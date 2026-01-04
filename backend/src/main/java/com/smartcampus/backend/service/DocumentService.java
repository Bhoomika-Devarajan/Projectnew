package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Document;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DocumentService {

    private final Path rootLocation;
    private final VectorStore vectorStore;
    private final String storeFile = "vector-store.json";

    public DocumentService(@Value("${file.upload-dir}") String uploadDir, VectorStore vectorStore) {
        this.rootLocation = Paths.get(uploadDir);
        this.vectorStore = vectorStore;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            System.out.println("System: Ready at " + rootLocation.toAbsolutePath());
            refreshVectorStore();
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public void refreshVectorStore() {
        System.out.println("System: Refreshing Vector Database...");
        try (Stream<Path> stream = Files.walk(this.rootLocation, 1)) {
            stream.filter(path -> !path.equals(this.rootLocation))
                    .forEach(path -> {
                        try {
                            this.ingestFile(path);
                        } catch (Exception e) {
                            System.err.println("AI Error: Failed to ingest " + path.getFileName() + " at startup: "
                                    + e.getMessage());
                        }
                    });
        } catch (IOException e) {
            System.err.println("System: Error walking files: " + e.getMessage());
        }
    }

    public void delete(String filename) {
        try {
            Path file = rootLocation.resolve(filename);
            Files.deleteIfExists(file);
            System.out.println("System: Deleted file " + filename);

            File sFile = new File(storeFile);
            if (sFile.exists())
                sFile.delete();

            refreshVectorStore();

        } catch (IOException e) {
            throw new RuntimeException("Delete failed: " + e.getMessage());
        }
    }

    public void store(MultipartFile file) {
        try {
            if (file.isEmpty())
                throw new RuntimeException("Empty file");

            Path destinationFile = this.rootLocation.resolve(Paths.get(file.getOriginalFilename()))
                    .normalize().toAbsolutePath();

            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("System: Saved " + file.getOriginalFilename());
                ingestFile(destinationFile);
            }
        } catch (IOException e) {
            throw new RuntimeException("Storage failed: " + e.getMessage());
        }
    }

    private void ingestFile(Path path) {
        String filename = path.getFileName().toString();
        String content = getContent(filename);

        if (content == null || content.isEmpty() || content.startsWith("Error")) {
            return;
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("filename", filename);
        metadata.put("source", filename);

        org.springframework.ai.document.Document aiDoc = new org.springframework.ai.document.Document(content,
                metadata);

        vectorStore.add(List.of(aiDoc));

        if (vectorStore instanceof SimpleVectorStore) {
            ((SimpleVectorStore) vectorStore).save(new File(storeFile));
        }
        System.out.println("System: Mapped " + filename + " to Vector Database.");
    }

    public List<Document> loadAll() {
        try (Stream<Path> stream = Files.walk(this.rootLocation, 1)) {
            return stream.filter(path -> !path.equals(this.rootLocation))
                    .map(this::mapToDocument)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            return List.of();
        }
    }

    public String getContent(String filename) {
        try {
            if (!Files.exists(rootLocation))
                Files.createDirectories(rootLocation);
            Path file = rootLocation.resolve(filename);
            if (!Files.exists(file))
                return "";

            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (ext.equals("txt"))
                return Files.readString(file);

            if (ext.equals("pdf")) {
                try (PDDocument doc = PDDocument.load(file.toFile())) {
                    return new PDFTextStripper().getText(doc);
                }
            }

            if (ext.equals("docx")) {
                try (java.io.FileInputStream fis = new java.io.FileInputStream(file.toFile());
                        XWPFDocument doc = new XWPFDocument(fis)) {
                    return doc.getParagraphs().stream().map(XWPFParagraph::getText).collect(Collectors.joining("\n"));
                }
            }

            return "";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    private Document mapToDocument(Path path) {
        try {
            String size = Files.size(path) / 1024 + " KB";
            return new Document(path.getFileName().toString(), "File", size, "Recently");
        } catch (IOException e) {
            return new Document(path.getFileName().toString(), "Unknown", "0 KB", "");
        }
    }
}

package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.Document;
import com.smartcampus.backend.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<Document> listUploadedFiles() {
        return documentService.loadAll();
    }

    @PostMapping
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) {
        documentService.store(file);
        return ResponseEntity.ok("You successfully uploaded " + file.getOriginalFilename() + "!");
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<String> deleteFile(@PathVariable String filename) {
        documentService.delete(filename);
        return ResponseEntity.ok("Deleted " + filename);
    }
}

package com.smartcampus.backend.controller;

import com.smartcampus.backend.service.DocumentService;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    private final DocumentService documentService;
    private final ChatModel chatModel;
    private final VectorStore vectorStore;
    private final ObjectMapper objectMapper;

    public ChatController(DocumentService documentService, ChatModel chatModel, VectorStore vectorStore) {
        this.documentService = documentService;
        this.chatModel = chatModel;
        this.vectorStore = vectorStore;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        System.out.println("AI Debug: Chat requested. Question: " + question);

        // Retrieval
        List<org.springframework.ai.document.Document> matches = vectorStore.similaritySearch(question);
        System.out.println("AI Debug: Found " + matches.size() + " matches in vector store.");

        String context = matches.stream()
                .map(doc -> "Source: " + doc.getMetadata().getOrDefault("filename", "Unknown") + "\nContent: "
                        + doc.getText())
                .collect(Collectors.joining("\n\n"));

        if (context.isEmpty()) {
            System.err.println("AI Warning: No context found for question.");
            return Map.of("answer", "I don't see any documents to reference. Please upload your materials first!");
        }

        // Generation
        String prompt = "You are a Campus AI Study Assistant. Use the following student-uploaded materials to answer their question.\n\n"
                + "MATERIALS:\n" + context + "\n\n" +
                "QUESTION: " + question + "\n\n" +
                "If the answer isn't in the materials, say you couldn't find it in their notes, but provide a generic helpful answer.";

        try {
            System.out.println("AI Debug: Calling chat model...");
            String response = chatModel.call(prompt);
            System.out.println("AI Debug: Chat model responded.");
            return Map.of("answer", response);
        } catch (Exception e) {
            System.err.println("AI Error: Chat call failed: " + e.getMessage());
            e.printStackTrace();
            return Map.of("answer", "Error communicating with AI: " + e.getMessage());
        }
    }

    @PostMapping("/summary")
    public Map<String, String> summarize(@RequestBody Map<String, String> request) {
        String filename = request.get("docId");
        System.out.println("AI Debug: Summary requested for: " + filename);
        String content = documentService.getContent(filename);

        if (content == null || content.isEmpty() || content.startsWith("Error")) {
            System.err.println("AI Error: Failed to read content for " + filename);
            return Map.of("summary", "Could not read document content.");
        }

        if (content.length() > 5000)
            content = content.substring(0, 5000) + "...[truncated]";

        String prompt = "Summarize the following document in 5 key bullet points:\n\n" + content;
        try {
            System.out.println("AI Debug: Calling AI for summary...");
            String aiSummary = chatModel.call(prompt);
            System.out.println("AI Debug: AI responded with summary.");
            return Map.of("summary", aiSummary);
        } catch (Exception e) {
            System.err.println("AI Error: Summary call failed: " + e.getMessage());
            return Map.of("summary", "Error generating summary: " + e.getMessage());
        }
    }

    @PostMapping("/quiz")
    public Map<String, Object> generateQuiz(@RequestBody Map<String, String> request) {
        String filename = request.get("docId");
        System.out.println("AI Debug: Quiz requested for: " + filename);
        String content = documentService.getContent(filename);

        if (content == null || content.isEmpty() || content.startsWith("Error")) {
            System.err.println("AI Error: Failed to read content for " + filename);
            return Map.of("error", "No content found for quiz.");
        }

        if (content.length() > 3000)
            content = content.substring(0, 3000);

        String prompt = "Generate a quiz with exactly 5 multiple choice questions based on the following text. " +
                "Return ONLY a raw JSON array (no markdown formatting). " +
                "Each object must have keys: 'question', 'options' (array of 4 strings), and 'correct' (string which must be one of the options). "
                +
                "\n\nText:\n" + content;

        String jsonResponse = "";
        try {
            System.out.println("AI Debug: Calling AI for quiz...");
            jsonResponse = chatModel.call(prompt);
            jsonResponse = jsonResponse.replace("```json", "").replace("```", "").trim();

            List<Map<String, Object>> questions = objectMapper.readValue(jsonResponse,
                    new TypeReference<List<Map<String, Object>>>() {
                    });
            System.out.println("AI Debug: Successfully parsed " + questions.size() + " quiz questions.");
            return Map.of("quiz", questions);
        } catch (Exception e) {
            System.err.println("AI Error: Quiz flow failed: " + e.getMessage());
            e.printStackTrace();
            return Map.of("error", "Failed to generate valid quiz JSON: " + e.getMessage(), "raw", jsonResponse);
        }
    }
}

package com.smartcampus.backend.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        String vectorStorePath = "vector-store.json";
        SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel).build();

        File file = new File(vectorStorePath);
        if (file.exists()) {
            System.out.println("AI Debug: Loading existing vector store from " + vectorStorePath);
            vectorStore.load(file);
        } else {
            System.out.println("AI Debug: Creating new vector store at " + vectorStorePath);
        }

        return vectorStore;
    }
}

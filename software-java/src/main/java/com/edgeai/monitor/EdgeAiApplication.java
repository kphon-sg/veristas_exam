package com.edgeai.monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EdgeAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(EdgeAiApplication.class, args);
        System.out.println("Edge AI Monitoring System (Java Backend) is running...");
    }
}

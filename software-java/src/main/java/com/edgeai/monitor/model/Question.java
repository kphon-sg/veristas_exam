package com.edgeai.monitor.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String text;
    private String type; // "MULTIPLE_CHOICE" or "ESSAY"
    
    @ElementCollection
    private List<String> options;
    private Integer correctAnswer; // Index of correct option, null for essay

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }
    public Integer getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(Integer correctAnswer) { this.correctAnswer = correctAnswer; }
}

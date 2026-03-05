package com.edgeai.monitor.model;

import jakarta.persistence.*;

@Entity
@Table(name = "student_answers")
public class StudentAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long questionId;
    private String answerText; // For essay
    private Integer selectedOption; // For multiple choice
    private Double pointsEarned; // For manual or auto grading

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
    public Integer getSelectedOption() { return selectedOption; }
    public void setSelectedOption(Integer selectedOption) { this.selectedOption = selectedOption; }
    public Double getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Double pointsEarned) { this.pointsEarned = pointsEarned; }
}

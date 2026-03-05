package com.edgeai.monitor.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long quizId;
    private String studentId;
    private LocalDateTime submittedAt;
    private Double score; // For auto-graded MCQs

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "submission_id")
    private List<StudentAnswer> answers;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public List<StudentAnswer> getAnswers() { return answers; }
    public void setAnswers(List<StudentAnswer> answers) { this.answers = answers; }
}

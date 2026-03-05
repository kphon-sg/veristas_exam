package com.edgeai.monitor.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "quizzes")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private int duration; // minutes
    private String classId;
    private String teacherId;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "quiz_id")
    private List<Question> questions;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
}

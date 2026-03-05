package com.edgeai.monitor.controller;

import com.edgeai.monitor.model.*;
import com.edgeai.monitor.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AppController {

    @Autowired private UserRepository userRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private SubmissionRepository submissionRepository;

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // Đơn giản hóa cho demo: Tìm user hoặc tạo mới nếu chưa có
        User user = userRepository.findByUsername(username);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setRole(username.contains("teacher") ? "TEACHER" : "STUDENT");
            user.setClassId("CLASS_A");
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("classId", user.getClassId());
        return response;
    }

    @GetMapping("/quizzes")
    public List<Quiz> getQuizzes(@RequestParam(required = false) String classId) {
        if (classId != null) return quizRepository.findByClassId(classId);
        return quizRepository.findAll();
    }

    @PostMapping("/quizzes")
    public Quiz createQuiz(@RequestBody Quiz quiz) {
        return quizRepository.save(quiz);
    }

    @PostMapping("/submissions")
    public Submission submitQuiz(@RequestBody Submission submission) {
        submission.setSubmittedAt(LocalDateTime.now());
        
        // Auto-grading for Multiple Choice
        Optional<Quiz> quizOpt = quizRepository.findById(submission.getQuizId());
        if (quizOpt.isPresent()) {
            Quiz quiz = quizOpt.get();
            double totalScore = 0;
            for (StudentAnswer answer : submission.getAnswers()) {
                Optional<Question> questionOpt = quiz.getQuestions().stream()
                    .filter(q -> q.getId().equals(answer.getQuestionId()))
                    .findFirst();
                
                if (questionOpt.isPresent()) {
                    Question question = questionOpt.get();
                    if ("MULTIPLE_CHOICE".equals(question.getType())) {
                        if (question.getCorrectAnswer() != null && question.getCorrectAnswer().equals(answer.getSelectedOption())) {
                            answer.setPointsEarned(1.0);
                            totalScore += 1.0;
                        } else {
                            answer.setPointsEarned(0.0);
                        }
                    }
                }
            }
            submission.setScore(totalScore);
        }
        
        return submissionRepository.save(submission);
    }

    @PutMapping("/submissions/{id}")
    public Submission updateSubmission(@PathVariable Long id, @RequestBody Submission updatedSubmission) {
        return submissionRepository.findById(id).map(submission -> {
            submission.setScore(updatedSubmission.getScore());
            if (updatedSubmission.getAnswers() != null) {
                for (StudentAnswer updatedAns : updatedSubmission.getAnswers()) {
                    submission.getAnswers().stream()
                        .filter(a -> a.getId().equals(updatedAns.getId()))
                        .findFirst()
                        .ifPresent(a -> a.setPointsEarned(updatedAns.getPointsEarned()));
                }
            }
            return submissionRepository.save(submission);
        }).orElse(null);
    }

    @GetMapping("/submissions/quiz/{quizId}")
    public List<Submission> getSubmissionsByQuiz(@PathVariable Long quizId) {
        return submissionRepository.findByQuizId(quizId);
    }

    @GetMapping("/submissions")
    public List<Submission> getSubmissions(@RequestParam(required = false) Long quizId) {
        if (quizId != null) {
            return submissionRepository.findByQuizId(quizId);
        }
        return submissionRepository.findAll();
    }
}

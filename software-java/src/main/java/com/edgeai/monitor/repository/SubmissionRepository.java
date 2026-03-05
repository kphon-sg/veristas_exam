package com.edgeai.monitor.repository;

import com.edgeai.monitor.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByQuizId(Long quizId);
    List<Submission> findByStudentId(String studentId);
}

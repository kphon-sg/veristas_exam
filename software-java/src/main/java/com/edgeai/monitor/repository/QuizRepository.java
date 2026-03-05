package com.edgeai.monitor.repository;
import com.edgeai.monitor.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByClassId(String classId);
}

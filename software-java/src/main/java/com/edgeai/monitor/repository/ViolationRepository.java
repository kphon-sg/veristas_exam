package com.edgeai.monitor.repository;

import com.edgeai.monitor.model.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByStudentId(String studentId);
}

package com.edgeai.monitor.controller;

import com.edgeai.monitor.model.Violation;
import com.edgeai.monitor.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Autowired
    private ViolationRepository violationRepository;

    @PostMapping("/report-violation")
    public Map<String, String> reportViolation(@RequestBody Map<String, Object> payload) {
        Violation violation = new Violation();
        violation.setStudentId((String) payload.get("studentId"));
        violation.setType((String) payload.get("type"));
        violation.setMessage((String) payload.get("message"));
        violation.setSeverity((String) payload.get("severity"));
        violation.setTimestamp(LocalDateTime.now());

        violationRepository.save(violation);
        
        System.out.println("Saved to DB - Violation: " + violation.getType() + " from Student: " + violation.getStudentId());
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Violation saved to MySQL Database");
        return response;
    }

    @GetMapping("/violations")
    public List<Violation> getViolations() {
        return violationRepository.findAll();
    }

    @GetMapping("/violations/{studentId}")
    public List<Violation> getViolationsByStudent(@PathVariable String studentId) {
        return violationRepository.findByStudentId(studentId);
    }
}

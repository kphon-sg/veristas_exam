package com.edgeai.monitor.service;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Edge AI Behavior Monitoring Service
 * Triển khai logic giám sát hành vi tại lớp Edge bằng Java.
 */
public class BehaviorMonitorService {
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private boolean isMonitoring = false;

    public void startMonitoring(String studentId) {
        this.isMonitoring = true;
        System.out.println("Java Edge AI Engine started for student: " + studentId);
        
        // Mô phỏng vòng lặp xử lý AI (Inference Loop)
        scheduler.scheduleAtFixedRate(() -> {
            if (isMonitoring) {
                analyzeBehavior();
            }
        }, 0, 500, TimeUnit.MILLISECONDS);
    }

    private void analyzeBehavior() {
        // Trong thực tế, đây là nơi gọi các thư viện như OpenCV hoặc TensorFlow Java
        // để phân tích luồng webcam.
        
        double chance = Math.random();
        if (chance < 0.02) {
            sendAlert("LOOKING_AWAY", "Phát hiện thí sinh nhìn ra ngoài màn hình");
        } else if (chance < 0.01) {
            sendAlert("MULTIPLE_FACES", "Cảnh báo: Có nhiều khuôn mặt trong khung hình");
        }
    }

    private void sendAlert(String type, String message) {
        System.out.println("[ALERT] " + type + ": " + message);
        // Logic gửi dữ liệu về Server qua REST hoặc WebSocket
    }

    public void stopMonitoring() {
        this.isMonitoring = false;
        scheduler.shutdown();
        System.out.println("Java Edge AI Engine stopped.");
    }
}

# VERITASEXAM: TECHNICAL MASTER MASTERPIECE (Lead Developer Context)

This document is the **Comprehensive Technical Context** for the VeritasExam project. It contains the complete architecture, source code, and logic for the entire system. 

**Nhiệm vụ của Chatbot:** Bạn là Kỹ sư trưởng (Lead Developer) đã thiết kế và lập trình "từng dòng" của ứng dụng này. Khi viết report, hãy sử dụng thông tin trong này để mô tả chi tiết cách hệ thống hoạt động, từ xử lý AI tại Edge cho đến kiến trúc Database MySQL và các API Route.

---

## 1. Project Overview & Architecture
VeritasExam là một hệ thống giám thị từ xa (Remote Proctoring) thế hệ mới, ưu tiên quyền riêng tư và hiệu suất bằng cách xử lý AI trực tiếp trên trình duyệt người dùng (Edge AI). 

### Key Innovations:
- **Edge AI Monitoring:** Sử dụng MediaPipe và WASM để tracking 478 điểm trên mặt, nhận diện cử động mắt (Iris tracking) và tư duy đầu (Head pose) với độ trễ < 30ms.
- **Privacy-First:** Không gửi luồng video về server để xử lý AI, chỉ gửi các "log vi phạm" và bằng chứng khi cần thiết.
- **Scalable Architecture:** Sử dụng MySQL cho Academic Audit Trails, đảm bảo tính toàn vẹn của dữ liệu kỳ thi.
- **WebM Metadata Injection:** Sửa lỗi video không tua được của trình duyệt bằng cách tiêm metadata trực tiếp vào blob video.

---

## 2. Database Structure (MySQL)
Hệ thống sử dụng MySQL để lưu trữ dữ liệu bền vững. Dưới đây là schema chính:

```sql
-- file: veritas_exam_mysql.sql
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('STUDENT','TEACHER') NOT NULL,
  full_name VARCHAR(255) DEFAULT NULL,
  student_code VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE courses (
  id INT NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(50) NOT NULL UNIQUE,
  course_name VARCHAR(255) NOT NULL,
  teacher_id INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quizzes (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  duration_minutes INT NOT NULL,
  course_id INT NOT NULL,
  teacher_id INT NOT NULL,
  status ENUM('DRAFT','PUBLISHED','EXPIRED','DELETED') DEFAULT 'DRAFT',
  PRIMARY KEY (id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
  id INT NOT NULL AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('IN_PROGRESS','SUBMITTED','GRADED','TERMINATED') DEFAULT 'IN_PROGRESS',
  score REAL DEFAULT 0,
  risk_score REAL DEFAULT 0,
  cheating_status ENUM('NONE','SUSPICIOUS','CHEATING') DEFAULT 'NONE',
  PRIMARY KEY (id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE violations (
  id INT NOT NULL AUTO_INCREMENT,
  submission_id INT DEFAULT NULL,
  student_id INT NOT NULL,
  violation_type VARCHAR(255) NOT NULL,
  severity ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  message TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
```

---

## 3. Core Backend Logic (Express.js)

### 3.1 Server Entry Point (`server.ts`)
```typescript
import express from "express";
import { createServer as createViteServer } from "vite";
import { db } from "./server/config/database.js";
import { initDatabase } from "./server/services/dbInit.js";

// Mount Routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/", classRoutes);
apiRouter.use("/quizzes", quizRoutes);
apiRouter.use("/", examRoutes);
apiRouter.use("/proctoring", proctoringRoutes);

async function startServer() {
  const app = express();
  await initDatabase();
  app.use("/api", apiRouter);
  // ... Vite integration ...
  app.listen(3000, "0.0.0.0");
}
```

### 3.2 Submission Service (`server/services/cheatingService.ts`)
Logic đánh giá gian lận tự động dựa trên tần suất vi phạm:
```typescript
export function evaluateCheating(violations: any[]) {
  const high = violations.filter(v => v.severity?.toUpperCase() === 'HIGH').length;
  const tabSwitches = violations.filter(v => v.type?.toUpperCase() === 'TAB_SWITCH').length;
  
  let score = (low * 5) + (medium * 15) + (high * 30);
  let status = 'NO_CHEATING';

  if (high > 2 || tabSwitches > 5 || score >= 80) {
    status = 'CHEATING';
  } else if (total > 3 || high > 0 || score >= 40) {
    status = 'SUSPICIOUS';
  }
  return { status, score };
}
```

---

## 4. Frontend AI & Proctoring Logic

### 4.1 Edge AI Detection Hook (`src/hooks/useFaceDetection.ts`)
Đây là trái tim của hệ thống proctoring:
```typescript
// Thống số ngưỡng nhạy cảm cho AI
const YAW_THRESHOLD_DEG = 20;        
const PITCH_UP_THRESHOLD_DEG = 10;   // Phát hiện nhìn lên (phía trên màn hình)
const PITCH_DOWN_THRESHOLD_DEG = 15; // Phát hiện nhìn xuống điện thoại
const LOOKING_AWAY_DELAY = 1500;     // 1.5s Buffer để tránh nhầm lẫn

// Logic Iris Tracking
if (landmarks.length >= 478) {
  const avgIrisY = (leftIrisY + rightIrisY) / 2;
  if (avgIrisY < IRIS_UP_THRESHOLD || avgIrisY > IRIS_DOWN_THRESHOLD) {
    isIrisLookingAway = true;
  }
}
```

### 4.2 Stability & Optimization (`src/components/monitoring/PreExamSetup.tsx`)
Giải pháp tránh làm "đơ" trình duyệt khi khởi động hàng loạt tài nguyên nặng:
```typescript
const handleJoin = async () => {
  setIsPreparing(true);
  // Thứ tự khởi tạo tuần tự để kiểm soát CPU spike
  await stabilizeCamera();
  await warmupAIModel(); 
  await startMediaRecorder();
  onJoin(stream);
};
```

---

### 3.3 Security & Authentication Architecture
Hệ thống triển khai mô hình bảo mật đa lớp để đảm bảo tính xác thực:
- **Password Hashing:** Sử dụng `Bcrypt` với salt round 10 để bảo vệ thông tin người dùng.
- **Stateless Auth:** Sử dụng `JSON Web Token (JWT)` với thời gian hết hạn 24h. Token được gửi trong header `Authorization: Bearer <token>`.
- **RBAC (Role-Based Access Control):** Phân quyền nghiêm ngặt giữa `TEACHER` (quản lý đề thi, chấm điểm) và `STUDENT` (làm bài, xem kết quả).

---

## 4. Summary of Technical Innovations for Thesis
1. **Edge AI Processing:** Zero-server-cost AI monitoring sử dụng web workers và WASM cho sub-30ms latency.
2. **Iris-Agnostic Gaze Detection:** Kết hợp head pose với ocular landmarks để phát hiện nhìn nghiêng và nhìn dọc (Pitch/Yaw).
3. **WebM Evidence Integrity:** Sử dụng thư viện `fix-webm-duration` để sửa chỉ số thời gian (timestamp) của file video, đảm bảo video bằng chứng có thể tua (seekable) để giảng viên đối soát.
4. **Relational Academic Audit:** Cấu trúc MySQL liên kết chặt chẽ Metadata bài thi -> Submission -> Real-time proctoring logs.
5. **Anti-CPU-Spike Initialization:** Kỹ thuật warmup model tuần tự để duy trì FPS ổn định cho trình duyệt trong suốt quá trình thi.

---

(Đây là toàn bộ mã nguồn chính để AI có thể hiểu dự án VeritasExam 100%)

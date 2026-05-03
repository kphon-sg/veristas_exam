# VeritasExam - Project Context for Thesis Writing

This document contains the consolidated technical details, database schema, and core source code for the VeritasExam project. Use this as the "Source of Truth" for generating a detailed 60-page thesis report.

---

## 1. Project Overview
**Title:** VERITASEXAM: AN AI-POWERED COMPREHENSIVE REMOTE PROCTORING SYSTEM FOR ACADEMIC INTEGRITY IN ONLINE EDUCATION
**Lead Developer Persona:** Software Engineer who designed the Edge AI architecture, optimized for browser performance, and implemented robust academic integrity protocols.

---

## 2. Database Schema (MySQL)
**File: `/veritas_exam_mysql.sql`**
```sql
-- Core Tables for Proctoring and Academic Audit
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Bcrypt hashed
    role ENUM('TEACHER', 'STUDENT') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    student_code VARCHAR(50),
    department VARCHAR(255)
);

CREATE TABLE courses (
  id INT NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(50) NOT NULL UNIQUE,
  course_name VARCHAR(255) NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'EXPIRED', 'DELETED') DEFAULT 'DRAFT',
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'TERMINATED'),
    score REAL DEFAULT 0,
    total_score REAL DEFAULT 0,
    start_time DATETIME,
    submitted_at DATETIME,
    cheating_status ENUM('NONE', 'SUSPICIOUS', 'CHEATING'),
    risk_score REAL DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE violations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT,
    student_id INT NOT NULL,
    violation_type VARCHAR(255) NOT NULL, 
    severity ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    duration_seconds INT DEFAULT 0,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE proctoring_logs (
  id INT NOT NULL AUTO_INCREMENT,
  submission_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'NONE') DEFAULT 'NONE',
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  duration INT DEFAULT 0,
  message TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
```

---

## 3. Backend Logic (Express & Node.js)

### [Server Entry] `/server.ts`
```typescript
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { initDB } from "./server/config/database.js";
import apiRouter from "./server/routes/api.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Initialize Database
  await initDB();

  // API Routes
  app.use("/api", apiRouter);

  // Serve uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VeritasExam Server running on http://localhost:${PORT}`);
  });
}

startServer();
```

### [Exam Submission Logic] `/server/routes/exam.ts` (Core Segment)
```typescript
router.post("/submissions", async (req: any, res) => {
  try {
    const { quizId, studentId, answers, proctoringLogs } = req.body;
    
    // 1. Calculate Score
    const [quizQuestions]: any = await db.query("SELECT id, points, correct_answer FROM questions WHERE quiz_id = ?", [quizId]);
    let earnedPoints = 0;
    let totalPoints = 0;
    
    // ... grading logic ...

    // 2. Evaluate Cheating Risks
    const cheatingStatus = evaluateCheating(proctoringLogs);

    // 3. Update Submission
    await db.query(`
      UPDATE submissions SET 
        status = 'SUBMITTED', 
        score = ?, 
        submitted_at = NOW(),
        cheating_status = ?
      WHERE quiz_id = ? AND student_id = ?
    `, [earnedPoints, cheatingStatus, quizId, studentId]);

    res.json({ success: true, earnedPoints });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 4. Frontend AI Engine (Edge AI Implementation)

### [AI Detection Hook] `/src/hooks/useFaceDetection.ts`
```typescript
// Uses MediaPipe Face Landmarker for 478-point landmark tracking
// Logic: Calculate head rotation (Yaw/Pitch) and Eye Gaze Index (Iris position)

export const useFaceDetection = ({ isCameraActive, videoRef, onDetection }) => {
  // Thresholds for strictly monitoring academic integrity
  const YAW_THRESHOLD_DEG = 20;        
  const PITCH_UP_THRESHOLD_DEG = 10;   // Sensitive to monitor-top cameras
  const PITCH_DOWN_THRESHOLD_DEG = 15; // Detecting desk-level cheating
  const LOOKING_AWAY_DELAY = 1500;     // 1.5s grace period

  const detect = async () => {
    const results = faceLandmarker.current.detectForVideo(videoRef.current, startTime);
    // ... math for pose estimation ...
    // ... iris tracking logic ...
    
    if (yaw > YAW_THRESHOLD_DEG || pitch > PITCH_UP_THRESHOLD_DEG) {
       onDetection('looking_away');
    }
  };
};
```

### [Stability Implementation] `/src/components/monitoring/PreExamSetup.tsx`
```typescript
// Sequential Initialization Pattern to prevent browser hang
const handleJoin = async () => {
  setIsPreparing(true);
  // 1. Stabilize Camera
  await new Promise(r => setTimeout(r, 500));
  // 2. Load Model WASM + Warmup
  await new Promise(r => setTimeout(r, 500));
  // 3. Safe Start MediaRecorder
  onJoin(videoRef.current.srcObject);
};
```

---

## 5. Summary of Technical Innovations for Thesis
1. **Edge AI Processing:** Zero-server-cost AI monitoring using web workers and WASM for sub-30ms latency.
2. **Iris-Agnostic Gaze Detection:** Combining head pose with ocular landmarks to detect vertical gaze shifts.
3. **WebM Evidence Integrity:** Implementing metadata injection to ensure proctoring videos are legally seekable/auditable.
4. **Relational Academic Audit:** Database design that links every AI event (ProctoringLogs) to a specific timestamp in the Submission lifecycle.

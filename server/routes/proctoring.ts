import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db, toDBDateTime } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "proctoring");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.mimetype.includes('video') ? '.webm' : '.webp';
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.use(authenticateToken);

router.post("/log-violation", upload.single("evidence"), async (req: any, res) => {
  try {
    const { submissionId, violationType, evidenceType, confidenceScore, timestamp } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No evidence file uploaded" });
    }

    if (!submissionId || !violationType || !evidenceType) {
      return res.status(400).json({ error: "Missing required metadata" });
    }

    const fileUrl = `/uploads/proctoring/${file.filename}`;
    const filePath = file.path;

    // Ensure file is written and has content
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      return res.status(500).json({ error: "File write failed or file is empty" });
    }

    const dbTimestamp = timestamp ? toDBDateTime(new Date(timestamp)) : toDBDateTime(new Date());

    const [result]: any = await db.query(`
      INSERT INTO violation_logs (submission_id, violation_type, evidence_type, file_url, confidence_score, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      Number(submissionId),
      violationType,
      evidenceType,
      fileUrl,
      confidenceScore ? Number(confidenceScore) : null,
      dbTimestamp
    ]);

    res.json({
      success: true,
      logId: result.insertId,
      fileUrl
    });
  } catch (error: any) {
    console.error("[Proctoring] Error logging violation:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/log", async (req, res) => {
  try {
    const { attempt_id, violation_type, timestamp, severity, message } = req.body;

    if (!attempt_id || !violation_type) {
      return res.status(400).json({ error: "Missing attempt_id or violation_type" });
    }

    const dbTimestamp = timestamp ? toDBDateTime(new Date(timestamp)) : toDBDateTime(new Date());

    const [result]: any = await db.query(`
      INSERT INTO violations (submission_id, student_id, violation_type, timestamp, severity, message)
      SELECT ?, student_id, ?, ?, ?, ?
      FROM submissions WHERE id = ?
    `, [
      Number(attempt_id),
      violation_type,
      dbTimestamp,
      severity || 'MEDIUM',
      message || `AI detected ${violation_type}`,
      Number(attempt_id)
    ]);

    res.json({
      success: true,
      violationId: result.insertId
    });
  } catch (error: any) {
    console.error("[Proctoring] Error logging violation to violations table:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/log-event", async (req, res) => {
  try {
    const { submissionId, eventType, severity, startTime, endTime, duration, message } = req.body;

    if (!submissionId || !eventType || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [result]: any = await db.query(`
      INSERT INTO proctoring_logs (submission_id, event_type, severity, start_time, end_time, duration, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      Number(submissionId),
      eventType,
      severity || 'NONE',
      toDBDateTime(new Date(startTime)),
      endTime ? toDBDateTime(new Date(endTime)) : null,
      duration ? Number(duration) : 0,
      message || null
    ]);

    res.json({
      success: true,
      logId: result.insertId
    });
  } catch (error: any) {
    console.error("[Proctoring] Error logging event:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/logs/:submissionId", async (req, res) => {
  try {
    const { submissionId } = req.params;
    const [rows]: any = await db.query(`
      SELECT 
        id,
        submission_id as submissionId,
        violation_type as violationType,
        evidence_type as evidenceType,
        file_url as fileUrl,
        confidence_score as confidenceScore,
        timestamp
      FROM violation_logs 
      WHERE submission_id = ? 
      ORDER BY timestamp ASC
    `, [submissionId]);

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

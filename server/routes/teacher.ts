import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/courses", async (req, res) => {
  try {
    const { teacherId } = req.query;
    if (!teacherId) return res.status(400).json({ error: "teacherId is required" });

    const [rows] = await pool.query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
      FROM courses c
      WHERE c.teacher_id = ?
    `, [teacherId]);

    const mapped = (rows as any[]).map(r => ({
      id: Number(r.id),
      courseCode: r.course_code,
      name: r.course_name,
      description: r.description,
      teacherId: Number(r.teacher_id),
      studentCount: Number(r.student_count),
      createdAt: r.created_at
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/courses/:courseId/students", async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.student_code, u.full_name, u.email,
             (SELECT AVG((score / NULLIF(total_score, 0)) * 100) FROM submissions WHERE student_id = u.id AND status = 'GRADED' AND quiz_id IN (SELECT id FROM quizzes WHERE course_id = ?)) as avg_score,
             (SELECT COUNT(DISTINCT quiz_id) FROM submissions WHERE student_id = u.id AND quiz_id IN (SELECT id FROM quizzes WHERE course_id = ?)) as quizzes_attempted
      FROM users u
      JOIN course_enrollments e ON u.id = e.student_id
      WHERE e.course_id = ?
    `, [courseId, courseId, courseId]);

    const mapped = (rows as any[]).map(r => ({
      id: Number(r.id),
      username: r.username,
      studentCode: r.student_code,
      fullName: r.full_name,
      email: r.email,
      avgScore: r.avg_score ? Number(r.avg_score) : null,
      quizzesAttempted: Number(r.quizzes_attempted)
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/courses/:courseId/students/:studentId/quizzes", async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const [rows] = await pool.query(`
      SELECT q.id as quiz_id, q.title as quiz_name, 
             s.id as submission_id, s.score, s.total_score, s.submitted_at, s.status, s.risk_score, s.cheating_status
      FROM quizzes q
      LEFT JOIN submissions s ON q.id = s.quiz_id AND s.student_id = ?
      WHERE q.course_id = ? AND q.status != 'DELETED'
    `, [studentId, courseId]);

    const mapped = (rows as any[]).map(r => ({
      quizId: Number(r.quiz_id),
      quizName: r.quiz_name,
      submissionId: r.submission_id ? Number(r.submission_id) : null,
      score: r.score !== null ? Number(r.score) : null,
      totalScore: r.total_score !== null ? Number(r.total_score) : null,
      submittedAt: r.submitted_at,
      status: r.status,
      riskScore: r.risk_score !== null ? Number(r.risk_score) : null,
      cheatingStatus: r.cheating_status
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

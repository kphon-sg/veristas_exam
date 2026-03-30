import express from "express";
import { pool, toMySQLDateTime } from "../config/database.js";
import { mapSubmission } from "../services/submissionService.js";
import { logActivity } from "../services/activityService.js";
import { evaluateCheating } from "../services/cheatingService.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// --- Submissions ---
router.get("/student/stats", async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    if (!studentId || !classId) {
      return res.status(400).json({ error: "Missing studentId or classId" });
    }

    // 1. Total Assigned (Published/Expired and not deleted)
    const [quizResults] = await pool.query(`
      SELECT id, deadline 
      FROM quizzes 
      WHERE course_id = ? AND status IN ('PUBLISHED', 'EXPIRED')
    `, [classId]);
    const quizzes = quizResults as any[];
    const totalAssigned = quizzes.length;

    // 2. Completed (Latest submission per quiz for this student)
    const [subResults] = await pool.query(`
      SELECT s.quiz_id, s.score, s.total_score, s.status, s.submitted_at
      FROM submissions s
      WHERE s.student_id = ? AND s.quiz_id IN (
        SELECT id FROM quizzes WHERE course_id = ? AND status IN ('PUBLISHED', 'EXPIRED')
      ) AND (s.status = 'SUBMITTED' || s.status = 'GRADED')
    `, [studentId, classId]);
    const submissions = subResults as any[];

    // Group by quiz_id to get latest submission
    const latestSubs = new Map<number, any>();
    submissions.forEach(s => {
      const existing = latestSubs.get(s.quiz_id);
      if (!existing || new Date(s.submitted_at) > new Date(existing.submitted_at)) {
        latestSubs.set(s.quiz_id, s);
      }
    });

    const completedCount = latestSubs.size;

    // 3. Pending (Strictly Total Assigned - Completed)
    const pendingCount = totalAssigned - completedCount;

    // 4. Average Score
    const latestSubsArray = Array.from(latestSubs.values());
    const averageScore = latestSubsArray.length > 0
      ? (latestSubsArray.reduce((acc, s) => {
          const score = Number(s.score) || 0;
          const total = Number(s.total_score) || 1;
          return acc + (score / total);
        }, 0) / latestSubsArray.length) * 100
      : 0;

    res.json({
      totalAssigned,
      completedCount,
      pendingCount,
      averageScore
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/submissions", async (req, res) => {
  try {
    const { quizId, studentId, classId } = req.query;
    let query = `
      SELECT s.*, u.full_name as studentName 
      FROM submissions s
      JOIN users u ON s.student_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (quizId) {
      conditions.push("s.quiz_id = ?");
      params.push(quizId);
    }
    if (studentId) {
      conditions.push("s.student_id = ?");
      params.push(studentId);
    }
    if (classId) {
      query = `
        SELECT s.*, u.full_name as studentName 
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        JOIN quizzes q ON s.quiz_id = q.id
      `;
      conditions.push("q.course_id = ?");
      params.push(classId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY s.submitted_at DESC";

    const [rows] = await pool.query(query, params);
    const mapped = await Promise.all((rows as any[]).map(r => mapSubmission(r)));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/teacher/submissions", async (req, res) => {
  try {
    const { teacherId, status } = req.query;
    if (!teacherId) {
      return res.status(400).json({ error: "Missing teacherId" });
    }

    let query = `
      SELECT 
        s.*, 
        u.full_name as studentName,
        q.title as quizTitle,
        c.course_name as className,
        c.course_code as classCode
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE q.teacher_id = ?
    `;
    const params: any[] = [teacherId];

    if (status) {
      query += " AND s.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.submitted_at DESC";

    const [rows] = await pool.query(query, params);
    const mapped = await Promise.all((rows as any[]).map(async (r) => {
      const sub = await mapSubmission(r);
      return {
        ...sub,
        studentName: r.studentName,
        quizTitle: r.quizTitle,
        className: r.className,
        classCode: r.classCode
      };
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/quiz-history", async (req, res) => {
  try {
    const { studentId, classId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    let query = `
      SELECT 
        s.*, 
        u.full_name as studentName,
        q.title as quizTitle,
        t.full_name as teacherName,
        c.course_name as className
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN users t ON q.teacher_id = t.id
      JOIN courses c ON q.course_id = c.id
      WHERE s.student_id = ?
    `;
    const params: any[] = [studentId];

    if (classId && classId !== 'null' && classId !== 'undefined') {
      query += " AND q.course_id = ?";
      params.push(classId);
    }

    query += " ORDER BY s.submitted_at DESC";

    const [rows] = await pool.query(query, params);
    const mapped = await Promise.all((rows as any[]).map(async (r) => {
      const sub = await mapSubmission(r);
      return {
        ...sub,
        quizTitle: r.quizTitle,
        teacherName: r.teacherName,
        className: r.className
      };
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/submissions/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.full_name as studentName 
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    const sub = (rows as any)[0];
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    res.json(await mapSubmission(sub));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/submissions", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { quizId, studentId, answers, startTime, browserInfo, ipAddress } = req.body;
    
    if (!quizId || !studentId || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing required fields or answers is not an array" });
    }

    await connection.beginTransaction();

    const [quizRows] = await connection.query("SELECT title, total_score FROM quizzes WHERE id = ?", [quizId]);
    const quiz = (quizRows as any)[0];
    const quizName = quiz ? quiz.title : 'Unknown Quiz';
    
    const [questionRows] = await connection.query("SELECT * FROM questions WHERE quiz_id = ?", [quizId]);
    const questions = questionRows as any[];

    let maxPossibleScore = quiz ? Number(quiz.total_score) : 0;
    if (maxPossibleScore === 0 && questions.length > 0) {
      maxPossibleScore = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    }
    
    let earnedScore = 0;
    const processedAnswers = [];
    for (const ans of answers) {
      const question = questions.find(q => q.id === Number(ans.questionId));
      let pointsEarned = 0;

      if (question && question.question_type === 'MULTIPLE_CHOICE') {
        const [optionRows] = await connection.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [question.id]);
        const options = optionRows as any[];
        const correctOpt = options.find(o => o.is_correct === 1);
        const selectedOpt = options[ans.selectedOption];
        
        if (correctOpt && selectedOpt && correctOpt.id === selectedOpt.id) {
          pointsEarned = Number(question.points) || 1.0;
        }
      }
      earnedScore += pointsEarned;
      processedAnswers.push({ ...ans, pointsEarned });
    }

    const submittedAt = new Date();
    const startTimestamp = startTime ? new Date(startTime).getTime() : 0;
    const endTimestamp = submittedAt.getTime();
    let duration = 0;
    if (!isNaN(startTimestamp) && !isNaN(endTimestamp) && startTimestamp > 0) {
      duration = Math.floor((endTimestamp - startTimestamp) / 1000);
    }
    
    const hasEssay = questions.some(q => q.question_type === 'ESSAY');
    const initialStatus = hasEssay ? 'SUBMITTED' : 'GRADED';
    
    const [subResult] = await connection.query(`
      INSERT INTO submissions (
        quiz_id, student_id, quiz_name, status, total_score, score, start_time, submitted_at, duration_seconds, browser_info, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [Number(quizId), Number(studentId), quizName, initialStatus, maxPossibleScore, earnedScore, toMySQLDateTime(startTime), toMySQLDateTime(submittedAt), duration, browserInfo || null, ipAddress || null]);
    
    const submissionId = (subResult as any).insertId;

    await connection.query("UPDATE violations SET submission_id = ? WHERE student_id = ? AND submission_id IS NULL", [submissionId, studentId]);

    const [violationRows] = await connection.query("SELECT * FROM violations WHERE submission_id = ?", [submissionId]);
    const violations = violationRows as any[];
    const evaluation = evaluateCheating(violations);
    
    await connection.query(`
      UPDATE submissions SET 
        cheating_status = ?, 
        risk_score = ?, 
        total_violation_count = ?, 
        high_violation_count = ?, 
        medium_violation_count = ?, 
        low_violation_count = ?, 
        tab_switch_count = ?,
        face_missing_count = ?,
        looking_away_count = ?,
        multiple_faces_count = ?,
        evaluation_timestamp = ?
      WHERE id = ?
    `, [
      evaluation.status, 
      evaluation.score, 
      evaluation.total, 
      evaluation.high, 
      evaluation.medium, 
      evaluation.low, 
      evaluation.tabSwitches,
      evaluation.faceMissing,
      evaluation.lookingAway,
      evaluation.multipleFaces,
      toMySQLDateTime(submittedAt), 
      submissionId
    ]);

    for (const ans of processedAnswers) {
      const [optionRows] = await connection.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [ans.questionId]);
      const options = optionRows as any[];
      const selectedOptId = ans.selectedOption !== undefined && ans.selectedOption !== null ? options[ans.selectedOption]?.id : null;
      
      await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)",
        [submissionId, ans.questionId, selectedOptId, ans.answerText || null, ans.pointsEarned]);
    }

    const [finalSubRows] = await connection.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [submissionId]);
    const finalSub = (finalSubRows as any)[0];
    const result = await mapSubmission(finalSub);

    await connection.commit();

    const [quizInfoRows] = await connection.query(`
      SELECT q.title, c.course_name as courseName, c.course_code 
      FROM quizzes q 
      JOIN courses c ON q.course_id = c.id 
      WHERE q.id = ?
    `, [quizId]);
    const quizInfo = (quizInfoRows as any)[0];
    const courseInfo = quizInfo ? ` for course ${quizInfo.course_code} - ${quizInfo.courseName}` : '';

    await logActivity(studentId, 'QUIZ_SUBMITTED', 'QUIZ', Number(quizId), `Student ${finalSub.studentName} submitted quiz "${quizName}"${courseInfo}. Score: ${earnedScore}/${maxPossibleScore}`);

    res.json(result);
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.put("/submissions/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { score, answers, feedback } = req.body;
    const subId = req.params.id;
    const { teacherId } = req.query;
    
    const [existingRows] = await connection.query("SELECT status, total_score, student_id, quiz_id, quiz_name FROM submissions WHERE id = ?", [subId]);
    const existing = (existingRows as any)[0];
    if (!existing) return res.status(404).json({ error: "Submission not found" });
    
    if (existing.status === 'GRADED') {
      return res.status(400).json({ error: "This submission has already been graded and finalized." });
    }

    await connection.beginTransaction();

    await connection.query("UPDATE submissions SET score = ?, status = 'GRADED', teacher_feedback = ? WHERE id = ?", [score || 0, feedback || null, subId]);
    
    if (Array.isArray(answers)) {
      for (const ans of answers) {
        await connection.query("UPDATE student_answers SET awarded_points = ? WHERE submission_id = ? AND question_id = ?", [ans.pointsEarned || 0, subId, ans.questionId]);
      }
    }

    await connection.commit();
    
    const [subRows] = await connection.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [subId]);
    const sub = (subRows as any)[0];
    
    const [quizInfoRows] = await connection.query(`
      SELECT q.title, c.course_name as courseName, c.course_code 
      FROM quizzes q 
      JOIN courses c ON q.course_id = c.id 
      WHERE q.id = ?
    `, [sub.quiz_id]);
    const quizInfo = (quizInfoRows as any)[0];
    const courseInfo = quizInfo ? ` in course ${quizInfo.course_code} - ${quizInfo.courseName}` : '';

    if (teacherId) {
      await logActivity(Number(teacherId), 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Graded submission for student ${sub.studentName}${courseInfo}. Score: ${score}/${sub.total_score}`);
    }
    await logActivity(sub.student_id, 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Your quiz "${sub.quiz_name}"${courseInfo} has been graded. Score: ${score}/${sub.total_score}`);

    res.json(await mapSubmission(sub));
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// --- Violations / Exam Monitoring ---
router.post("/exam/report-violation", async (req, res) => {
  try {
    const { studentId, type, message, severity, submissionId, browserInfo, ipAddress } = req.body;
    const timestamp = new Date();
    const formattedTimestamp = toMySQLDateTime(timestamp);
    
    await pool.query(`
      INSERT INTO violations (submission_id, student_id, violation_type, timestamp, severity, message, browser_info, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [submissionId || null, studentId, type, formattedTimestamp, severity, message, browserInfo || null, ipAddress || null]);
    
    res.json({ status: "received", timestamp });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save violation" });
  }
});

router.get("/exam/violations", async (req, res) => {
  try {
    const { studentId, submissionId } = req.query;
    let rows: any[];
    if (submissionId) {
      const [results] = await pool.query("SELECT * FROM violations WHERE submission_id = ?", [submissionId]);
      rows = results as any[];
    } else if (studentId) {
      const [results] = await pool.query("SELECT * FROM violations WHERE student_id = ?", [studentId]);
      rows = results as any[];
    } else {
      const [results] = await pool.query("SELECT * FROM violations ORDER BY timestamp DESC");
      rows = results as any[];
    }

    const mapped = rows.map(v => ({
      id: Number(v.id),
      submissionId: Number(v.submission_id),
      studentId: Number(v.student_id),
      type: v.violation_type,
      severity: v.severity,
      timestamp: v.timestamp,
      message: v.message,
      deviceInfo: v.device_info,
      browserInfo: v.browser_info,
      ipAddress: v.ip_address,
      duration: v.event_duration_seconds
    }));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

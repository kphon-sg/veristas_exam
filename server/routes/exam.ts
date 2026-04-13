import express from "express";
import { db, toDBDateTime } from "../config/database.js";
import { mapSubmission } from "../services/submissionService.js";
import { logActivity } from "../services/activityService.js";
import { evaluateCheating } from "../services/cheatingService.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/student/pending-quizzes", async (req: any, res) => {
  try {
    const studentId = req.user?.id;
    const { upcomingOnly } = req.query;
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    let query = `
      SELECT q.id, q.title, q.duration_minutes, q.deadline, c.course_name, c.course_code, q.status
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN course_enrollments e ON q.course_id = e.course_id
      WHERE e.student_id = ? 
        AND q.status IN ('PUBLISHED', 'EXPIRED')
        AND q.id NOT IN (
          SELECT quiz_id FROM submissions WHERE student_id = ? AND status IN ('SUBMITTED', 'GRADED', 'PENDING')
        )
    `;
    const params: any[] = [studentId, studentId];

    if (upcomingOnly === 'true') {
      query += " AND q.deadline > NOW() AND q.status = 'PUBLISHED'";
    }

    query += " ORDER BY q.deadline ASC";

    const [rows]: any = await db.query(query, params);

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/student/dashboard-overview", async (req: any, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Fetch Profile Info using LEFT JOIN
    const [profileRows]: any = await db.query(`
      SELECT 
        u.full_name, u.profile_picture, u.student_code, u.department, u.age, u.country_location, 
        sd.major, sd.year_of_study, sd.bio, sd.gpa
      FROM users u
      LEFT JOIN student_details sd ON u.id = sd.user_id
      WHERE u.id = ?
    `, [studentId]);
    
    const profile = profileRows[0] || {};

    // 2. Stats Aggregation using SQL for efficiency
    const [statsRows]: any = await db.query(`
      SELECT 
        COUNT(DISTINCT q.id) as totalAssigned,
        COUNT(DISTINCT s.quiz_id) as completedCount,
        COALESCE(AVG(CASE WHEN s.status = 'GRADED' THEN (s.score / s.total_score) * 100 END), 0) as averageScore
      FROM course_enrollments e
      JOIN quizzes q ON e.course_id = q.course_id
      LEFT JOIN submissions s ON q.id = s.quiz_id AND s.student_id = e.student_id AND s.status IN ('SUBMITTED', 'GRADED', 'PENDING')
      WHERE e.student_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
    `, [studentId]);

    const stats = statsRows[0] || { totalAssigned: 0, completedCount: 0, averageScore: 0 };

    res.json({
      profile: {
        fullName: profile.full_name || 'N/A',
        profilePicture: profile.profile_picture,
        studentCode: profile.student_code || 'N/A',
        department: profile.department || profile.major || 'N/A',
        age: profile.age || 'N/A',
        location: profile.country_location || 'N/A',
        yearOfStudy: profile.year_of_study || 'N/A',
        major: profile.major || 'N/A',
        gpa: profile.gpa || 0
      },
      stats: {
        totalAssigned: Number(stats.totalAssigned) || 0,
        completedCount: Number(stats.completedCount) || 0,
        pendingCount: Math.max(0, (Number(stats.totalAssigned) || 0) - (Number(stats.completedCount) || 0)),
        averageScore: Math.round(Number(stats.averageScore) || 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/student/dashboard-stats", async (req: any, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    // Single query with LEFT JOIN for global aggregation
    const [rows]: any = await db.query(`
      SELECT 
        COUNT(DISTINCT q.id) as totalAssigned,
        COUNT(DISTINCT s.quiz_id) as completedCount,
        COALESCE(AVG(CASE WHEN s.status = 'GRADED' THEN (s.score / s.total_score) * 100 END), 0) as averageScore
      FROM course_enrollments e
      JOIN quizzes q ON e.course_id = q.course_id
      LEFT JOIN submissions s ON q.id = s.quiz_id AND s.student_id = e.student_id AND s.status IN ('SUBMITTED', 'GRADED', 'PENDING')
      WHERE e.student_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
    `, [studentId]);

    const stats = rows[0] || { totalAssigned: 0, completedCount: 0, averageScore: 0 };

    res.json({
      totalAssigned: Number(stats.totalAssigned) || 0,
      completedCount: Number(stats.completedCount) || 0,
      pendingCount: Math.max(0, (Number(stats.totalAssigned) || 0) - (Number(stats.completedCount) || 0)),
      averageScore: Math.round(Number(stats.averageScore) || 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Submissions ---
router.get("/student/stats", async (req: any, res) => {
  try {
    const studentId = req.user?.id;
    const { classId } = req.query;
    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Total Assigned (Published/Expired and not deleted)
    // Filter by classId if provided, otherwise all enrolled courses
    let quizQuery = `
      SELECT q.id, q.deadline 
      FROM quizzes q
      JOIN course_enrollments e ON q.course_id = e.course_id
      WHERE e.student_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
    `;
    const quizParams: any[] = [studentId];
    if (classId && classId !== 'undefined' && classId !== 'null') {
      quizQuery += " AND q.course_id = ?";
      quizParams.push(classId);
    }

    const [quizResults]: any = await db.query(quizQuery, quizParams);
    const totalAssigned = quizResults.length;

    // 2. Completed (Latest submission per quiz for this student)
    let subQuery = `
      SELECT s.quiz_id, s.score, s.total_score, s.status, s.submitted_at
      FROM submissions s
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN course_enrollments e ON q.course_id = e.course_id
      WHERE s.student_id = ? 
        AND e.student_id = ?
        AND s.quiz_id = q.id
        AND q.status IN ('PUBLISHED', 'EXPIRED')
        AND (s.status = 'SUBMITTED' OR s.status = 'GRADED')
    `;
    const subParams: any[] = [studentId, studentId];
    if (classId && classId !== 'undefined' && classId !== 'null') {
      subQuery += " AND q.course_id = ?";
      subParams.push(classId);
    }

    const [subResults]: any = await db.query(subQuery, subParams);

    // Group by quiz_id to get latest submission
    const latestSubs = new Map<number, any>();
    (subResults as any[]).forEach(s => {
      const existing = latestSubs.get(s.quiz_id);
      if (!existing || new Date(s.submitted_at) > new Date(existing.submitted_at)) {
        latestSubs.set(s.quiz_id, s);
      }
    });

    const completedCount = latestSubs.size;

    // 3. Pending (Strictly Total Assigned - Completed)
    const pendingCount = Math.max(0, totalAssigned - completedCount);

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

router.get("/submissions", async (req: any, res) => {
  try {
    let { quizId, studentId, classId } = req.query;
    
    // If student is logged in, force their ID if not specified or for security
    if (req.user?.role === 'STUDENT') {
      studentId = req.user.id;
    }
    let queryStr = `
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
      queryStr = `
        SELECT s.*, u.full_name as studentName 
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        JOIN quizzes q ON s.quiz_id = q.id
      `;
      conditions.push("q.course_id = ?");
      params.push(classId);
    }

    if (conditions.length > 0) {
      queryStr += " WHERE " + conditions.join(" AND ");
    }
    queryStr += " ORDER BY s.submitted_at DESC";

    const [rows]: any = await db.query(queryStr, params);
    const mapped = await Promise.all((rows as any[]).map(r => mapSubmission(r)));
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/teacher/submissions", async (req: any, res) => {
  try {
    const teacherId = req.query.teacherId || req.user?.id;
    const { status, limit } = req.query;
    
    if (!teacherId) {
      return res.status(400).json({ error: "Missing teacherId" });
    }

    let queryStr = `
      SELECT 
        s.*, 
        u.full_name as studentName,
        u.student_code,
        q.title as quizTitle,
        c.course_name as className,
        c.course_code as classCode,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE q.teacher_id = ?
    `;
    const params: any[] = [teacherId];

    if (status && status !== 'undefined' && status !== 'null') {
      queryStr += " AND s.status = ?";
      params.push(status);
    }

    queryStr += " ORDER BY s.submitted_at DESC";

    if (limit && !isNaN(Number(limit))) {
      queryStr += " LIMIT ?";
      params.push(Number(limit));
    }

    const [rows]: any = await db.query(queryStr, params);
    const mapped = await Promise.all((rows as any[]).map(async (r) => {
      const sub = await mapSubmission(r);
      return {
        ...sub,
        studentName: r.studentName,
        studentCode: r.student_code,
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

    let queryStr = `
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
      queryStr += " AND q.course_id = ?";
      params.push(classId);
    }

    queryStr += " ORDER BY s.submitted_at DESC";

    const [rows]: any = await db.query(queryStr, params);
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
    const [rows]: any = await db.query(`
      SELECT s.*, 
             u.full_name as studentName, u.student_code,
             q.title as quizTitle,
             c.course_name as className, c.course_code as classCode,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);
    const sub = rows[0];
    if (!sub) return res.status(404).json({ error: "Submission not found" });
    res.json(await mapSubmission(sub));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/submissions", async (req, res) => {
  try {
    const { quizId, studentId, answers, startTime, browserInfo, ipAddress } = req.body;
    
    if (!quizId || !studentId || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing required fields or answers is not an array" });
    }

    const [quizzes]: any = await db.query("SELECT title, total_score FROM quizzes WHERE id = ?", [quizId]);
    const quiz = quizzes[0];
    const quizName = quiz ? quiz.title : 'Unknown Quiz';
    
    const [questions]: any = await db.query("SELECT * FROM questions WHERE quiz_id = ?", [quizId]);

    let maxPossibleScore = quiz ? Number(quiz.total_score) : 0;
    if (maxPossibleScore === 0 && (questions as any[]).length > 0) {
      maxPossibleScore = (questions as any[]).reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    }
    
    let earnedScore = 0;
    const processedAnswers = [];
    for (const ans of answers) {
      const question = (questions as any[]).find(q => q.id === Number(ans.questionId));
      let pointsEarned = 0;

      if (question && question.question_type === 'MULTIPLE_CHOICE') {
        const [options]: any = await db.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [question.id]);
        const correctOpt = options.find((o: any) => o.is_correct === 1);
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
    
    const hasEssay = (questions as any[]).some(q => q.question_type === 'ESSAY');
    const initialStatus = 'PENDING';
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Check for existing IN_PROGRESS submission
      const [existingSub]: any = await connection.query(
        "SELECT id FROM submissions WHERE quiz_id = ? AND student_id = ? AND status = 'IN_PROGRESS'",
        [Number(quizId), Number(studentId)]
      );

      let submissionId;
      if (existingSub.length > 0) {
        submissionId = existingSub[0].id;
        await connection.query(`
          UPDATE submissions SET 
            quiz_name = ?, status = ?, total_score = ?, score = ?, start_time = ?, submitted_at = ?, duration_seconds = ?, browser_info = ?, ip_address = ?
          WHERE id = ?
        `, [quizName, initialStatus, maxPossibleScore, earnedScore, toDBDateTime(startTime), toDBDateTime(submittedAt), duration, browserInfo || null, ipAddress || null, submissionId]);
        
        // Clear old answers if updating
        await connection.query("DELETE FROM student_answers WHERE submission_id = ?", [submissionId]);
      } else {
        const [subResult]: any = await connection.query(`
          INSERT INTO submissions (
            quiz_id, student_id, quiz_name, status, total_score, score, start_time, submitted_at, duration_seconds, browser_info, ip_address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [Number(quizId), Number(studentId), quizName, initialStatus, maxPossibleScore, earnedScore, toDBDateTime(startTime), toDBDateTime(submittedAt), duration, browserInfo || null, ipAddress || null]);
        submissionId = subResult.insertId;
      }

      await connection.query("UPDATE violations SET submission_id = ? WHERE student_id = ? AND submission_id IS NULL", [submissionId, studentId]);

      const [violationRows]: any = await connection.query("SELECT * FROM violations WHERE submission_id = ?", [submissionId]);
      const evaluation = evaluateCheating(violationRows);
      
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
        toDBDateTime(submittedAt), 
        submissionId
      ]);

      for (const ans of processedAnswers) {
        const [options]: any = await connection.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [ans.questionId]);
        const selectedOptId = ans.selectedOption !== undefined && ans.selectedOption !== null ? options[ans.selectedOption]?.id : null;
        
        await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [
          submissionId, ans.questionId, selectedOptId, ans.answerText || null, ans.pointsEarned
        ]);
      }
      
      await connection.commit();
      
      const [finalSubRows]: any = await db.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [submissionId]);
      const finalSub = finalSubRows[0];
      const result = await mapSubmission(finalSub);

      const [quizInfoRows]: any = await db.query(`
        SELECT q.title, c.course_name as courseName, c.course_code 
        FROM quizzes q 
        JOIN courses c ON q.course_id = c.id 
        WHERE q.id = ?
      `, [quizId]);
      const quizInfo = quizInfoRows[0];
      const courseInfo = quizInfo ? ` for course ${quizInfo.course_code} - ${quizInfo.courseName}` : '';

      await logActivity(studentId, 'QUIZ_SUBMITTED', 'QUIZ', Number(quizId), `Student ${finalSub.studentName} submitted quiz "${quizName}"${courseInfo}. Score: ${earnedScore}/${maxPossibleScore}`);

      res.json(result);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/submissions/:id", async (req, res) => {
  try {
    const { score, answers, feedback, finalize } = req.body;
    const subId = req.params.id;
    const { teacherId } = req.query;
    
    const [existingRows]: any = await db.query("SELECT status, total_score, student_id, quiz_id, quiz_name FROM submissions WHERE id = ?", [subId]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Submission not found" });
    
    if (existing.status === 'GRADED') {
      return res.status(400).json({ error: "This submission has already been graded and finalized." });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const newStatus = finalize ? 'GRADED' : 'PENDING';
      await connection.query("UPDATE submissions SET score = ?, status = ?, teacher_feedback = ? WHERE id = ?", [score || 0, newStatus, feedback || null, subId]);
      
      if (Array.isArray(answers)) {
        for (const ans of answers) {
          await connection.query("UPDATE student_answers SET awarded_points = ? WHERE submission_id = ? AND question_id = ?", [ans.pointsEarned || 0, subId, ans.questionId]);
        }
      }
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
    
    const [subRows]: any = await db.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [subId]);
    const sub = subRows[0];
    
    const [quizInfoRows]: any = await db.query(`
      SELECT q.title, c.course_name as courseName, c.course_code 
      FROM quizzes q 
      JOIN courses c ON q.course_id = c.id 
      WHERE q.id = ?
    `, [sub.quiz_id]);
    const quizInfo = quizInfoRows[0];
    const courseInfo = quizInfo ? ` in course ${quizInfo.course_code} - ${quizInfo.courseName}` : '';

    if (finalize) {
      if (teacherId) {
        await logActivity(Number(teacherId), 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Graded submission for student ${sub.studentName}${courseInfo}. Score: ${score}/${sub.total_score}`);
      }
      await logActivity(sub.student_id, 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Your quiz "${sub.quiz_name}"${courseInfo} has been graded. Score: ${score}/${sub.total_score}`);
    }

    res.json(await mapSubmission(sub));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Violations / Exam Monitoring ---
router.post("/exam/report-violation", async (req, res) => {
  try {
    const { studentId, type, message, severity, submissionId, browserInfo, ipAddress } = req.body;
    const timestamp = new Date();
    const formattedTimestamp = toDBDateTime(timestamp);
    
    await db.query(`
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
      const [vRows]: any = await db.query("SELECT * FROM violations WHERE submission_id = ?", [submissionId]);
      rows = vRows;
    } else if (studentId) {
      const [vRows]: any = await db.query("SELECT * FROM violations WHERE student_id = ?", [studentId]);
      rows = vRows;
    } else {
      const [vRows]: any = await db.query("SELECT * FROM violations ORDER BY timestamp DESC");
      rows = vRows;
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

router.get("/submissions/:id/analysis", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [subRows]: any = await db.query(`
      SELECT s.*, u.full_name as studentName, u.student_code
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = ?
    `, [id]);
    
    const sub = subRows[0];
    if (!sub) return res.status(404).json({ error: "Submission not found" });

    const [logRows]: any = await db.query(`
      SELECT * FROM proctoring_logs 
      WHERE submission_id = ? 
      ORDER BY start_time ASC
    `, [id]);

    const mappedLogs = (logRows as any[]).map(log => ({
      id: log.id,
      type: log.event_type,
      severity: log.severity,
      startTime: log.start_time,
      endTime: log.end_time,
      duration: log.duration,
      message: log.message
    }));

    const mappedSub = await mapSubmission(sub);

    res.json({
      ...mappedSub,
      proctoringLogs: mappedLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/submissions/:id/evidence", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows]: any = await db.query(`
      SELECT 
        id,
        submission_id as submissionId,
        violation_type as violation_type,
        evidence_type as evidence_type,
        file_url as file_url,
        confidence_score as confidence_score,
        timestamp
      FROM violation_logs 
      WHERE submission_id = ? 
      ORDER BY timestamp ASC
    `, [id]);

    res.json(rows.map((row: any) => ({
      ...row,
      file_url: row.file_url || "",
      violation_type: row.violation_type || "UNKNOWN"
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

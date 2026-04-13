import express from "express";
import { db, toDBDateTime } from "../config/database.js";
import { logActivity } from "../services/activityService.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: any, res) => {
  try {
    let { classId, teacherId, studentId } = req.query;
    
    if (req.user?.role === 'STUDENT') {
      studentId = req.user.id;
    }
    console.log(`[API] GET /quizzes - classId: ${classId}, teacherId: ${teacherId}, studentId: ${studentId}`);
    let quizRows: any[];
    
    if (classId && classId !== 'undefined') {
      if (studentId) {
        const [rows]: any = await db.query(`
          SELECT q.*, c.course_code, c.course_name, s.id as submission_id, s.score as submission_score, s.status as submission_status, s.submitted_at
          FROM quizzes q
          JOIN courses c ON q.course_id = c.id
          LEFT JOIN submissions s ON q.id = s.quiz_id AND s.student_id = ?
          WHERE q.course_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
        `, [studentId, classId]);
        quizRows = rows;
      } else {
        const [rows]: any = await db.query(`
          SELECT q.*, c.course_code, c.course_name 
          FROM quizzes q
          JOIN courses c ON q.course_id = c.id
          WHERE q.course_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
        `, [classId]);
        quizRows = rows;
      }
    } else if (studentId) {
      const [rows]: any = await db.query(`
        SELECT q.*, c.course_code, c.course_name, s.id as submission_id, s.score as submission_score, s.status as submission_status, s.submitted_at
        FROM quizzes q
        JOIN courses c ON q.course_id = c.id
        JOIN course_enrollments ce ON q.course_id = ce.course_id
        LEFT JOIN submissions s ON q.id = s.quiz_id AND s.student_id = ?
        WHERE ce.student_id = ? AND q.status IN ('PUBLISHED', 'EXPIRED')
      `, [studentId, studentId]);
      quizRows = rows;
    } else if (teacherId) {
      const [rows]: any = await db.query(`
        SELECT q.*, c.course_code, c.course_name 
        FROM quizzes q
        JOIN courses c ON q.course_id = c.id
        WHERE q.teacher_id = ? AND q.status != 'DELETED'
      `, [teacherId]);
      quizRows = rows;
    } else {
      const [rows]: any = await db.query(`
        SELECT q.*, c.course_code, c.course_name 
        FROM quizzes q
        JOIN courses c ON q.course_id = c.id
        WHERE q.status != 'DELETED'
      `);
      quizRows = rows;
    }

    const fullQuizzes = [];
    const now = new Date();

    for (const quiz of quizRows) {
      const [questionRows]: any = await db.query("SELECT * FROM questions WHERE quiz_id = ? ORDER BY sort_order ASC", [quiz.id]);
      const questionsWithOpts = [];
      for (const q of questionRows as any[]) {
        const [options]: any = await db.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [q.id]);
        const correctAnswer = options.findIndex((o: any) => o.is_correct === 1);
        questionsWithOpts.push({
          id: Number(q.id),
          text: q.question_text,
          type: q.question_type,
          points: q.points,
          sortOrder: q.sort_order,
          options: options.map((o: any) => o.option_text),
          correctAnswer: correctAnswer >= 0 ? correctAnswer : 0
        });
      }

      // Calculate completion status for students
      let completionStatus = null;
      if (studentId) {
        const deadline = new Date(quiz.deadline);
        if (quiz.submission_id && quiz.submission_status !== 'IN_PROGRESS') {
          completionStatus = 'completed';
        } else if (now > deadline) {
          completionStatus = 'overdue';
        } else {
          completionStatus = 'pending';
        }
      }

      fullQuizzes.push({ 
        id: Number(quiz.id),
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration_minutes,
        durationMinutes: quiz.duration_minutes,
        classId: Number(quiz.course_id),
        teacherId: Number(quiz.teacher_id),
        courseCode: quiz.course_code,
        courseName: quiz.course_name,
        deadline: quiz.deadline,
        openAt: quiz.open_at,
        closeAt: quiz.close_at,
        status: quiz.status,
        totalScore: quiz.total_score,
        createdAt: quiz.created_at,
        publishedAt: quiz.published_at,
        questions: questionsWithOpts,
        completionStatus,
        submissionScore: quiz.submission_score,
        submittedAt: quiz.submitted_at
      });
    }

    res.json(fullQuizzes);
  } catch (error: any) {
    console.error("[API] GET /quizzes error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [quizzes]: any = await db.query("SELECT * FROM quizzes WHERE id = ?", [req.params.id]);
    const quiz = quizzes[0];
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const [questionRows]: any = await db.query("SELECT * FROM questions WHERE quiz_id = ? ORDER BY sort_order ASC", [quiz.id]);
    const questions = [];
    for (const q of questionRows as any[]) {
      const [options]: any = await db.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [q.id]);
      questions.push({
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        points: q.points,
        options: options.map((o: any) => o.option_text),
        correctAnswer: options.findIndex((o: any) => o.is_correct)
      });
    }
    res.json({ 
      ...quiz, 
      duration: quiz.duration_minutes,
      durationMinutes: quiz.duration_minutes,
      questions 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, duration, classId, teacherId, deadline, openAt, closeAt, questions, status, totalScore } = req.body;
    
    if (!title || !classId || !teacherId || duration === undefined) {
      return res.status(400).json({ error: "Missing required fields: title, duration, classId, or teacherId" });
    }

    const createdAt = new Date();
    const publishedAt = status === 'PUBLISHED' ? createdAt : null;
    
    const [teachers]: any = await db.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
    const [courses]: any = await db.query("SELECT course_name AS name FROM courses WHERE id = ?", [classId]);
    const teacherName = teachers[0]?.full_name || null;
    const courseName = courses[0]?.name || null;

    let finalTotalScore = totalScore;
    if (finalTotalScore === undefined && questions && Array.isArray(questions)) {
      finalTotalScore = questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 0), 0);
    }

    // MySQL transactions are different. We'll use the pool's connection for transaction.
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result]: any = await connection.query(
        "INSERT INTO quizzes (title, duration_minutes, course_id, teacher_id, course_name, teacher_name, deadline, open_at, close_at, status, total_score, created_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, Number(duration), Number(classId), Number(teacherId), courseName, teacherName, toDBDateTime(deadline), toDBDateTime(openAt), toDBDateTime(closeAt), status || 'DRAFT', Number(finalTotalScore) || 0, toDBDateTime(createdAt), toDBDateTime(publishedAt)]
      );
      
      const quizId = result.insertId;

      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const [qResult]: any = await connection.query(
            "INSERT INTO questions (quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?)",
            [quizId, q.text || "Untitled Question", q.type, q.points || 1.0, i]
          );
          
          const questionId = qResult.insertId;
          if (q.type === 'MULTIPLE_CHOICE' && q.options) {
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              const opt = q.options[optIdx];
              await connection.query(
                "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                [questionId, opt || "", optIdx === q.correctAnswer ? 1 : 0]
              );
            }
          }
        }
      }
      
      await connection.commit();
      
      const [courseCodeRows]: any = await db.query("SELECT course_code FROM courses WHERE id = ?", [classId]);
      const courseCode = courseCodeRows[0]?.course_code || `Course #${classId}`;
      const courseInfo = `${courseCode} - ${courseName || 'N/A'}`;
      
      await logActivity(teacherId, 'QUIZ_CREATED', 'QUIZ', Number(quizId), `Teacher ${teacherName || 'Teacher'} created quiz "${title}" for course ${courseInfo}`);

      res.json({ id: quizId, ...req.body, createdAt, publishedAt });
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

router.put("/:id", async (req, res) => {
  try {
    const { title, duration, classId, deadline, openAt, closeAt, questions, status, totalScore } = req.body;
    const quizId = Number(req.params.id);
    
    const now = new Date();
    const [courses]: any = await db.query("SELECT course_name AS name FROM courses WHERE id = ?", [classId]);
    const courseName = courses[0]?.name || null;

    let finalTotalScore = totalScore;
    if (finalTotalScore === undefined && questions && Array.isArray(questions)) {
      finalTotalScore = questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 0), 0);
    }
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (status === 'PUBLISHED') {
        await connection.query(`
          UPDATE quizzes 
          SET title = ?, duration_minutes = ?, course_id = ?, course_name = ?, deadline = ?, open_at = ?, close_at = ?, status = ?, total_score = COALESCE(?, total_score), published_at = ?
          WHERE id = ?
        `, [title, Number(duration), Number(classId), courseName, toDBDateTime(deadline), toDBDateTime(openAt), toDBDateTime(closeAt), status, finalTotalScore !== undefined ? Number(finalTotalScore) : null, toDBDateTime(now), quizId]);
      } else {
        await connection.query(`
          UPDATE quizzes 
          SET title = ?, duration_minutes = ?, course_id = ?, course_name = ?, deadline = ?, open_at = ?, close_at = ?, status = ?, total_score = COALESCE(?, total_score)
          WHERE id = ?
        `, [title, Number(duration), Number(classId), courseName, toDBDateTime(deadline), toDBDateTime(openAt), toDBDateTime(closeAt), status, finalTotalScore !== undefined ? Number(finalTotalScore) : null, quizId]);
      }

      if (questions && Array.isArray(questions)) {
        await connection.query("DELETE FROM questions WHERE quiz_id = ?", [quizId]);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const [qResult]: any = await connection.query(
            "INSERT INTO questions (quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?)",
            [quizId, q.text || "Untitled Question", q.type, q.points || 1.0, i]
          );
          
          const questionId = qResult.insertId;
          if (q.type === 'MULTIPLE_CHOICE' && q.options) {
            for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
              const opt = q.options[optIdx];
              await connection.query(
                "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                [questionId, opt || "", optIdx === q.correctAnswer ? 1 : 0]
              );
            }
          }
        }
      }
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const [quizRows]: any = await db.query(`
      SELECT q.teacher_id, u.full_name as teacherName, c.course_name as courseName, c.course_code 
      FROM quizzes q 
      JOIN users u ON q.teacher_id = u.id 
      JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `, [quizId]);
    const quiz = quizRows[0];
    
    if (quiz) {
      await logActivity(quiz.teacher_id, 'QUIZ_UPDATED', 'QUIZ', quizId, `Teacher ${quiz.teacherName} updated quiz "${title}" for course ${quiz.course_code} - ${quiz.courseName}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const quizId = req.params.id;
    const { teacherId } = req.query;

    const [quizzes]: any = await db.query("SELECT * FROM quizzes WHERE id = ?", [quizId]);
    const quiz = quizzes[0];
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    await db.query("UPDATE quizzes SET status = 'DELETED' WHERE id = ?", [quizId]);
    
    if (teacherId) {
      const [teachers]: any = await db.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
      const teacherName = teachers[0] ? teachers[0].full_name : 'Teacher';
      
      const [courses]: any = await db.query("SELECT c.course_name, c.course_code FROM courses c JOIN quizzes q ON q.course_id = c.id WHERE q.id = ?", [quizId]);
      const course = courses[0];
      const courseInfo = course ? ` for course ${course.course_code} - ${course.course_name}` : '';

      await logActivity(Number(teacherId), 'QUIZ_DELETED', 'QUIZ', Number(quizId), `Teacher ${teacherName} deleted quiz "${quiz.title}"${courseInfo}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/start", async (req, res) => {
  try {
    const quizId = req.params.id;
    const { studentId } = req.body;

    const [quizzes]: any = await db.query(`
      SELECT q.title, q.total_score, c.course_name as courseName, c.course_code 
      FROM quizzes q 
      JOIN courses c ON q.course_id = c.id 
      WHERE q.id = ?
    `, [quizId]);
    const quiz = quizzes[0];
    
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const [students]: any = await db.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
    const studentName = students[0] ? students[0].full_name : 'Student';

    // Create or get existing IN_PROGRESS submission
    const [existingSub]: any = await db.query(
      "SELECT id FROM submissions WHERE quiz_id = ? AND student_id = ? AND status = 'IN_PROGRESS'",
      [quizId, studentId]
    );

    let submissionId;
    if (existingSub.length > 0) {
      submissionId = existingSub[0].id;
    } else {
      const [subResult]: any = await db.query(`
        INSERT INTO submissions (quiz_id, student_id, quiz_name, status, total_score, start_time)
        VALUES (?, ?, ?, 'IN_PROGRESS', ?, NOW())
      `, [quizId, studentId, quiz.title, quiz.total_score || 0]);
      submissionId = subResult.insertId;
    }

    await logActivity(studentId, 'QUIZ_STARTED', 'QUIZ', Number(quizId), `Student ${studentName} started quiz "${quiz.title}" for course ${quiz.course_code} - ${quiz.courseName}`);
    res.json({ success: true, submissionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

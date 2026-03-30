import express from "express";
import { pool } from "../config/database.js";
import { logActivity } from "../services/activityService.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// --- Classes / Courses ---
router.get("/classes", async (req: any, res) => {
  try {
    const { studentId } = req.query;
    let rows: any[];
    if (studentId) {
      const [results] = await pool.query(`
        SELECT c.* FROM courses c
        JOIN course_enrollments e ON c.id = e.course_id
        WHERE e.student_id = ?
      `, [studentId]);
      rows = results as any[];
    } else if (req.user && req.user.role === 'TEACHER') {
      const [results] = await pool.query("SELECT * FROM courses WHERE teacher_id = ?", [req.user.id]);
      rows = results as any[];
    } else {
      const [results] = await pool.query("SELECT * FROM courses");
      rows = results as any[];
    }

    const mapped = rows.map(r => ({
      id: Number(r.id),
      courseCode: r.course_code,
      name: r.course_name,
      description: r.description,
      schoolName: r.school_name,
      educationLevel: r.education_level,
      teacherId: Number(r.teacher_id),
      createdAt: r.created_at
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/classes/:courseId/materials", async (req: any, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await pool.query("SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC", [courseId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classes", async (req, res) => {
  try {
    const { courseCode, name, description, schoolName, educationLevel, teacherId, teacherName } = req.body;
    
    // Sanitize values: convert undefined to null for database compatibility
    const params = [
      courseCode ?? null,
      name ?? null,
      description ?? null,
      schoolName ?? null,
      educationLevel ?? null,
      teacherId ?? null,
      teacherName ?? null
    ];

    const [result] = await pool.execute(
      "INSERT INTO courses (course_code, course_name, description, school_name, education_level, teacher_id, teacher_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params
    );
    res.status(201).json({ id: (result as any).insertId });
  } catch (error: any) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/classes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM courses WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/classes/search-available", async (req, res) => {
  try {
    const { query, courseName, courseCode, teacherName, schoolName, studentId } = req.query;
    
    let sql = `
      SELECT c.*, u.full_name as teacher_name,
             (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id AND student_id = ?) > 0 as is_enrolled,
             (SELECT status FROM course_join_requests WHERE course_id = c.id AND student_id = ? AND status = 'PENDING') as request_status
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [studentId, studentId];

    if (query) {
      sql += " AND (c.course_name LIKE ? OR c.course_code LIKE ? OR u.full_name LIKE ? OR c.school_name LIKE ?)";
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (courseName) {
      sql += " AND c.course_name LIKE ?";
      params.push(`%${courseName}%`);
    }

    if (courseCode) {
      sql += " AND c.course_code LIKE ?";
      params.push(`%${courseCode}%`);
    }

    if (teacherName) {
      sql += " AND u.full_name LIKE ?";
      params.push(`%${teacherName}%`);
    }

    if (schoolName) {
      sql += " AND c.school_name LIKE ?";
      params.push(`%${schoolName}%`);
    }

    const [rows] = await pool.query(sql, params);

    const mapped = (rows as any[]).map(r => ({
      id: Number(r.id),
      courseCode: r.course_code,
      name: r.course_name,
      teacherName: r.teacher_name,
      schoolName: r.school_name,
      isEnrolled: Boolean(r.is_enrolled),
      requestStatus: r.request_status
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/classes/:id/students", async (req, res) => {
  try {
    const classId = req.params.id;
    const [rows] = await pool.query(`
      SELECT u.id, u.student_code as studentCode, u.full_name as fullName, u.email, e.enrolled_at as enrolledAt
      FROM users u
      JOIN course_enrollments e ON u.id = e.student_id
      WHERE e.course_id = ? AND u.role = 'STUDENT'
    `, [classId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classes/:id/enroll", async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentId } = req.body;
    const { teacherId } = req.query;
    
    if (!studentId) return res.status(400).json({ error: "Student ID is required" });

    const [existing] = await pool.query("SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?", [classId, studentId]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: "Student is already enrolled in this class" });
    }

    await pool.execute("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [classId, studentId]);

    const [courseRows] = await pool.query("SELECT course_name AS name, course_code FROM courses WHERE id = ?", [classId]);
    const course = (courseRows as any)[0];
    const [studentRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
    const student = (studentRows as any)[0];

    if (course && student) {
      if (teacherId) {
        await logActivity(Number(teacherId), 'STUDENT_ADDED', 'COURSE', Number(classId), `Added student ${student.full_name} to course ${course.course_code} - ${course.name}`);
      }
      await logActivity(studentId, 'COURSE_JOINED', 'COURSE', Number(classId), `Joined course: ${course.course_code} - ${course.name}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/classes/:id/unenroll/:studentId", async (req, res) => {
  try {
    const classId = req.params.id;
    const studentId = req.params.studentId;
    const { teacherId } = req.query;

    const [courseRows] = await pool.query("SELECT course_name AS name, course_code FROM courses WHERE id = ?", [classId]);
    const course = (courseRows as any)[0];
    const [studentRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
    const student = (studentRows as any)[0];

    const [result] = await pool.execute("DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?", [classId, studentId]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    if (course && student) {
      if (teacherId) {
        await logActivity(Number(teacherId), 'STUDENT_REMOVED', 'COURSE', Number(classId), `Removed student ${student.full_name} from course ${course.course_code} - ${course.name}`);
      }
      await logActivity(Number(studentId), 'COURSE_LEFT', 'COURSE', Number(classId), `Left course: ${course.course_code} - ${course.name}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Invitations ---
router.post("/classes/:courseId/invite", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { courseId } = req.params;
    const { studentId, teacherId } = req.body;

    if (!studentId || !teacherId) {
      return res.status(400).json({ error: "studentId and teacherId are required" });
    }

    await connection.beginTransaction();

    const [enrollment] = await connection.query("SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?", [courseId, studentId]);
    if ((enrollment as any[]).length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Student is already enrolled in this class" });
    }

    const [invitation] = await connection.query("SELECT id, status FROM course_invitations WHERE course_id = ? AND student_id = ?", [courseId, studentId]);
    const existing = (invitation as any[])[0];
    if (existing) {
      if (existing.status === 'PENDING') {
        await connection.rollback();
        return res.status(400).json({ error: "An invitation is already pending for this student" });
      }
      await connection.query("DELETE FROM course_invitations WHERE id = ?", [existing.id]);
    }

    const [result] = await connection.query("INSERT INTO course_invitations (course_id, teacher_id, student_id, status) VALUES (?, ?, ?, 'PENDING')", [courseId, teacherId, studentId]);
    const invitationId = (result as any).insertId;

    const [courseRows] = await connection.query("SELECT course_name AS name, course_code FROM courses WHERE id = ?", [courseId]);
    const [teacherRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
    const course = (courseRows as any)[0];
    const teacher = (teacherRows as any)[0];

    await connection.query(
      "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION', ?, ?, ?)",
      [studentId, "New Class Invitation", `Teacher ${teacher.full_name} invited you to join class: ${course.course_code} - ${course.name}`, invitationId]
    );

    await connection.commit();
    
    await logActivity(teacherId, 'INVITATION_SENT', 'COURSE', Number(courseId), `Invited student ${studentId} to join course ${course.course_code} - ${course.name}`);
    await logActivity(studentId, 'INVITATION_RECEIVED', 'COURSE', Number(courseId), `Received invitation from Teacher ${teacher.full_name} to join course ${course.course_code} - ${course.name}`);

    res.json({ success: true, invitationId });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.post("/invitations/:id/respond", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await connection.beginTransaction();

    const [invitationRows] = await connection.query("SELECT * FROM course_invitations WHERE id = ?", [id]);
    const invitation = (invitationRows as any)[0];

    if (!invitation || invitation.status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({ error: "Invitation not found or already processed" });
    }

    await connection.query("UPDATE course_invitations SET status = ? WHERE id = ?", [status, id]);

    const [courseRows] = await connection.query("SELECT course_name AS name, course_code FROM courses WHERE id = ?", [invitation.course_id]);
    const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [invitation.student_id]);
    
    const course = (courseRows as any)[0];
    const student = (studentRows as any)[0];

    if (status === 'ACCEPTED') {
      await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [invitation.course_id, invitation.student_id]);
    }

    await connection.query(
      "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION_RESPONSE', ?, ?, ?)",
      [invitation.teacher_id, status === 'ACCEPTED' ? "Invitation Accepted" : "Invitation Declined", `Student ${student.full_name} has ${status.toLowerCase()} your invitation to join ${course.course_code}`, id]
    );

    await connection.commit();

    await logActivity(invitation.student_id, `INVITATION_${status}`, 'COURSE', invitation.course_id, `${status === 'ACCEPTED' ? 'Accepted' : 'Declined'} invitation to join course ${course.course_code} - ${course.name}`);
    await logActivity(invitation.teacher_id, `STUDENT_INVITATION_${status}`, 'COURSE', invitation.course_id, `Student ${student.full_name} ${status.toLowerCase()} your invitation to join course ${course.course_code} - ${course.name}`);

    res.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// --- Join Requests ---
router.post("/classes/:courseId/join-request", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    await connection.beginTransaction();

    const [enrollment] = await connection.query("SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?", [courseId, studentId]);
    if ((enrollment as any[]).length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "You are already enrolled in this class" });
    }

    const [request] = await connection.query("SELECT id, status FROM course_join_requests WHERE course_id = ? AND student_id = ?", [courseId, studentId]);
    const existing = (request as any[])[0];
    if (existing) {
      if (existing.status === 'PENDING') {
        await connection.rollback();
        return res.status(400).json({ error: "A join request is already pending" });
      }
      await connection.query("DELETE FROM course_join_requests WHERE id = ?", [existing.id]);
    }

    const [result] = await connection.query("INSERT INTO course_join_requests (course_id, student_id, status) VALUES (?, ?, 'PENDING')", [courseId, studentId]);
    const requestId = (result as any).insertId;

    const [courseRows] = await connection.query("SELECT course_name AS name, course_code, teacher_id FROM courses WHERE id = ?", [courseId]);
    const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
    const course = (courseRows as any)[0];
    const student = (studentRows as any)[0];

    await connection.query(
      "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_REQUEST', ?, ?, ?)",
      [course.teacher_id, "New Join Request", `Student ${student.full_name} wants to join your class: ${course.course_code} - ${course.name}`, requestId]
    );

    await connection.commit();

    await logActivity(studentId, 'JOIN_REQUEST_SENT', 'COURSE', Number(courseId), `Sent request to join course: ${course.course_code} - ${course.name}`);
    await logActivity(course.teacher_id, 'JOIN_REQUEST_RECEIVED', 'COURSE', Number(courseId), `Student ${student.full_name} requested to join course ${course.course_code} - ${course.name}`);

    res.json({ success: true, requestId });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.post("/join-requests/:id/respond", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;

    await connection.beginTransaction();

    const [requestRows] = await connection.query("SELECT * FROM course_join_requests WHERE id = ?", [id]);
    const request = (requestRows as any)[0];

    if (!request || request.status !== 'PENDING') {
      await connection.rollback();
      return res.status(400).json({ error: "Request not found or already processed" });
    }

    await connection.query("UPDATE course_join_requests SET status = ? WHERE id = ?", [status, id]);

    const [courseRows] = await connection.query("SELECT course_name AS name, course_code, teacher_id FROM courses WHERE id = ?", [request.course_id]);
    const course = (courseRows as any)[0];

    if (status === 'ACCEPTED') {
      await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [request.course_id, request.student_id]);
    }

    await connection.query(
      "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_RESPONSE', ?, ?, ?)",
      [request.student_id, status === 'ACCEPTED' ? "Join Request Accepted" : "Join Request Declined", `Your request to join ${course.course_code} has been ${status.toLowerCase()}`, id]
    );

    await connection.commit();

    const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [request.student_id]);
    const student = (studentRows as any)[0];

    await logActivity(course.teacher_id, `JOIN_REQUEST_${status}`, 'COURSE', request.course_id, `${status === 'ACCEPTED' ? 'Accepted' : 'Declined'} join request from ${student ? student.full_name : 'Unknown Student'} for course ${course.course_code} - ${course.name}`);
    await logActivity(request.student_id, `JOIN_REQUEST_${status}_BY_TEACHER`, 'COURSE', request.course_id, `Your request to join course ${course.course_code} - ${course.name} was ${status.toLowerCase()} by the teacher`);

    res.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// --- Students ---
router.get("/students/search", async (req, res) => {
  try {
    const { query, courseId } = req.query;
    if (!query || (query as string).length < 2) return res.json([]);
    
    const searchTerm = `%${query}%`;
    let queryStr = `SELECT u.id, u.student_code as studentCode, u.full_name as fullName, u.email `;
    const params: any[] = [];
    
    if (courseId) {
      queryStr += `, (SELECT COUNT(*) FROM course_enrollments WHERE course_id = ? AND student_id = u.id) > 0 as isEnrolled `;
      params.push(courseId);
    } else {
      queryStr += `, 0 as isEnrolled `;
    }
    
    queryStr += ` FROM users u WHERE u.role = 'STUDENT' AND (u.full_name LIKE ? OR u.student_code LIKE ? OR u.email LIKE ?) LIMIT 20 `;
    params.push(searchTerm, searchTerm, searchTerm);

    const [rows] = await pool.query(queryStr, params);
    res.json((rows as any[]).map(r => ({ ...r, isEnrolled: Boolean(r.isEnrolled) })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Schools ---
router.get("/schools", async (req, res) => {
  try {
    const { query } = req.query;
    let sql = "SELECT DISTINCT school_name FROM courses WHERE school_name IS NOT NULL AND school_name != ''";
    const params: any[] = [];
    
    if (query) {
      sql += " AND school_name LIKE ?";
      params.push(`%${query}%`);
    }
    
    sql += " LIMIT 10";
    
    const [rows] = await pool.query(sql, params);
    const schools = (rows as any[]).map(r => r.school_name);
    
    res.json(schools);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

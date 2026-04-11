import express from "express";
import { db } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// --- Activities ---
router.get("/activities", async (req, res) => {
  try {
    const { userId, type, date, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT 
        a.id, 
        a.user_id as userId, 
        a.action_type as actionType, 
        a.entity_type as entityType, 
        a.entity_id as entityId, 
        a.details, 
        a.created_at as createdAt, 
        u.username as userName 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += " AND a.user_id = ?";
      params.push(userId);
    }
    if (type) {
      query += " AND a.action_type = ?";
      params.push(type);
    }
    if (date) {
      query += " AND DATE(a.created_at) = ?";
      params.push(date);
    }

    const countQuery = `SELECT COUNT(*) as total FROM activities a WHERE 1=1 ${userId ? 'AND a.user_id = ?' : ''} ${type ? 'AND a.action_type = ?' : ''} ${date ? 'AND DATE(a.created_at) = ?' : ''}`;
    const countParams = [];
    if (userId) countParams.push(userId);
    if (type) countParams.push(type);
    if (date) countParams.push(date);
    
    const [countRows]: any = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows]: any = await db.query(query, params);
    
    res.json({
      activities: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error("[API] GET /activities error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Admin / System ---
router.post("/admin/seed", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Generate Teachers
    for (let i = 1; i <= 15; i++) {
      await connection.query(
        "INSERT IGNORE INTO users (username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        [`teacher${i}`, null, `Teacher Name ${i}`, `teacher${i}@edu.com`, 'password123', 'TEACHER']
      );
    }

    // 2. Generate Students
    for (let i = 1; i <= 200; i++) {
      const code = `STU${1000 + i}`;
      await connection.query(
        "INSERT IGNORE INTO users (username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        [`student${i}`, code, `Student Full Name ${i}`, `student${i}@edu.com`, 'password123', 'STUDENT']
      );
    }

    const [teacherRows]: any = await connection.query("SELECT id FROM users WHERE role = 'TEACHER'");
    const teacherIds = teacherRows.map((r: any) => r.id);

    // 3. Generate Courses
    const courseCodes = [
      'CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'IT101', 'IT102', 'IT201', 'IT202',
      'MATH101', 'MATH102', 'PHY101', 'PHY102', 'BIO101', 'BIO102', 'ENG101', 'ENG102', 'HIS101', 'HIS102',
      'ART101', 'ART102', 'MUS101', 'MUS102', 'PE101'
    ];

    for (let i = 0; i < courseCodes.length; i++) {
      const teacherId = teacherIds[i % teacherIds.length];
      await connection.query(
        "INSERT IGNORE INTO courses (course_code, course_name, description, teacher_id) VALUES (?, ?, ?, ?)",
        [courseCodes[i], `Course Name for ${courseCodes[i]}`, `Comprehensive description for ${courseCodes[i]} course.`, teacherId]
      );
    }

    const [courseRows]: any = await connection.query("SELECT id FROM courses");
    const [studentRows]: any = await connection.query("SELECT id FROM users WHERE role = 'STUDENT'");
    const courseIds = courseRows.map((r: any) => r.id);
    const studentIds = studentRows.map((r: any) => r.id);

    // 4. Generate Enrollments
    for (const courseId of courseIds) {
      const numStudents = Math.floor(Math.random() * 31) + 20;
      const shuffled = [...studentIds].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, numStudents);
      for (const studentId of selectedStudents) {
        await connection.query("INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [courseId, studentId]);
      }
    }

    await connection.commit();
    res.json({ message: "Database seeded successfully" });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

export default router;

import express from "express";
import { pool } from "../config/database.js";
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
    
    const [countRows] = await pool.query(countQuery, countParams);
    const total = (countRows as any)[0].total;

    query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const [rows] = await pool.query(query, params);
    
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
  try {
    // 1. Generate Teachers
    const teachers = [];
    for (let i = 1; i <= 15; i++) {
      teachers.push([
        `teacher${i}`,
        null,
        `Teacher Name ${i}`,
        `teacher${i}@edu.com`,
        'password123',
        'TEACHER'
      ]);
    }

    // 2. Generate Students
    const students = [];
    for (let i = 1; i <= 200; i++) {
      const code = `STU${1000 + i}`;
      students.push([
        `student${i}`,
        code,
        `Student Full Name ${i}`,
        `student${i}@edu.com`,
        'password123',
        'STUDENT'
      ]);
    }

    await pool.query(
      "INSERT IGNORE INTO users (username, student_code, full_name, email, password, role) VALUES ?",
      [ [...teachers, ...students] ]
    );

    const [teacherRows] = await pool.query("SELECT id FROM users WHERE role = 'TEACHER'");
    const teacherIds = (teacherRows as any[]).map(r => r.id);

    // 3. Generate Courses
    const courses = [];
    const courseCodes = [
      'CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'IT101', 'IT102', 'IT201', 'IT202',
      'MATH101', 'MATH102', 'PHY101', 'PHY102', 'BIO101', 'BIO102', 'ENG101', 'ENG102', 'HIS101', 'HIS102',
      'ART101', 'ART102', 'MUS101', 'MUS102', 'PE101'
    ];

    for (let i = 0; i < courseCodes.length; i++) {
      const teacherId = teacherIds[i % teacherIds.length];
      courses.push([
        courseCodes[i],
        `Course Name for ${courseCodes[i]}`,
        `Comprehensive description for ${courseCodes[i]} course.`,
        teacherId
      ]);
    }

    await pool.query(
      "INSERT IGNORE INTO courses (course_code, course_name, description, teacher_id) VALUES ?",
      [courses]
    );

    const [courseRows] = await pool.query("SELECT id FROM courses");
    const [studentRows] = await pool.query("SELECT id FROM users WHERE role = 'STUDENT'");
    const courseIds = (courseRows as any[]).map(r => r.id);
    const studentIds = (studentRows as any[]).map(r => r.id);

    // 4. Generate Enrollments
    const enrollments = [];
    for (const courseId of courseIds) {
      const numStudents = Math.floor(Math.random() * 31) + 20;
      const shuffled = [...studentIds].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, numStudents);
      for (const studentId of selectedStudents) {
        enrollments.push([courseId, studentId]);
      }
    }

    const chunkSize = 500;
    for (let i = 0; i < enrollments.length; i += chunkSize) {
      const chunk = enrollments.slice(i, i + chunkSize);
      await pool.query(
        "INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES ?",
        [chunk]
      );
    }

    res.json({ message: "Database seeded successfully", teachers: teachers.length, students: students.length, courses: courses.length, enrollments: enrollments.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

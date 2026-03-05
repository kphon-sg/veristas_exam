import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toMySQLDateTime = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // Format to YYYY-MM-DD HH:mm:ss
    // This is the standard format MySQL DATETIME expects.
    // We use ISO string and transform it to avoid any local timezone issues during formatting.
    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');
    console.log(`[toMySQLDateTime] Input: ${date} -> Output: ${formatted}`);
    return formatted;
  } catch (e) {
    console.error(`[toMySQLDateTime] Error formatting ${date}:`, e);
    return null;
  }
};

console.log("Starting server.ts...");

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "edge_ai_exam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database with a fully normalized production-ready schema
async function initDatabase() {
  try {
    console.log("[DB] Initializing MySQL database...");
    
    // Check if database exists and create if not
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "123456",
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "edge_ai_exam"}\``);
    await tempConn.end();

    // Create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          student_code VARCHAR(20) UNIQUE,
          full_name VARCHAR(100),
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('TEACHER', 'STUDENT') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Migration: Ensure student_code column exists
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'student_code'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding student_code column to users table...");
        await pool.execute("ALTER TABLE users ADD COLUMN student_code VARCHAR(20) UNIQUE AFTER username");
      }
    } catch (err) {
      console.error("[DB] Migration error (student_code):", err);
    }

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_code VARCHAR(20) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          teacher_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          student_id INT NOT NULL,
          enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE (course_id, student_id)
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS quizzes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          description TEXT,
          duration_minutes INT NOT NULL,
          course_id INT NOT NULL,
          teacher_id INT NOT NULL,
          deadline DATETIME,
          status ENUM('DRAFT', 'PUBLISHED', 'DELETED') DEFAULT 'DRAFT',
          total_score DECIMAL(5,2) DEFAULT 0.0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          published_at DATETIME,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          quiz_id INT NOT NULL,
          question_text TEXT NOT NULL,
          question_type ENUM('MULTIPLE_CHOICE', 'ESSAY') NOT NULL,
          points DECIMAL(5,2) DEFAULT 1.0,
          sort_order INT DEFAULT 0,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS question_options (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question_id INT NOT NULL,
          option_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          quiz_id INT NOT NULL,
          student_id INT NOT NULL,
          quiz_name VARCHAR(100),
          start_time DATETIME,
          end_time DATETIME,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          duration_seconds INT DEFAULT 0,
          status ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'AUTO_TERMINATED') DEFAULT 'IN_PROGRESS',
          auto_termination_reason TEXT,
          total_score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
          score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
          cheating_status ENUM('NO_CHEATING', 'SUSPICIOUS', 'CHEATING') DEFAULT 'NO_CHEATING',
          risk_score DECIMAL(5,2) DEFAULT 0.0,
          total_violation_count INT DEFAULT 0,
          low_violation_count INT DEFAULT 0,
          medium_violation_count INT DEFAULT 0,
          high_violation_count INT DEFAULT 0,
          evaluation_timestamp TIMESTAMP NULL,
          browser_info VARCHAR(255),
          ip_address VARCHAR(45),
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_answers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          submission_id INT NOT NULL,
          question_id INT NOT NULL,
          selected_option_id INT,
          answer_text TEXT,
          awarded_points DECIMAL(5,2) DEFAULT 0.0,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS violations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          submission_id INT,
          student_id INT NOT NULL,
          violation_type VARCHAR(50) NOT NULL,
          severity ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          message TEXT,
          device_info VARCHAR(255),
          browser_info VARCHAR(255),
          ip_address VARCHAR(45),
          event_duration_seconds INT DEFAULT 0,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS course_invitations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          teacher_id INT NOT NULL,
          student_id INT NOT NULL,
          status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE (course_id, student_id)
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS course_join_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          student_id INT NOT NULL,
          status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE (course_id, student_id)
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type ENUM('INVITATION', 'JOIN_REQUEST', 'SYSTEM', 'INVITATION_RESPONSE', 'JOIN_RESPONSE') NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          related_id INT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50),
          entity_id INT,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log("Database schema verified/created.");

    // Migration: Update old activity logs to use course names instead of "class [ID]"
    try {
      console.log("[DB] Migrating old activity logs...");
      // 1. Fix QUIZ_CREATED logs
      const [oldQuizLogs] = await pool.query(`
        SELECT a.id, a.entity_id as quizId, q.title, c.name as courseName, c.course_code, u.full_name as teacherName, a.user_id
        FROM activities a
        JOIN quizzes q ON a.entity_id = q.id
        JOIN courses c ON q.course_id = c.id
        JOIN users u ON a.user_id = u.id
        WHERE a.action_type = 'QUIZ_CREATED' AND (a.details LIKE '%for class %' OR a.details NOT LIKE 'Teacher %')
      `);
      
      for (const log of oldQuizLogs as any[]) {
        const newDetails = `Teacher ${log.teacherName} created quiz "${log.title}" for course ${log.course_code} - ${log.courseName}`;
        await pool.execute("UPDATE activities SET details = ? WHERE id = ?", [newDetails, log.id]);
      }
      
      // 2. Fix other logs that might use "class"
      await pool.execute("UPDATE activities SET details = REPLACE(details, 'class:', 'course:') WHERE details LIKE '%class:%'");
      await pool.execute("UPDATE activities SET details = REPLACE(details, 'class ', 'course ') WHERE details LIKE '%class %'");
      await pool.execute("UPDATE activities SET entity_type = 'COURSE' WHERE entity_type = 'CLASS'");
      
      console.log("[DB] Activity log migration completed.");
    } catch (err) {
      console.error("[DB] Migration error (activities):", err);
    }

    // Check if seeding is needed
    const [userCountRows] = await pool.query("SELECT count(*) as count FROM users");
    const [courseCountRows] = await pool.query("SELECT count(*) as count FROM courses");
    const userCount = (userCountRows as any)[0].count;
    const courseCount = (courseCountRows as any)[0].count;

    if (userCount === 0 || courseCount === 0) {
      console.log("[DB] Seeding required...");
      await seedDatabase();
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

// Helper to clear and seed
const seedDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log("Seeding database with the user's provided SQL data...");
    await connection.beginTransaction();

    // 1. Users
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [1, "teacher_admin", "TCIU001", "Dr. Alan Turing", "turing@edu.com", "123", "TEACHER"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [2, "student_sv01", "ITIU21278", "Grace Hopper", "grace@edu.com", "123", "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [3, "student_sv02", "ITIU22231", "Ada Lovelace", "ada@edu.com", "123", "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [4, "student_sv03", "SEIU23145", "Linus Torvalds", "linus@edu.com", "123", "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [5, "chukongphong", "TCIU002", "Chu Kong Phong", "chukongphong@gmail.com", "123", "TEACHER"]);

    // 2. Courses
    await connection.query("INSERT INTO courses (id, course_code, name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [1, "IT101", "Introduction to Programming", "Foundations of logic using Python.", 1]);
    await connection.query("INSERT INTO courses (id, course_code, name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [2, "IT303", "Database Systems", "Relational modeling and SQL mastery.", 1]);
    await connection.query("INSERT INTO courses (id, course_code, name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [3, "AI101", "Artificial Intelligence", "Introduction to AI and Machine Learning.", 5]);

    // 3. Enrollments
    await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [1, 2]);
    await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [2, 2]);
    await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [2, 3]);
    await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)", [1, 4]);

    // 4. Quizzes
    await connection.query("INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, deadline, status, total_score, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", [1, "Python Basics Quiz", "Basic syntax and logic", 30, 1, 1, '2026-12-31 23:59:59', 'PUBLISHED', 10.0]);
    await connection.query("INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, deadline, status, total_score, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", [2, "SQL Joins Mastery", "Complex queries and joins", 45, 2, 1, '2026-12-31 23:59:59', 'PUBLISHED', 10.0]);

    // 5. Questions
    await connection.query("INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [1, 1, "What is the output of 2 ** 3 in Python?", "MULTIPLE_CHOICE", 2.0, 1]);
    await connection.query("INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [2, 1, "Explain the difference between a List and a Tuple.", "ESSAY", 5.0, 2]);
    await connection.query("INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?, ?)", [3, 2, "Which JOIN returns all records when there is a match in either left or right table?", "MULTIPLE_CHOICE", 2.0, 1]);

    // 6. Options
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [1, 1, "6", 0]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [2, 1, "8", 1]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [3, 1, "9", 0]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [4, 1, "5", 0]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [5, 3, "INNER JOIN", 0]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [6, 3, "LEFT JOIN", 0]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [7, 3, "FULL OUTER JOIN", 1]);
    await connection.query("INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)", [8, 3, "RIGHT JOIN", 0]);

    // 7. Submissions
    // Submission 1: Grace Hopper (ID 2) - Python Basics - GRADED
    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, 1, 2, 'Python Basics Quiz', '2026-03-01 10:00:00', '2026-03-01 10:15:00', '2026-03-01 10:15:00', 900, 'GRADED', 7.0, 6.0, 'NO_CHEATING', 5.0]);

    // Submission 2: Grace Hopper (ID 2) - SQL Joins - SUBMITTED (Suspicious)
    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score, total_violation_count, medium_violation_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [2, 2, 2, 'SQL Joins Mastery', '2026-03-01 11:00:00', '2026-03-01 11:30:00', '2026-03-01 11:30:00', 1800, 'SUBMITTED', 2.0, 0.0, 'SUSPICIOUS', 45.0, 3, 2]);

    // Submission 3: Ada Lovelace (ID 3) - SQL Joins - IN_PROGRESS
    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [3, 2, 3, 'SQL Joins Mastery', toMySQLDateTime(new Date()), 'IN_PROGRESS']);

    // 8. Student Answers
    // Answers for Submission 1 (Grace Hopper - Python)
    await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [1, 1, 2, null, 2.0]);
    await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [1, 2, null, 'A list is mutable, while a tuple is immutable. Lists use square brackets, tuples use parentheses.', 4.0]);

    // Answers for Submission 2 (Grace Hopper - SQL)
    await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [2, 3, 5, null, 0.0]);

    // 9. Violations
    await connection.query("INSERT INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [2, 2, 'TAB_SWITCH', 'MEDIUM', 'User switched to another tab for 15 seconds.', '2026-03-01 11:10:00']);
    await connection.query("INSERT INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [2, 2, 'FACE_DETECTION', 'MEDIUM', 'Multiple faces detected in frame.', '2026-03-01 11:15:00']);
    await connection.query("INSERT INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [2, 2, 'EYE_TRACKING', 'LOW', 'Eyes looking away from screen frequently.', '2026-03-01 11:20:00']);

    await connection.commit();
    console.log("Database seeding completed successfully.");
  } catch (err) {
    await connection.rollback();
    console.error("Database seeding error:", err);
  } finally {
    connection.release();
  }
};

const logActivity = async (userId: number, actionType: string, entityType: string | null = null, entityId: number | null = null, details: string | null = null) => {
  try {
    await pool.execute(
      "INSERT INTO activities (user_id, action_type, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, actionType, entityType, entityId, details]
    );
    console.log(`[ACTIVITY] Logged: ${actionType} for user ${userId}`);
  } catch (err) {
    console.error("[DB] Error logging activity:", err);
  }
};

async function startServer() {
  await initDatabase();
  // Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const apiRouter = express.Router();

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  apiRouter.post("/auth/login", async (req, res) => {
    try {
      console.log("[AUTH] Login request body:", JSON.stringify(req.body));
      const { username: rawUsername, password, loginType } = req.body;
      
      if (!rawUsername) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const email = rawUsername.toLowerCase().trim();
      console.log(`[AUTH] Login attempt for email: "${email}" with loginType: "${loginType}"`);
      
      // 1. Check if Email exists (we check both username and email fields to be safe, but primarily email)
      const [userRows] = await pool.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, email]);
      const user = (userRows as any)[0];
      
      if (!user) {
        console.log(`[AUTH] User with email/username "${email}" not found.`);
        return res.status(404).json({ error: "Email does not exist." });
      }

      // 2. Check Password
      // Note: In a real app we'd use bcrypt, but here we use plain text as per the seed data
      if (user.password !== password) {
        console.log(`[AUTH] Incorrect password for user "${email}".`);
        return res.status(401).json({ error: "Incorrect password." });
      }

      // 3. Check Role match
      if (user.role !== loginType) {
        console.log(`[AUTH] Role mismatch: User role is ${user.role}, but loginType is ${loginType}`);
        return res.status(403).json({ error: "Incorrect login type. Please select the correct role." });
      }

      console.log(`[AUTH] Login successful for user "${user.full_name}" (Role: ${user.role})`);

      // Map to camelCase for frontend
      const responseUser: any = {
        id: Number(user.id),
        username: user.username,
        studentCode: user.student_code,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      };

      if (user.role === 'STUDENT') {
        const [enrollmentRows] = await pool.query("SELECT course_id FROM course_enrollments WHERE student_id = ? LIMIT 1", [user.id]);
        const enrollment = (enrollmentRows as any)[0];
        if (enrollment) {
          responseUser.classId = Number(enrollment.course_id);
        }
      }

      res.json(responseUser);
    } catch (error: any) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  apiRouter.get("/classes", async (req, res) => {
    try {
      const { studentId } = req.query;
      console.log(`[API] GET /classes - studentId: ${studentId}`);
      let rows: any[];
      if (studentId) {
        const [results] = await pool.query(`
          SELECT c.* FROM courses c
          JOIN course_enrollments e ON c.id = e.course_id
          WHERE e.student_id = ?
        `, [studentId]);
        rows = results as any[];
      } else {
        const [results] = await pool.query("SELECT * FROM courses");
        rows = results as any[];
      }

      // Map to camelCase
      const mapped = rows.map(r => ({
        id: Number(r.id),
        courseCode: r.course_code,
        name: r.name,
        description: r.description,
        teacherId: Number(r.teacher_id),
        createdAt: r.created_at
      }));

      console.log(`[API] Found ${mapped.length} courses`);
      res.json(mapped);
    } catch (error: any) {
      console.error("[API] Error in GET /classes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new class
  apiRouter.post("/classes", async (req, res) => {
    try {
      const { courseCode, name, description, teacherId } = req.body;
      if (!courseCode || !name || !teacherId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [result] = await pool.execute(
        "INSERT INTO courses (course_code, name, description, teacher_id) VALUES (?, ?, ?, ?)",
        [courseCode, name, description, teacherId]
      );
      const classId = (result as any).insertId;

      await logActivity(teacherId, 'COURSE_CREATED', 'COURSE', classId, `Created course: ${courseCode} - ${name}`);

      res.json({ id: classId, courseCode, name, description, teacherId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a class
  apiRouter.delete("/classes/:id", async (req, res) => {
    try {
      const classId = req.params.id;
      const { teacherId } = req.query; // Need teacherId for logging

      // Get course info before deleting
      const [courseRows] = await pool.query("SELECT * FROM courses WHERE id = ?", [classId]);
      const course = (courseRows as any)[0];
      if (!course) return res.status(404).json({ error: "Course not found" });

      await pool.execute("DELETE FROM courses WHERE id = ?", [classId]);

      if (teacherId) {
        await logActivity(Number(teacherId), 'COURSE_DELETED', 'COURSE', Number(classId), `Deleted course: ${course.course_code} - ${course.name}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get activity history
  apiRouter.get("/activities", async (req, res) => {
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

      // Get total count for pagination
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
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/quizzes", async (req, res) => {
    try {
      const { classId, teacherId } = req.query;
      console.log(`[API] GET /quizzes - classId: ${classId}, teacherId: ${teacherId}`);
      let quizRows: any[];
      if (classId && classId !== 'undefined') {
        const [results] = await pool.query(`
          SELECT q.*, c.course_code, c.name as course_name 
          FROM quizzes q
          JOIN courses c ON q.course_id = c.id
          WHERE q.course_id = ? AND q.status = 'PUBLISHED'
        `, [classId]);
        quizRows = results as any[];
      } else if (teacherId) {
        const [results] = await pool.query(`
          SELECT q.*, c.course_code, c.name as course_name 
          FROM quizzes q
          JOIN courses c ON q.course_id = c.id
          WHERE q.teacher_id = ? AND q.status != 'DELETED'
        `, [teacherId]);
        quizRows = results as any[];
      } else {
        const [results] = await pool.query(`
          SELECT q.*, c.course_code, c.name as course_name 
          FROM quizzes q
          JOIN courses c ON q.course_id = c.id
          WHERE q.status != 'DELETED'
        `);
        quizRows = results as any[];
      }

      const fullQuizzes = [];
      for (const quiz of quizRows) {
        const [questionRows] = await pool.query("SELECT * FROM questions WHERE quiz_id = ? ORDER BY sort_order ASC", [quiz.id]);
        const questionsWithOpts = [];
        for (const q of questionRows as any[]) {
          const [optionRows] = await pool.query("SELECT * FROM question_options WHERE question_id = ?", [q.id]);
          const options = optionRows as any[];
          const correctAnswer = options.findIndex(o => o.is_correct === 1);
          questionsWithOpts.push({
            id: Number(q.id),
            text: q.question_text,
            type: q.question_type,
            points: q.points,
            sortOrder: q.sort_order,
            options: options.map(o => o.option_text),
            correctAnswer: correctAnswer >= 0 ? correctAnswer : 0
          });
        }
        fullQuizzes.push({ 
          id: Number(quiz.id),
          title: quiz.title,
          description: quiz.description,
          duration: quiz.duration_minutes,
          classId: Number(quiz.course_id),
          courseCode: quiz.course_code,
          courseName: quiz.course_name,
          teacherId: Number(quiz.teacher_id),
          deadline: quiz.deadline,
          status: quiz.status,
          totalScore: Number(quiz.total_score || 0),
          createdAt: quiz.created_at,
          publishedAt: quiz.published_at,
          questions: questionsWithOpts 
        });
      }
      res.json(fullQuizzes);
    } catch (error: any) {
      console.error("[API] Error in GET /quizzes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to check database content
  apiRouter.get("/debug/db/:table", async (req, res) => {
    try {
      const table = req.params.table;
      const allowedTables = ['users', 'courses', 'course_enrollments', 'quizzes', 'questions', 'question_options', 'submissions', 'student_answers', 'violations', 'course_invitations', 'course_join_requests', 'notifications'];
      if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: "Invalid table" });
      }
      const [results] = await pool.query(`SELECT * FROM ${table}`);
      const data = results as any[];
      res.json({ table, count: data.length, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Activity History APIs ---

  apiRouter.get("/activities", async (req, res) => {
    try {
      const { userId, page = 1, limit = 20, type, date } = req.query;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const offset = (Number(page) - 1) * Number(limit);
      let query = "SELECT a.*, u.full_name as userName FROM activities a JOIN users u ON a.user_id = u.id WHERE a.user_id = ?";
      const params: any[] = [userId];

      if (type) {
        query += " AND a.action_type = ?";
        params.push(type);
      }

      if (date) {
        query += " AND DATE(a.created_at) = ?";
        params.push(date);
      }

      query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
      params.push(Number(limit), offset);

      const [rows] = await pool.query(query, params);
      
      const [countRows] = await pool.query(
        "SELECT COUNT(*) as total FROM activities WHERE user_id = ?",
        [userId]
      );
      const total = (countRows as any)[0].total;

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
      res.status(500).json({ error: error.message });
    }
  });

  // --- Notification System APIs ---

  // Get notifications for a user
  apiRouter.get("/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const [rows] = await pool.query(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      
      const mapped = (rows as any[]).map(r => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        title: r.title,
        message: r.message,
        relatedId: r.related_id,
        isRead: !!r.is_read,
        createdAt: r.created_at
      }));

      res.json(mapped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  apiRouter.put("/notifications/:id/read", async (req, res) => {
    try {
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all notifications as read
  apiRouter.put("/notifications/read-all", async (req, res) => {
    try {
      const { userId } = req.body;
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Teacher Invitation APIs ---

  // Teacher invites student
  apiRouter.post("/classes/:courseId/invite", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { courseId } = req.params;
      const { studentId, teacherId } = req.body;

      if (!studentId || !teacherId) {
        return res.status(400).json({ error: "studentId and teacherId are required" });
      }

      await connection.beginTransaction();

      // Check if already enrolled
      const [enrollment] = await connection.query(
        "SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?",
        [courseId, studentId]
      );
      if ((enrollment as any[]).length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Student is already enrolled in this class" });
      }

      // Check if invitation exists
      const [invitation] = await connection.query(
        "SELECT id, status FROM course_invitations WHERE course_id = ? AND student_id = ?",
        [courseId, studentId]
      );
      
      const existing = (invitation as any[])[0];
      if (existing) {
        if (existing.status === 'PENDING') {
          await connection.rollback();
          return res.status(400).json({ error: "An invitation is already pending for this student" });
        }
        // If declined, we can re-invite
        await connection.query("DELETE FROM course_invitations WHERE id = ?", [existing.id]);
      }

      // Create invitation
      const [result] = await connection.query(
        "INSERT INTO course_invitations (course_id, teacher_id, student_id, status) VALUES (?, ?, ?, 'PENDING')",
        [courseId, teacherId, studentId]
      );
      const invitationId = (result as any).insertId;

      // Get course and teacher info for notification
      const [courseRows] = await connection.query("SELECT name, course_code FROM courses WHERE id = ?", [courseId]);
      const [teacherRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
      
      const course = (courseRows as any)[0];
      const teacher = (teacherRows as any)[0];

      // Create notification for student
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION', ?, ?, ?)",
        [
          studentId, 
          "New Class Invitation", 
          `Teacher ${teacher.full_name} invited you to join class: ${course.course_code} - ${course.name}`,
          invitationId
        ]
      );

      await connection.commit();
      
      // Log activity for teacher
      await logActivity(teacherId, 'INVITATION_SENT', 'COURSE', Number(courseId), `Invited student ${studentId} to join course ${course.course_code} - ${course.name}`);
      // Log activity for student
      await logActivity(studentId, 'INVITATION_RECEIVED', 'COURSE', Number(courseId), `Received invitation from Teacher ${teacher.full_name} to join course ${course.course_code} - ${course.name}`);

      res.json({ success: true, invitationId });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  // Student responds to invitation
  apiRouter.post("/invitations/:id/respond", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACCEPTED' or 'DECLINED'

      if (!['ACCEPTED', 'DECLINED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await connection.beginTransaction();

      const [invitationRows] = await connection.query(
        "SELECT * FROM course_invitations WHERE id = ?",
        [id]
      );
      const invitation = (invitationRows as any)[0];

      if (!invitation || invitation.status !== 'PENDING') {
        await connection.rollback();
        return res.status(400).json({ error: "Invitation not found or already processed" });
      }

      // Update invitation
      await connection.query(
        "UPDATE course_invitations SET status = ? WHERE id = ?",
        [status, id]
      );

      // Get course and student info
      const [courseRows] = await connection.query("SELECT name, course_code FROM courses WHERE id = ?", [invitation.course_id]);
      const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [invitation.student_id]);
      
      const course = (courseRows as any)[0];
      const student = (studentRows as any)[0];

      if (status === 'ACCEPTED') {
        // Add to enrollments
        await connection.query(
          "INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP",
          [invitation.course_id, invitation.student_id]
        );
      }

      // Create notification for teacher
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION_RESPONSE', ?, ?, ?)",
        [
          invitation.teacher_id,
          status === 'ACCEPTED' ? "Invitation Accepted" : "Invitation Declined",
          `Student ${student.full_name} has ${status.toLowerCase()} your invitation to join ${course.course_code}`,
          id
        ]
      );

      await connection.commit();

      // Log activity for student
      await logActivity(invitation.student_id, `INVITATION_${status}`, 'COURSE', invitation.course_id, `${status === 'ACCEPTED' ? 'Accepted' : 'Declined'} invitation to join course ${course.course_code} - ${course.name}`);
      // Log activity for teacher
      await logActivity(invitation.teacher_id, `STUDENT_INVITATION_${status}`, 'COURSE', invitation.course_id, `Student ${student.full_name} ${status.toLowerCase()} your invitation to join course ${course.course_code} - ${course.name}`);

      res.json({ success: true });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  // --- Student Join Request APIs ---

  // Search courses for students to join
  apiRouter.get("/classes/search-available", async (req, res) => {
    try {
      const { query, studentId } = req.query;
      if (!query) return res.json([]);

      // Find courses that student is NOT already enrolled in
      const [rows] = await pool.query(`
        SELECT c.*, u.full_name as teacherName,
        (SELECT status FROM course_join_requests WHERE course_id = c.id AND student_id = ?) as requestStatus
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE (c.course_code LIKE ? OR c.name LIKE ?)
        AND c.id NOT IN (SELECT course_id FROM course_enrollments WHERE student_id = ?)
      `, [studentId, `%${query}%`, `%${query}%`, studentId]);

      const mapped = (rows as any[]).map(r => ({
        id: r.id,
        courseCode: r.course_code,
        name: r.name,
        description: r.description,
        teacherId: r.teacher_id,
        teacherName: r.teacherName,
        requestStatus: r.requestStatus
      }));

      res.json(mapped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Student requests to join course
  apiRouter.post("/classes/:courseId/join-request", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;

      await connection.beginTransaction();

      // Check if already enrolled
      const [enrollment] = await connection.query(
        "SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?",
        [courseId, studentId]
      );
      if ((enrollment as any[]).length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: "You are already enrolled in this class" });
      }

      // Check if request exists
      const [request] = await connection.query(
        "SELECT id, status FROM course_join_requests WHERE course_id = ? AND student_id = ?",
        [courseId, studentId]
      );
      
      const existing = (request as any[])[0];
      if (existing) {
        if (existing.status === 'PENDING') {
          await connection.rollback();
          return res.status(400).json({ error: "A join request is already pending" });
        }
        await connection.query("DELETE FROM course_join_requests WHERE id = ?", [existing.id]);
      }

      // Create request
      const [result] = await connection.query(
        "INSERT INTO course_join_requests (course_id, student_id, status) VALUES (?, ?, 'PENDING')",
        [courseId, studentId]
      );
      const requestId = (result as any).insertId;

      // Get course and student info
      const [courseRows] = await connection.query("SELECT name, course_code, teacher_id FROM courses WHERE id = ?", [courseId]);
      const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
      
      const course = (courseRows as any)[0];
      const student = (studentRows as any)[0];

      // Create notification for teacher
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_REQUEST', ?, ?, ?)",
        [
          course.teacher_id,
          "New Join Request",
          `Student ${student.full_name} wants to join your class: ${course.course_code} - ${course.name}`,
          requestId
        ]
      );

      await connection.commit();

      // Log activity for student
      await logActivity(studentId, 'JOIN_REQUEST_SENT', 'COURSE', Number(courseId), `Sent request to join course: ${course.course_code} - ${course.name}`);
      // Log activity for teacher
      await logActivity(course.teacher_id, 'JOIN_REQUEST_RECEIVED', 'COURSE', Number(courseId), `Student ${student.full_name} requested to join course ${course.course_code} - ${course.name}`);

      res.json({ success: true, requestId });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  // Teacher responds to join request
  apiRouter.post("/join-requests/:id/respond", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACCEPTED' or 'DECLINED'

      await connection.beginTransaction();

      const [requestRows] = await connection.query(
        "SELECT * FROM course_join_requests WHERE id = ?",
        [id]
      );
      const request = (requestRows as any)[0];

      if (!request || request.status !== 'PENDING') {
        await connection.rollback();
        return res.status(400).json({ error: "Request not found or already processed" });
      }

      // Update request
      await connection.query(
        "UPDATE course_join_requests SET status = ? WHERE id = ?",
        [status, id]
      );

      // Get course info
      const [courseRows] = await connection.query("SELECT name, course_code FROM courses WHERE id = ?", [request.course_id]);
      const course = (courseRows as any)[0];

      if (status === 'ACCEPTED') {
        // Add to enrollments
        await connection.query(
          "INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP",
          [request.course_id, request.student_id]
        );
      }

      // Create notification for student
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_RESPONSE', ?, ?, ?)",
        [
          request.student_id,
          status === 'ACCEPTED' ? "Join Request Accepted" : "Join Request Declined",
          `Your request to join ${course.course_code} has been ${status.toLowerCase()}`,
          id
        ]
      );

      await connection.commit();

      // Fetch student info for logging
      const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [request.student_id]);
      const student = (studentRows as any)[0];

      // Log activity for teacher
      await logActivity(request.teacher_id, `JOIN_REQUEST_${status}`, 'COURSE', request.course_id, `${status === 'ACCEPTED' ? 'Accepted' : 'Declined'} join request from ${student ? student.full_name : 'Unknown Student'} for course ${course.course_code} - ${course.name}`);
      // Log activity for student
      await logActivity(request.student_id, `JOIN_REQUEST_${status}_BY_TEACHER`, 'COURSE', request.course_id, `Your request to join course ${course.course_code} - ${course.name} was ${status.toLowerCase()} by the teacher`);

      res.json({ success: true });
    } catch (error: any) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  apiRouter.post("/quizzes", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { title, duration, classId, teacherId, deadline, questions, status, totalScore } = req.body;
      console.log(`[API] POST /quizzes - START`, { title, duration, classId, teacherId, status, totalScore });
      
      if (!title || !classId || !teacherId || duration === undefined) {
        console.error("[API] POST /quizzes - Missing required fields:", { title, classId, teacherId, duration });
        return res.status(400).json({ error: "Missing required fields: title, duration, classId, or teacherId" });
      }

      await connection.beginTransaction();

      const createdAt = new Date();
      const publishedAt = status === 'PUBLISHED' ? createdAt : null;
      
      // Calculate totalScore if missing but questions are present
      let finalTotalScore = totalScore;
      if (finalTotalScore === undefined && questions && Array.isArray(questions)) {
        finalTotalScore = questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 0), 0);
      }

      const [result] = await connection.query(
        "INSERT INTO quizzes (title, duration_minutes, course_id, teacher_id, deadline, status, total_score, created_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, Number(duration), Number(classId), Number(teacherId), toMySQLDateTime(deadline), status || 'DRAFT', Number(finalTotalScore) || 0, toMySQLDateTime(createdAt), toMySQLDateTime(publishedAt)]
      );
      
      const quizId = (result as any).insertId;
      console.log(`[API] Quiz record created with ID: ${quizId}`);

      if (questions && Array.isArray(questions)) {
        console.log(`[API] Inserting ${questions.length} questions for quiz ${quizId}`);
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const [qResult] = await connection.query(
            "INSERT INTO questions (quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?)",
            [quizId, q.text || "Untitled Question", q.type, q.points || 1.0, i]
          );
          
          const questionId = (qResult as any).insertId;
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
      console.log(`[API] POST /quizzes - SUCCESS - Quiz ID: ${quizId}`);
      
      // Fetch teacher name for logging
      const [teacherRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
      const teacher = (teacherRows as any)[0];
      const teacherName = teacher ? teacher.full_name : 'Teacher';
      
      // Fetch course name
      const [courseRows] = await connection.query("SELECT name, course_code FROM courses WHERE id = ?", [classId]);
      const course = (courseRows as any)[0];
      const courseInfo = course ? `${course.course_code} - ${course.name}` : `Course #${classId}`;
      
      await logActivity(teacherId, 'QUIZ_CREATED', 'QUIZ', quizId, `Teacher ${teacherName} created quiz "${title}" for course ${courseInfo}`);

      res.json({ id: quizId, ...req.body, createdAt, publishedAt });
    } catch (error: any) {
      await connection.rollback();
      console.error("[API] Error in POST /quizzes:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  apiRouter.put("/quizzes/:id", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { title, duration, classId, deadline, questions, status, totalScore } = req.body;
      const quizId = Number(req.params.id);
      console.log(`[API] PUT /quizzes/${quizId} - Status: ${status}, totalScore: ${totalScore}`);
      
      await connection.beginTransaction();
      const now = new Date();

      // If totalScore is not provided but questions are, calculate it
      let finalTotalScore = totalScore;
      if (finalTotalScore === undefined && questions && Array.isArray(questions)) {
        finalTotalScore = questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 0), 0);
      }
      
      if (status === 'PUBLISHED') {
        await connection.query(`
          UPDATE quizzes 
          SET title = ?, duration_minutes = ?, course_id = ?, deadline = ?, status = ?, total_score = COALESCE(?, total_score), published_at = ?
          WHERE id = ?
        `, [title, Number(duration), Number(classId), toMySQLDateTime(deadline), status, finalTotalScore !== undefined ? Number(finalTotalScore) : null, toMySQLDateTime(now), quizId]);
      } else {
        await connection.query(`
          UPDATE quizzes 
          SET title = ?, duration_minutes = ?, course_id = ?, deadline = ?, status = ?, total_score = COALESCE(?, total_score)
          WHERE id = ?
        `, [title, Number(duration), Number(classId), toMySQLDateTime(deadline), status, finalTotalScore !== undefined ? Number(finalTotalScore) : null, quizId]);
      }

      if (questions && Array.isArray(questions)) {
        // Sync questions (simple approach: delete and recreate)
        await connection.query("DELETE FROM questions WHERE quiz_id = ?", [quizId]);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const [qResult] = await connection.query(
            "INSERT INTO questions (quiz_id, question_text, question_type, points, sort_order) VALUES (?, ?, ?, ?, ?)",
            [quizId, q.text || "Untitled Question", q.type, q.points || 1.0, i]
          );
          
          const questionId = (qResult as any).insertId;
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
      console.log(`[API] PUT /quizzes/${quizId} - Transaction committed`);

      // Log activity
      const [quizRows] = await pool.query(`
        SELECT q.teacher_id, u.full_name as teacherName, c.name as courseName, c.course_code 
        FROM quizzes q 
        JOIN users u ON q.teacher_id = u.id 
        JOIN courses c ON q.course_id = c.id
        WHERE q.id = ?
      `, [quizId]);
      const quiz = (quizRows as any)[0];
      if (quiz) {
        await logActivity(quiz.teacher_id, 'QUIZ_UPDATED', 'QUIZ', quizId, `Teacher ${quiz.teacherName} updated quiz "${title}" for course ${quiz.course_code} - ${quiz.courseName}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      await connection.rollback();
      console.error("[API] Error in PUT /quizzes:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  apiRouter.delete("/quizzes/:id", async (req, res) => {
    try {
      const quizId = req.params.id;
      const { teacherId } = req.query;

      // Get quiz info before deleting
      const [quizRows] = await pool.query("SELECT * FROM quizzes WHERE id = ?", [quizId]);
      const quiz = (quizRows as any)[0];
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      // Soft delete
      await pool.query("UPDATE quizzes SET status = 'DELETED' WHERE id = ?", [quizId]);
      
      if (teacherId) {
        const [teacherRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [teacherId]);
        const teacher = (teacherRows as any)[0];
        const teacherName = teacher ? teacher.full_name : 'Teacher';
        
        // Get course info
        const [courseRows] = await pool.query("SELECT c.name, c.course_code FROM courses c JOIN quizzes q ON q.course_id = c.id WHERE q.id = ?", [quizId]);
        const course = (courseRows as any)[0];
        const courseInfo = course ? ` for course ${course.course_code} - ${course.name}` : '';

        await logActivity(Number(teacherId), 'QUIZ_DELETED', 'QUIZ', Number(quizId), `Teacher ${teacherName} deleted quiz "${quiz.title}"${courseInfo}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Log quiz start
  apiRouter.post("/quizzes/:id/start", async (req, res) => {
    try {
      const quizId = req.params.id;
      const { studentId } = req.body;

      const [quizRows] = await pool.query(`
        SELECT q.title, c.name as courseName, c.course_code 
        FROM quizzes q 
        JOIN courses c ON q.course_id = c.id 
        WHERE q.id = ?
      `, [quizId]);
      const quiz = (quizRows as any)[0];
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });

      const [studentRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
      const student = (studentRows as any)[0];
      const studentName = student ? student.full_name : 'Student';

      await logActivity(studentId, 'QUIZ_STARTED', 'QUIZ', Number(quizId), `Student ${studentName} started quiz "${quiz.title}" for course ${quiz.course_code} - ${quiz.courseName}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  async function mapSubmission(sub: any) {
    const [answerRows] = await pool.query("SELECT * FROM student_answers WHERE submission_id = ?", [sub.id]);
    const mappedAnswers = [];
    for (const ans of answerRows as any[]) {
      if (ans.selected_option_id) {
        const [optionRows] = await pool.query("SELECT * FROM question_options WHERE question_id = ?", [ans.question_id]);
        const options = optionRows as any[];
        const index = options.findIndex(o => o.id === ans.selected_option_id);
        mappedAnswers.push({ 
          id: Number(ans.id),
          submissionId: Number(ans.submission_id),
          questionId: Number(ans.question_id),
          selectedOptionId: Number(ans.selected_option_id),
          answerText: ans.answer_text,
          pointsEarned: ans.awarded_points,
          selectedOption: index >= 0 ? index : null 
        });
      } else {
        mappedAnswers.push({
          id: Number(ans.id),
          submissionId: Number(ans.submission_id),
          questionId: Number(ans.question_id),
          answerText: ans.answer_text,
          pointsEarned: ans.awarded_points
        });
      }
    }
    
    const [violationRows] = await pool.query("SELECT * FROM violations WHERE submission_id = ? ORDER BY timestamp ASC", [sub.id]);
    const mappedViolations = (violationRows as any[]).map((v: any) => ({
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
    
    return { 
      id: Number(sub.id),
      quizId: Number(sub.quiz_id),
      quizName: sub.quiz_name,
      studentId: Number(sub.student_id),
      studentName: sub.studentName,
      startTime: sub.start_time,
      endTime: sub.end_time,
      submittedAt: sub.submitted_at,
      durationSeconds: sub.duration_seconds,
      status: sub.status,
      autoTerminationReason: sub.auto_termination_reason,
      totalScore: Number(sub.total_score || 0),
      score: Number(sub.score || 0),
      cheatingStatus: sub.cheating_status,
      riskScore: Number(sub.risk_score || 0),
      totalViolationCount: Number(sub.total_violation_count || 0),
      lowViolationCount: Number(sub.low_violation_count || 0),
      mediumViolationCount: Number(sub.medium_violation_count || 0),
      highViolationCount: Number(sub.high_violation_count || 0),
      evaluationTimestamp: sub.evaluation_timestamp,
      answers: mappedAnswers, 
      violations: mappedViolations 
    };
  }

  apiRouter.get("/submissions", async (req, res) => {
    try {
      const { quizId, studentId, classId } = req.query;
      console.log(`[API] GET /submissions - quizId: ${quizId}, studentId: ${studentId}, classId: ${classId}`);
      let rows: any[];
      
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
        // We need to join with quizzes table to filter by course_id
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

      const [results] = await pool.query(query, params);
      rows = results as any[];

      console.log(`[API] Found ${rows.length} submissions`);

      const fullSubmissions = [];
      for (const sub of rows) {
        fullSubmissions.push(await mapSubmission(sub));
      }
      res.json(fullSubmissions);
    } catch (error: any) {
      console.error("[API] Error in GET /submissions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  function evaluateCheating(violations: any[]) {
    const total = violations.length;
    const high = violations.filter(v => v.severity?.toUpperCase() === 'HIGH').length;
    const medium = violations.filter(v => v.severity?.toUpperCase() === 'MEDIUM').length;
    const low = violations.filter(v => v.severity?.toUpperCase() === 'LOW').length;
    const tabSwitches = violations.filter(v => (v.violation_type || v.type)?.toUpperCase() === 'TAB_SWITCH').length;

    let status = 'NO_CHEATING';
    let score = 0;

    // Base score calculation
    score = (low * 5) + (medium * 15) + (high * 30);
    
    if (high > 2 || tabSwitches > 5 || score >= 80) {
      status = 'CHEATING';
      score = Math.min(100, Math.max(80, score));
    } else if (total > 3 || high > 0 || medium > 1 || score >= 40) {
      status = 'SUSPICIOUS';
      score = Math.min(79, Math.max(40, score));
    } else {
      status = 'NO_CHEATING';
      score = Math.min(39, score);
    }

    return { status, score, high, medium, low, total };
  }

  apiRouter.post("/submissions", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { quizId, studentId, answers, startTime, browserInfo, ipAddress } = req.body;
      console.log(`[API] POST /submissions - quizId: ${quizId}, studentId: ${studentId}`);
      
      if (!quizId || !studentId || !Array.isArray(answers)) {
        console.error("[API] Missing required fields for submission");
        return res.status(400).json({ error: "Missing required fields or answers is not an array" });
      }

      await connection.beginTransaction();

      // Fetch quiz info
      const [quizRows] = await connection.query("SELECT title, total_score FROM quizzes WHERE id = ?", [quizId]);
      const quiz = (quizRows as any)[0];
      const quizName = quiz ? quiz.title : 'Unknown Quiz';
      
      // Fetch questions for scoring
      const [questionRows] = await connection.query("SELECT * FROM questions WHERE quiz_id = ?", [quizId]);
      const questions = questionRows as any[];

      // Calculate maxPossibleScore (fallback to summing questions if quiz.total_score is 0)
      let maxPossibleScore = quiz ? Number(quiz.total_score) : 0;
      if (maxPossibleScore === 0 && questions.length > 0) {
        maxPossibleScore = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
      }
      
      // Calculate earned score
      let earnedScore = 0;
      const processedAnswers = [];
      for (const ans of answers) {
        const question = questions.find(q => q.id === Number(ans.questionId));
        let pointsEarned = 0;

        if (question && question.question_type === 'MULTIPLE_CHOICE') {
          const [optionRows] = await connection.query("SELECT * FROM question_options WHERE question_id = ?", [question.id]);
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
      
      console.log(`[API] Calculated earnedScore: ${earnedScore}, maxScore: ${maxPossibleScore}, duration: ${duration}s`);

      const formattedStartTime = toMySQLDateTime(startTime);
      const formattedSubmittedAt = toMySQLDateTime(submittedAt);
      
      console.log(`[API] Submission Data:`, {
        quizId,
        studentId,
        startTime,
        formattedStartTime,
        submittedAt,
        formattedSubmittedAt,
        duration
      });

      // Create submission
      const [subResult] = await connection.query(`
        INSERT INTO submissions (
          quiz_id, student_id, quiz_name, status, total_score, score, start_time, submitted_at, duration_seconds, browser_info, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        Number(quizId), 
        Number(studentId), 
        quizName, 
        'SUBMITTED', 
        maxPossibleScore, 
        earnedScore, 
        formattedStartTime, 
        formattedSubmittedAt, 
        duration, 
        browserInfo || null, 
        ipAddress || null
      ]);
      
      const submissionId = (subResult as any).insertId;
      console.log(`[API] Created submission ID: ${submissionId}`);

      // Link pending violations to this submission
      await connection.query("UPDATE violations SET submission_id = ? WHERE student_id = ? AND submission_id IS NULL", [submissionId, studentId]);

      // Evaluate cheating
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
          evaluation_timestamp = ?
        WHERE id = ?
      `, [
        evaluation.status, 
        evaluation.score, 
        evaluation.total, 
        evaluation.high, 
        evaluation.medium, 
        evaluation.low, 
        toMySQLDateTime(submittedAt), 
        submissionId
      ]);

      for (const ans of processedAnswers) {
        const [optionRows] = await connection.query("SELECT * FROM question_options WHERE question_id = ?", [ans.questionId]);
        const options = optionRows as any[];
        const selectedOptId = ans.selectedOption !== undefined && ans.selectedOption !== null ? options[ans.selectedOption]?.id : null;
        
        await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)",
          [submissionId, ans.questionId, selectedOptId, ans.answerText || null, ans.pointsEarned]);
      }

      const [finalSubRows] = await connection.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [submissionId]);
      const finalSub = (finalSubRows as any)[0];
      const result = await mapSubmission(finalSub);

      await connection.commit();
      console.log(`[API] POST /submissions - Transaction committed for Submission ID: ${result.id}`);

      // Log activity
      const [quizInfoRows] = await connection.query(`
        SELECT q.title, c.name as courseName, c.course_code 
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
      console.error("[API] Error in POST /submissions:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  apiRouter.put("/submissions/:id", async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { score, answers } = req.body;
      const subId = req.params.id;
      
      let finalScore = 0;
      if (score !== undefined && score !== null) finalScore = Number(score);

      console.log(`[API] PUT /submissions/${subId} - Raw score: ${score}, Final: ${finalScore}`);

      const [existingRows] = await connection.query("SELECT status, total_score FROM submissions WHERE id = ?", [subId]);
      const existing = (existingRows as any)[0];
      if (!existing) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      if (existing.status === 'GRADED') {
        return res.status(400).json({ error: "This submission has already been graded and finalized." });
      }

      await connection.beginTransaction();

      // Fix: Only update score, NOT total_score. Keep existing total_score.
      await connection.query("UPDATE submissions SET score = ?, status = 'GRADED' WHERE id = ?",
        [finalScore, subId]);
      
      if (Array.isArray(answers)) {
        for (const ans of answers) {
          await connection.query("UPDATE student_answers SET awarded_points = ? WHERE submission_id = ? AND question_id = ?",
            [ans.pointsEarned || 0, subId, ans.questionId]);
        }
      }

      await connection.commit();
      console.log(`[API] PUT /submissions/${subId} - Successfully updated to GRADED with score ${finalScore}`);
      
      const [subRows] = await connection.query("SELECT s.*, u.full_name as studentName FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?", [subId]);
      const sub = (subRows as any)[0];
      if (!sub) return res.status(404).json({ error: "Submission not found after update" });
      
      // Log activity for teacher
      const { teacherId } = req.query;
      
      const [quizInfoRows] = await connection.query(`
        SELECT q.title, c.name as courseName, c.course_code 
        FROM quizzes q 
        JOIN courses c ON q.course_id = c.id 
        WHERE q.id = ?
      `, [sub.quiz_id]);
      const quizInfo = (quizInfoRows as any)[0];
      const courseInfo = quizInfo ? ` in course ${quizInfo.course_code} - ${quizInfo.courseName}` : '';

      if (teacherId) {
        await logActivity(Number(teacherId), 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Graded submission for student ${sub.studentName}${courseInfo}. Score: ${finalScore}/${sub.total_score}`);
      }
      // Log activity for student
      await logActivity(sub.student_id, 'QUIZ_GRADED', 'SUBMISSION', Number(subId), `Your quiz "${sub.quiz_name}"${courseInfo} has been graded. Score: ${finalScore}/${sub.total_score}`);

      res.json(await mapSubmission(sub));
    } catch (error: any) {
      await connection.rollback();
      console.error("[API] Error in PUT /submissions/:id:", error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  });

  apiRouter.post("/exam/report-violation", async (req, res) => {
    try {
      const { studentId, type, message, severity, submissionId, browserInfo, ipAddress } = req.body;
      const timestamp = new Date();
      const formattedTimestamp = toMySQLDateTime(timestamp);
      
      console.log(`Violation reported for student ${studentId}: ${type} at ${formattedTimestamp}`);
      
      await pool.query(`
        INSERT INTO violations (submission_id, student_id, violation_type, timestamp, severity, message, browser_info, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [submissionId || null, studentId, type, formattedTimestamp, severity, message, browserInfo || null, ipAddress || null]);
      
      res.json({ status: "received", timestamp });
    } catch (error: any) {
      console.error("Error saving violation:", error);
      res.status(500).json({ error: "Failed to save violation" });
    }
  });

  apiRouter.get("/violations", async (req, res) => {
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

  // --- Teacher Dashboard Drill-down Endpoints ---

  // 1. Get all classes (courses) taught by the instructor
  apiRouter.get("/teacher/courses", async (req, res) => {
    try {
      const { teacherId } = req.query;
      console.log(`[API] GET /teacher/courses - teacherId: ${teacherId}`);
      if (!teacherId) return res.status(400).json({ error: "teacherId is required" });

      const [rows] = await pool.query(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
        FROM courses c
        WHERE c.teacher_id = ?
      `, [teacherId]);

      console.log(`[API] Found ${(rows as any[]).length} courses for teacher ${teacherId}`);

      const mapped = (rows as any[]).map(r => ({
        id: Number(r.id),
        courseCode: r.course_code,
        name: r.name,
        description: r.description,
        teacherId: Number(r.teacher_id),
        studentCount: Number(r.student_count),
        createdAt: r.created_at
      }));

      res.json(mapped);
    } catch (error: any) {
      console.error("[API] Error in GET /teacher/courses:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Get all students enrolled in a specific class with stats
  apiRouter.get("/teacher/courses/:courseId/students", async (req, res) => {
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
      console.error("[API] Error in GET /teacher/courses/:courseId/students:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Get all quizzes in a course and the student's submission for each
  apiRouter.get("/teacher/courses/:courseId/students/:studentId/quizzes", async (req, res) => {
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
      console.error("[API] Error in GET /teacher/courses/:courseId/students/:studentId/quizzes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- CLASS MANAGEMENT API ---

  // Admin: Seed Database
  apiRouter.post("/admin/seed", async (req, res) => {
    try {
      console.log("[DB] Starting administrative seeding...");
      
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
        "INSERT IGNORE INTO courses (course_code, name, description, teacher_id) VALUES ?",
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
      console.error("[DB] Seeding error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get students in a specific class
  apiRouter.get("/classes/:id/students", async (req, res) => {
    try {
      const classId = req.params.id;
      console.log(`[API] GET /classes/${classId}/students - Fetching students...`);
      const [rows] = await pool.query(`
        SELECT u.id, u.student_code as studentCode, u.full_name as fullName, u.email, e.enrolled_at as enrolledAt
        FROM users u
        JOIN course_enrollments e ON u.id = e.student_id
        WHERE e.course_id = ? AND u.role = 'STUDENT'
      `, [classId]);
      console.log(`[API] Found ${(rows as any[]).length} students for class ${classId}`);
      res.json(rows);
    } catch (error: any) {
      console.error("[API] Error in GET /classes/:id/students:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Search students globally
  apiRouter.get("/students/search", async (req, res) => {
    try {
      const { query, courseId } = req.query;
      if (!query || (query as string).length < 2) {
        return res.json([]);
      }
      
      const searchTerm = `%${query}%`;
      
      // If courseId is provided, we check if the student is already enrolled
      let queryStr = `
        SELECT u.id, u.student_code as studentCode, u.full_name as fullName, u.email
      `;
      
      const params: any[] = [];
      
      if (courseId) {
        queryStr += `, (SELECT COUNT(*) FROM course_enrollments WHERE course_id = ? AND student_id = u.id) > 0 as isEnrolled `;
        params.push(courseId);
      } else {
        queryStr += `, 0 as isEnrolled `;
      }
      
      queryStr += `
        FROM users u
        WHERE u.role = 'STUDENT' AND (u.full_name LIKE ? OR u.student_code LIKE ? OR u.email LIKE ?)
        LIMIT 20
      `;
      params.push(searchTerm, searchTerm, searchTerm);

      const [rows] = await pool.query(queryStr, params);
      
      const mapped = (rows as any[]).map(r => ({
        ...r,
        isEnrolled: Boolean(r.isEnrolled)
      }));

      res.json(mapped);
    } catch (error: any) {
      console.error("[API] Error in GET /students/search:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enroll a student in a class
  apiRouter.post("/classes/:id/enroll", async (req, res) => {
    try {
      const classId = req.params.id;
      const { studentId } = req.body;
      
      if (!studentId) {
        return res.status(400).json({ error: "Student ID is required" });
      }

      // Check if already enrolled
      const [existing] = await pool.query(
        "SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?",
        [classId, studentId]
      );

      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: "Student is already enrolled in this class" });
      }

      await pool.execute(
        "INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?)",
        [classId, studentId]
      );

      // Log activity
      const [courseRows] = await pool.query("SELECT name, course_code, teacher_id FROM courses WHERE id = ?", [classId]);
      const course = (courseRows as any)[0];
      const [studentRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
      const student = (studentRows as any)[0];

      if (course && student) {
        const { teacherId } = req.query;
        if (teacherId) {
          await logActivity(Number(teacherId), 'STUDENT_ADDED', 'COURSE', Number(classId), `Added student ${student.full_name} to course ${course.course_code} - ${course.name}`);
        }
        await logActivity(studentId, 'COURSE_JOINED', 'COURSE', Number(classId), `Joined course: ${course.course_code} - ${course.name}`);
      }

      res.json({ success: true, message: "Student enrolled successfully" });
    } catch (error: any) {
      console.error("[API] Error in POST /classes/:id/enroll:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Unenroll a student from a class
  apiRouter.delete("/classes/:id/unenroll/:studentId", async (req, res) => {
    try {
      const classId = req.params.id;
      const studentId = req.params.studentId;
      const { teacherId } = req.query;

      // Get info for logging
      const [courseRows] = await pool.query("SELECT name, course_code FROM courses WHERE id = ?", [classId]);
      const course = (courseRows as any)[0];
      const [studentRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [studentId]);
      const student = (studentRows as any)[0];

      const [result] = await pool.execute(
        "DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?",
        [classId, studentId]
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      if (course && student) {
        if (teacherId) {
          await logActivity(Number(teacherId), 'STUDENT_REMOVED', 'COURSE', Number(classId), `Removed student ${student.full_name} from course ${course.course_code} - ${course.name}`);
        }
        await logActivity(Number(studentId), 'COURSE_LEFT', 'COURSE', Number(classId), `Left course: ${course.course_code} - ${course.name}`);
      }

      res.json({ success: true, message: "Student removed from class" });
    } catch (error: any) {
      console.error("[API] Error in DELETE /classes/:id/unenroll/:studentId:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use("/api", apiRouter);

  // Catch-all for undefined API routes
  app.all("/api/*", (req, res) => {
    console.log(`404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

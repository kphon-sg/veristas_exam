import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { pool, toMySQLDateTime } from "../config/database.js";

// Initialize database with a fully normalized production-ready schema
export async function initDatabase() {
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
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('TEACHER', 'STUDENT', 'OTHER') NOT NULL,
          department VARCHAR(100),
          age INT,
          school_institution VARCHAR(255),
          country_location VARCHAR(100),
          usage_reason VARCHAR(255),
          is_verified BOOLEAN DEFAULT FALSE,
          verification_token VARCHAR(255),
          reset_token VARCHAR(255),
          reset_token_expiry DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_role (role),
          INDEX idx_student_code (student_code)
      ) ENGINE=InnoDB;
    `);

    // Migration: Ensure new columns exist in users table
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM users");
      const columnNames = (columns as any[]).map(c => c.Field);
      
      if (!columnNames.includes('department')) {
        console.log("[DB] Adding department to users table...");
        await pool.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100) AFTER role");
      }

      if (!columnNames.includes('age')) {
        console.log("[DB] Adding new profile columns to users table...");
        await pool.execute("ALTER TABLE users ADD COLUMN age INT AFTER role");
        await pool.execute("ALTER TABLE users ADD COLUMN school_institution VARCHAR(255) AFTER age");
        await pool.execute("ALTER TABLE users ADD COLUMN country_location VARCHAR(100) AFTER school_institution");
        await pool.execute("ALTER TABLE users ADD COLUMN usage_reason VARCHAR(255) AFTER country_location");
        await pool.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER usage_reason");
        await pool.execute("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) AFTER is_verified");
        await pool.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) AFTER verification_token");
        await pool.execute("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME AFTER reset_token");
      }

      if (!columnNames.includes('profile_picture')) {
        console.log("[DB] Adding profile_picture and phone_number to users table...");
        await pool.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT AFTER email");
        await pool.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) AFTER profile_picture");
      }

      // Update role enum if needed
      const roleColumn = (columns as any[]).find(c => c.Field === 'role');
      if (roleColumn && !roleColumn.Type.includes('OTHER')) {
        console.log("[DB] Updating role enum in users table...");
        await pool.execute("ALTER TABLE users MODIFY COLUMN role ENUM('TEACHER', 'STUDENT', 'OTHER') NOT NULL");
      }
    } catch (err) {
      console.error("[DB] Migration error (users columns):", err);
    }

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_code VARCHAR(20) NOT NULL,
          course_name VARCHAR(100) NOT NULL,
          description TEXT,
          school_name VARCHAR(255),
          education_level ENUM('PRIMARY_SCHOOL', 'SECONDARY_SCHOOL', 'HIGH_SCHOOL', 'UNIVERSITY'),
          teacher_id INT NOT NULL,
          teacher_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
          UNIQUE (teacher_id, course_code)
      ) ENGINE=InnoDB;
    `);

    // Migration: Rename 'name' to 'course_name' in courses table if it exists
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM courses LIKE 'name'");
      if ((columns as any[]).length > 0) {
        console.log("[DB] Renaming 'name' to 'course_name' in courses table...");
        await pool.execute("ALTER TABLE courses CHANGE COLUMN name course_name VARCHAR(100) NOT NULL");
      }
    } catch (err) {
      console.error("[DB] Migration error (courses name rename):", err);
    }

    // Migration: Update course_code uniqueness to be per-teacher
    try {
      const [indices] = await pool.query("SHOW INDEX FROM courses WHERE Key_name = 'course_code'");
      if ((indices as any[]).length > 0) {
        console.log("[DB] Changing course_code uniqueness from global to per-teacher...");
        await pool.execute("ALTER TABLE courses DROP INDEX course_code");
        await pool.execute("ALTER TABLE courses ADD UNIQUE INDEX teacher_course_code (teacher_id, course_code)");
      }
    } catch (err) {
      console.error("[DB] Migration error (courses uniqueness):", err);
    }

    // Migration: Ensure school_name and education_level columns exist
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM courses LIKE 'school_name'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding school_name and education_level columns to courses table...");
        await pool.execute("ALTER TABLE courses ADD COLUMN school_name VARCHAR(255) AFTER description");
        await pool.execute("ALTER TABLE courses ADD COLUMN education_level ENUM('PRIMARY_SCHOOL', 'SECONDARY_SCHOOL', 'HIGH_SCHOOL', 'UNIVERSITY') AFTER school_name");
      }
    } catch (err) {
      console.error("[DB] Migration error (courses columns):", err);
    }

    // Migration: Ensure teacher_name column exists in courses
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM courses LIKE 'teacher_name'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding teacher_name column to courses table...");
        await pool.execute("ALTER TABLE courses ADD COLUMN teacher_name VARCHAR(100) AFTER teacher_id");
        
        // Populate existing courses with teacher names
        console.log("[DB] Populating teacher_name for existing courses...");
        await pool.execute(`
          UPDATE courses c
          JOIN users u ON c.teacher_id = u.id
          SET c.teacher_name = u.full_name
        `);
      }
    } catch (err) {
      console.error("[DB] Migration error (courses teacher_name):", err);
    }

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
          course_name VARCHAR(100),
          teacher_name VARCHAR(100),
          deadline DATETIME,
          open_at DATETIME,
          close_at DATETIME,
          status ENUM('DRAFT', 'PUBLISHED', 'DELETED') DEFAULT 'DRAFT',
          total_score DECIMAL(5,2) DEFAULT 0.0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          published_at DATETIME,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_course (course_id),
          INDEX idx_teacher (teacher_id),
          INDEX idx_status (status)
      ) ENGINE=InnoDB;
    `);

    // Migration: Ensure open_at and close_at columns exist in quizzes
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM quizzes LIKE 'open_at'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding open_at and close_at columns to quizzes table...");
        await pool.execute("ALTER TABLE quizzes ADD COLUMN open_at DATETIME AFTER deadline");
        await pool.execute("ALTER TABLE quizzes ADD COLUMN close_at DATETIME AFTER open_at");
        
        // Populate existing quizzes with default values
        console.log("[DB] Populating open_at and close_at for existing quizzes...");
        await pool.execute(`
          UPDATE quizzes SET open_at = created_at, close_at = deadline
        `);
      }
    } catch (err) {
      console.error("[DB] Migration error (quizzes scheduling columns):", err);
    }

    // Migration: Ensure course_name and teacher_name columns exist in quizzes
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM quizzes LIKE 'course_name'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding course_name and teacher_name columns to quizzes table...");
        await pool.execute("ALTER TABLE quizzes ADD COLUMN course_name VARCHAR(100) AFTER teacher_id");
        await pool.execute("ALTER TABLE quizzes ADD COLUMN teacher_name VARCHAR(100) AFTER course_name");
        
        // Populate existing quizzes with names
        console.log("[DB] Populating course_name and teacher_name for existing quizzes...");
        await pool.execute(`
          UPDATE quizzes q
          JOIN courses c ON q.course_id = c.id
          JOIN users u ON q.teacher_id = u.id
          SET q.course_name = c.course_name, q.teacher_name = u.full_name
        `);
      }
    } catch (err) {
      console.error("[DB] Migration error (quizzes columns):", err);
    }

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
          tab_switch_count INT DEFAULT 0,
          face_missing_count INT DEFAULT 0,
          looking_away_count INT DEFAULT 0,
          multiple_faces_count INT DEFAULT 0,
          evaluation_timestamp TIMESTAMP NULL,
          browser_info VARCHAR(255),
          ip_address VARCHAR(45),
          teacher_feedback TEXT,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_quiz_student (quiz_id, student_id),
          INDEX idx_status (status),
          INDEX idx_cheating (cheating_status)
      ) ENGINE=InnoDB;
    `);

    // Migration: Ensure teacher_feedback column exists in submissions
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM submissions LIKE 'teacher_feedback'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding teacher_feedback column to submissions table...");
        await pool.execute("ALTER TABLE submissions ADD COLUMN teacher_feedback TEXT AFTER ip_address");
      }
    } catch (err) {
      console.error("[DB] Migration error (submissions teacher_feedback):", err);
    }

    // Migration: Ensure specific violation count columns exist in submissions
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM submissions LIKE 'tab_switch_count'");
      if ((columns as any[]).length === 0) {
        console.log("[DB] Adding specific violation count columns to submissions table...");
        await pool.execute("ALTER TABLE submissions ADD COLUMN tab_switch_count INT DEFAULT 0 AFTER high_violation_count");
        await pool.execute("ALTER TABLE submissions ADD COLUMN face_missing_count INT DEFAULT 0 AFTER tab_switch_count");
        await pool.execute("ALTER TABLE submissions ADD COLUMN looking_away_count INT DEFAULT 0 AFTER face_missing_count");
        await pool.execute("ALTER TABLE submissions ADD COLUMN multiple_faces_count INT DEFAULT 0 AFTER looking_away_count");
      }
    } catch (err) {
      console.error("[DB] Migration error (submissions violation counts):", err);
    }

    // Migration: Ensure indices exist for performance
    try {
      const [indices] = await pool.query("SHOW INDEX FROM submissions WHERE Key_name = 'idx_quiz_student'");
      if ((indices as any[]).length === 0) {
        console.log("[DB] Adding indices to submissions table...");
        await pool.execute("CREATE INDEX idx_quiz_student ON submissions (quiz_id, student_id)");
        await pool.execute("CREATE INDEX idx_status ON submissions (status)");
        await pool.execute("CREATE INDEX idx_cheating ON submissions (cheating_status)");
      }
    } catch (err) {
      console.error("[DB] Migration error (submissions indices):", err);
    }

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
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_submission (submission_id),
          INDEX idx_type (violation_type)
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
        SELECT a.id, a.entity_id as quizId, q.title, c.course_name as courseName, c.course_code, u.full_name as teacherName, a.user_id
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
export const seedDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log("Seeding database with the user's provided SQL data...");
    await connection.beginTransaction();

    // 1. Users
    const hashedPw = await bcrypt.hash("123", 10);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [1, "teacher_admin", "TCIU001", "Dr. Alan Turing", "turing@edu.com", hashedPw, "TEACHER"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [2, "student_sv01", "ITIU21278", "Grace Hopper", "grace@edu.com", hashedPw, "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [3, "student_sv02", "ITIU22231", "Ada Lovelace", "ada@edu.com", hashedPw, "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [4, "student_sv03", "SEIU23145", "Linus Torvalds", "linus@edu.com", hashedPw, "STUDENT"]);
    await connection.query("INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_code = VALUES(student_code), full_name = VALUES(full_name)", [5, "chukongphong", "TCIU002", "Chu Kong Phong", "chukongphong@gmail.com", hashedPw, "TEACHER"]);

    // 2. Courses
    await connection.query("INSERT INTO courses (id, course_code, course_name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [1, "IT101", "Introduction to Programming", "Foundations of logic using Python.", 1]);
    await connection.query("INSERT INTO courses (id, course_code, course_name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [2, "IT303", "Database Systems", "Relational modeling and SQL mastery.", 1]);
    await connection.query("INSERT INTO courses (id, course_code, course_name, description, teacher_id) VALUES (?, ?, ?, ?, ?)", [3, "AI101", "Artificial Intelligence", "Introduction to AI and Machine Learning.", 5]);

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
    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, 1, 2, 'Python Basics Quiz', '2026-03-01 10:00:00', '2026-03-01 10:15:00', '2026-03-01 10:15:00', 900, 'GRADED', 7.0, 6.0, 'NO_CHEATING', 5.0]);

    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score, total_violation_count, medium_violation_count, tab_switch_count, face_missing_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [2, 2, 2, 'SQL Joins Mastery', '2026-03-01 11:00:00', '2026-03-01 11:30:00', '2026-03-01 11:30:00', 1800, 'SUBMITTED', 2.0, 0.0, 'SUSPICIOUS', 45.0, 3, 2, 2, 1]);

    await connection.query(`
      INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [3, 2, 3, 'SQL Joins Mastery', toMySQLDateTime(new Date()), 'IN_PROGRESS']);

    // 8. Student Answers
    await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [1, 1, 2, null, 2.0]);
    await connection.query("INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES (?, ?, ?, ?, ?)", [1, 2, null, 'A list is mutable, while a tuple is immutable. Lists use square brackets, tuples use parentheses.', 4.0]);
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

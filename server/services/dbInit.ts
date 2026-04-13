import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { db, toDBDateTime } from "../config/database.js";

// Initialize database with a fully normalized production-ready schema
export async function initDatabase() {
  try {
    console.log("[DB] Initializing MySQL database...");

    if (process.env.RESET_DB === 'true') {
      console.log("[DB] RESET_DB is true. Dropping all tables...");
      await db.query("SET FOREIGN_KEY_CHECKS = 0");
      const tables = [
        'violations', 'student_answers', 'submissions', 'question_options',
        'questions', 'quizzes', 'course_materials', 'course_enrollments',
        'course_invitations', 'course_join_requests', 'courses', 'activities',
        'notifications', 'student_details', 'users'
      ];
      for (const table of tables) {
        await db.query(`DROP TABLE IF EXISTS ${table}`);
      }
      await db.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("[DB] All tables dropped.");
    }
    
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(255) NOT NULL UNIQUE,
          student_code VARCHAR(255) UNIQUE,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('TEACHER', 'STUDENT', 'OTHER') NOT NULL,
          department VARCHAR(255),
          age INT,
          school_institution VARCHAR(255),
          country_location VARCHAR(255),
          usage_reason TEXT,
          is_verified BOOLEAN DEFAULT 0,
          verification_token VARCHAR(255),
          reset_token VARCHAR(255),
          reset_token_expiry DATETIME,
          profile_picture TEXT,
          phone_number VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS courses (
          id INT PRIMARY KEY AUTO_INCREMENT,
          course_code VARCHAR(255) NOT NULL UNIQUE,
          course_name VARCHAR(255) NOT NULL,
          description TEXT,
          school_name VARCHAR(255),
          education_level VARCHAR(255),
          teacher_id INT NOT NULL,
          teacher_name VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          course_id INT NOT NULL,
          student_id INT NOT NULL,
          enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(course_id, student_id),
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_materials (
          id INT PRIMARY KEY AUTO_INCREMENT,
          course_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          file_url TEXT,
          file_type VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duration_minutes INT NOT NULL DEFAULT 30,
          course_id INT NOT NULL,
          teacher_id INT NOT NULL,
          course_name VARCHAR(255),
          teacher_name VARCHAR(255),
          deadline DATETIME,
          open_at DATETIME,
          close_at DATETIME,
          status ENUM('DRAFT', 'PUBLISHED', 'DELETED') DEFAULT 'DRAFT',
          total_score REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          published_at DATETIME,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS questions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          quiz_id INT NOT NULL,
          question_text TEXT NOT NULL,
          question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
          points REAL DEFAULT 1,
          sort_order INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS question_options (
          id INT PRIMARY KEY AUTO_INCREMENT,
          question_id INT NOT NULL,
          option_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT 0,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS submissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          quiz_id INT NOT NULL,
          student_id INT NOT NULL,
          quiz_name VARCHAR(255),
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          submitted_at DATETIME,
          status ENUM('IN_PROGRESS', 'PENDING', 'SUBMITTED', 'GRADED', 'TERMINATED', 'AUTO_TERMINATED') DEFAULT 'IN_PROGRESS',
          score REAL DEFAULT 0,
          total_score REAL DEFAULT 0,
          duration_seconds INT,
          cheating_status ENUM('NONE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'NO_CHEATING', 'SUSPICIOUS', 'CHEATING') DEFAULT 'NONE',
          risk_score REAL DEFAULT 0,
          auto_termination_reason TEXT,
          teacher_feedback TEXT,
          evaluation_timestamp DATETIME,
          total_violation_count INT DEFAULT 0,
          low_violation_count INT DEFAULT 0,
          medium_violation_count INT DEFAULT 0,
          high_violation_count INT DEFAULT 0,
          tab_switch_count INT DEFAULT 0,
          face_missing_count INT DEFAULT 0,
          looking_away_count INT DEFAULT 0,
          multiple_faces_count INT DEFAULT 0,
          browser_info TEXT,
          ip_address VARCHAR(255),
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist for existing databases
    const columnsToAdd = [
      { table: 'submissions', column: 'student_id', def: 'INT NOT NULL AFTER quiz_id' },
      { table: 'submissions', column: 'browser_info', def: 'TEXT' },
      { table: 'submissions', column: 'ip_address', def: 'VARCHAR(255)' },
      { table: 'submissions', column: 'risk_score', def: 'REAL DEFAULT 0' },
      { table: 'submissions', column: 'cheating_status', def: "ENUM('NONE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'NO_CHEATING', 'SUSPICIOUS', 'CHEATING') DEFAULT 'NONE'" },
      { table: 'submissions', column: 'evaluation_timestamp', def: 'DATETIME' },
      { table: 'submissions', column: 'total_violation_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'low_violation_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'medium_violation_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'high_violation_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'tab_switch_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'face_missing_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'looking_away_count', def: 'INT DEFAULT 0' },
      { table: 'submissions', column: 'multiple_faces_count', def: 'INT DEFAULT 0' },
      { table: 'violations', column: 'student_id', def: 'INT NOT NULL AFTER submission_id' },
      { table: 'violations', column: 'browser_info', def: 'TEXT' },
      { table: 'violations', column: 'ip_address', def: 'VARCHAR(255)' },
      { table: 'student_answers', column: 'awarded_points', def: 'REAL DEFAULT 0' }
    ];

    // Update ENUM for status if needed
    try {
      await db.query("ALTER TABLE submissions MODIFY COLUMN status ENUM('IN_PROGRESS', 'PENDING', 'SUBMITTED', 'GRADED', 'TERMINATED', 'AUTO_TERMINATED') DEFAULT 'IN_PROGRESS'");
      console.log("[DB] Updated submissions.status ENUM to include PENDING");
    } catch (err: any) {
      console.error("[DB] Error updating submissions.status ENUM:", err.message);
    }

    for (const item of columnsToAdd) {
      try {
        await db.query(`ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.def}`);
        console.log(`[DB] Added column ${item.column} to ${item.table}`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_COLUMN_NAME' || err.errno === 1060) {
          // Column already exists, ignore
        } else {
          console.error(`[DB] Error adding column ${item.column} to ${item.table}:`, err.message);
        }
      }
    }


    await db.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT NOT NULL,
          question_id INT NOT NULL,
          selected_option_id INT,
          answer_text TEXT,
          awarded_points REAL DEFAULT 0,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS violations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT,
          student_id INT NOT NULL,
          violation_type VARCHAR(255) NOT NULL,
          severity ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          message TEXT,
          device_info TEXT,
          browser_info TEXT,
          ip_address VARCHAR(255),
          event_duration_seconds INT DEFAULT 0,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS activities (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          action_type VARCHAR(255) NOT NULL,
          entity_type VARCHAR(255),
          entity_id INT,
          details TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          type VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          related_id INT,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_invitations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          course_id INT NOT NULL,
          teacher_id INT NOT NULL,
          student_id INT NOT NULL,
          status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS course_join_requests (
          id INT PRIMARY KEY AUTO_INCREMENT,
          course_id INT NOT NULL,
          student_id INT NOT NULL,
          status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS student_details (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL UNIQUE,
          major VARCHAR(255),
          year_of_study INT,
          bio TEXT,
          gpa REAL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS violation_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT NOT NULL,
          violation_type VARCHAR(255) NOT NULL,
          evidence_type ENUM('IMAGE', 'VIDEO') NOT NULL,
          file_url TEXT NOT NULL,
          confidence_score REAL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS proctoring_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          severity ENUM('LOW', 'MEDIUM', 'HIGH', 'NONE') DEFAULT 'NONE',
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          duration INT DEFAULT 0,
          message TEXT,
          FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )
    `);

    console.log("Database schema verified/created.");

    // Check if seeding is needed
    const [rows]: any = await db.query("SELECT count(*) as count FROM users");
    const userCount = rows[0].count;

    if (userCount === 0 || process.env.RESET_DB === 'true') {
      console.log("[DB] Seeding required or RESET_DB is true...");
      await seedDatabase();
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

// Helper to clear and seed
export const seedDatabase = async () => {
  console.log("[DB] Starting database seeding process...");
  
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("[DB] Foreign keys temporarily disabled for seeding.");

    const largeSeedPath = path.join(process.cwd(), "large_seed_data.sql");
    
    if (fs.existsSync(largeSeedPath)) {
      console.log("[DB] Found large_seed_data.sql. Executing...");
      const sql = fs.readFileSync(largeSeedPath, "utf8");
      
      const statements = sql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`[DB] Executing ${statements.length} SQL statements from large_seed_data.sql...`);
      
      for (let i = 0; i < statements.length; i++) {
        try {
          // Convert SQLite syntax to MySQL if needed
          let mysqlStmt = statements[i]
            .replace(/INSERT OR IGNORE/g, "INSERT IGNORE")
            .replace(/DATETIME\('now', '([^']+)'\)/g, "DATE_ADD(NOW(), INTERVAL $1)")
            .replace(/DATETIME\('now'\)/g, "NOW()")
            .replace(/AUTOINCREMENT/g, "AUTO_INCREMENT");
          
          await db.query(mysqlStmt);
        } catch (err: any) {
          console.error(`[DB] Error executing statement #${i + 1}:`);
          console.error(`[DB] SQL Error Message: ${err.message}`);
        }
      }
      
      console.log("[DB] Large seed data executed successfully.");
    }

    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("[DB] Foreign keys re-enabled.");
  } catch (err) {
    console.error("[DB] Database seeding failed:", err);
  }
};

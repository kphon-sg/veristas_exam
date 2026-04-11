-- ==========================================================
-- DATABASE SETUP SCRIPT (MySQL Syntax)
-- Project: Edge AI Proctoring & Examination System
-- Updated: 2026-02-28
-- ==========================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS edge_ai_exam;
USE edge_ai_exam;

-- 2. Cleanup existing tables (Order matters due to Foreign Keys)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS violations;
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    student_code VARCHAR(20) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('TEACHER', 'STUDENT', 'OTHER') NOT NULL,
    age INT,
    school_institution VARCHAR(255),
    country_location VARCHAR(100),
    usage_reason VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Courses Table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL, -- e.g., 'IT101'
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

-- 5. Course Enrollments
CREATE TABLE course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (course_id, student_id)
) ENGINE=InnoDB;

-- 6. Quizzes Table
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
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
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Questions Table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    points DECIMAL(5,2) DEFAULT 1.0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Answer Options Table
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Quiz Attempts / Submissions
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    quiz_name VARCHAR(100),
    
    -- Session Info
    start_time DATETIME,
    end_time DATETIME,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT DEFAULT 0,
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'AUTO_TERMINATED', 'TERMINATED') DEFAULT 'IN_PROGRESS',
    auto_termination_reason TEXT,
    
    -- Scoring
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    
    -- Cheating Evaluation
    cheating_status ENUM('NONE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'NO_CHEATING', 'SUSPICIOUS', 'CHEATING') DEFAULT 'NONE',
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

    -- Technical Metadata
    browser_info VARCHAR(255),
    ip_address VARCHAR(45),

    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Student Answers
CREATE TABLE student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT,
    answer_text TEXT,
    awarded_points DECIMAL(5,2) DEFAULT 0.0,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Proctoring Violations
CREATE TABLE violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    student_id INT NOT NULL,
    violation_type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'FACE_DETECTION', 'EYE_TRACKING', etc.
    severity ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    
    -- Technical Metadata
    device_info VARCHAR(255),
    browser_info VARCHAR(255),
    ip_address VARCHAR(45),
    event_duration_seconds INT DEFAULT 0,

    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Course Invitations (Teacher -> Student)
CREATE TABLE course_invitations (
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

-- 13. Course Join Requests (Student -> Teacher)
CREATE TABLE course_join_requests (
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

-- 14. Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('INVITATION', 'JOIN_REQUEST', 'SYSTEM', 'INVITATION_RESPONSE', 'JOIN_RESPONSE') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id INT, -- ID of invitation or join request
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- 1. Users (Teacher: teacher_admin/123, Student: student_sv01/123)
INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES 
(1, 'teacher_admin', 'TCIU001', 'Dr. Alan Turing', 'turing@edu.com', '123', 'TEACHER'),
(2, 'student_sv01', 'ITIU21278', 'Grace Hopper', 'grace@edu.com', '123', 'STUDENT'),
(3, 'student_sv02', 'ITIU22231', 'Ada Lovelace', 'ada@edu.com', '123', 'STUDENT'),
(4, 'student_sv03', 'SEIU23145', 'Linus Torvalds', 'linus@edu.com', '123', 'STUDENT'),
(5, 'chukongphong', 'TCIU002', 'Chu Kong Phong', 'chukongphong@gmail.com', '123', 'TEACHER');

-- 2. Courses
INSERT INTO courses (id, course_code, course_name, description, school_name, education_level, teacher_id, teacher_name) VALUES 
(1, 'IT101', 'Introduction to Programming', 'Foundations of logic using Python.', 'Veritas University', 'UNIVERSITY', 1, 'Dr. Alan Turing'),
(2, 'IT303', 'Database Systems', 'Relational modeling and SQL mastery.', 'Veritas University', 'UNIVERSITY', 1, 'Dr. Alan Turing');

-- 3. Enrollments
INSERT INTO course_enrollments (course_id, student_id) VALUES 
(1, 2), (2, 2), (2, 3), (1, 4);

-- 4. Quizzes
INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, course_name, teacher_name, deadline, status, total_score, published_at) VALUES 
(1, 'Python Basics Quiz', 'Basic syntax and logic', 30, 1, 1, 'Introduction to Programming', 'Dr. Alan Turing', '2026-12-31 23:59:59', 'PUBLISHED', 10.0, NOW()),
(2, 'SQL Joins Mastery', 'Complex queries and joins', 45, 2, 1, 'Database Systems', 'Dr. Alan Turing', '2026-12-31 23:59:59', 'PUBLISHED', 10.0, NOW());

-- 5. Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES 
(1, 1, 'What is the output of 2 ** 3 in Python?', 'MULTIPLE_CHOICE', 2.0, 1),
(2, 1, 'Explain the difference between a List and a Tuple.', 'ESSAY', 5.0, 2),
(3, 2, 'Which JOIN returns all records when there is a match in either left or right table?', 'MULTIPLE_CHOICE', 2.0, 1);

-- 6. Options
INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES 
(1, 1, '6', 0), (2, 1, '8', 1), (3, 1, '9', 0), (4, 1, '5', 0),
(5, 3, 'INNER JOIN', 0), (6, 3, 'LEFT JOIN', 0), (7, 3, 'FULL OUTER JOIN', 1), (8, 3, 'RIGHT JOIN', 0);

-- 7. Submissions (Testing Grading & Proctoring)
-- Submission 1: Grace Hopper (ID 2) - Python Basics - GRADED
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score) VALUES 
(1, 1, 2, 'Python Basics Quiz', '2026-03-01 10:00:00', '2026-03-01 10:15:00', '2026-03-01 10:15:00', 900, 'GRADED', 7.0, 6.0, 'NO_CHEATING', 5.0);

-- Submission 2: Grace Hopper (ID 2) - SQL Joins - SUBMITTED (Suspicious)
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score, total_violation_count, medium_violation_count) VALUES 
(2, 2, 2, 'SQL Joins Mastery', '2026-03-01 11:00:00', '2026-03-01 11:30:00', '2026-03-01 11:30:00', 1800, 'SUBMITTED', 2.0, 0.0, 'SUSPICIOUS', 45.0, 3, 2);

-- Submission 3: Ada Lovelace (ID 3) - SQL Joins - IN_PROGRESS
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, status) VALUES 
(3, 2, 3, 'SQL Joins Mastery', NOW(), 'IN_PROGRESS');

-- 8. Student Answers
-- Answers for Submission 1 (Grace Hopper - Python)
INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES 
(1, 1, 2, NULL, 2.0), -- Correct MC
(1, 2, NULL, 'A list is mutable, while a tuple is immutable. Lists use square brackets, tuples use parentheses.', 4.0); -- Essay (Partially graded)

-- Answers for Submission 2 (Grace Hopper - SQL)
INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES 
(2, 3, 5, NULL, 0.0); -- Incorrect MC (INNER JOIN instead of FULL OUTER)

-- 9. Violations (Proctoring logs for Submission 2)
INSERT INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES 
(2, 2, 'TAB_SWITCH', 'MEDIUM', 'User switched to another tab for 15 seconds.', '2026-03-01 11:10:00'),
(2, 2, 'FACE_DETECTION', 'MEDIUM', 'Multiple faces detected in frame.', '2026-03-01 11:15:00'),
(2, 2, 'EYE_TRACKING', 'LOW', 'Eyes looking away from screen frequently.', '2026-03-01 11:20:00');

-- [ignoring loop detection]
-- ==========================================================
-- MASTER PROFESSIONAL SEED DATA FOR VERITASEXAM (MySQL)
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CLEANUP EVERYTHING
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS course_invitations;
DROP TABLE IF EXISTS course_join_requests;
DROP TABLE IF EXISTS violations;
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS course_materials;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS student_details;
DROP TABLE IF EXISTS users;

-- 2. RE-CREATE TABLES
CREATE TABLE users (
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
);

CREATE TABLE student_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    major VARCHAR(255),
    year_of_study INT,
    bio TEXT,
    gpa REAL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE courses (
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
);

CREATE TABLE course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE course_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE quizzes (
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
    status ENUM('DRAFT', 'PUBLISHED', 'DELETED', 'EXPIRED') DEFAULT 'DRAFT',
    total_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY') NOT NULL,
    points REAL DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE question_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    quiz_name VARCHAR(255),
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    submitted_at DATETIME,
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'TERMINATED', 'AUTO_TERMINATED') DEFAULT 'IN_PROGRESS',
    score REAL DEFAULT 0,
    total_score REAL DEFAULT 0,
    duration_seconds INT,
    cheating_status ENUM('NONE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'NO_CHEATING', 'SUSPICIOUS', 'CHEATING') DEFAULT 'NONE',
    risk_score REAL DEFAULT 0,
    auto_termination_reason TEXT,
    teacher_feedback TEXT,
    evaluation_timestamp DATETIME,
    total_violation_count INT DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE student_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    selected_option_id INT,
    is_correct BOOLEAN,
    points_earned REAL,
    feedback TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE violations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT NOT NULL,
    violation_type VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    screenshot_url TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action_type VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255),
    entity_id INT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_id INT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE course_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE course_join_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. SEED DATA

-- Teachers
INSERT INTO users (id, username, student_code, full_name, email, password, role, department, school_institution) VALUES 
(1, 'teacher_alan', 'T001', 'Dr. Alan Turing', 'alan@veritas.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Computer Science', 'Veritas University'),
(2, 'teacher_grace', 'T002', 'Prof. Grace Hopper', 'grace@veritas.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Software Engineering', 'Veritas University'),
(3, 'teacher_phong', 'T003', 'Chu Kong Phong', 'phong@veritas.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'AI & Data Science', 'Veritas University'),
(4, 'teacher_ada', 'T004', 'Ada Lovelace', 'ada@veritas.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Mathematics', 'Veritas University');

-- Students
INSERT INTO users (id, username, student_code, full_name, email, password, role, department, age, school_institution, country_location) VALUES 
(10, 'student_an', 'SV2026001', 'Nguyen Van An', 'an@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Computer Science', 21, 'Veritas University', 'Vietnam'),
(11, 'student_binh', 'SV2026002', 'Tran Thi Binh', 'binh@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Information Technology', 20, 'Veritas University', 'Vietnam'),
(12, 'student_cuong', 'SV2026003', 'Le Van Cuong', 'cuong@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Software Engineering', 22, 'Veritas University', 'Vietnam'),
(13, 'student_dung', 'SV2026004', 'Pham Thi Dung', 'dung@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Data Science', 20, 'Veritas University', 'Vietnam'),
(14, 'student_hoa', 'SV2026005', 'Tran Thi Hoa', 'hoa@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'AI', 21, 'Veritas University', 'Vietnam'),
(15, 'student_linh', 'SV2026006', 'Hoang Thuy Linh', 'linh@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Computer Science', 19, 'Veritas University', 'Vietnam'),
(16, 'student_minh', 'SV2026007', 'Vu Quang Minh', 'minh@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Software Engineering', 22, 'Veritas University', 'Vietnam'),
(17, 'student_nam', 'SV2026008', 'Do Hoang Nam', 'nam@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Data Science', 21, 'Veritas University', 'Vietnam'),
(18, 'student_oanh', 'SV2026009', 'Bui Thi Oanh', 'oanh@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'AI', 20, 'Veritas University', 'Vietnam'),
(19, 'student_phuc', 'SV2026010', 'Nguyen Hong Phuc', 'phuc@student.edu', '$2b$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Computer Science', 21, 'Veritas University', 'Vietnam');

-- Student Details
INSERT INTO student_details (user_id, major, year_of_study, bio, gpa) VALUES 
(10, 'Computer Science', 3, 'Passionate about algorithms.', 3.8),
(11, 'Information Technology', 2, 'Web developer enthusiast.', 3.9),
(12, 'Software Engineering', 4, 'Focusing on distributed systems.', 3.7),
(13, 'Data Science', 2, 'Loves data visualization.', 3.6),
(14, 'AI', 3, 'Deep learning researcher.', 4.0),
(15, 'Computer Science', 1, 'Newbie in programming.', 3.5),
(16, 'Software Engineering', 4, 'Agile practitioner.', 3.8),
(17, 'Data Science', 3, 'Statistician at heart.', 3.7),
(18, 'AI', 2, 'Robotics fan.', 3.9),
(19, 'Computer Science', 3, 'Cybersecurity student.', 3.6);

-- Courses
INSERT INTO courses (id, course_code, course_name, description, teacher_id, teacher_name, school_name) VALUES 
(1, 'CS101', 'Introduction to Computer Science', 'Basics of computing and programming.', 1, 'Dr. Alan Turing', 'Veritas University'),
(2, 'DB301', 'Database Management Systems', 'Relational databases and SQL.', 1, 'Dr. Alan Turing', 'Veritas University'),
(3, 'AI201', 'Artificial Intelligence', 'Fundamentals of AI and ML.', 3, 'Chu Kong Phong', 'Veritas University'),
(4, 'SE401', 'Software Architecture', 'Design patterns and large scale systems.', 2, 'Prof. Grace Hopper', 'Veritas University'),
(5, 'WEB101', 'Web Development Basics', 'HTML, CSS, and JavaScript.', 3, 'Chu Kong Phong', 'Veritas University'),
(6, 'NET201', 'Computer Networking', 'TCP/IP, DNS, and network protocols.', 2, 'Prof. Grace Hopper', 'Veritas University'),
(7, 'MATH101', 'Calculus I', 'Limits, derivatives, and integrals.', 4, 'Ada Lovelace', 'Veritas University');

-- Course Enrollments
INSERT INTO course_enrollments (course_id, student_id) VALUES 
(1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15),
(2, 10), (2, 11), (2, 16), (2, 17),
(3, 13), (3, 14), (3, 18), (3, 19),
(4, 12), (4, 16), (5, 11), (5, 15),
(6, 10), (6, 12), (7, 13), (7, 17);

-- Course Materials
INSERT INTO course_materials (course_id, title, description, file_url, file_type) VALUES 
(1, 'Syllabus', 'Course overview', 'https://example.com/cs101-syllabus.pdf', 'pdf'),
(1, 'Lecture 1', 'Introduction to Binary', 'https://example.com/cs101-l1.pdf', 'pdf'),
(2, 'SQL Cheat Sheet', 'Common SQL commands', 'https://example.com/sql-cheat.pdf', 'pdf'),
(3, 'AI History', 'Evolution of AI', 'https://example.com/ai-history.pdf', 'pdf');

-- Quizzes
INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, status, open_at, deadline, total_score) VALUES 
(1, 'CS101 Midterm', 'Midterm exam for CS101', 60, 1, 1, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 10),
(2, 'SQL Mastery Quiz', 'Test your SQL skills', 45, 2, 1, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 10),
(3, 'Neural Networks Basics', 'Introduction to NN', 30, 3, 3, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 10),
(4, 'Architecture Patterns', 'Design patterns quiz', 40, 4, 2, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 10),
(5, 'Python Syntax Quiz', 'Basic Python syntax', 15, 1, 1, 'PUBLISHED', DATE_ADD(NOW(), INTERVAL -10 DAY), DATE_ADD(NOW(), INTERVAL -9 DAY), 10),
(6, 'Relational Algebra', 'Foundations of DB', 30, 2, 1, 'PUBLISHED', DATE_ADD(NOW(), INTERVAL -5 DAY), DATE_ADD(NOW(), INTERVAL -4 DAY), 10);

-- Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES 
(1, 1, 'What is the time complexity of binary search?', 'MULTIPLE_CHOICE', 2.0, 1),
(2, 1, 'Is Python an interpreted language?', 'TRUE_FALSE', 1.0, 2),
(3, 2, 'What does SQL stand for?', 'MULTIPLE_CHOICE', 2.0, 1),
(4, 2, 'Write a query to select all from users.', 'SHORT_ANSWER', 3.0, 2),
(5, 5, 'Which keyword is used to define a function in Python?', 'MULTIPLE_CHOICE', 2.0, 1);

-- Question Options
INSERT INTO question_options (question_id, option_text, is_correct) VALUES 
(1, 'O(n)', 0), (1, 'O(log n)', 1), (1, 'O(n^2)', 0), (1, 'O(1)', 0),
(2, 'True', 1), (2, 'False', 0),
(3, 'Structured Query Language', 1), (3, 'Simple Query Language', 0), (3, 'Standard Query Language', 0),
(5, 'def', 1), (5, 'func', 0), (5, 'function', 0);

-- Submissions
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, status, score, total_score, submitted_at, cheating_status) VALUES 
(1, 5, 10, 'Python Syntax Quiz', 'GRADED', 8.0, 10.0, DATE_ADD(NOW(), INTERVAL -9 DAY), 'NO_CHEATING'),
(2, 5, 11, 'Python Syntax Quiz', 'GRADED', 9.0, 10.0, DATE_ADD(NOW(), INTERVAL -9 DAY), 'NO_CHEATING'),
(3, 6, 10, 'Relational Algebra', 'GRADED', 7.5, 10.0, DATE_ADD(NOW(), INTERVAL -4 DAY), 'NO_CHEATING'),
(4, 6, 11, 'Relational Algebra', 'GRADED', 8.5, 10.0, DATE_ADD(NOW(), INTERVAL -4 DAY), 'NO_CHEATING');

-- Student Answers
INSERT INTO student_answers (submission_id, question_id, answer_text, selected_option_id, is_correct, points_earned) VALUES 
(1, 5, NULL, 10, 1, 2.0),
(2, 5, NULL, 10, 1, 2.0);

-- Violations
INSERT INTO violations (submission_id, violation_type, details, timestamp) VALUES 
(1, 'TAB_SWITCH', 'Switched tab 3 times', DATE_ADD(NOW(), INTERVAL -9 DAY)),
(3, 'FACE_NOT_FOUND', 'Face not detected for 10 seconds', DATE_ADD(NOW(), INTERVAL -4 DAY));

-- Activities
INSERT INTO activities (user_id, action_type, entity_type, entity_id, details) VALUES 
(1, 'CREATE_QUIZ', 'quiz', 1, 'Created CS101 Midterm'),
(10, 'START_QUIZ', 'quiz', 5, 'Started Python Syntax Quiz'),
(10, 'SUBMIT_QUIZ', 'quiz', 5, 'Submitted Python Syntax Quiz');

-- Notifications
INSERT INTO notifications (user_id, type, title, message) VALUES 
(10, 'QUIZ_PUBLISHED', 'New Quiz', 'CS101 Midterm has been published.'),
(11, 'QUIZ_PUBLISHED', 'New Quiz', 'CS101 Midterm has been published.'),
(10, 'QUIZ_GRADED', 'Quiz Graded', 'Your Python Syntax Quiz has been graded.');

-- Course Invitations
INSERT INTO course_invitations (course_id, teacher_id, student_id, status) VALUES 
(7, 4, 10, 'PENDING'),
(7, 4, 11, 'ACCEPTED');

-- Course Join Requests
INSERT INTO course_join_requests (course_id, student_id, status) VALUES 
(3, 15, 'PENDING'),
(4, 17, 'ACCEPTED');

SET FOREIGN_KEY_CHECKS = 1;

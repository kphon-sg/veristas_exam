-- ==========================================================
-- VERITASEXAM MYSQL SCHEMA & SEED DATA
-- ==========================================================

-- 1. SCHEMA CREATION
CREATE DATABASE IF NOT EXISTS veritas_exam;
USE veritas_exam;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS violations;
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS course_materials;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS course_invitations;
DROP TABLE IF EXISTS course_join_requests;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS users;

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
    status ENUM('DRAFT', 'PUBLISHED', 'DELETED') DEFAULT 'DRAFT',
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
);

CREATE TABLE student_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT,
    answer_text TEXT,
    awarded_points REAL DEFAULT 0,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
);

CREATE TABLE violations (
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

-- 2. SEED DATA
-- Teachers (IDs: 1, 5, 6)
INSERT IGNORE INTO users (id, username, student_code, full_name, email, password, role, department, school_institution) VALUES 
(1, 'admin', NULL, 'Dr. Alan Turing', 'admin@veritas.edu', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Computer Science', 'Veritas University'),
(5, 'teacher_phong', 'TCIU002', 'Chu Kong Phong', 'phong@edu.com', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Artificial Intelligence', 'Veritas University'),
(6, 'prof_hopper', 'TCIU003', 'Prof. Grace Hopper', 'hopper@edu.com', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'TEACHER', 'Software Engineering', 'Veritas University');

-- Students (IDs: 7-20)
INSERT IGNORE INTO users (id, username, student_code, full_name, email, password, role, school_institution) VALUES 
(7, 'student_01', 'ITITIU21001', 'Nguyen Van An', 'an.nv@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(8, 'student_02', 'ITITIU21002', 'Tran Thi Binh', 'binh.tt@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(9, 'student_03', 'ITITIU21003', 'Le Van Cuong', 'cuong.lv@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(10, 'student_04', 'ITITIU21004', 'Pham Thi Dung', 'dung.pt@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(11, 'student_05', 'ITITIU21005', 'Hoang Van Em', 'em.hv@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(12, 'student_06', 'ITITIU21006', 'Vo Thi Phuong', 'phuong.vt@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(13, 'student_07', 'ITITIU21007', 'Dang Van Giang', 'giang.dv@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(14, 'student_08', 'ITITIU21008', 'Bui Thi Hoa', 'hoa.bt@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(15, 'student_09', 'ITITIU21009', 'Do Van Hung', 'hung.dv@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University'),
(16, 'student_10', 'ITITIU21010', 'Ngo Thi Kim', 'kim.nt@student.edu.vn', '$2a$10$zV.fN.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.S.M.', 'STUDENT', 'Veritas University');

-- Courses (12 Classes)
INSERT IGNORE INTO courses (id, course_code, course_name, description, teacher_id, teacher_name, school_name) VALUES 
(1, 'IT101', 'Introduction to Programming', 'Foundations of logic using Python.', 1, 'Dr. Alan Turing', 'Veritas University'),
(2, 'IT303', 'Database Systems', 'Relational modeling and SQL mastery.', 1, 'Dr. Alan Turing', 'Veritas University'),
(3, 'AI101', 'AI Fundamentals', 'Introduction to Machine Learning and Neural Networks.', 5, 'Chu Kong Phong', 'Veritas University'),
(4, 'OS202', 'Operating Systems', 'Process management, memory, and file systems.', 1, 'Dr. Alan Turing', 'Veritas University'),
(5, 'NET404', 'Network Security', 'Cryptography and defense mechanisms.', 6, 'Prof. Grace Hopper', 'Veritas University'),
(6, 'EMB505', 'Embedded Systems', 'Microcontrollers and Real-time OS.', 5, 'Chu Kong Phong', 'Veritas University'),
(7, 'SE301', 'Software Engineering', 'Agile methodologies and design patterns.', 6, 'Prof. Grace Hopper', 'Veritas University'),
(8, 'DS201', 'Data Structures', 'Advanced algorithms and complexity analysis.', 1, 'Dr. Alan Turing', 'Veritas University'),
(9, 'WEB102', 'Web Development', 'Modern frontend and backend architectures.', 5, 'Chu Kong Phong', 'Veritas University'),
(10, 'ML302', 'Machine Learning', 'Deep learning and statistical modeling.', 5, 'Chu Kong Phong', 'Veritas University'),
(11, 'CS102', 'Data Structures II', 'Advanced graph algorithms and dynamic programming.', 1, 'Dr. Alan Turing', 'Veritas University'),
(12, 'BIO101', 'Intro to Biology', 'Cell biology and genetics.', 6, 'Prof. Grace Hopper', 'Veritas University');

-- Enrollments
INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES 
(1, 7), (1, 8), (1, 9), (1, 10), (2, 7), (2, 11), (2, 12), (3, 7), (3, 8), (3, 9), (3, 13), (4, 7), (4, 10), (4, 14), (5, 11), (5, 12), (5, 15), (6, 13), (6, 16), (7, 14), (7, 17), (8, 15), (8, 18), (9, 16), (9, 19), (10, 7), (10, 8), (10, 20);

-- Quizzes
INSERT IGNORE INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, status, open_at, deadline) VALUES 
(3, 'Neural Networks Midterm', 'Covers MLP and Backpropagation', 60, 3, 5, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY)),
(4, 'Process Scheduling Quiz', 'Round Robin and Priority Scheduling', 30, 4, 1, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(13, 'Python Syntax 101', 'Variables and Loops', 15, 1, 1, 'PUBLISHED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(14, 'SQL Basics', 'SELECT and WHERE clauses', 30, 2, 1, 'PUBLISHED', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(15, 'HTML/CSS Basics', 'Box model and Flexbox', 45, 9, 5, 'PUBLISHED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(18, 'Cell Structure Quiz', 'Organelles and their functions', 30, 12, 6, 'PUBLISHED', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY)),
(19, 'Graph Theory Basics', 'Nodes, edges, and paths', 40, 11, 1, 'PUBLISHED', NOW(), DATE_ADD(NOW(), INTERVAL 5 HOUR));

-- Questions
INSERT IGNORE INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES 
(4, 3, 'What is the primary purpose of an activation function?', 'MULTIPLE_CHOICE', 2.0, 1),
(5, 3, 'Backpropagation is based on the chain rule of calculus.', 'TRUE_FALSE', 2.0, 2),
(6, 3, 'Which optimizer is commonly used in Deep Learning?', 'MULTIPLE_CHOICE', 2.0, 3),
(7, 3, 'Describe the vanishing gradient problem.', 'ESSAY', 4.0, 4),
(8, 13, 'What is the correct way to create a list in Python?', 'MULTIPLE_CHOICE', 2.0, 1),
(9, 13, 'Python is a compiled language.', 'TRUE_FALSE', 2.0, 2),
(10, 14, 'Which SQL keyword is used to sort the result-set?', 'MULTIPLE_CHOICE', 2.0, 1),
(11, 18, 'What is the powerhouse of the cell?', 'MULTIPLE_CHOICE', 2.0, 1),
(12, 18, 'Ribosomes are responsible for protein synthesis.', 'TRUE_FALSE', 2.0, 2),
(13, 19, 'A graph with no cycles is called a tree.', 'TRUE_FALSE', 2.0, 1),
(14, 19, 'What is the complexity of Dijkstra algorithm?', 'SHORT_ANSWER', 5.0, 2);

-- Options
INSERT IGNORE INTO question_options (question_id, option_text, is_correct) VALUES 
(4, 'To introduce non-linearity', 1), (4, 'To normalize data', 0), (4, 'To speed up training', 0), (4, 'To reduce parameters', 0),
(5, 'True', 1), (5, 'False', 0),
(6, 'Adam', 1), (6, 'Newton', 0), (6, 'Bubble', 0), (6, 'DFS', 0),
(8, 'my_list = []', 1), (8, 'my_list = {}', 0), (8, 'my_list = ()', 0),
(9, 'False', 1), (9, 'True', 0),
(10, 'ORDER BY', 1), (10, 'SORT BY', 0), (10, 'GROUP BY', 0),
(11, 'Mitochondria', 1), (11, 'Nucleus', 0), (11, 'Ribosome', 0),
(12, 'True', 1), (12, 'False', 0),
(13, 'True', 1), (13, 'False', 0);

-- Submissions
INSERT IGNORE INTO submissions (id, quiz_id, student_id, quiz_name, status, score, total_score, submitted_at, cheating_status, risk_score) VALUES 
(4, 13, 7, 'Python Syntax 101', 'GRADED', 9.5, 10.0, DATE_SUB(NOW(), INTERVAL 9 DAY), 'NO_CHEATING', 2.0),
(5, 13, 8, 'Python Syntax 101', 'GRADED', 4.0, 10.0, DATE_SUB(NOW(), INTERVAL 9 DAY), 'SUSPICIOUS', 35.0),
(6, 14, 7, 'SQL Basics', 'GRADED', 10.0, 10.0, DATE_SUB(NOW(), INTERVAL 4 DAY), 'NO_CHEATING', 1.0),
(7, 14, 9, 'SQL Basics', 'GRADED', 8.0, 10.0, DATE_SUB(NOW(), INTERVAL 4 DAY), 'NO_CHEATING', 5.0),
(8, 15, 16, 'HTML/CSS Basics', 'GRADED', 7.5, 10.0, DATE_SUB(NOW(), INTERVAL 1 DAY), 'NO_CHEATING', 8.0),
(10, 3, 8, 'Neural Networks Midterm', 'SUBMITTED', 0.0, 10.0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), 'SUSPICIOUS', 42.0),
(11, 16, 14, 'Git Version Control', 'GRADED', 9.0, 10.0, DATE_SUB(NOW(), INTERVAL 14 DAY), 'NO_CHEATING', 3.0),
(12, 17, 15, 'Binary Trees', 'GRADED', 5.5, 10.0, DATE_SUB(NOW(), INTERVAL 19 DAY), 'CHEATING', 85.0),
(13, 13, 9, 'Python Syntax 101', 'GRADED', 8.0, 10.0, DATE_SUB(NOW(), INTERVAL 9 DAY), 'NO_CHEATING', 4.0),
(14, 13, 10, 'Python Syntax 101', 'GRADED', 7.0, 10.0, DATE_SUB(NOW(), INTERVAL 9 DAY), 'NO_CHEATING', 6.0);

-- Violations
INSERT IGNORE INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES 
(10, 8, 'FACE_DETECTION', 'MEDIUM', 'Face not detected for 10 seconds.', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(10, 8, 'TAB_SWITCH', 'HIGH', 'User switched to another application.', DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(12, 15, 'MULTIPLE_FACES', 'HIGH', 'Multiple faces detected in frame.', DATE_SUB(NOW(), INTERVAL 19 DAY)),
(5, 8, 'TAB_SWITCH', 'MEDIUM', 'Switched tab 3 times.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(10, 8, 'VOICE_DETECTION', 'LOW', 'Background noise detected.', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(10, 8, 'OBJECT_DETECTION', 'MEDIUM', 'Phone detected in frame.', DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(18, 14, 'FACE_DETECTION', 'MEDIUM', 'Face partially obscured.', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(18, 14, 'TAB_SWITCH', 'LOW', 'Briefly switched tab.', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(12, 15, 'EYE_TRACKING', 'MEDIUM', 'User looking away from screen frequently.', DATE_SUB(NOW(), INTERVAL 19 DAY)),
(12, 15, 'TAB_SWITCH', 'HIGH', 'Attempted to open developer tools.', DATE_SUB(NOW(), INTERVAL 19 DAY));

-- Notifications
INSERT IGNORE INTO notifications (user_id, type, title, message, is_read) VALUES 
(5, 'SYSTEM', 'Security Alert', 'Suspicious activity detected in Neural Networks Midterm.', 0),
(1, 'SYSTEM', 'Grading Complete', 'All submissions for SQL Basics have been graded.', 1),
(7, 'INVITATION', 'New Course', 'You have been invited to join Machine Learning.', 0),
(8, 'SYSTEM', 'Quiz Result', 'Your Python Syntax 101 quiz has been graded.', 0),
(1, 'INVITATION', 'New Student Request', 'A new student wants to join IT101.', 0),
(5, 'SYSTEM', 'Server Maintenance', 'System will be down for maintenance at midnight.', 0),
(7, 'SYSTEM', 'Welcome', 'Welcome to VeritasExam!', 1),
(8, 'SYSTEM', 'Profile Update', 'Your profile was successfully updated.', 1),
(9, 'SYSTEM', 'Quiz Result', 'Your Python Syntax 101 quiz has been graded.', 1),
(10, 'SYSTEM', 'Quiz Result', 'Your Python Syntax 101 quiz has been graded.', 0);

-- Activities
INSERT IGNORE INTO activities (user_id, action_type, entity_type, entity_id, details) VALUES 
(1, 'LOGIN', 'USER', 1, 'Teacher logged in'),
(5, 'CREATE_QUIZ', 'QUIZ', 3, 'Created Neural Networks Midterm'),
(7, 'START_QUIZ', 'QUIZ', 3, 'Started Neural Networks Midterm'),
(8, 'SUBMIT_QUIZ', 'QUIZ', 13, 'Submitted Python Syntax 101'),
(1, 'GRADE_QUIZ', 'SUBMISSION', 4, 'Graded Python Syntax 101 for student 7'),
(6, 'CREATE_COURSE', 'COURSE', 7, 'Created Software Engineering course'),
(14, 'JOIN_COURSE', 'COURSE', 1, 'Joined Introduction to Programming'),
(5, 'UPDATE_PROFILE', 'USER', 5, 'Updated profile information'),
(1, 'DELETE_QUIZ', 'QUIZ', 99, 'Deleted a draft quiz'),
(7, 'VIEW_RESULTS', 'SUBMISSION', 4, 'Viewed results for Python Syntax 101');

SET FOREIGN_KEY_CHECKS = 1;

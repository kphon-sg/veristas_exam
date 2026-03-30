-- Seed data for Edge AI Exam System
-- Database: edge_ai_exam

-- 1. Users (Passwords are '123' for all)
INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES 
(1, 'teacher_phong', NULL, 'Chu Kong Phong', 'phong@edu.com', '123', 'TEACHER'),
(2, 'student_grace', 'ITIU21045', 'Grace Hopper', 'grace@edu.com', '123', 'STUDENT'),
(3, 'student_ada', 'ITIU22231', 'Ada Lovelace', 'ada@edu.com', '123', 'STUDENT'),
(4, 'student_linus', 'SEIU23145', 'Linus Torvalds', 'linus@edu.com', '123', 'STUDENT'),
(5, 'teacher_nguyen', NULL, 'Nguyễn Văn A', 'nguyenvana@edu.com', '123', 'TEACHER');

-- 2. Courses
INSERT INTO courses (id, course_code, course_name, description, school_name, education_level, teacher_id, teacher_name) VALUES 
(1, 'IT101', 'Lập trình cơ bản', 'Nền tảng logic sử dụng Python.', 'Đại học Bách Khoa', 'UNIVERSITY', 1, 'Chu Kong Phong'),
(2, 'IT303', 'Hệ quản trị cơ sở dữ liệu', 'Mô hình quan hệ và SQL.', 'Đại học Bách Khoa', 'UNIVERSITY', 1, 'Chu Kong Phong'),
(3, 'AI101', 'Trí tuệ nhân tạo', 'Giới thiệu về AI và Machine Learning.', 'Đại học Công nghệ', 'UNIVERSITY', 5, 'Nguyễn Văn A');

-- 3. Enrollments
INSERT INTO course_enrollments (course_id, student_id) VALUES 
(1, 2),
(2, 2),
(2, 3),
(1, 4);

-- 4. Quizzes
INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, course_name, teacher_name, deadline, status, total_score, published_at) VALUES 
(1, 'Kiểm tra Python cơ bản', 'Cú pháp và logic cơ bản', 30, 1, 1, 'Lập trình cơ bản', 'Chu Kong Phong', '2026-12-31 23:59:59', 'PUBLISHED', 10.0, NOW()),
(2, 'SQL Joins Mastery', 'Truy vấn phức tạp và joins', 45, 2, 1, 'Hệ quản trị cơ sở dữ liệu', 'Chu Kong Phong', '2026-12-31 23:59:59', 'PUBLISHED', 10.0, NOW());

-- 5. Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES 
(1, 1, 'Kết quả của 2 ** 3 trong Python là gì?', 'MULTIPLE_CHOICE', 2.0, 1),
(2, 1, 'Giải thích sự khác biệt giữa List và Tuple.', 'ESSAY', 5.0, 2),
(3, 2, 'JOIN nào trả về tất cả các bản ghi khi có sự khớp ở bảng trái hoặc phải?', 'MULTIPLE_CHOICE', 2.0, 1);

-- 6. Options
INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES 
(1, 1, '6', 0),
(2, 1, '8', 1),
(3, 1, '9', 0),
(4, 1, '5', 0),
(5, 3, 'INNER JOIN', 0),
(6, 3, 'LEFT JOIN', 0),
(7, 3, 'FULL OUTER JOIN', 1),
(8, 3, 'RIGHT JOIN', 0);

-- 7. Submissions
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score) VALUES 
(1, 1, 2, 'Kiểm tra Python cơ bản', '2026-03-01 10:00:00', '2026-03-01 10:15:00', '2026-03-01 10:15:00', 900, 'GRADED', 7.0, 6.0, 'NO_CHEATING', 5.0),
(2, 2, 2, 'SQL Joins Mastery', '2026-03-01 11:00:00', '2026-03-01 11:30:00', '2026-03-01 11:30:00', 1800, 'SUBMITTED', 2.0, 0.0, 'SUSPICIOUS', 45.0);

-- 8. Student Answers
INSERT INTO student_answers (submission_id, question_id, selected_option_id, answer_text, awarded_points) VALUES 
(1, 1, 2, NULL, 2.0),
(1, 2, NULL, 'List là mutable còn Tuple là immutable.', 4.0),
(2, 3, 7, NULL, 2.0);

-- 9. Activities
INSERT INTO activities (user_id, action_type, entity_type, entity_id, details) VALUES 
(1, 'QUIZ_CREATED', 'QUIZ', 1, 'Giảng viên Chu Kong Phong đã tạo bài kiểm tra "Kiểm tra Python cơ bản" cho khóa học IT101 - Lập trình cơ bản'),
(2, 'QUIZ_STARTED', 'QUIZ', 1, 'Sinh viên Grace Hopper đã bắt đầu làm bài kiểm tra "Kiểm tra Python cơ bản"'),
(2, 'QUIZ_SUBMITTED', 'QUIZ', 1, 'Sinh viên Grace Hopper đã nộp bài kiểm tra "Kiểm tra Python cơ bản". Điểm: 6.0/10.0');

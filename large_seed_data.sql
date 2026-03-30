-- ==========================================================
-- LARGE SEED DATA SCRIPT
-- Project: VeritasExam - Secure Monitoring System
-- Purpose: Populate system with realistic data for testing
-- ==========================================================

-- 1. Additional Users
-- Teachers (IDs 6-10)
INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES 
(6, 'prof_einstein', 'TCIU003', 'Albert Einstein', 'einstein@veritas.edu', '123', 'TEACHER'),
(7, 'prof_curie', 'TCIU004', 'Marie Curie', 'curie@veritas.edu', '123', 'TEACHER'),
(8, 'prof_feynman', 'TCIU005', 'Richard Feynman', 'feynman@veritas.edu', '123', 'TEACHER'),
(9, 'prof_tesla', 'TCIU006', 'Nikola Tesla', 'tesla@veritas.edu', '123', 'TEACHER'),
(10, 'prof_darwin', 'TCIU007', 'Charles Darwin', 'darwin@veritas.edu', '123', 'TEACHER');

-- Students (IDs 11-25)
INSERT INTO users (id, username, student_code, full_name, email, password, role) VALUES 
(11, 'student_01', 'STU001', 'John Smith', 'john@student.edu', '123', 'STUDENT'),
(12, 'student_02', 'STU002', 'Emily Brown', 'emily@student.edu', '123', 'STUDENT'),
(13, 'student_03', 'STU003', 'Michael Johnson', 'michael@student.edu', '123', 'STUDENT'),
(14, 'student_04', 'STU004', 'Sarah Williams', 'sarah@student.edu', '123', 'STUDENT'),
(15, 'student_05', 'STU005', 'David Jones', 'david@student.edu', '123', 'STUDENT'),
(16, 'student_06', 'STU006', 'Jessica Garcia', 'jessica@student.edu', '123', 'STUDENT'),
(17, 'student_07', 'STU007', 'Christopher Miller', 'chris@student.edu', '123', 'STUDENT'),
(18, 'student_08', 'STU008', 'Ashley Davis', 'ashley@student.edu', '123', 'STUDENT'),
(19, 'student_09', 'STU009', 'Matthew Rodriguez', 'matthew@student.edu', '123', 'STUDENT'),
(20, 'student_10', 'STU010', 'Amanda Martinez', 'amanda@student.edu', '123', 'STUDENT'),
(21, 'student_11', 'STU011', 'Joshua Hernandez', 'joshua@student.edu', '123', 'STUDENT'),
(22, 'student_12', 'STU012', 'Brittany Lopez', 'brittany@student.edu', '123', 'STUDENT'),
(23, 'student_13', 'STU013', 'Andrew Gonzalez', 'andrew@student.edu', '123', 'STUDENT'),
(24, 'student_14', 'STU014', 'Megan Wilson', 'megan@student.edu', '123', 'STUDENT'),
(25, 'student_15', 'STU015', 'Daniel Anderson', 'daniel@student.edu', '123', 'STUDENT');

-- 2. Additional Courses
INSERT INTO courses (id, course_code, course_name, description, school_name, education_level, teacher_id, teacher_name) VALUES 
(3, 'PHY201', 'Quantum Mechanics', 'Advanced physics and wave functions.', 'Veritas University', 'UNIVERSITY', 6, 'Albert Einstein'),
(4, 'CHM102', 'Organic Chemistry', 'Carbon-based compounds and reactions.', 'Veritas University', 'UNIVERSITY', 7, 'Marie Curie'),
(5, 'PHY105', 'Classical Mechanics', 'Newtonian physics and motion.', 'Veritas University', 'UNIVERSITY', 8, 'Richard Feynman'),
(6, 'EE302', 'Electromagnetism', 'Fields, waves, and circuits.', 'Veritas University', 'UNIVERSITY', 9, 'Nikola Tesla'),
(7, 'BIO101', 'Evolutionary Biology', 'Natural selection and genetics.', 'Veritas University', 'UNIVERSITY', 10, 'Charles Darwin'),
(8, 'CS404', 'Artificial Intelligence', 'Machine learning and neural networks.', 'Veritas University', 'UNIVERSITY', 5, 'Chu Kong Phong'),
(9, 'CS202', 'Data Structures', 'Algorithms and efficient data storage.', 'Veritas University', 'UNIVERSITY', 5, 'Chu Kong Phong'),
(10, 'MAT101', 'Calculus I', 'Limits, derivatives, and integrals.', 'Veritas University', 'UNIVERSITY', 6, 'Albert Einstein');

-- 3. Enrollments (Random distribution)
INSERT INTO course_enrollments (course_id, student_id) VALUES 
(3, 11), (3, 12), (3, 13), (3, 14), (3, 15),
(4, 16), (4, 17), (4, 18), (4, 19), (4, 20),
(5, 21), (5, 22), (5, 23), (5, 24), (5, 25),
(8, 11), (8, 12), (8, 13), (8, 14), (8, 15),
(9, 16), (9, 17), (9, 18), (9, 19), (9, 20),
(1, 11), (1, 12), (1, 13), (2, 14), (2, 15);

-- 4. Additional Quizzes
INSERT INTO quizzes (id, title, description, duration_minutes, course_id, teacher_id, course_name, teacher_name, deadline, status, total_score, published_at) VALUES 
(3, 'Quantum Basics', 'Introduction to wave-particle duality.', 45, 3, 6, 'Quantum Mechanics', 'Albert Einstein', '2026-06-30 23:59:59', 'PUBLISHED', 20.0, NOW()),
(4, 'Carbon Bonding', 'Alkanes, Alkenes, and Alkynes.', 60, 4, 7, 'Organic Chemistry', 'Marie Curie', '2026-06-30 23:59:59', 'PUBLISHED', 25.0, NOW()),
(5, 'Newtonian Laws', 'Forces and acceleration.', 30, 5, 8, 'Classical Mechanics', 'Richard Feynman', '2026-06-30 23:59:59', 'PUBLISHED', 15.0, NOW()),
(6, 'Maxwell Equations', 'Electromagnetic field theory.', 90, 6, 9, 'Electromagnetism', 'Nikola Tesla', '2026-06-30 23:59:59', 'PUBLISHED', 30.0, NOW()),
(7, 'Origin of Species', 'Natural selection concepts.', 40, 7, 10, 'Evolutionary Biology', 'Charles Darwin', '2026-06-30 23:59:59', 'PUBLISHED', 20.0, NOW()),
(8, 'Neural Networks Midterm', 'Backpropagation and CNNs.', 120, 8, 5, 'Artificial Intelligence', 'Chu Kong Phong', '2026-06-30 23:59:59', 'PUBLISHED', 50.0, NOW()),
(9, 'Sorting Algorithms', 'QuickSort, MergeSort, and HeapSort.', 45, 9, 5, 'Data Structures', 'Chu Kong Phong', '2026-06-30 23:59:59', 'PUBLISHED', 20.0, NOW()),
(10, 'Derivative Mastery', 'Chain rule and product rule.', 60, 10, 6, 'Calculus I', 'Albert Einstein', '2026-06-30 23:59:59', 'PUBLISHED', 25.0, NOW());

-- 5. Questions for Quiz 8 (AI Midterm)
INSERT INTO questions (id, quiz_id, question_text, question_type, points, sort_order) VALUES 
(4, 8, 'What is the primary purpose of an activation function in a neural network?', 'MULTIPLE_CHOICE', 5.0, 1),
(5, 8, 'Describe the difference between supervised and unsupervised learning.', 'ESSAY', 15.0, 2),
(6, 8, 'Which of the following is NOT a common optimizer in deep learning?', 'MULTIPLE_CHOICE', 5.0, 3),
(7, 8, 'What is overfitting and how can it be prevented?', 'ESSAY', 15.0, 4),
(8, 8, 'In a CNN, what is the purpose of a pooling layer?', 'MULTIPLE_CHOICE', 10.0, 5);

-- 6. Options for Quiz 8
INSERT INTO question_options (id, question_id, option_text, is_correct) VALUES 
(9, 4, 'To introduce non-linearity', 1), (10, 4, 'To reduce the number of parameters', 0), (11, 4, 'To speed up training only', 0), (12, 4, 'To initialize weights', 0),
(13, 6, 'Adam', 0), (14, 6, 'SGD', 0), (15, 6, 'ReLU', 1), (16, 6, 'RMSprop', 0),
(17, 8, 'To increase spatial dimensions', 0), (18, 8, 'To reduce spatial dimensions and parameters', 1), (19, 8, 'To apply filters', 0), (20, 8, 'To normalize data', 0);

-- 7. Submissions (Realistic History)
INSERT INTO submissions (id, quiz_id, student_id, quiz_name, start_time, end_time, submitted_at, duration_seconds, status, total_score, score, cheating_status, risk_score, total_violation_count) VALUES 
(4, 8, 11, 'Neural Networks Midterm', '2026-03-10 09:00:00', '2026-03-10 11:00:00', '2026-03-10 11:00:00', 7200, 'GRADED', 50.0, 45.0, 'NO_CHEATING', 2.0, 0),
(5, 8, 12, 'Neural Networks Midterm', '2026-03-10 09:05:00', '2026-03-10 11:05:00', '2026-03-10 11:05:00', 7200, 'GRADED', 50.0, 38.0, 'SUSPICIOUS', 35.0, 12),
(6, 8, 13, 'Neural Networks Midterm', '2026-03-10 09:10:00', '2026-03-10 11:10:00', '2026-03-10 11:10:00', 7200, 'SUBMITTED', 50.0, 0.0, 'CHEATING', 85.0, 45),
(7, 9, 16, 'Sorting Algorithms', '2026-03-11 14:00:00', '2026-03-11 14:45:00', '2026-03-11 14:45:00', 2700, 'GRADED', 20.0, 18.0, 'NO_CHEATING', 0.0, 0),
(8, 9, 17, 'Sorting Algorithms', '2026-03-11 14:05:00', '2026-03-11 14:50:00', '2026-03-11 14:50:00', 2700, 'GRADED', 20.0, 15.0, 'NO_CHEATING', 10.0, 2);

-- 8. Violations for Cheating Student (ID 13)
INSERT INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES 
(6, 13, 'TAB_SWITCH', 'HIGH', 'User switched to ChatGPT for 2 minutes.', '2026-03-10 09:30:00'),
(6, 13, 'FACE_DETECTION', 'HIGH', 'Face missing for 3 minutes.', '2026-03-10 09:45:00'),
(6, 13, 'MULTIPLE_FACES', 'HIGH', 'Another person detected helping the student.', '2026-03-10 10:00:00'),
(6, 13, 'TAB_SWITCH', 'MEDIUM', 'User switched to browser search.', '2026-03-10 10:15:00'),
(6, 13, 'EYE_TRACKING', 'MEDIUM', 'Student looking at phone below desk.', '2026-03-10 10:30:00');

-- 9. Notifications
INSERT INTO notifications (user_id, type, title, message, related_id, is_read) VALUES 
(5, 'JOIN_REQUEST', 'New Enrollment Request', 'John Smith wants to join Artificial Intelligence.', 1, 0),
(5, 'JOIN_REQUEST', 'New Enrollment Request', 'Emily Brown wants to join Artificial Intelligence.', 2, 0),
(11, 'SYSTEM', 'Exam Published', 'Neural Networks Midterm is now available.', 8, 1),
(12, 'SYSTEM', 'Exam Published', 'Neural Networks Midterm is now available.', 8, 0),
(1, 'SYSTEM', 'System Update', 'VeritasExam v2.4.0 is now live with improved AI tracking.', NULL, 0);

-- 10. Join Requests
INSERT INTO course_join_requests (course_id, student_id, status) VALUES 
(8, 11, 'PENDING'), (8, 12, 'PENDING'), (8, 13, 'ACCEPTED'), (9, 16, 'ACCEPTED'), (9, 17, 'PENDING');

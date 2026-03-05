-- SEED DATA FOR VERITAS ACADEMY (edge_ai_exam)
-- This script provides a large set of sample data for testing purposes.

-- 1. TEACHERS (15 Teachers)
INSERT IGNORE INTO users (username, full_name, email, password, role) VALUES
('teacher1', 'Dr. Alan Turing', 'teacher1@edu.com', 'password123', 'TEACHER'),
('teacher2', 'Prof. Grace Hopper', 'teacher2@edu.com', 'password123', 'TEACHER'),
('teacher3', 'Dr. Margaret Hamilton', 'teacher3@edu.com', 'password123', 'TEACHER'),
('teacher4', 'Prof. Donald Knuth', 'teacher4@edu.com', 'password123', 'TEACHER'),
('teacher5', 'Dr. Barbara Liskov', 'teacher5@edu.com', 'password123', 'TEACHER'),
('teacher6', 'Prof. Ken Thompson', 'teacher6@edu.com', 'password123', 'TEACHER'),
('teacher7', 'Dr. Adele Goldberg', 'teacher7@edu.com', 'password123', 'TEACHER'),
('teacher8', 'Prof. Niklaus Wirth', 'teacher8@edu.com', 'password123', 'TEACHER'),
('teacher9', 'Dr. Shafi Goldwasser', 'teacher9@edu.com', 'password123', 'TEACHER'),
('teacher10', 'Prof. Leslie Lamport', 'teacher10@edu.com', 'password123', 'TEACHER'),
('teacher11', 'Dr. Silvio Micali', 'teacher11@edu.com', 'password123', 'TEACHER'),
('teacher12', 'Prof. Judea Pearl', 'teacher12@edu.com', 'password123', 'TEACHER'),
('teacher13', 'Dr. Yann LeCun', 'teacher13@edu.com', 'password123', 'TEACHER'),
('teacher14', 'Prof. Geoffrey Hinton', 'teacher14@edu.com', 'password123', 'TEACHER'),
('teacher15', 'Dr. Yoshua Bengio', 'teacher15@edu.com', 'password123', 'TEACHER');

-- 2. COURSES (25 Courses)
-- Note: teacher_id values assume the teachers above are the first 15 teachers in the DB.
-- In a real scenario, you would match the IDs.
INSERT IGNORE INTO courses (course_code, name, description, teacher_id) VALUES
('CS101', 'Intro to Computer Science', 'Fundamental concepts of computing.', 1),
('CS102', 'Data Structures', 'Advanced organization and storage of data.', 2),
('CS201', 'Algorithms', 'Design and analysis of efficient procedures.', 3),
('CS202', 'Operating Systems', 'Principles of OS design and implementation.', 4),
('CS301', 'Artificial Intelligence', 'Introduction to machine learning and AI.', 5),
('CS302', 'Database Systems', 'Relational models and SQL optimization.', 6),
('IT101', 'Web Development', 'Building modern responsive web applications.', 7),
('IT102', 'Network Security', 'Protecting systems from cyber threats.', 8),
('IT201', 'Cloud Computing', 'Scalable infrastructure and microservices.', 9),
('IT202', 'Mobile App Dev', 'iOS and Android development with React Native.', 10),
('MATH101', 'Calculus I', 'Limits, derivatives, and integrals.', 11),
('MATH102', 'Linear Algebra', 'Vector spaces and matrix operations.', 12),
('PHY101', 'Physics I', 'Mechanics and thermodynamics.', 13),
('PHY102', 'Quantum Mechanics', 'Introduction to subatomic particles.', 14),
('BIO101', 'Molecular Biology', 'Study of life at the molecular level.', 15),
('BIO102', 'Genetics', 'Principles of heredity and variation.', 1),
('ENG101', 'English Literature', 'Classic works of the Western canon.', 2),
('ENG102', 'Creative Writing', 'Workshop for fiction and poetry.', 3),
('HIS101', 'World History', 'Global events from antiquity to modern era.', 4),
('HIS102', 'History of Science', 'Evolution of scientific thought.', 5),
('ART101', 'Art History', 'Visual arts through the ages.', 6),
('ART102', 'Digital Illustration', 'Modern techniques for digital art.', 7),
('MUS101', 'Music Theory', 'Foundations of harmony and rhythm.', 8),
('MUS102', 'Composition', 'Creating original musical works.', 9),
('PE101', 'Physical Education', 'Health, fitness, and team sports.', 10);

-- 3. STUDENTS (Sample of 200 Students)
-- Showing first 10 for brevity, the full script would have 200.
INSERT IGNORE INTO users (username, student_code, full_name, email, password, role) VALUES
('student1', 'STU1001', 'Nguyen Van A', 'student1@edu.com', 'password123', 'STUDENT'),
('student2', 'STU1002', 'Tran Thi B', 'student2@edu.com', 'password123', 'STUDENT'),
('student3', 'STU1003', 'Le Van C', 'student3@edu.com', 'password123', 'STUDENT'),
('student4', 'STU1004', 'Pham Thi D', 'student4@edu.com', 'password123', 'STUDENT'),
('student5', 'STU1005', 'Hoang Van E', 'student5@edu.com', 'password123', 'STUDENT'),
('student6', 'STU1006', 'Vu Thi F', 'student6@edu.com', 'password123', 'STUDENT'),
('student7', 'STU1007', 'Dang Van G', 'student7@edu.com', 'password123', 'STUDENT'),
('student8', 'STU1008', 'Bui Thi H', 'student8@edu.com', 'password123', 'STUDENT'),
('student9', 'STU1009', 'Do Van I', 'student9@edu.com', 'password123', 'STUDENT'),
('student10', 'STU1010', 'Ngo Thi K', 'student10@edu.com', 'password123', 'STUDENT');
-- ... (Repeat up to student200)

-- 4. COURSE ENROLLMENTS (Sample)
-- INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES
-- (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), ... (20-50 per course)

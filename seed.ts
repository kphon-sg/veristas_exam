import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "edge_ai_exam",
});

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Generate Teachers
    const teachers = [];
    for (let i = 1; i <= 15; i++) {
      const id = i + 100; // Offset to avoid collisions with existing
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

    // Insert Users
    console.log("Inserting users...");
    await pool.query(
      "INSERT IGNORE INTO users (username, student_code, full_name, email, password, role) VALUES ?",
      [ [...teachers, ...students] ]
    );

    // Get Teacher IDs
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

    console.log("Inserting courses...");
    await pool.query(
      "INSERT IGNORE INTO courses (course_code, course_name, description, teacher_id) VALUES ?",
      [courses]
    );

    // Get Course and Student IDs
    const [courseRows] = await pool.query("SELECT id FROM courses");
    const [studentRows] = await pool.query("SELECT id FROM users WHERE role = 'STUDENT'");
    const courseIds = (courseRows as any[]).map(r => r.id);
    const studentIds = (studentRows as any[]).map(r => r.id);

    // 4. Generate Enrollments
    const enrollments = [];
    for (const courseId of courseIds) {
      // Randomly pick 20-50 students for each course
      const numStudents = Math.floor(Math.random() * 31) + 20;
      const shuffled = [...studentIds].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffled.slice(0, numStudents);

      for (const studentId of selectedStudents) {
        enrollments.push([courseId, studentId]);
      }
    }

    console.log("Inserting enrollments...");
    // Use chunking for large inserts
    const chunkSize = 500;
    for (let i = 0; i < enrollments.length; i += chunkSize) {
      const chunk = enrollments.slice(i, i + chunkSize);
      await pool.query(
        "INSERT IGNORE INTO course_enrollments (course_id, student_id) VALUES ?",
        [chunk]
      );
    }

    // 5. Generate Quizzes
    const quizzes = [];
    for (const courseId of courseIds) {
      const teacherId = teacherIds[courseId % teacherIds.length];
      quizzes.push([
        `Midterm Exam for Course ${courseId}`,
        `Comprehensive midterm evaluation for course ${courseId}.`,
        60,
        courseId,
        teacherId,
        'PUBLISHED',
        100.0,
        new Date()
      ]);
      quizzes.push([
        `Final Project Quiz ${courseId}`,
        `Final assessment for course ${courseId}.`,
        120,
        courseId,
        teacherId,
        'PUBLISHED',
        100.0,
        new Date()
      ]);
    }

    console.log("Inserting quizzes...");
    await pool.query(
      "INSERT IGNORE INTO quizzes (title, description, duration_minutes, course_id, teacher_id, status, total_score, published_at) VALUES ?",
      [quizzes]
    );

    // Get Quiz IDs
    const [quizRows] = await pool.query("SELECT id FROM quizzes");
    const quizIds = (quizRows as any[]).map(r => r.id);

    // 6. Generate Questions
    const questions = [];
    for (const quizId of quizIds) {
      for (let i = 1; i <= 5; i++) {
        questions.push([
          quizId,
          `Question ${i} for Quiz ${quizId}: What is the fundamental concept of this topic?`,
          'MULTIPLE_CHOICE',
          20.0,
          i
        ]);
      }
    }

    console.log("Inserting questions...");
    await pool.query(
      "INSERT IGNORE INTO questions (quiz_id, question_text, question_type, points, sort_order) VALUES ?",
      [questions]
    );

    // Get Question IDs
    const [questionRows] = await pool.query("SELECT id FROM questions");
    const questionIds = (questionRows as any[]).map(r => r.id);

    // 7. Generate Options
    const options = [];
    for (const questionId of questionIds) {
      for (let i = 1; i <= 4; i++) {
        options.push([
          questionId,
          `Option ${i} for Question ${questionId}`,
          i === 1 ? 1 : 0 // First option is correct
        ]);
      }
    }

    console.log("Inserting options...");
    const optionChunkSize = 1000;
    for (let i = 0; i < options.length; i += optionChunkSize) {
      const chunk = options.slice(i, i + optionChunkSize);
      await pool.query(
        "INSERT IGNORE INTO question_options (question_id, option_text, is_correct) VALUES ?",
        [chunk]
      );
    }

    // 8. Generate Submissions
    const submissions = [];
    for (let i = 0; i < 500; i++) {
      const quizId = quizIds[Math.floor(Math.random() * quizIds.length)];
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const status = ['GRADED', 'SUBMITTED', 'IN_PROGRESS'][Math.floor(Math.random() * 3)];
      const cheatingStatus = ['NO_CHEATING', 'SUSPICIOUS', 'CHEATING'][Math.floor(Math.random() * 3)];
      
      submissions.push([
        quizId,
        studentId,
        `Quiz Submission ${i}`,
        new Date(),
        status === 'IN_PROGRESS' ? null : new Date(),
        status,
        100.0,
        status === 'GRADED' ? Math.floor(Math.random() * 101) : 0,
        cheatingStatus,
        cheatingStatus === 'NO_CHEATING' ? 0 : Math.floor(Math.random() * 100)
      ]);
    }

    console.log("Inserting submissions...");
    await pool.query(
      "INSERT IGNORE INTO submissions (quiz_id, student_id, quiz_name, start_time, end_time, status, total_score, score, cheating_status, risk_score) VALUES ?",
      [submissions]
    );

    // Get Submission IDs
    const [submissionRows] = await pool.query("SELECT id FROM submissions");
    const submissionIds = (submissionRows as any[]).map(r => r.id);

    // 9. Generate Violations
    const violations = [];
    const violationTypes = ['TAB_SWITCH', 'FACE_DETECTION', 'EYE_TRACKING', 'MULTIPLE_FACES'];
    const severities = ['LOW', 'MEDIUM', 'HIGH'];

    for (let i = 0; i < 1000; i++) {
      const submissionId = submissionIds[Math.floor(Math.random() * submissionIds.length)];
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      violations.push([
        submissionId,
        studentId,
        violationTypes[Math.floor(Math.random() * violationTypes.length)],
        severities[Math.floor(Math.random() * severities.length)],
        `Automated proctoring alert: Suspicious activity detected during exam session.`,
        new Date()
      ]);
    }

    console.log("Inserting violations...");
    const violationChunkSize = 500;
    for (let i = 0; i < violations.length; i += violationChunkSize) {
      const chunk = violations.slice(i, i + violationChunkSize);
      await pool.query(
        "INSERT IGNORE INTO violations (submission_id, student_id, violation_type, severity, message, timestamp) VALUES ?",
        [chunk]
      );
    }

    // 10. Generate Notifications
    const notifications = [];
    const notificationTypes = ['INVITATION', 'JOIN_REQUEST', 'SYSTEM', 'INVITATION_RESPONSE', 'JOIN_RESPONSE'];
    for (let i = 0; i < 200; i++) {
      const userId = studentIds[Math.floor(Math.random() * studentIds.length)];
      notifications.push([
        userId,
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
        `System Notification ${i}`,
        `This is an automated notification message for testing purposes.`,
        null,
        Math.random() > 0.5 ? 1 : 0
      ]);
    }

    console.log("Inserting notifications...");
    await pool.query(
      "INSERT IGNORE INTO notifications (user_id, type, title, message, related_id, is_read) VALUES ?",
      [notifications]
    );

    // 11. Generate Join Requests
    const joinRequests = [];
    for (let i = 0; i < 100; i++) {
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      joinRequests.push([
        courseId,
        studentId,
        ['PENDING', 'ACCEPTED', 'DECLINED'][Math.floor(Math.random() * 3)]
      ]);
    }

    console.log("Inserting join requests...");
    await pool.query(
      "INSERT IGNORE INTO course_join_requests (course_id, student_id, status) VALUES ?",
      [joinRequests]
    );

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

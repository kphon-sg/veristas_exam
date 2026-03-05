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
      "INSERT IGNORE INTO courses (course_code, name, description, teacher_id) VALUES ?",
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

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

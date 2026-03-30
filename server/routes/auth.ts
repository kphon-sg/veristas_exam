import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../config/database.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "veritas_exam_secret_key_2026";

// Brute-force protection: Limit login attempts
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { error: "Too many failed attempts. Please try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV !== 'production',
});

// Registration Endpoint
router.post("/register", async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      role, 
      age, 
      school, 
      country, 
      reason 
    } = req.body;

    // 1. Basic Validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields (Name, Email, Password, Role)" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 2. Check if user already exists
    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if ((existingUsers as any[]).length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate Username (simple version)
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // 5. Insert User
    const [result] = await pool.execute(
      `INSERT INTO users (username, full_name, email, password, role, age, school_institution, country_location, usage_reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, fullName, email.toLowerCase(), hashedPassword, role, age || null, school || null, country || null, reason || null]
    );

    const userId = (result as any).insertId;

    // 6. Generate JWT
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase(), role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        fullName,
        email,
        role
      }
    });

  } catch (error: any) {
    console.error("[AUTH] Registration error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Login Endpoint
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username: rawUsername, password, loginType } = req.body;
    
    console.log(`[AUTH] Login attempt - Username/Email: ${rawUsername}, Type: ${loginType}`);

    if (!rawUsername || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const identifier = rawUsername.trim();
    const emailLower = identifier.toLowerCase();
    
    // 1. Find User - Check email, username, and student_code
    console.log(`[AUTH] Searching for user with identifier: ${identifier}`);
    const [userRows] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ? OR student_code = ?", 
      [emailLower, identifier, identifier]
    );
    const user = (userRows as any)[0];
    
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for identifier "${identifier}"`);
      return res.status(401).json({ error: "Invalid credentials." });
    }

    console.log(`[AUTH] User found: ID=${user.id}, Username=${user.username}, Role=${user.role}`);

    // 2. Verify Password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log(`[AUTH] Bcrypt comparison result: ${isMatch}`);
    } catch (bcryptErr) {
      console.error(`[AUTH] Bcrypt error:`, bcryptErr);
    }
    
    if (!isMatch) {
      // Fallback for plain text passwords (ONLY FOR DEBUGGING/MIGRATION)
      if (password === user.password) {
        console.log(`[AUTH] Plain text password match detected for user ${user.id}`);
        isMatch = true;
      } else {
        console.log(`[AUTH] Login failed: Password mismatch for user ${user.id}`);
        return res.status(401).json({ error: "Invalid credentials." });
      }
    }

    // 3. Verify Role
    if (user.role !== loginType) {
      console.log(`[AUTH] Login failed: Role mismatch. User role: ${user.role}, Login type: ${loginType}`);
      return res.status(403).json({ error: "Incorrect login type for this account." });
    }

    console.log(`[AUTH] Login successful for user: ${user.email}`);

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseUser: any = {
      id: Number(user.id),
      username: user.username,
      studentCode: user.student_code,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department,
      profilePicture: user.profile_picture,
      phoneNumber: user.phone_number,
      createdAt: user.created_at,
      token // Send token to client
    };

    if (user.role === 'STUDENT') {
      const [enrollmentRows] = await pool.query("SELECT course_id FROM course_enrollments WHERE student_id = ? LIMIT 1", [user.id]);
      const enrollment = (enrollmentRows as any)[0];
      if (enrollment) {
        responseUser.classId = Number(enrollment.course_id);
      }
    }

    res.json(responseUser);
  } catch (error: any) {
    console.error("[AUTH] Login error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

export default router;

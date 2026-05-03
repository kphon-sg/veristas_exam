import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { db } from "../config/database.js";

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
    const [existingUsers]: any = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate Username (simple version)
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // 5. Insert User
    console.log(`[AUTH] Attempting to insert user: ${email.toLowerCase()} with role: ${role}`);
    
    let result: any;
    try {
      const [insertResult]: any = await db.query(`
        INSERT INTO users (username, full_name, email, password, role, age, school_institution, country_location, usage_reason) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        username, 
        fullName, 
        email.toLowerCase(), 
        hashedPassword, 
        role, 
        age || null, 
        school || null, 
        country || null, 
        reason || null
      ]);
      
      result = insertResult;
      console.log(`[AUTH] Insert result:`, result);
      
      if (result.affectedRows === 0) {
        console.error(`[AUTH] Insert failed: No rows were changed.`);
        return res.status(500).json({ error: "Failed to create user account." });
      }
    } catch (dbError: any) {
      console.error(`[AUTH] Database error during registration:`, dbError);
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: "Username or Email already exists." });
      }
      throw dbError;
    }

    const userId = result.insertId;
    console.log(`[AUTH] User created successfully with ID: ${userId}`);

    // Create student_details if role is STUDENT
    if (role === 'STUDENT') {
      await db.query("INSERT INTO student_details (user_id, major, year_of_study) VALUES (?, ?, ?)", [userId, null, 1]);
    }

    // Immediate verification
    const [verifiedUsers]: any = await db.query("SELECT id, email, username FROM users WHERE id = ?", [userId]);
    if (verifiedUsers.length === 0) {
      console.error(`[AUTH] CRITICAL: User with ID ${userId} was not found in database immediately after insert!`);
    } else {
      console.log(`[AUTH] Verified user exists in DB:`, verifiedUsers[0]);
    }

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
    const [users]: any = await db.query(`
      SELECT * FROM users 
      WHERE email = ? OR username = ? OR student_code = ?
    `, [emailLower, identifier, identifier]);
    
    const user = users[0];
    
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for identifier "${identifier}"`);
      return res.status(401).json({ error: "Account not found. Please check your email or student code." });
    }

    console.log(`[AUTH] User found: ID=${user.id}, Username=${user.username}, Role=${user.role}`);

    // 2. Verify Password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log(`[AUTH] Bcrypt comparison result for user ${user.id}: ${isMatch}`);
    } catch (bcryptErr) {
      console.error(`[AUTH] Bcrypt error for user ${user.id}:`, bcryptErr);
    }
    
    if (!isMatch) {
      // Fallback for plain text passwords (ONLY FOR DEBUGGING/MIGRATION)
      if (password === user.password) {
        console.log(`[AUTH] Plain text password match detected for user ${user.id}. Migrating to hash...`);
        // Migrate to hash immediately
        const hashed = bcrypt.hashSync(password, 10);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
        isMatch = true;
      } else {
        console.log(`[AUTH] Login failed: Password mismatch for user ${user.id} (${user.email})`);
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }
    }

    // 3. Verify Role
    if (loginType && user.role !== loginType) {
      console.log(`[AUTH] Login failed: Role mismatch. User role: ${user.role}, Requested login type: ${loginType}`);
      const roleName = user.role === 'TEACHER' ? 'Teacher' : 'Student';
      return res.status(403).json({ error: `This account is registered as a ${roleName}. Please use the correct login portal.` });
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
      const [enrollments]: any = await db.query("SELECT course_id FROM course_enrollments WHERE student_id = ? LIMIT 1", [user.id]);
      if (enrollments.length > 0) {
        responseUser.classId = Number(enrollments[0].course_id);
      }
    }

    res.json(responseUser);
  } catch (error: any) {
    console.error("[AUTH] Login error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

export default router;

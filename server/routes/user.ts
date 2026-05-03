import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../config/database.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  },
});

// Get Student Profile Endpoint
router.get("/student/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [rows]: any = await db.query(`
      SELECT u.id, u.username, u.full_name, u.email, u.student_code, u.role, u.department, u.age, u.profile_picture,
             sd.major, sd.year_of_study, sd.bio, sd.gpa
      FROM users u
      LEFT JOIN student_details sd ON u.id = sd.user_id
      WHERE u.id = ?
    `, [userId]);

    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    res.json(profile);
  } catch (error: any) {
    console.error("[USER] Fetch student profile error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Update Profile Endpoint
router.put("/update-profile", authenticateToken, upload.single("profilePicture"), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { fullName, phoneNumber, department, currentPassword, newPassword } = req.body;
    const profilePicture = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;

    // 1. Fetch current user data
    const [userRows]: any = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = userRows[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Handle Password Change if requested
    let hashedPassword = user.password;
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(newPassword, salt);
    }

    // 3. Update User in Database
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (fullName) {
      updateFields.push("full_name = ?");
      updateValues.push(fullName);
    }

    if (phoneNumber !== undefined) {
      updateFields.push("phone_number = ?");
      updateValues.push(phoneNumber);
    }

    if (department !== undefined) {
      updateFields.push("department = ?");
      updateValues.push(department);
    }

    if (profilePicture) {
      updateFields.push("profile_picture = ?");
      updateValues.push(profilePicture);
    }

    if (currentPassword && newPassword) {
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateValues.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    await db.query(updateQuery, updateValues);

    // 4. Fetch updated user data
    const [updatedUserRows]: any = await db.query("SELECT id, username, full_name, email, role, department, profile_picture, phone_number, created_at FROM users WHERE id = ?", [userId]);
    const updatedUser = updatedUserRows[0];

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        profilePicture: updatedUser.profile_picture,
        phoneNumber: updatedUser.phone_number,
        createdAt: updatedUser.created_at
      }
    });

  } catch (error: any) {
    console.error("[USER] Profile update error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

export default router;

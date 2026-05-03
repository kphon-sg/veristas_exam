import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./server/config/database.js";
import { initDatabase } from "./server/services/dbInit.js";

// Import Routes
import authRoutes from "./server/routes/auth.js";
import quizRoutes from "./server/routes/quiz.js";
import examRoutes from "./server/routes/exam.js";
import teacherRoutes from "./server/routes/teacher.js";
import notificationRoutes from "./server/routes/notification.js";
import systemRoutes from "./server/routes/system.js";
import classRoutes from "./server/routes/class.js";
import userRoutes from "./server/routes/user.js";
import proctoringRoutes from "./server/routes/proctoring.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Database
  await initDatabase();

  const apiRouter = express.Router();

  // Health Check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug Route
  apiRouter.get("/debug/db/:table", async (req, res) => {
    try {
      const { table } = req.params;
      const allowedTables = ['users', 'courses', 'course_enrollments', 'quizzes', 'questions', 'options', 'submissions', 'violations', 'activity_logs', 'notifications', 'course_invitations', 'course_join_requests'];
      
      if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      const [rows]: any = await db.query(`SELECT * FROM \`${table}\` LIMIT 100`);
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mount Routes
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/", classRoutes); // Handles /classes, /invitations, /join-requests, /students, /schools
  apiRouter.use("/quizzes", quizRoutes);
  apiRouter.use("/", systemRoutes); // Handles /activities and /admin
  apiRouter.use("/", examRoutes); // Handles /submissions and /exam
  apiRouter.use("/teacher", teacherRoutes);
  apiRouter.use("/notifications", notificationRoutes);
  apiRouter.use("/user", userRoutes);
  apiRouter.use("/proctoring", proctoringRoutes);

  app.use("/api", apiRouter);

  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Catch-all for undefined API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

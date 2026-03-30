import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Fetch basic notifications
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    
    const mapped = await Promise.all((notifications as any[]).map(async (r) => {
      let details: any = null;

      // Fetch additional details based on notification type
      if (r.type === 'INVITATION' && r.related_id) {
        const [inv] = await pool.query(`
          SELECT i.*, c.course_name, c.course_code, u.full_name as teacher_name
          FROM course_invitations i
          JOIN courses c ON i.course_id = c.id
          JOIN users u ON i.teacher_id = u.id
          WHERE i.id = ?
        `, [r.related_id]);
        details = (inv as any[])[0];
      } else if (r.type === 'JOIN_REQUEST' && r.related_id) {
        const [reqs] = await pool.query(`
          SELECT jr.*, c.course_name, c.course_code, u.full_name as student_name, u.student_code
          FROM course_join_requests jr
          JOIN courses c ON jr.course_id = c.id
          JOIN users u ON jr.student_id = u.id
          WHERE jr.id = ?
        `, [r.related_id]);
        details = (reqs as any[])[0];
      }

      return {
        id: r.id,
        userId: r.user_id,
        type: r.type,
        title: r.title,
        message: r.message,
        relatedId: r.related_id,
        isRead: !!r.is_read,
        createdAt: r.created_at,
        details
      };
    }));

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/respond", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { notificationId, response } = req.body; // response: 'ACCEPTED' or 'DECLINED' (or 'REJECTED')
    
    await connection.beginTransaction();

    const [notifRows] = await connection.query("SELECT * FROM notifications WHERE id = ?", [notificationId]);
    const notification = (notifRows as any)[0];

    if (!notification) {
      await connection.rollback();
      return res.status(404).json({ error: "Notification not found" });
    }

    const status = response === 'APPROVE' || response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

    if (notification.type === 'INVITATION') {
      // Handle Invitation Response (Student responding to Teacher)
      const [invRows] = await connection.query("SELECT * FROM course_invitations WHERE id = ?", [notification.related_id]);
      const invitation = (invRows as any)[0];

      if (invitation && invitation.status === 'PENDING') {
        await connection.query("UPDATE course_invitations SET status = ? WHERE id = ?", [status, invitation.id]);
        if (status === 'ACCEPTED') {
          await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [invitation.course_id, invitation.student_id]);
        }
        
        // Notify Teacher
        const [studentRows] = await connection.query("SELECT full_name FROM users WHERE id = ?", [invitation.student_id]);
        const [courseRows] = await connection.query("SELECT course_code FROM courses WHERE id = ?", [invitation.course_id]);
        const student = (studentRows as any)[0];
        const course = (courseRows as any)[0];

        await connection.query(
          "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION_RESPONSE', ?, ?, ?)",
          [invitation.teacher_id, status === 'ACCEPTED' ? "Invitation Accepted" : "Invitation Declined", `Student ${student.full_name} has ${status.toLowerCase()} your invitation to join ${course.course_code}`, invitation.id]
        );
      }
    } else if (notification.type === 'JOIN_REQUEST') {
      // Handle Join Request Response (Teacher responding to Student)
      const [reqRows] = await connection.query("SELECT * FROM course_join_requests WHERE id = ?", [notification.related_id]);
      const joinRequest = (reqRows as any)[0];

      if (joinRequest && joinRequest.status === 'PENDING') {
        await connection.query("UPDATE course_join_requests SET status = ? WHERE id = ?", [status, joinRequest.id]);
        if (status === 'ACCEPTED') {
          await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [joinRequest.course_id, joinRequest.student_id]);
        }

        // Notify Student
        const [courseRows] = await connection.query("SELECT course_code FROM courses WHERE id = ?", [joinRequest.course_id]);
        const course = (courseRows as any)[0];

        await connection.query(
          "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_RESPONSE', ?, ?, ?)",
          [joinRequest.student_id, status === 'ACCEPTED' ? "Join Request Accepted" : "Join Request Declined", `Your request to join ${course.course_code} has been ${status.toLowerCase()}`, joinRequest.id]
        );
      }
    }

    // Mark notification as read
    await connection.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [notificationId]);

    await connection.commit();
    res.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

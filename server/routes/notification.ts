import express from "express";
import { db } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Fetch basic notifications
    const [notifications]: any = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    
    const mapped = [];
    for (const r of notifications) {
      let details: any = null;

      // Fetch additional details based on notification type
      if (r.type === 'INVITATION' && r.related_id) {
        const [rows]: any = await db.query(`
          SELECT i.*, c.course_name, c.course_code, u.full_name as teacher_name
          FROM course_invitations i
          JOIN courses c ON i.course_id = c.id
          JOIN users u ON i.teacher_id = u.id
          WHERE i.id = ?
        `, [r.related_id]);
        details = rows[0] || null;
      } else if (r.type === 'JOIN_REQUEST' && r.related_id) {
        const [rows]: any = await db.query(`
          SELECT jr.*, c.course_name, c.course_code, u.full_name as student_name, u.student_code
          FROM course_join_requests jr
          JOIN courses c ON jr.course_id = c.id
          JOIN users u ON jr.student_id = u.id
          WHERE jr.id = ?
        `, [r.related_id]);
        details = rows[0] || null;
      }

      mapped.push({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        title: r.title,
        message: r.message,
        relatedId: r.related_id,
        isRead: !!r.is_read,
        createdAt: r.created_at,
        details
      });
    }

    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/respond", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { notificationId, response } = req.body; // response: 'ACCEPTED' or 'DECLINED' (or 'REJECTED')
    
    const [notificationRows]: any = await connection.query("SELECT * FROM notifications WHERE id = ?", [notificationId]);
    const notification = notificationRows[0];

    if (!notification) {
      throw new Error("Notification not found");
    }

    const status = response === 'APPROVE' || response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

    if (notification.type === 'INVITATION') {
      // Handle Invitation Response (Student responding to Teacher)
      const [invitationRows]: any = await connection.query("SELECT * FROM course_invitations WHERE id = ?", [notification.related_id]);
      const invitation = invitationRows[0];

      if (invitation && invitation.status === 'PENDING') {
        await connection.query("UPDATE course_invitations SET status = ? WHERE id = ?", [status, invitation.id]);
        if (status === 'ACCEPTED') {
          await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [invitation.course_id, invitation.student_id]);
        }
        
        // Notify Teacher
        const [studentRows]: any = await connection.query("SELECT full_name FROM users WHERE id = ?", [invitation.student_id]);
        const [courseRows]: any = await connection.query("SELECT course_code FROM courses WHERE id = ?", [invitation.course_id]);
        const student = studentRows[0];
        const course = courseRows[0];

        await connection.query(
          "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'INVITATION_RESPONSE', ?, ?, ?)",
          [invitation.teacher_id, status === 'ACCEPTED' ? "Invitation Accepted" : "Invitation Declined", `Student ${student.full_name} has ${status.toLowerCase()} your invitation to join ${course.course_code}`, invitation.id]
        );
      }
    } else if (notification.type === 'JOIN_REQUEST') {
      // Handle Join Request Response (Teacher responding to Student)
      const [joinRequestRows]: any = await connection.query("SELECT * FROM course_join_requests WHERE id = ?", [notification.related_id]);
      const joinRequest = joinRequestRows[0];

      if (joinRequest && joinRequest.status === 'PENDING') {
        await connection.query("UPDATE course_join_requests SET status = ? WHERE id = ?", [status, joinRequest.id]);
        if (status === 'ACCEPTED') {
          await connection.query("INSERT INTO course_enrollments (course_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrolled_at = CURRENT_TIMESTAMP", [joinRequest.course_id, joinRequest.student_id]);
        }

        // Notify Student
        const [courseRows]: any = await connection.query("SELECT course_code FROM courses WHERE id = ?", [joinRequest.course_id]);
        const course = courseRows[0];

        await connection.query(
          "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'JOIN_RESPONSE', ?, ?, ?)",
          [joinRequest.student_id, status === 'ACCEPTED' ? "Join Request Accepted" : "Join Request Declined", `Your request to join ${course.course_code} has been ${status.toLowerCase()}`, joinRequest.id]
        );
      }
    }

    // Mark notification as read
    await connection.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [notificationId]);

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
    await db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

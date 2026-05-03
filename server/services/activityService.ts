import { db } from "../config/database.js";

export const logActivity = async (userId: number, actionType: string, entityType: string | null = null, entityId: number | null = null, details: string | null = null) => {
  try {
    await db.query(
      "INSERT INTO activities (user_id, action_type, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, actionType, entityType, entityId, details]
    );
    console.log(`[ACTIVITY] Logged: ${actionType} for user ${userId}`);
  } catch (err) {
    console.error("[DB] Error logging activity:", err);
  }
};

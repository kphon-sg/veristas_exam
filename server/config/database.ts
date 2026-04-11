import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Initialize MySQL connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "edge_ai_exam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// For backward compatibility during migration, we'll provide a wrapper or just use the pool directly
// But since we need to change all routes to async, we'll export the pool.
export const db = pool;

export const toDBDateTime = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // Format to YYYY-MM-DD HH:mm:ss
    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');
    return formatted;
  } catch (e) {
    console.error(`[toDBDateTime] Error formatting ${date}:`, e);
    return null;
  }
};

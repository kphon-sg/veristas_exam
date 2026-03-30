import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "edge_ai_exam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const toMySQLDateTime = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // Format to YYYY-MM-DD HH:mm:ss
    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');
    return formatted;
  } catch (e) {
    console.error(`[toMySQLDateTime] Error formatting ${date}:`, e);
    return null;
  }
};

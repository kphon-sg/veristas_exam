# Project Instructions: VeritasExam

## Database Requirements
- **Strict Requirement**: This project MUST always use **MySQL**.
- **No SQLite**: Do not use SQLite or any `better-sqlite3` patterns.
- **Connection Details**:
  - Host: `root` (or as specified in `.env`)
  - Database Name: `edge_ai_exam`
  - Password: `123456`
- **Library**: Use `mysql2/promise` for all database interactions.
- **Patterns**: Always use `async/await` with `db.query()` or `db.execute()`. Use explicit transactions with `connection.beginTransaction()`, `commit()`, and `rollback()` for multi-step writes.

## Authentication
- Use `bcrypt` for password hashing.
- Support login via Email, Username, or Student Code.
- Ensure roles (Teacher/Student) are verified during login.

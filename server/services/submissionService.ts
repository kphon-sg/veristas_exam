import { pool } from "../config/database.js";

export async function mapSubmission(sub: any) {
  const [answerRows] = await pool.query(`
    SELECT sa.*, q.question_text, q.question_type, q.points as max_points
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.submission_id = ?
  `, [sub.id]);
  
  const mappedAnswers = [];
  for (const ans of answerRows as any[]) {
    const [optionRows] = await pool.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [ans.question_id]);
    const options = (optionRows as any[]).map(o => o.option_text);
    const correctOptionIdx = (optionRows as any[]).findIndex(o => o.is_correct === 1);
    
    mappedAnswers.push({ 
      id: Number(ans.id),
      submissionId: Number(ans.submission_id),
      questionId: Number(ans.question_id),
      questionText: ans.question_text,
      type: ans.question_type,
      maxPoints: ans.max_points,
      correctAnswer: correctOptionIdx !== -1 ? correctOptionIdx : null,
      options: options,
      selectedOption: ans.selected_option_id ? (optionRows as any[]).findIndex(o => o.id === ans.selected_option_id) : null,
      answerText: ans.answer_text,
      studentAnswer: ans.answer_text, // Alias for frontend
      pointsEarned: ans.awarded_points
    });
  }
  
  const [violationRows] = await pool.query("SELECT * FROM violations WHERE submission_id = ? ORDER BY timestamp ASC", [sub.id]);
  const mappedViolations = (violationRows as any[]).map((v: any) => ({
    id: Number(v.id),
    submissionId: Number(v.submission_id),
    studentId: Number(v.student_id),
    type: v.violation_type,
    severity: v.severity,
    timestamp: v.timestamp,
    message: v.message,
    deviceInfo: v.device_info,
    browserInfo: v.browser_info,
    ipAddress: v.ip_address,
    duration: v.event_duration_seconds
  }));
  
  return { 
    id: Number(sub.id),
    quizId: Number(sub.quiz_id),
    quizName: sub.quiz_name,
    courseName: sub.courseName,
    courseCode: sub.courseCode,
    studentId: Number(sub.student_id),
    studentName: sub.studentName,
    startTime: sub.start_time,
    endTime: sub.end_time,
    submittedAt: sub.submitted_at,
    timestamp: sub.submitted_at, // Alias for frontend
    durationSeconds: sub.duration_seconds,
    status: sub.status,
    autoTerminationReason: sub.auto_termination_reason,
    totalScore: Number(sub.total_score || 0),
    score: Number(sub.score || 0),
    cheatingStatus: sub.cheating_status,
    riskScore: Number(sub.risk_score || 0),
    totalViolationCount: Number(sub.total_violation_count || 0),
    lowViolationCount: Number(sub.low_violation_count || 0),
    mediumViolationCount: Number(sub.medium_violation_count || 0),
    highViolationCount: Number(sub.high_violation_count || 0),
    tabSwitchCount: Number(sub.tab_switch_count || 0),
    faceMissingCount: Number(sub.face_missing_count || 0),
    lookingAwayCount: Number(sub.looking_away_count || 0),
    multipleFacesCount: Number(sub.multiple_faces_count || 0),
    evaluationTimestamp: sub.evaluation_timestamp,
    teacherFeedback: sub.teacher_feedback,
    answers: mappedAnswers, 
    violations: mappedViolations 
  };
}

import { db } from "../config/database.js";
import { calculateRiskScore } from "../utils/riskEngine.js";

export async function mapSubmission(sub: any) {
  const [answerRows]: any = await db.query(`
    SELECT sa.*, q.question_text, q.question_type, q.points as max_points
    FROM student_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.submission_id = ?
  `, [sub.id]);
  
  const mappedAnswers = [];
  for (const ans of answerRows as any[]) {
    const [optionRows]: any = await db.query("SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC", [ans.question_id]);
    const options = optionRows.map((o: any) => o.option_text);
    const correctOptionIdx = optionRows.findIndex((o: any) => o.is_correct === 1);
    
    mappedAnswers.push({ 
      id: Number(ans.id),
      submissionId: Number(ans.submission_id),
      questionId: Number(ans.question_id),
      questionText: ans.question_text,
      type: ans.question_type,
      maxPoints: ans.max_points,
      correctAnswer: correctOptionIdx !== -1 ? correctOptionIdx : null,
      options: options,
      selectedOption: ans.selected_option_id ? optionRows.findIndex((o: any) => o.id === ans.selected_option_id) : null,
      answerText: ans.answer_text,
      studentAnswer: ans.answer_text, // Alias for frontend
      pointsEarned: ans.awarded_points
    });
  }
  
  const [logRows]: any = await db.query("SELECT * FROM proctoring_logs WHERE submission_id = ? ORDER BY start_time ASC", [sub.id]);
  const mappedViolations = (logRows as any[]).map((v: any) => ({
    id: Number(v.id),
    submissionId: Number(v.submission_id),
    type: v.event_type,
    severity: v.severity,
    timestamp: v.start_time,
    endTime: v.end_time,
    duration: v.duration,
    message: v.message
  }));

  // Calculate dynamic risk score
  const { score: calculatedRiskScore, status: calculatedStatus } = calculateRiskScore(mappedViolations);

  // Update DB with calculated values if they differ or are missing
  if (sub.risk_score !== calculatedRiskScore || sub.cheating_status !== calculatedStatus) {
    await db.query("UPDATE submissions SET risk_score = ?, cheating_status = ? WHERE id = ?", [calculatedRiskScore, calculatedStatus, sub.id]);
  }
  
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
    submitted_at: sub.submitted_at,
    timestamp: sub.submitted_at, // Alias for frontend
    durationSeconds: sub.duration_seconds,
    duration_seconds: sub.duration_seconds,
    status: sub.status,
    autoTerminationReason: sub.auto_termination_reason,
    auto_termination_reason: sub.auto_termination_reason,
    totalScore: Number(sub.total_score || 0),
    maxScore: Number(sub.total_score || 0), // Alias for frontend
    score: Number(sub.score || 0),
    total_score: Number(sub.total_score || 0), // Underscore version for compatibility
    totalQuestions: Number(sub.total_questions || 0),
    total_questions: Number(sub.total_questions || 0), // Underscore version
    cheatingStatus: calculatedStatus,
    cheating_status: calculatedStatus,
    riskScore: calculatedRiskScore,
    risk_score: calculatedRiskScore,
    totalViolationCount: mappedViolations.length,
    total_violation_count: mappedViolations.length,
    quiz_title: sub.quiz_name || sub.quizTitle,
    student_name: sub.studentName,
    student_code: sub.student_code,
    course_name: sub.courseName || sub.className,
    course_code: sub.courseCode || sub.classCode,
    evaluationTimestamp: sub.evaluation_timestamp,
    teacherFeedback: sub.teacher_feedback,
    answers: mappedAnswers, 
    violations: mappedViolations,
    lowViolationCount: mappedViolations.filter(v => String(v.severity).toUpperCase() === 'LOW').length,
    mediumViolationCount: mappedViolations.filter(v => String(v.severity).toUpperCase() === 'MEDIUM').length,
    highViolationCount: mappedViolations.filter(v => String(v.severity).toUpperCase() === 'HIGH').length,
  };
}

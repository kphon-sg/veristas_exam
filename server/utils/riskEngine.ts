
export interface ProctoringLog {
  type: string;
  severity: string;
}

export function calculateRiskScore(logs: ProctoringLog[]): { score: number; status: 'NO_CHEATING' | 'SUSPICIOUS' | 'CHEATING' } {
  let totalPoints = 0;

  // Weights
  const weights: Record<string, number> = {
    'tab_switch': 30,
    'app_blur': 30,
    'phone_detected': 50,
    'multiple_faces': 40,
    'looking_away': 15,
    'face_missing': 15
  };

  // We count unique occurrences of violations to avoid over-penalizing for the same event type
  // Or should we count every instance? The prompt says "frequency and severity".
  // Usually, frequency means count.
  
  logs.forEach(log => {
    const type = log.type.toLowerCase();
    if (weights[type]) {
      totalPoints += weights[type];
    }
  });

  // Cap at 100
  const score = Math.min(totalPoints, 100);

  // Classification Rules
  let status: 'NO_CHEATING' | 'SUSPICIOUS' | 'CHEATING' = 'NO_CHEATING';
  if (score > 70) {
    status = 'CHEATING';
  } else if (score > 30) {
    status = 'SUSPICIOUS';
  } else {
    status = 'NO_CHEATING';
  }

  return { score, status };
}

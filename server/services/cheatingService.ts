export function evaluateCheating(violations: any[]) {
  const total = violations.length;
  const high = violations.filter(v => v.severity?.toUpperCase() === 'HIGH').length;
  const medium = violations.filter(v => v.severity?.toUpperCase() === 'MEDIUM').length;
  const low = violations.filter(v => v.severity?.toUpperCase() === 'LOW').length;
  const tabSwitches = violations.filter(v => (v.violation_type || v.type)?.toUpperCase() === 'TAB_SWITCH').length;
  const faceMissing = violations.filter(v => (v.violation_type || v.type)?.toUpperCase() === 'FACE_MISSING').length;
  const lookingAway = violations.filter(v => (v.violation_type || v.type)?.toUpperCase() === 'LOOKING_AWAY').length;
  const multipleFaces = violations.filter(v => (v.violation_type || v.type)?.toUpperCase() === 'MULTIPLE_FACES').length;

  let status = 'NO_CHEATING';
  let score = 0;

  // Base score calculation
  score = (low * 5) + (medium * 15) + (high * 30);
  
  if (high > 2 || tabSwitches > 5 || score >= 80) {
    status = 'CHEATING';
    score = Math.min(100, Math.max(80, score));
  } else if (total > 3 || high > 0 || medium > 1 || score >= 40) {
    status = 'SUSPICIOUS';
    score = Math.min(79, Math.max(40, score));
  } else {
    status = 'NO_CHEATING';
    score = Math.min(39, score);
  }

  return { status, score, high, medium, low, total, tabSwitches, faceMissing, lookingAway, multipleFaces };
}

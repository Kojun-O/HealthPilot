const CHECK_IN_KEYS = ["condition", "sleep", "focus", "mentalSpace", "activity"];

const SLEEP_SCORE_ANCHORS = [
  { minutes: 240, score: 30 },
  { minutes: 270, score: 40 },
  { minutes: 300, score: 50 },
  { minutes: 330, score: 60 },
  { minutes: 360, score: 70 },
  { minutes: 390, score: 80 },
  { minutes: 420, score: 90 },
  { minutes: 450, score: 95 },
  { minutes: 480, score: 100 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function calculateSleepScore(durationMinutes) {
  const minutes = toFiniteNumber(durationMinutes);

  if (minutes === null) {
    return null;
  }

  const minAnchor = SLEEP_SCORE_ANCHORS[0];
  const maxAnchor = SLEEP_SCORE_ANCHORS[SLEEP_SCORE_ANCHORS.length - 1];

  if (minutes <= minAnchor.minutes) {
    return minAnchor.score;
  }

  if (minutes >= maxAnchor.minutes) {
    return maxAnchor.score;
  }

  for (let index = 1; index < SLEEP_SCORE_ANCHORS.length; index += 1) {
    const left = SLEEP_SCORE_ANCHORS[index - 1];
    const right = SLEEP_SCORE_ANCHORS[index];

    if (minutes > right.minutes) {
      continue;
    }

    const ratio = (minutes - left.minutes) / (right.minutes - left.minutes);
    return left.score + (right.score - left.score) * ratio;
  }

  return null;
}

export function calculateCheckInScore(checkIn) {
  const source = checkIn && typeof checkIn === "object" ? checkIn : null;

  if (!source) {
    return null;
  }

  const values = [];

  for (const key of CHECK_IN_KEYS) {
    const numeric = toFiniteNumber(source[key]);

    if (numeric === null) {
      return null;
    }

    values.push(clamp(Math.round(numeric), 1, 5));
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average * 20;
}

export function calculateTodayCapacity({ sleepDurationMinutes, checkIn } = {}) {
  const sleepScore = calculateSleepScore(sleepDurationMinutes);
  const checkInScore = calculateCheckInScore(checkIn);

  if (sleepScore === null || checkInScore === null) {
    return null;
  }

  const raw = sleepScore * 0.75 + checkInScore * 0.25;
  return Math.round(clamp(raw, 0, 100));
}

export function calculateTodayCapacityFromSnapshot({ healthSnapshot, checkIn } = {}) {
  const durationMinutes = healthSnapshot?.health?.mainSleep?.durationMinutes;

  return calculateTodayCapacity({
    sleepDurationMinutes: durationMinutes,
    checkIn,
  });
}

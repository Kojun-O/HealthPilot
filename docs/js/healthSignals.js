// ======================================
// Health Pilot
// Health Signals Foundation v1
// ======================================

function clampScore(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizeDate(value) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeTimeOfDay(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "morning" || normalized === "afternoon" || normalized === "evening") {
    return normalized;
  }

  return "morning";
}

function normalizeWeekday(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return new Date().getDay();
  }

  const rounded = Math.round(number);

  if (rounded < 0 || rounded > 6) {
    return new Date().getDay();
  }

  return rounded;
}

function normalizeStreakDays(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.round(number);
}

/**
 * HealthSignals contract for the AI Insight Engine foundation.
 * All signal scores are normalized to 0-100.
 *
 * signals.sleepScore: Sleep quality/quantity score for last night.
 * signals.recoveryScore: Recovery readiness based on fatigue/body condition.
 * signals.stressLevel: Current stress burden where higher means more stress.
 * signals.activityScore: Daily movement/activity balance score.
 * signals.moodScore: Emotional state score for today.
 * signals.focusLevel: Cognitive focus capacity score for today.
 * signals.hydrationScore: Hydration status score, null when unavailable.
 */
function createHealthSignals(input = {}) {
  const safeInput = input && typeof input === "object" ? input : {};
  const rawSignals = safeInput.signals && typeof safeInput.signals === "object" ? safeInput.signals : {};
  const rawContext = safeInput.context && typeof safeInput.context === "object" ? safeInput.context : {};

  const hydrationRaw = rawSignals.hydrationScore;
  const hydrationScore = hydrationRaw == null ? null : clampScore(hydrationRaw, null);

  return {
    date: normalizeDate(safeInput.date),
    profileId: typeof safeInput.profileId === "string" && safeInput.profileId.trim()
      ? safeInput.profileId
      : "local-user",
    signals: {
      sleepScore: clampScore(rawSignals.sleepScore, 80),
      recoveryScore: clampScore(rawSignals.recoveryScore, 75),
      stressLevel: clampScore(rawSignals.stressLevel, 35),
      activityScore: clampScore(rawSignals.activityScore, 65),
      moodScore: clampScore(rawSignals.moodScore, 70),
      focusLevel: clampScore(rawSignals.focusLevel, 68),
      hydrationScore
    },
    context: {
      timeOfDay: normalizeTimeOfDay(rawContext.timeOfDay),
      weekday: normalizeWeekday(rawContext.weekday),
      recentCompletionRate: clampScore(rawContext.recentCompletionRate, 60),
      streakDays: normalizeStreakDays(rawContext.streakDays)
    }
  };
}

window.HealthSignals = {
  createHealthSignals
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createHealthSignals
  };
}

console.log("Health Signals loaded");

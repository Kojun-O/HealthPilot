// ======================================
// Health Pilot
// Health Data Adapter v0.1
// ======================================

function clampMetric(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

/**
 * @param {Object} rawData
 * @returns {import("./healthEngine.js").DailyCondition}
 */
function normalizeHealthData(rawData = {}) {
  if (rawData == null || typeof rawData !== "object") {
    rawData = {};
  }

  const normalized = {
    sleep: clampMetric(rawData.sleep ?? rawData.sleepScore, 80),
    condition: clampMetric(rawData.condition ?? rawData.recoveryScore, 80),
    stress: clampMetric(rawData.stress ?? rawData.stressLevel, 30),
    exercise: clampMetric(rawData.exercise ?? rawData.energyLevel, 70),
    mood: clampMetric(rawData.mood ?? rawData.focusLevel, 70),
    sleepScore: clampMetric(rawData.sleepScore ?? rawData.sleep, 80),
    recoveryScore: clampMetric(rawData.recoveryScore ?? rawData.condition, 80),
    stressLevel: clampMetric(rawData.stressLevel ?? rawData.stress, 30),
    energyLevel: clampMetric(rawData.energyLevel ?? rawData.exercise, 70),
    focusLevel: clampMetric(rawData.focusLevel ?? rawData.mood, 70),
    bodyCondition: normalizeText(rawData.bodyCondition),
    note: normalizeText(rawData.note)
  };

  return normalized;
}

window.HealthDataAdapter = {
  normalizeHealthData
};

console.log("Health Data Adapter loaded");

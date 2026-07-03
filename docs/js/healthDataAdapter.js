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
    sleepScore: clampMetric(rawData.sleepScore, 80),
    recoveryScore: clampMetric(rawData.recoveryScore, 80),
    stressLevel: clampMetric(rawData.stressLevel, 30),
    energyLevel: clampMetric(rawData.energyLevel, 70),
    focusLevel: clampMetric(rawData.focusLevel, 70),
    bodyCondition: normalizeText(rawData.bodyCondition),
    note: normalizeText(rawData.note)
  };

  return normalized;
}

window.HealthDataAdapter = {
  normalizeHealthData
};

console.log("Health Data Adapter loaded");

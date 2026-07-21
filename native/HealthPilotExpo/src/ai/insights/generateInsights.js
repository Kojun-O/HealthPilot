const SHORT_MAIN_SLEEP_THRESHOLD_MINUTES = 420;
const HIGH_SHORT_MAIN_SLEEP_THRESHOLD_MINUTES = 360;
const LOW_ACTIVITY_THRESHOLD_STEPS = 5000;

function toDurationMinutes(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

function toStepCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

export function generateInsights(normalizedHealthData = {}) {
  const durationMinutes = toDurationMinutes(
    normalizedHealthData?.sleep?.mainSleep?.durationMinutes,
  );
  const stepCount = toStepCount(normalizedHealthData?.activity?.steps);
  const insights = [];

  if (
    durationMinutes !== null &&
    durationMinutes < SHORT_MAIN_SLEEP_THRESHOLD_MINUTES
  ) {
    insights.push({
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity:
        durationMinutes < HIGH_SHORT_MAIN_SLEEP_THRESHOLD_MINUTES
          ? "high"
          : "moderate",
      evidence: {
        durationMinutes,
        thresholdMinutes: SHORT_MAIN_SLEEP_THRESHOLD_MINUTES,
      },
    });
  }

  if (stepCount !== null && stepCount < LOW_ACTIVITY_THRESHOLD_STEPS) {
    insights.push({
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount,
        thresholdSteps: LOW_ACTIVITY_THRESHOLD_STEPS,
      },
    });
  }

  return insights;
}
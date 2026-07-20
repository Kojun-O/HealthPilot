const SHORT_MAIN_SLEEP_THRESHOLD_MINUTES = 420;
const HIGH_SHORT_MAIN_SLEEP_THRESHOLD_MINUTES = 360;

function toDurationMinutes(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

export function generateInsights(normalizedHealthData = {}) {
  const durationMinutes = toDurationMinutes(
    normalizedHealthData?.sleep?.mainSleep?.durationMinutes,
  );

  if (
    durationMinutes === null ||
    durationMinutes >= SHORT_MAIN_SLEEP_THRESHOLD_MINUTES
  ) {
    return [];
  }

  return [
    {
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
    },
  ];
}
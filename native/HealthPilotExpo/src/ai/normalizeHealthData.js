const DEFAULT_NORMALIZED_HEALTH_DATA = Object.freeze({
  sleep: {
    score: null,
  },
  recovery: {
    hrvStatus: "unknown",
    restingHeartRateStatus: "unknown",
  },
  activity: {
    steps: null,
  },
});

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scoreFromSleepHours(sleepHours) {
  const hours = toNumber(sleepHours);

  if (hours === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((hours / 8) * 100)));
}

function statusFromHrv(hrv) {
  const value = toNumber(hrv);

  if (value === null) {
    return "unknown";
  }

  if (value >= 50) {
    return "high";
  }

  if (value <= 25) {
    return "low";
  }

  return "medium";
}

function statusFromRestingHeartRate(restingHeartRate) {
  const value = toNumber(restingHeartRate);

  if (value === null) {
    return "unknown";
  }

  if (value <= 60) {
    return "low";
  }

  if (value <= 70) {
    return "medium";
  }

  return "high";
}

export function normalizeHealthData(sourceHealthData = {}) {
  const sleepScore =
    toNumber(sourceHealthData?.sleep?.score) ??
    scoreFromSleepHours(sourceHealthData.sleepHours);
  const hrvStatus =
    sourceHealthData?.recovery?.hrvStatus ?? statusFromHrv(sourceHealthData.hrv);
  const restingHeartRateStatus =
    sourceHealthData?.recovery?.restingHeartRateStatus ??
    statusFromRestingHeartRate(sourceHealthData.restingHeartRate);
  const steps = toNumber(sourceHealthData?.activity?.steps) ?? toNumber(sourceHealthData.steps);

  return {
    sleep: {
      score: sleepScore ?? DEFAULT_NORMALIZED_HEALTH_DATA.sleep.score,
    },
    recovery: {
      hrvStatus,
      restingHeartRateStatus,
    },
    activity: {
      steps: steps ?? DEFAULT_NORMALIZED_HEALTH_DATA.activity.steps,
    },
  };
}

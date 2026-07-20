const DEFAULT_NORMALIZED_HEALTH_DATA = Object.freeze({
  sleep: {
    mainSleep: null,
    score: null,
  },
  recovery: {
    hrvMs: null,
    restingHeartRateBpm: null,
  },
  activity: {
    steps: null,
  },
  metadata: {
    generatedAt: null,
  },
});

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toDurationMinutes(value) {
  const durationMinutes = toNumber(value);

  if (durationMinutes === null) {
    return null;
  }

  return Math.max(0, Math.round(durationMinutes));
}

function toIsoString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeMainSleep(mainSleep) {
  if (!mainSleep || typeof mainSleep !== "object") {
    return null;
  }

  const startAt = toIsoString(mainSleep.startAt);
  const endAt = toIsoString(mainSleep.endAt);
  const durationMinutes = toDurationMinutes(mainSleep.durationMinutes);

  if (startAt === null && endAt === null && durationMinutes === null) {
    return null;
  }

  return {
    startAt,
    endAt,
    durationMinutes,
  };
}

function scoreFromSleepMinutes(durationMinutes) {
  const minutes = toDurationMinutes(durationMinutes);

  if (minutes === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((minutes / 480) * 100)));
}

export function normalizeHealthData(sourceHealthData = {}) {
  const mainSleep = normalizeMainSleep(
    sourceHealthData?.sleep?.mainSleep ?? sourceHealthData?.mainSleep,
  );
  const sleepScore =
    toNumber(sourceHealthData?.sleep?.score) ??
    scoreFromSleepMinutes(mainSleep?.durationMinutes);
  const hrvMs = toNumber(sourceHealthData?.recovery?.hrvMs) ?? toNumber(sourceHealthData.hrv);
  const restingHeartRateBpm =
    toNumber(sourceHealthData?.recovery?.restingHeartRateBpm) ??
    toNumber(sourceHealthData.restingHeartRate);
  const steps = toNumber(sourceHealthData?.activity?.steps) ?? toNumber(sourceHealthData.steps);
  const generatedAt = new Date().toISOString();

  return {
    sleep: {
      mainSleep,
      score: sleepScore ?? DEFAULT_NORMALIZED_HEALTH_DATA.sleep.score,
    },
    recovery: {
      hrvMs: hrvMs ?? DEFAULT_NORMALIZED_HEALTH_DATA.recovery.hrvMs,
      restingHeartRateBpm:
        restingHeartRateBpm ?? DEFAULT_NORMALIZED_HEALTH_DATA.recovery.restingHeartRateBpm,
    },
    activity: {
      steps: steps ?? DEFAULT_NORMALIZED_HEALTH_DATA.activity.steps,
    },
    metadata: {
      generatedAt,
    },
  };
}

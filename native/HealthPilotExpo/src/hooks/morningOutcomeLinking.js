export function shouldPersistMorningOutcomeLink({ previousRecord, currentDateKey, hasUserCheckInInput }) {
  if (!hasUserCheckInInput || !previousRecord || !currentDateKey) {
    return false;
  }

  return previousRecord?.morningOutcome?.sourceDate !== currentDateKey;
}

function toRoundedNumberOrNull(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric);
}

export function buildMorningOutcome({ currentDateKey, checkInRatings, actualCapacity, previousRecord }) {
  if (!currentDateKey || !checkInRatings || typeof checkInRatings !== "object") {
    return null;
  }

  const normalizedActualCapacity = toRoundedNumberOrNull(actualCapacity);

  if (normalizedActualCapacity === null) {
    return null;
  }

  const prediction = previousRecord?.tomorrowCapacityPrediction;
  const predictedBaseline = toRoundedNumberOrNull(prediction?.baseline);
  const predictedProjected = toRoundedNumberOrNull(prediction?.projected);

  return {
    sourceDate: currentDateKey,
    checkIn: checkInRatings,
    actualCapacity: normalizedActualCapacity,
    predictedBaseline,
    predictedProjected,
    baselineError:
      predictedBaseline === null
        ? null
        : normalizedActualCapacity - predictedBaseline,
    projectedError:
      predictedProjected === null
        ? null
        : normalizedActualCapacity - predictedProjected,
  };
}

function parseDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function toDateKey(value) {
  const parsed = parseDateKey(value);

  if (!parsed) {
    return getTodayDateKey();
  }

  return value;
}

function shiftDateKey(dateKey, offsetDays) {
  const parsed = parseDateKey(toDateKey(dateKey));
  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);
  return parsed.toISOString().slice(0, 10);
}

export function getPreviousDateKey(dateKey) {
  return shiftDateKey(dateKey, -1);
}

export function getNextDateKey(dateKey) {
  return shiftDateKey(dateKey, 1);
}

function toBooleanMap(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce((result, entry) => {
    const [key, flag] = entry;

    if (typeof key === "string" && key.trim()) {
      result[key.trim()] = Boolean(flag);
    }

    return result;
  }, {});
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}

function clampRating(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function toNumber(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric);
}

function toRoundedPositiveNumberOrDefault(value, defaultValue = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return defaultValue;
  }

  return Math.max(0, Math.round(numeric));
}

export function normalizeCheckIn(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    condition: clampRating(source.condition),
    sleep: clampRating(source.sleep),
    focus: clampRating(source.focus),
    mentalSpace: clampRating(source.mentalSpace),
    activity: clampRating(source.activity),
  };
}

export function normalizePresentedMissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((mission) => {
      const id = typeof mission?.id === "string" ? mission.id.trim() : "";
      const title = typeof mission?.title === "string" ? mission.title.trim() : "";

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title,
        expectedImpact: toRoundedPositiveNumberOrDefault(mission?.expectedImpact, 0),
      };
    })
    .filter(Boolean);
}

export function normalizePrediction(value, baseDateKey) {
  const source = value && typeof value === "object" ? value : {};

  return {
    baseline: toNumber(source.baseline),
    projected: toNumber(source.projected),
    completedImpact: toNumber(source.completedImpact),
    delta: toNumber(source.delta),
    targetDate: toDateKey(source.targetDate || getNextDateKey(baseDateKey)),
  };
}

export function normalizeMorningOutcome(value) {
  const source = value && typeof value === "object" ? value : null;

  if (!source) {
    return null;
  }

  return {
    sourceDate: toDateKey(source.sourceDate),
    checkIn: normalizeCheckIn(source.checkIn),
  };
}

export function normalizeDailyRecord(value, dateKey) {
  const source = value && typeof value === "object" ? value : {};
  const normalizedDate = toDateKey(source.date || dateKey);

  return {
    date: normalizedDate,
    healthSnapshot: source.healthSnapshot && typeof source.healthSnapshot === "object"
      ? source.healthSnapshot
      : null,
    checkIn: normalizeCheckIn(source.checkIn),
    presentedMissions: normalizePresentedMissions(source.presentedMissions),
    selectedMissionIds: toStringArray(source.selectedMissionIds),
    missionCompletion: toBooleanMap(source.missionCompletion),
    tomorrowCapacityPrediction: normalizePrediction(source.tomorrowCapacityPrediction, normalizedDate),
    morningOutcome: normalizeMorningOutcome(source.morningOutcome),
  };
}

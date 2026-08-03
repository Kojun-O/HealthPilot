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

function toOptionalNumber(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
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

function toIsoStringOrNull(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
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

export function normalizeCheckInNote(value) {
  const source = value && typeof value === "object" ? value : null;
  const rawText = typeof value === "string"
    ? value
    : typeof source?.text === "string"
      ? source.text
      : "";

  if (!rawText.trim()) {
    return null;
  }

  const createdAt = toIsoStringOrNull(source?.createdAt);
  const updatedAt = toIsoStringOrNull(source?.updatedAt);

  return {
    text: rawText,
    createdAt: createdAt || updatedAt,
    updatedAt: updatedAt || createdAt,
  };
}

export function resolveCheckInNoteForSave(value, previousValue, nowIso = new Date().toISOString()) {
  const next = normalizeCheckInNote(value);

  if (!next) {
    return null;
  }

  const previous = normalizeCheckInNote(previousValue);

  if (!previous) {
    return {
      text: next.text,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  const createdAt = previous.createdAt || previous.updatedAt || nowIso;

  if (previous.text === next.text) {
    return {
      text: next.text,
      createdAt,
      updatedAt: previous.updatedAt || previous.createdAt || nowIso,
    };
  }

  return {
    text: next.text,
    createdAt,
    updatedAt: nowIso,
  };
}

export function normalizeMorningOutcome(value) {
  const source = value && typeof value === "object" ? value : null;

  if (!source) {
    return null;
  }

  const actualCapacity = toOptionalNumber(source.actualCapacity);
  const predictedBaseline = toOptionalNumber(source.predictedBaseline);
  const predictedProjected = toOptionalNumber(source.predictedProjected);

  return {
    sourceDate: toDateKey(source.sourceDate),
    checkIn: normalizeCheckIn(source.checkIn),
    actualCapacity,
    predictedBaseline,
    predictedProjected,
    baselineError: actualCapacity === null || predictedBaseline === null
      ? null
      : actualCapacity - predictedBaseline,
    projectedError: actualCapacity === null || predictedProjected === null
      ? null
      : actualCapacity - predictedProjected,
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
    checkInNote: normalizeCheckInNote(source.checkInNote),
    morningOutcome: normalizeMorningOutcome(source.morningOutcome),
  };
}

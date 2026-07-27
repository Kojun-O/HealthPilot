import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_RECORD_STORAGE_PREFIX = "healthPilot.dailyRecord";

function toDateKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getTodayDateKey();
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

function normalizeCheckIn(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    condition: clampRating(source.condition),
    sleep: clampRating(source.sleep),
    focus: clampRating(source.focus),
    mentalSpace: clampRating(source.mentalSpace),
    activity: clampRating(source.activity),
  };
}

function clampRating(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function normalizePrediction(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    baseline: toNumber(source.baseline),
    projected: toNumber(source.projected),
    completedImpact: toNumber(source.completedImpact),
    delta: toNumber(source.delta),
  };
}

function toNumber(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.round(numeric);
}

function normalizeDailyRecord(value, dateKey) {
  const source = value && typeof value === "object" ? value : {};

  return {
    date: toDateKey(source.date || dateKey),
    healthSnapshot: source.healthSnapshot && typeof source.healthSnapshot === "object"
      ? source.healthSnapshot
      : null,
    checkIn: normalizeCheckIn(source.checkIn),
    selectedMissionIds: toStringArray(source.selectedMissionIds),
    missionCompletion: toBooleanMap(source.missionCompletion),
    tomorrowCapacityPrediction: normalizePrediction(source.tomorrowCapacityPrediction),
  };
}

export function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyRecordStorageKey(dateKey) {
  return `${DAILY_RECORD_STORAGE_PREFIX}:${toDateKey(dateKey)}`;
}

export async function loadDailyRecord(dateKey = getTodayDateKey()) {
  try {
    const key = getDailyRecordStorageKey(dateKey);
    const rawValue = await AsyncStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    const normalized = normalizeDailyRecord(parsed, dateKey);

    if (normalized.date !== toDateKey(dateKey)) {
      return null;
    }

    return normalized;
  } catch (error) {
    console.warn("Failed to load daily record", error);
    return null;
  }
}

export async function saveDailyRecord(dateKey, dailyRecord) {
  const safeDateKey = toDateKey(dateKey);
  const normalized = normalizeDailyRecord(dailyRecord, safeDateKey);
  const key = getDailyRecordStorageKey(safeDateKey);

  try {
    await AsyncStorage.setItem(key, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Failed to save daily record", error);
  }

  return normalized;
}
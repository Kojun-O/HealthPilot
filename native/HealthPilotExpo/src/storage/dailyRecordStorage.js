import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNextDateKey,
  getPreviousDateKey,
  getTodayDateKey,
  normalizeDailyRecord,
  resolveCheckInNoteForSave,
  toDateKey,
} from "./dailyRecordModel";

const DAILY_RECORD_STORAGE_PREFIX = "healthPilot.dailyRecord";

export { getTodayDateKey, getPreviousDateKey, getNextDateKey };

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
  const existingRecord = await loadDailyRecord(safeDateKey);
  const normalized = normalizeDailyRecord(dailyRecord, safeDateKey);
  normalized.checkInNote = resolveCheckInNoteForSave(
    normalized.checkInNote,
    existingRecord?.checkInNote,
  );
  const key = getDailyRecordStorageKey(safeDateKey);

  try {
    await AsyncStorage.setItem(key, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Failed to save daily record", error);
  }

  return normalized;
}
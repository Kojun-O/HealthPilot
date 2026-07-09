import { Platform } from "react-native";
import {
  CategoryValueSleepAnalysis,
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

const EMPTY_HEALTH = Object.freeze({
  sleepHours: null,
  restingHeartRate: null,
  hrv: null,
  steps: null,
  weight: null,
});

const LAST_NIGHT_LOOKBACK_HOURS = 36;
const SLEEP_SESSION_MIN_HOURS = 3;
const SLEEP_SESSION_GAP_MS = 90 * 60 * 1000;

const READ_PERMISSIONS = {
  toRead: [
    "HKCategoryTypeIdentifierSleepAnalysis",
    "HKQuantityTypeIdentifierRestingHeartRate",
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    "HKQuantityTypeIdentifierStepCount",
    "HKQuantityTypeIdentifierBodyMass",
  ],
};

function cloneEmptyHealth() {
  return { ...EMPTY_HEALTH };
}

function normalizeError(error) {
  if (!error) {
    return "Unknown HealthKit error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error.message === "string") {
    return error.message;
  }

  return JSON.stringify(error);
}

export function isPermissionDeniedError(error) {
  return /denied|not authorized|authorization/i.test(normalizeError(error));
}

function isNoDataError(error) {
  return /not available|no data|no samples|not determined|not found/i.test(
    normalizeError(error),
  );
}

function round(value, decimals = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function createSleepWindow() {
  const endDate = new Date();
  const startDate = new Date(
    endDate.getTime() - LAST_NIGHT_LOOKBACK_HOURS * 60 * 60 * 1000,
  );

  return { startDate, endDate };
}

function isAsleepValue(value) {
  return (
    value === CategoryValueSleepAnalysis.asleep ||
    value === CategoryValueSleepAnalysis.asleepUnspecified ||
    value === CategoryValueSleepAnalysis.asleepCore ||
    value === CategoryValueSleepAnalysis.asleepDeep ||
    value === CategoryValueSleepAnalysis.asleepREM
  );
}

function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((left, right) => left.start - right.start);
  const merged = [];

  for (const interval of sorted) {
    const previous = merged[merged.length - 1];

    if (!previous) {
      merged.push({ ...interval });
      continue;
    }

    if (interval.start <= previous.end) {
      previous.end = new Date(Math.max(previous.end.getTime(), interval.end.getTime()));
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

function collapseSleepSessions(intervals) {
  const merged = mergeIntervals(intervals);
  const sessions = [];

  for (const interval of merged) {
    const previous = sessions[sessions.length - 1];

    if (!previous) {
      sessions.push({ ...interval });
      continue;
    }

    if (interval.start.getTime() - previous.end.getTime() <= SLEEP_SESSION_GAP_MS) {
      previous.end = interval.end;
      continue;
    }

    sessions.push({ ...interval });
  }

  return sessions;
}

function getDurationHours(interval) {
  return (interval.end.getTime() - interval.start.getTime()) / (60 * 60 * 1000);
}

function pickLastNightSleepHours(samples) {
  const asleepIntervals = samples
    .filter((sample) => isAsleepValue(sample.value))
    .map((sample) => ({
      start: toDate(sample.startDate),
      end: toDate(sample.endDate),
    }))
    .filter((interval) => interval.start && interval.end && interval.end > interval.start);

  if (asleepIntervals.length === 0) {
    return null;
  }

  const sessions = collapseSleepSessions(asleepIntervals);
  const qualifyingSessions = sessions.filter(
    (session) => getDurationHours(session) >= SLEEP_SESSION_MIN_HOURS,
  );
  const candidates = qualifyingSessions.length > 0 ? qualifyingSessions : sessions;
  const lastSession = candidates[candidates.length - 1];

  return round(getDurationHours(lastSession), 1);
}

async function authorizeHealthKit() {
  return requestAuthorization(READ_PERMISSIONS);
}

async function readMetric(reader) {
  try {
    const value = await reader();

    return {
      value,
      denied: false,
      failed: false,
    };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return {
        value: null,
        denied: true,
        failed: false,
      };
    }

    if (isNoDataError(error)) {
      return {
        value: null,
        denied: false,
        failed: false,
      };
    }

    return {
      value: null,
      denied: false,
      failed: true,
      error: normalizeError(error),
    };
  }
}

async function readSleepHours() {
  const { startDate, endDate } = createSleepWindow();
  const samples = await queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", {
    limit: -1,
    ascending: true,
    filter: {
      date: {
        startDate,
        endDate,
        strictStartDate: false,
        strictEndDate: false,
      },
    },
  });

  return pickLastNightSleepHours(samples);
}

async function readRestingHeartRate() {
  const sample = await getMostRecentQuantitySample(
    "HKQuantityTypeIdentifierRestingHeartRate",
    "count/min",
  );

  return round(sample?.quantity ?? null);
}

async function readHeartRateVariability() {
  const sample = await getMostRecentQuantitySample(
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    "ms",
  );

  return round(sample?.quantity ?? null);
}

async function readTodayStepCount() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await queryStatisticsForQuantity(
    "HKQuantityTypeIdentifierStepCount",
    ["cumulativeSum"],
    {
      unit: "count",
      filter: {
        date: {
          startDate: startOfDay,
          endDate: new Date(),
          strictStartDate: true,
          strictEndDate: false,
        },
      },
    },
  );

  return round(result?.sumQuantity?.quantity ?? null);
}

async function readLatestWeight() {
  const sample = await getMostRecentQuantitySample(
    "HKQuantityTypeIdentifierBodyMass",
    "kg",
  );

  return round(sample?.quantity ?? null, 1);
}

export async function loadAppleHealthSnapshot() {
  const health = cloneEmptyHealth();

  if (Platform.OS !== "ios") {
    return {
      status: "unsupported",
      message: "Apple Health is only available on iPhone.",
      health,
    };
  }

  try {
    if (!isHealthDataAvailable()) {
      return {
        status: "unavailable",
        message: "Apple Health is unavailable on this device.",
        health,
      };
    }

    const authorized = await authorizeHealthKit();

    if (!authorized) {
      return {
        status: "denied",
        message: "Apple Health permission was denied for the requested metrics.",
        health,
      };
    }
  } catch (error) {
    return {
      status: isPermissionDeniedError(error) ? "denied" : "unavailable",
      message: isPermissionDeniedError(error)
        ? "Apple Health permission was denied."
        : normalizeError(error),
      health,
    };
  }

  const [sleepHours, restingHeartRate, hrv, steps, weight] = await Promise.all([
    readMetric(readSleepHours),
    readMetric(readRestingHeartRate),
    readMetric(readHeartRateVariability),
    readMetric(readTodayStepCount),
    readMetric(readLatestWeight),
  ]);

  health.sleepHours = sleepHours.value;
  health.restingHeartRate = restingHeartRate.value;
  health.hrv = hrv.value;
  health.steps = steps.value;
  health.weight = weight.value;

  const results = [sleepHours, restingHeartRate, hrv, steps, weight];
  const denied = results.some((result) => result.denied);
  const failed = results.some((result) => result.failed);
  const anyValue = Object.values(health).some((value) => value !== null);

  if (denied && !anyValue) {
    return {
      status: "denied",
      message: "Apple Health permission was denied for the requested metrics.",
      health,
    };
  }

  if (!anyValue) {
    return {
      status: failed ? "unavailable" : "empty",
      message: failed
        ? "Apple Health data could not be loaded right now."
        : "Apple Health has no data for the requested metrics yet.",
      health,
    };
  }

  return {
    status: denied ? "partial" : "ready",
    message: denied
      ? "Some Apple Health metrics are unavailable."
      : "Apple Health connected.",
    health,
  };
}
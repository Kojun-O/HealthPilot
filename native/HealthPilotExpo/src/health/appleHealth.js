import { Platform } from "react-native";
import {
  CategoryValueSleepAnalysis,
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";
import { pickMainSleep } from "./mainSleep";

const EMPTY_HEALTH = Object.freeze({
  mainSleep: null,
  restingHeartRate: null,
  hrv: null,
  steps: null,
  weight: null,
});

const LAST_NIGHT_LOOKBACK_HOURS = 36;

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

function pickMainSleepFromSamples(samples) {
  const asleepIntervals = samples
    .filter((sample) => isAsleepValue(sample.value))
    .map((sample) => ({
      start: toDate(sample.startDate),
      end: toDate(sample.endDate),
    }))
    .filter((interval) => interval.start && interval.end && interval.end > interval.start);

  return pickMainSleep(asleepIntervals);
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

async function readMainSleep() {
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

  return pickMainSleepFromSamples(samples);
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

  const [mainSleep, restingHeartRate, hrv, steps, weight] = await Promise.all([
    readMetric(readMainSleep),
    readMetric(readRestingHeartRate),
    readMetric(readHeartRateVariability),
    readMetric(readTodayStepCount),
    readMetric(readLatestWeight),
  ]);

  health.mainSleep = mainSleep.value;
  health.restingHeartRate = restingHeartRate.value;
  health.hrv = hrv.value;
  health.steps = steps.value;
  health.weight = weight.value;

  const results = [mainSleep, restingHeartRate, hrv, steps, weight];
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
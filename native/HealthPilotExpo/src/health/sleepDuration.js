import AppleHealthKit from "react-native-health";

const PERMISSIONS = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.SleepAnalysis],
    write: [],
  },
};

const ASLEEP_VALUES = new Set(["ASLEEP", "ASLEEP_CORE", "ASLEEP_DEEP", "ASLEEP_REM", "ASLEEP_UNSPECIFIED"]);

const PERMISSION_DENIED_PATTERNS = [
  "authorization denied",
  "not authorized",
  "permission",
  "health data is unavailable",
  "healthkit not available",
];

function sampleDurationHours(sample) {
  const start = new Date(sample.startDate);
  const end = new Date(sample.endDate);
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
}

export function getLastNightWindow(now = new Date()) {
  const endDate = new Date(now);
  endDate.setHours(12, 0, 0, 0);

  if (now < endDate) {
    endDate.setDate(endDate.getDate() - 1);
  }

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 1);

  return { startDate, endDate };
}

export function authorizeSleepRead() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function readSleepDurationHours(startDate, endDate) {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getSleepSamples(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      (error, samples) => {
        if (error) {
          reject(error);
          return;
        }

        const totalHours = (samples || [])
          .filter((sample) => ASLEEP_VALUES.has(sample.value))
          .reduce((sum, sample) => sum + sampleDurationHours(sample), 0);

        resolve(totalHours);
      }
    );
  });
}

export async function readLastNightSleepDurationHours(now = new Date()) {
  const { startDate, endDate } = getLastNightWindow(now);
  return readSleepDurationHours(startDate, endDate);
}

export function isPermissionDeniedError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return PERMISSION_DENIED_PATTERNS.some((pattern) => message.includes(pattern));
}

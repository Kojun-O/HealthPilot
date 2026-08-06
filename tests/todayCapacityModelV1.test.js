const test = require("node:test");
const assert = require("node:assert/strict");

async function loadCapacityModel() {
  return import("../native/HealthPilotExpo/src/capacity/todayCapacityModelV1.js");
}

function createHealthSnapshot(durationMinutes, steps = null) {
  return {
    status: "ready",
    health: {
      mainSleep: durationMinutes === null
        ? null
        : {
            startAt: "2026-08-05T14:00:00.000Z",
            endAt: "2026-08-05T21:00:00.000Z",
            durationMinutes,
          },
      restingHeartRate: null,
      hrv: null,
      steps,
      weight: null,
    },
  };
}

const DEFAULT_CHECK_IN = Object.freeze({
  condition: 3,
  sleep: 3,
  focus: 3,
  mentalSpace: 3,
  activity: 3,
});

test("calculateSleepScore maps v1 anchor points and interpolation", async () => {
  const { calculateSleepScore } = await loadCapacityModel();

  assert.equal(calculateSleepScore(480), 100);
  assert.equal(calculateSleepScore(450), 95);
  assert.equal(calculateSleepScore(420), 90);
  assert.equal(calculateSleepScore(405), 85);
  assert.equal(calculateSleepScore(390), 80);
  assert.equal(calculateSleepScore(360), 70);
  assert.equal(calculateSleepScore(330), 60);
  assert.equal(calculateSleepScore(300), 50);
  assert.equal(calculateSleepScore(270), 40);
  assert.equal(calculateSleepScore(240), 30);
  assert.equal(calculateSleepScore(239), 30);
  assert.equal(calculateSleepScore(481), 100);
});

test("calculateCheckInScore maps 1-5 ratings to 20-100 and averages correctly", async () => {
  const { calculateCheckInScore } = await loadCapacityModel();

  assert.equal(
    calculateCheckInScore({
      condition: 1,
      sleep: 1,
      focus: 1,
      mentalSpace: 1,
      activity: 1,
    }),
    20,
  );
  assert.equal(
    calculateCheckInScore({
      condition: 3,
      sleep: 3,
      focus: 3,
      mentalSpace: 3,
      activity: 3,
    }),
    60,
  );
  assert.equal(
    calculateCheckInScore({
      condition: 5,
      sleep: 5,
      focus: 5,
      mentalSpace: 5,
      activity: 5,
    }),
    100,
  );
  assert.equal(
    calculateCheckInScore({
      condition: 5,
      sleep: 4,
      focus: 3,
      mentalSpace: 3,
      activity: 2,
    }),
    68,
  );
});

test("calculateTodayCapacity uses v1 weighted formula and rounds to integer", async () => {
  const { calculateTodayCapacity } = await loadCapacityModel();

  const capacity = calculateTodayCapacity({
    sleepDurationMinutes: 390,
    checkIn: {
      condition: 5,
      sleep: 4,
      focus: 3,
      mentalSpace: 3,
      activity: 2,
    },
  });

  assert.equal(capacity, 77);
});

test("capacity recalculates when latest check-in snapshot changes", async () => {
  const { calculateTodayCapacityFromSnapshot } = await loadCapacityModel();

  const healthSnapshot = createHealthSnapshot(390, 5000);
  const first = calculateTodayCapacityFromSnapshot({
    healthSnapshot,
    checkIn: {
      condition: 3,
      sleep: 3,
      focus: 3,
      mentalSpace: 3,
      activity: 3,
    },
  });
  const updated = calculateTodayCapacityFromSnapshot({
    healthSnapshot,
    checkIn: {
      condition: 5,
      sleep: 5,
      focus: 5,
      mentalSpace: 5,
      activity: 5,
    },
  });

  assert.notEqual(first, updated);
  assert.equal(first, 75);
  assert.equal(updated, 85);
});

test("mission completion does not affect capacity", async () => {
  const { calculateTodayCapacityFromSnapshot } = await loadCapacityModel();

  const baseInput = {
    healthSnapshot: createHealthSnapshot(390, 5000),
    checkIn: DEFAULT_CHECK_IN,
  };

  const withoutMissionState = calculateTodayCapacityFromSnapshot(baseInput);
  const withMissionState = calculateTodayCapacityFromSnapshot({
    ...baseInput,
    missionCompletion: {
      mission_a: true,
      mission_b: false,
    },
  });

  assert.equal(withoutMissionState, withMissionState);
});

test("steps changes do not affect capacity", async () => {
  const { calculateTodayCapacityFromSnapshot } = await loadCapacityModel();

  const lowSteps = calculateTodayCapacityFromSnapshot({
    healthSnapshot: createHealthSnapshot(390, 1000),
    checkIn: DEFAULT_CHECK_IN,
  });
  const highSteps = calculateTodayCapacityFromSnapshot({
    healthSnapshot: createHealthSnapshot(390, 15000),
    checkIn: DEFAULT_CHECK_IN,
  });

  assert.equal(lowSteps, highSteps);
});

test("same stored healthSnapshot/checkIn values produce same capacity after reload-like recompute", async () => {
  const { calculateTodayCapacityFromSnapshot } = await loadCapacityModel();

  const persistedSnapshot = createHealthSnapshot(390, 4000);
  const persistedCheckIn = {
    condition: 4,
    sleep: 3,
    focus: 4,
    mentalSpace: 3,
    activity: 3,
  };

  const first = calculateTodayCapacityFromSnapshot({
    healthSnapshot: persistedSnapshot,
    checkIn: persistedCheckIn,
  });
  const reloaded = calculateTodayCapacityFromSnapshot({
    healthSnapshot: persistedSnapshot,
    checkIn: persistedCheckIn,
  });

  assert.equal(first, reloaded);
});

test("missing data does not get silently imputed", async () => {
  const { calculateTodayCapacity, calculateTodayCapacityFromSnapshot } = await loadCapacityModel();

  assert.equal(
    calculateTodayCapacityFromSnapshot({
      healthSnapshot: createHealthSnapshot(null, 3000),
      checkIn: DEFAULT_CHECK_IN,
    }),
    null,
  );

  assert.equal(
    calculateTodayCapacity({
      sleepDurationMinutes: 390,
      checkIn: {
        condition: 3,
        sleep: 3,
        focus: 3,
        mentalSpace: 3,
      },
    }),
    null,
  );
}
);
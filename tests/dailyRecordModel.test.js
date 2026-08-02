const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModel() {
  return import("../native/HealthPilotExpo/src/storage/dailyRecordModel.js");
}

test("normalizeDailyRecord keeps backward compatibility for existing records", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const record = normalizeDailyRecord(
    {
      date: "2026-08-02",
      healthSnapshot: {
        status: "ready",
      },
      checkIn: {
        condition: 4,
        sleep: 2,
        focus: 3,
        mentalSpace: 5,
        activity: 1,
      },
      selectedMissionIds: ["sleep_before_2300", "walk_15min"],
      missionCompletion: {
        sleep_before_2300: true,
        walk_15min: false,
      },
      tomorrowCapacityPrediction: {
        baseline: 61,
        projected: 66,
        completedImpact: 5,
        delta: 5,
      },
    },
    "2026-08-02",
  );

  assert.deepEqual(record.presentedMissions, []);
  assert.equal(record.morningOutcome, null);
  assert.equal(record.tomorrowCapacityPrediction.targetDate, "2026-08-03");
  assert.deepEqual(record.selectedMissionIds, ["sleep_before_2300", "walk_15min"]);
  assert.deepEqual(record.missionCompletion, {
    sleep_before_2300: true,
    walk_15min: false,
  });
});

test("normalizeDailyRecord keeps new presentedMissions and morningOutcome fields", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const record = normalizeDailyRecord(
    {
      date: "2026-08-03",
      presentedMissions: [
        {
          id: "sleep_before_2300",
          title: "23:00までに就寝",
          expectedImpact: 2,
        },
        {
          id: "walk_15min",
          title: "15分歩く",
          expectedImpact: "3",
        },
      ],
      tomorrowCapacityPrediction: {
        baseline: 62,
        projected: 66,
        completedImpact: 4,
        delta: 4,
        targetDate: "2026-08-04",
      },
      morningOutcome: {
        sourceDate: "2026-08-04",
        checkIn: {
          condition: 5,
          sleep: 4,
          focus: 3,
          mentalSpace: 2,
          activity: 1,
        },
      },
    },
    "2026-08-03",
  );

  assert.deepEqual(record.presentedMissions, [
    {
      id: "sleep_before_2300",
      title: "23:00までに就寝",
      expectedImpact: 2,
    },
    {
      id: "walk_15min",
      title: "15分歩く",
      expectedImpact: 3,
    },
  ]);
  assert.equal(record.tomorrowCapacityPrediction.targetDate, "2026-08-04");
  assert.deepEqual(record.morningOutcome, {
    sourceDate: "2026-08-04",
    checkIn: {
      condition: 5,
      sleep: 4,
      focus: 3,
      mentalSpace: 2,
      activity: 1,
    },
  });
});

test("date helpers compute previous and next day keys across boundaries", async () => {
  const { getPreviousDateKey, getNextDateKey } = await loadModel();

  assert.equal(getPreviousDateKey("2026-01-01"), "2025-12-31");
  assert.equal(getNextDateKey("2026-12-31"), "2027-01-01");
});

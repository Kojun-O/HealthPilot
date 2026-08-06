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
  assert.equal(record.checkInNote, null);
  assert.equal(record.morningOutcome, null);
  assert.equal(record.tomorrowCapacityPrediction.targetDate, "2026-08-03");
  assert.deepEqual(record.selectedMissionIds, ["sleep_before_2300", "walk_15min"]);
  assert.deepEqual(record.missionCompletion, {
    sleep_before_2300: true,
    walk_15min: false,
  });
  assert.deepEqual(record.checkInEvents, []);
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
      checkInEvents: [
        {
          timestamp: "2026-08-03T00:02:00.000Z",
          condition: 3,
          sleep: 3,
          focus: 3,
          mentalSpace: 3,
          activity: 3,
        },
        {
          timestamp: "2026-08-03T04:14:00.000Z",
          condition: 4,
          sleep: 4,
          focus: 3,
          mentalSpace: 2,
          activity: 4,
        },
      ],
      checkInNote: {
        text: "午後に不安感が強い",
        createdAt: "2026-08-03T02:15:00.000Z",
        updatedAt: "2026-08-03T04:40:00.000Z",
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
        actualCapacity: 64,
        predictedBaseline: 62,
        predictedProjected: 66,
        baselineError: 2,
        projectedError: -2,
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
  assert.deepEqual(record.checkInNote, {
    text: "午後に不安感が強い",
    createdAt: "2026-08-03T02:15:00.000Z",
    updatedAt: "2026-08-03T04:40:00.000Z",
  });
  assert.equal(record.tomorrowCapacityPrediction.targetDate, "2026-08-04");
  assert.deepEqual(record.checkInEvents, [
    {
      timestamp: "2026-08-03T00:02:00.000Z",
      condition: 3,
      sleep: 3,
      focus: 3,
      mentalSpace: 3,
      activity: 3,
    },
    {
      timestamp: "2026-08-03T04:14:00.000Z",
      condition: 4,
      sleep: 4,
      focus: 3,
      mentalSpace: 2,
      activity: 4,
    },
  ]);
  assert.deepEqual(record.morningOutcome, {
    sourceDate: "2026-08-04",
    checkIn: {
      condition: 5,
      sleep: 4,
      focus: 3,
      mentalSpace: 2,
      activity: 1,
    },
    actualCapacity: 64,
    predictedBaseline: 62,
    predictedProjected: 66,
    baselineError: 2,
    projectedError: -2,
  });
});

test("normalizeDailyRecord keeps backward compatibility for legacy morningOutcome shape", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const record = normalizeDailyRecord(
    {
      date: "2026-08-03",
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

  assert.deepEqual(record.morningOutcome, {
    sourceDate: "2026-08-04",
    checkIn: {
      condition: 5,
      sleep: 4,
      focus: 3,
      mentalSpace: 2,
      activity: 1,
    },
    actualCapacity: null,
    predictedBaseline: null,
    predictedProjected: null,
    baselineError: null,
    projectedError: null,
  });
});

test("date helpers compute previous and next day keys across boundaries", async () => {
  const { getPreviousDateKey, getNextDateKey } = await loadModel();

  assert.equal(getPreviousDateKey("2026-03-01"), "2026-02-28");
  assert.equal(getNextDateKey("2026-08-31"), "2026-09-01");
  assert.equal(getPreviousDateKey("2026-01-01"), "2025-12-31");
  assert.equal(getNextDateKey("2026-12-31"), "2027-01-01");
});

test("getTodayDateKey returns local YYYY-MM-DD for early JST times", async () => {
  const { getTodayDateKey } = await loadModel();

  const justAfterMidnightJst = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 4,
    toISOString: () => {
      throw new Error("getTodayDateKey must not use toISOString");
    },
  };
  const beforeNineAmJst = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 4,
    toISOString: () => {
      throw new Error("getTodayDateKey must not use toISOString");
    },
  };

  assert.equal(getTodayDateKey(justAfterMidnightJst), "2026-08-04");
  assert.equal(getTodayDateKey(beforeNineAmJst), "2026-08-04");
});

test("normalizeDailyRecord treats empty checkInNote text as null", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const record = normalizeDailyRecord(
    {
      date: "2026-08-03",
      checkInNote: {
        text: "   ",
        createdAt: "2026-08-03T02:15:00.000Z",
        updatedAt: "2026-08-03T04:40:00.000Z",
      },
    },
    "2026-08-03",
  );

  assert.equal(record.checkInNote, null);
});

test("normalizeDailyRecord restores latest checkIn from latest checkInEvent when legacy checkIn is missing", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const record = normalizeDailyRecord(
    {
      date: "2026-08-03",
      checkInEvents: [
        {
          timestamp: "2026-08-03T04:14:00.000Z",
          condition: 4,
          sleep: 4,
          focus: 3,
          mentalSpace: 2,
          activity: 4,
        },
        {
          timestamp: "2026-08-03T00:02:00.000Z",
          condition: 3,
          sleep: 3,
          focus: 3,
          mentalSpace: 3,
          activity: 3,
        },
      ],
    },
    "2026-08-03",
  );

  assert.deepEqual(record.checkIn, {
    condition: 4,
    sleep: 4,
    focus: 3,
    mentalSpace: 2,
    activity: 4,
  });
  assert.equal(record.checkInEvents.length, 2);
  assert.equal(record.checkInEvents[0].timestamp, "2026-08-03T00:02:00.000Z");
  assert.equal(record.checkInEvents[1].timestamp, "2026-08-03T04:14:00.000Z");
});

test("appendCheckInEvent appends new events and skips duplicate timestamp events", async () => {
  const { appendCheckInEvent } = await loadModel();

  const first = appendCheckInEvent([], {
    timestamp: "2026-08-03T00:02:00.000Z",
    condition: 3,
    sleep: 3,
    focus: 3,
    mentalSpace: 3,
    activity: 3,
  });

  const second = appendCheckInEvent(first, {
    timestamp: "2026-08-03T04:14:00.000Z",
    condition: 4,
    sleep: 4,
    focus: 3,
    mentalSpace: 2,
    activity: 4,
  });

  const duplicate = appendCheckInEvent(second, {
    timestamp: "2026-08-03T04:14:00.000Z",
    condition: 1,
    sleep: 1,
    focus: 1,
    mentalSpace: 1,
    activity: 1,
  });

  assert.equal(first.length, 1);
  assert.equal(second.length, 2);
  assert.equal(duplicate.length, 2);
});

test("normalizeDailyRecord keeps checkIn event history separated by dateKey", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const dayOne = normalizeDailyRecord(
    {
      date: "2026-08-03",
      checkInEvents: [
        {
          timestamp: "2026-08-03T00:02:00.000Z",
          condition: 3,
          sleep: 3,
          focus: 3,
          mentalSpace: 3,
          activity: 3,
        },
      ],
    },
    "2026-08-03",
  );

  const dayTwo = normalizeDailyRecord(
    {
      date: "2026-08-04",
      checkInEvents: [
        {
          timestamp: "2026-08-04T12:37:00.000Z",
          condition: 4,
          sleep: 4,
          focus: 4,
          mentalSpace: 4,
          activity: 4,
        },
      ],
    },
    "2026-08-04",
  );

  assert.equal(dayOne.date, "2026-08-03");
  assert.equal(dayTwo.date, "2026-08-04");
  assert.equal(dayOne.checkInEvents[0].timestamp.startsWith("2026-08-03"), true);
  assert.equal(dayTwo.checkInEvents[0].timestamp.startsWith("2026-08-04"), true);
});

test("normalizeDailyRecord preserves multiple checkIn events after serialize and reload", async () => {
  const { normalizeDailyRecord } = await loadModel();

  const firstPass = normalizeDailyRecord(
    {
      date: "2026-08-03",
      checkInEvents: [
        {
          timestamp: "2026-08-03T00:02:00.000Z",
          condition: 3,
          sleep: 3,
          focus: 3,
          mentalSpace: 3,
          activity: 3,
        },
        {
          timestamp: "2026-08-03T04:14:00.000Z",
          condition: 4,
          sleep: 4,
          focus: 3,
          mentalSpace: 2,
          activity: 4,
        },
      ],
    },
    "2026-08-03",
  );

  const serialized = JSON.stringify(firstPass);
  const secondPass = normalizeDailyRecord(JSON.parse(serialized), "2026-08-03");

  assert.equal(secondPass.checkInEvents.length, 2);
  assert.deepEqual(secondPass.checkInEvents, firstPass.checkInEvents);
  assert.deepEqual(secondPass.checkIn, {
    condition: 4,
    sleep: 4,
    focus: 3,
    mentalSpace: 2,
    activity: 4,
  });
});

test("resolveCheckInNoteForSave sets createdAt on first non-empty save", async () => {
  const { resolveCheckInNoteForSave } = await loadModel();
  const nowIso = "2026-08-03T05:00:00.000Z";

  const note = resolveCheckInNoteForSave("午後は頭痛あり", null, nowIso);

  assert.deepEqual(note, {
    text: "午後は頭痛あり",
    createdAt: nowIso,
    updatedAt: nowIso,
  });
});

test("resolveCheckInNoteForSave keeps createdAt and updates updatedAt only when text changes", async () => {
  const { resolveCheckInNoteForSave } = await loadModel();

  const previous = {
    text: "午後は頭痛あり",
    createdAt: "2026-08-03T05:00:00.000Z",
    updatedAt: "2026-08-03T05:00:00.000Z",
  };

  const unchanged = resolveCheckInNoteForSave(
    "午後は頭痛あり",
    previous,
    "2026-08-03T06:00:00.000Z",
  );

  assert.deepEqual(unchanged, previous);

  const changed = resolveCheckInNoteForSave(
    "午後は頭痛なし",
    previous,
    "2026-08-03T06:00:00.000Z",
  );

  assert.deepEqual(changed, {
    text: "午後は頭痛なし",
    createdAt: "2026-08-03T05:00:00.000Z",
    updatedAt: "2026-08-03T06:00:00.000Z",
  });
});

test("resolveCheckInNoteForSave returns null for empty text", async () => {
  const { resolveCheckInNoteForSave } = await loadModel();

  const previous = {
    text: "午後は頭痛あり",
    createdAt: "2026-08-03T05:00:00.000Z",
    updatedAt: "2026-08-03T05:00:00.000Z",
  };

  const cleared = resolveCheckInNoteForSave("", previous, "2026-08-03T06:00:00.000Z");

  assert.equal(cleared, null);
});

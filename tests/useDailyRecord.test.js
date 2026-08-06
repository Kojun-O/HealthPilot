const test = require("node:test");
const assert = require("node:assert/strict");

async function loadHookModule() {
  return import("../native/HealthPilotExpo/src/hooks/morningOutcomeLinking.js");
}

async function loadDailyRecordHookModule() {
  return import("../native/HealthPilotExpo/src/hooks/dailyRecordPersistence.js");
}

async function loadDailyMissionSelectionModule() {
  return import("../native/HealthPilotExpo/src/hooks/dailyMissionSelection.js");
}

function createMission(definitionId, expectedImpact = 1) {
  return {
    definitionId,
    title: definitionId,
    expectedImpact,
    confidence: "Medium",
    why: "",
    sourceInsightIds: [],
  };
}

test("shouldPersistMorningOutcomeLink returns false when user has not provided check-in input", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: false,
  });

  assert.equal(canPersist, false);
});

test("shouldPersistMorningOutcomeLink returns true once when prior day has no current sourceDate", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
      morningOutcome: null,
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: true,
  });

  assert.equal(canPersist, true);
});

test("shouldPersistMorningOutcomeLink returns false after same-day sourceDate already exists", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
      morningOutcome: {
        sourceDate: "2026-08-02",
        checkIn: {
          condition: 4,
          sleep: 3,
          focus: 4,
          mentalSpace: 3,
          activity: 2,
        },
      },
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: true,
  });

  assert.equal(canPersist, false);
});

test("buildMorningOutcome returns null when actualCapacity is not a finite number", async () => {
  const { buildMorningOutcome } = await loadHookModule();

  const outcome = buildMorningOutcome({
    previousRecord: {
      tomorrowCapacityPrediction: {
        baseline: 60,
        projected: 65,
      },
    },
    currentDateKey: "2026-08-02",
    checkInRatings: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    actualCapacity: "not-a-number",
  });

  assert.equal(outcome, null);
});

test("buildMorningOutcome links previous-day prediction and computes errors", async () => {
  const { buildMorningOutcome } = await loadHookModule();

  const outcome = buildMorningOutcome({
    previousRecord: {
      tomorrowCapacityPrediction: {
        baseline: 60,
        projected: 68,
      },
    },
    currentDateKey: "2026-08-02",
    checkInRatings: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    actualCapacity: 64,
  });

  assert.deepEqual(outcome, {
    sourceDate: "2026-08-02",
    checkIn: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    actualCapacity: 64,
    predictedBaseline: 60,
    predictedProjected: 68,
    baselineError: 4,
    projectedError: -4,
  });
});

test("buildMorningOutcome remains compatible when previous-day prediction is missing", async () => {
  const { buildMorningOutcome } = await loadHookModule();

  const outcome = buildMorningOutcome({
    previousRecord: {
      date: "2026-08-01",
    },
    currentDateKey: "2026-08-02",
    checkInRatings: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    actualCapacity: 64,
  });

  assert.deepEqual(outcome, {
    sourceDate: "2026-08-02",
    checkIn: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    actualCapacity: 64,
    predictedBaseline: null,
    predictedProjected: null,
    baselineError: null,
    projectedError: null,
  });
});

test("does not build a daily record payload while mission lock IDs are pending", async () => {
  const { buildPersistableDailyRecord } = await loadDailyRecordHookModule();

  const nextRecord = buildPersistableDailyRecord({
    isHydrated: true,
    nextSelectedMissionIds: ["mission_a", "mission_b", "mission_c"],
    currentDateKey: "2026-08-05",
    presentedMissions: [
      { id: "mission_a", title: "mission_a", expectedImpact: 1 },
      { id: "mission_b", title: "mission_b", expectedImpact: 1 },
      { id: "mission_c", title: "mission_c", expectedImpact: 1 },
    ],
    selectedMissionIds: [],
    missionCompletion: {},
    tomorrowCapacityPrediction: {
      baseline: 50,
      projected: 53,
      completedImpact: 3,
      delta: 3,
      targetDate: "2026-08-06",
    },
  });

  assert.equal(nextRecord, null);
});

test("builds a daily record payload after mission lock IDs are committed", async () => {
  const { buildPersistableDailyRecord } = await loadDailyRecordHookModule();

  const nextRecord = buildPersistableDailyRecord({
    isHydrated: true,
    nextSelectedMissionIds: null,
    currentDateKey: "2026-08-05",
    presentedMissions: [
      { id: "mission_a", title: "mission_a", expectedImpact: 1 },
      { id: "mission_b", title: "mission_b", expectedImpact: 2 },
      { id: "mission_c", title: "mission_c", expectedImpact: 3 },
    ],
    selectedMissionIds: ["mission_a", "mission_b", "mission_c"],
    missionCompletion: {
      mission_a: false,
      mission_b: false,
      mission_c: false,
    },
    tomorrowCapacityPrediction: {
      baseline: 50,
      projected: 56,
      completedImpact: 6,
      delta: 6,
      targetDate: "2026-08-06",
    },
  });

  assert.deepEqual(nextRecord.selectedMissionIds, ["mission_a", "mission_b", "mission_c"]);
  assert.deepEqual(
    nextRecord.presentedMissions.map((mission) => mission.id),
    ["mission_a", "mission_b", "mission_c"],
  );
});

test("builds a daily record payload with a committed check-in event", async () => {
  const { buildPersistableDailyRecord } = await loadDailyRecordHookModule();

  const nextRecord = buildPersistableDailyRecord({
    isHydrated: true,
    nextSelectedMissionIds: null,
    currentDateKey: "2026-08-05",
    checkInRatings: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    checkInEvent: {
      timestamp: "2026-08-05T04:14:00.000Z",
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    presentedMissions: [
      { id: "mission_a", title: "mission_a", expectedImpact: 1 },
      { id: "mission_b", title: "mission_b", expectedImpact: 2 },
      { id: "mission_c", title: "mission_c", expectedImpact: 3 },
    ],
    selectedMissionIds: ["mission_a", "mission_b", "mission_c"],
    missionCompletion: {
      mission_a: false,
      mission_b: false,
      mission_c: false,
    },
    tomorrowCapacityPrediction: {
      baseline: 50,
      projected: 56,
      completedImpact: 6,
      delta: 6,
      targetDate: "2026-08-06",
    },
  });

  assert.equal(typeof nextRecord.checkInEvent, "object");
  assert.equal(nextRecord.checkInEvent.timestamp, "2026-08-05T04:14:00.000Z");
  assert.equal(nextRecord.tomorrowCapacityPrediction.baseline, 50);
});

test("same-date live mission changes keep persisted payload pinned to committed mission IDs", async () => {
  const { buildPersistableDailyRecord } = await loadDailyRecordHookModule();
  const {
    getNextSelectedMissionIds,
    resolveDailyMissions,
    resolveDisplayedMissions,
  } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["mission_a", "mission_b", "mission_c"];
  const persistedPresentedMissions = [
    { id: "mission_a", title: "mission_a", expectedImpact: 1 },
    { id: "mission_b", title: "mission_b", expectedImpact: 2 },
    { id: "mission_c", title: "mission_c", expectedImpact: 3 },
  ];
  const changedLiveMissions = [
    createMission("mission_d", 1),
    createMission("mission_e", 1),
    createMission("mission_f", 1),
  ];

  const resolvedMissions = resolveDailyMissions({
    liveMissions: changedLiveMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });
  const displayedMissions = resolveDisplayedMissions({
    isHydrated: true,
    resolvedMissions,
  });
  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: selectedMissionIds,
    resolvedMissions,
  });
  const nextRecord = buildPersistableDailyRecord({
    isHydrated: true,
    nextSelectedMissionIds,
    currentDateKey: "2026-08-05",
    presentedMissions: displayedMissions.map((mission) => ({
      id: mission.definitionId,
      title: mission.title,
      expectedImpact: mission.expectedImpact,
    })),
    selectedMissionIds,
    missionCompletion: {
      mission_a: false,
      mission_b: false,
      mission_c: false,
    },
    tomorrowCapacityPrediction: {
      baseline: 50,
      projected: 56,
      completedImpact: 6,
      delta: 6,
      targetDate: "2026-08-06",
    },
  });

  assert.equal(nextSelectedMissionIds, null);
  assert.deepEqual(
    displayedMissions.map((mission) => mission.definitionId),
    ["mission_a", "mission_b", "mission_c"],
  );
  assert.deepEqual(nextRecord.selectedMissionIds, ["mission_a", "mission_b", "mission_c"]);
  assert.deepEqual(
    nextRecord.presentedMissions.map((mission) => mission.id),
    ["mission_a", "mission_b", "mission_c"],
  );
});

test("mission completion updates persist without changing committed mission IDs", async () => {
  const { buildPersistableDailyRecord } = await loadDailyRecordHookModule();

  const nextRecord = buildPersistableDailyRecord({
    isHydrated: true,
    nextSelectedMissionIds: null,
    currentDateKey: "2026-08-05",
    presentedMissions: [
      { id: "mission_a", title: "mission_a", expectedImpact: 1 },
      { id: "mission_b", title: "mission_b", expectedImpact: 2 },
      { id: "mission_c", title: "mission_c", expectedImpact: 3 },
    ],
    selectedMissionIds: ["mission_a", "mission_b", "mission_c"],
    missionCompletion: {
      mission_a: true,
      mission_b: false,
      mission_c: true,
    },
    tomorrowCapacityPrediction: {
      baseline: 50,
      projected: 54,
      completedImpact: 4,
      delta: 4,
      targetDate: "2026-08-06",
    },
  });

  assert.deepEqual(nextRecord.selectedMissionIds, ["mission_a", "mission_b", "mission_c"]);
  assert.deepEqual(nextRecord.missionCompletion, {
    mission_a: true,
    mission_b: false,
    mission_c: true,
  });
});

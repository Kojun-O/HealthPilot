const test = require("node:test");
const assert = require("node:assert/strict");

const FIXED_MOCK_AI_SELECTION_RESPONSE = Object.freeze({
  selections: [
    {
      missionId: "rest_eyes_closed_15min",
      reason: "睡眠不足の影響を和らげるために、短時間で実行できる回復行動を優先します。",
      expectedImpact: 1,
      confidence: "high",
    },
    {
      missionId: "walk_15min",
      reason: "活動量の不足があるため、短時間で実行可能な歩行を優先します。",
      expectedImpact: 1,
      confidence: "medium",
    },
    {
      missionId: "sleep_before_2300",
      reason: "明日の回復の土台づくりとして就寝時刻の安定を優先します。",
      expectedImpact: 1,
      confidence: "medium",
    },
  ],
  tomorrowCapacityComment: "回復行動と就寝行動を組み合わせることで、明日のCapacity維持を狙います。",
  safetyNote: null,
});

test("buildTodayMissions returns three missions via definition candidates and fallback definitions", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    normalizedHealthData: {
      sleep: {
        mainSleep: {
          durationMinutes: 390,
        },
        score: 60,
      },
      recovery: {
        hrvMs: null,
        restingHeartRateBpm: null,
      },
      activity: {
        steps: null,
      },
    },
  });

  assert.deepEqual(missions, [
    {
      definitionId: "rest_eyes_closed_15min",
      title: "15分、目を閉じて休む",
      expectedImpact: 1,
      confidence: "Medium",
      why: "昨夜の主睡眠が7時間未満だったため",
      sourceInsightIds: ["short_main_sleep"],
    },
    {
      definitionId: "sleep_before_2300",
      title: "23:00までに就寝",
      expectedImpact: 1,
      confidence: "Medium",
      why: "明日の回復に向けて、今夜の睡眠時間を確保するため",
      sourceInsightIds: [],
    },
    {
      definitionId: "walk_after_dinner_10min",
      title: "夕食後に10分歩く",
      expectedImpact: 1,
      confidence: "Medium",
      why: "軽い活動で今日のリズムを整えるため",
      sourceInsightIds: [],
    },
  ]);
  assert.equal(missions.length, 3);
});

test("buildTodayMissions returns three fallback missions when insights are empty", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [],
    normalizedHealthData: {},
  });

  assert.equal(missions.length, 3);
  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["sleep_before_2300", "walk_after_dinner_10min", "no_caffeine_after_1500"],
  );
});

test("buildTodayMissions keeps unique top three when insights include three or more candidates", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
      { id: "short_main_sleep_extra", type: "short_main_sleep" },
      { id: "low_activity_extra", type: "low_activity" },
    ],
    normalizedHealthData: {},
  });

  assert.equal(missions.length, 3);
  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
  assert.equal(new Set(missions.map((mission) => mission.definitionId)).size, missions.length);
});

test("buildTodayMissions sends AI selection request contract and applies injected client selections", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  let capturedRequest = null;

  const missions = await buildTodayMissions({
    date: "2026-07-28",
    health: {
      mainSleep: {
        durationMinutes: 390,
      },
      steps: 3000,
    },
    checkIn: {
      energy: 2,
      focus: 3,
      stress: 2,
      mood: 3,
    },
    context: {
      freeText: "午後に集中が切れやすい",
    },
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      selectMissions(request) {
        capturedRequest = request;
        return FIXED_MOCK_AI_SELECTION_RESPONSE;
      },
    },
  });

  assert.ok(capturedRequest);
  assert.equal(capturedRequest.date, "2026-07-28");
  assert.deepEqual(capturedRequest.health, {
    mainSleep: {
      durationMinutes: 390,
    },
    steps: 3000,
  });
  assert.deepEqual(capturedRequest.checkIn, {
    energy: 2,
    focus: 3,
    stress: 2,
    mood: 3,
  });
  assert.deepEqual(capturedRequest.context, {
    freeText: "午後に集中が切れやすい",
  });
  assert.equal(Array.isArray(capturedRequest.insights), true);
  assert.equal(capturedRequest.candidates.length >= 3, true);
  assert.deepEqual(Object.keys(capturedRequest.candidates[0]), [
    "id",
    "title",
    "why",
    "sourceInsightIds",
  ]);

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions uses default AISelectionClient with deterministic candidate-order selection", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions falls back to local selection when AISelectionClient throws", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      selectMissions() {
        throw new Error("mock ai failure");
      },
    },
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions falls back to local selection when AISelectionClient rejects", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      async selectMissions() {
        return Promise.reject(new Error("mock ai rejection"));
      },
    },
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions falls back to local selection when AI response is invalid", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      async selectMissions() {
        return { invalid: true };
      },
    },
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions falls back to local selection when normalized valid selections are zero", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      async selectMissions() {
        return {
          selections: [
            {
              missionId: "missing_candidate_id",
              reason: "invalid id",
              expectedImpact: 1,
              confidence: "high",
            },
          ],
          tomorrowCapacityComment: "",
          safetyNote: null,
        };
      },
    },
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions pads to three missions when AI returns one or two valid selections", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missionsFromTwo = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      async selectMissions() {
        return {
          selections: [
            {
              missionId: "walk_15min",
              reason: "first",
              expectedImpact: 1,
              confidence: "high",
            },
            {
              missionId: "rest_eyes_closed_15min",
              reason: "second",
              expectedImpact: 1,
              confidence: "medium",
            },
          ],
          tomorrowCapacityComment: "",
          safetyNote: null,
        };
      },
    },
  });

  assert.equal(missionsFromTwo.length, 3);
  assert.deepEqual(
    missionsFromTwo.map((mission) => mission.definitionId),
    ["walk_15min", "rest_eyes_closed_15min", "sleep_before_2300"],
  );

  const missionsFromOne = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionClient: {
      async selectMissions() {
        return {
          selections: [
            {
              missionId: "rest_eyes_closed_15min",
              reason: "only one",
              expectedImpact: 1,
              confidence: "high",
            },
          ],
          tomorrowCapacityComment: "",
          safetyNote: null,
        };
      },
    },
  });

  assert.equal(missionsFromOne.length, 3);
  assert.deepEqual(
    missionsFromOne.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

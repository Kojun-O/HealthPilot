const test = require("node:test");
const assert = require("node:assert/strict");

test("buildTodayMissions returns three missions via definition candidates and fallback definitions", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");

  const missions = buildTodayMissions({
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

  const missions = buildTodayMissions({
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

  const missions = buildTodayMissions({
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

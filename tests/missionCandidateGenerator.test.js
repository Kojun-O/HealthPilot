const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModules() {
  const [{ normalizeHealthData }, { generateInsights }, { generateMissionCandidates }, { selectMissions }] =
    await Promise.all([
      import("../native/HealthPilotExpo/src/ai/normalizeHealthData.js"),
      import("../native/HealthPilotExpo/src/ai/insights/generateInsights.js"),
      import("../native/HealthPilotExpo/src/ai/missions/generateMissionCandidates.js"),
      import("../native/HealthPilotExpo/src/ai/missions/selectMissions.js"),
    ]);

  return {
    normalizeHealthData,
    generateInsights,
    generateMissionCandidates,
    selectMissions,
  };
}

test("generateMissionCandidates returns one rest candidate for moderate short_main_sleep", async () => {
  const { generateMissionCandidates } = await loadModules();

  const insights = [
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
  ];

  const candidates = generateMissionCandidates(insights);

  assert.deepEqual(candidates, [
    {
      id: "short-main-sleep-rest",
      sourceInsightIds: ["short_main_sleep"],
      type: "rest",
      title: "昼休みに15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
  ]);
});

test("generateMissionCandidates returns the same candidate for high short_main_sleep", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "high",
      evidence: {
        durationMinutes: 350,
        thresholdMinutes: 420,
      },
    },
  ]);

  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0], {
    id: "short-main-sleep-rest",
    sourceInsightIds: ["short_main_sleep"],
    type: "rest",
    title: "昼休みに15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
  });
});

test("generateMissionCandidates returns one activity candidate for low_activity", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 3000,
        thresholdSteps: 5000,
      },
    },
  ]);

  assert.deepEqual(candidates, [
    {
      id: "low-activity-walk",
      sourceInsightIds: ["low_activity"],
      type: "activity",
      title: "今日は15分だけ外を歩く",
      rationale: "歩数が少なく、活動量が不足しています。",
    },
  ]);
});

test("generateMissionCandidates does not return low_activity mission when low_activity insight is missing", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
    },
  ]);

  assert.equal(candidates.some((candidate) => candidate.id === "low-activity-walk"), false);
});

test("generateMissionCandidates ignores unsupported insights and unsafe inputs", async () => {
  const { generateMissionCandidates } = await loadModules();

  assert.deepEqual(generateMissionCandidates([]), []);
  assert.deepEqual(generateMissionCandidates(null), []);
  assert.deepEqual(generateMissionCandidates(undefined), []);
  assert.deepEqual(generateMissionCandidates({}), []);
  assert.deepEqual(
    generateMissionCandidates([
      null,
      undefined,
      0,
      "short_main_sleep",
      { id: "energy_low", type: "energy_low" },
    ]),
    [],
  );
});

test("generateMissionCandidates deduplicates identical mission candidates and keeps source insight ids", async () => {
  const { generateMissionCandidates } = await loadModules();

  const insights = [
    { id: "sleep_a", type: "short_main_sleep", severity: "moderate" },
    { id: "sleep_b", type: "short_main_sleep", severity: "high" },
    { id: "sleep_a", type: "short_main_sleep", severity: "moderate" },
  ];

  const snapshot = JSON.parse(JSON.stringify(insights));
  const candidates = generateMissionCandidates(insights);

  assert.deepEqual(candidates, [
    {
      id: "short-main-sleep-rest",
      sourceInsightIds: ["sleep_a", "sleep_b"],
      type: "rest",
      title: "昼休みに15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
  ]);
  assert.deepEqual(insights, snapshot);
  assert.deepEqual(insights[0], snapshot[0]);
  assert.deepEqual(insights[1], snapshot[1]);
  assert.deepEqual(insights[2], snapshot[2]);
});

test("generateMissionCandidates returns two candidates from short_main_sleep and low_activity", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 3000,
        thresholdSteps: 5000,
      },
    },
  ]);

  assert.deepEqual(candidates, [
    {
      id: "short-main-sleep-rest",
      sourceInsightIds: ["short_main_sleep"],
      type: "rest",
      title: "昼休みに15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
    {
      id: "low-activity-walk",
      sourceInsightIds: ["low_activity"],
      type: "activity",
      title: "今日は15分だけ外を歩く",
      rationale: "歩数が少なく、活動量が不足しています。",
    },
  ]);
  assert.deepEqual(Object.keys(candidates[1]).sort(), [
    "id",
    "rationale",
    "sourceInsightIds",
    "title",
    "type",
  ]);
});

test("generateInsights output can be passed directly into generateMissionCandidates", async () => {
  const { normalizeHealthData, generateInsights, generateMissionCandidates } = await loadModules();

  const normalizedHealthData = normalizeHealthData({
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: 390,
    },
  });

  const insights = generateInsights(normalizedHealthData);
  const candidates = generateMissionCandidates(insights);

  assert.deepEqual(insights, [
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
  ]);
  assert.deepEqual(candidates, [
    {
      id: "short-main-sleep-rest",
      sourceInsightIds: ["short_main_sleep"],
      type: "rest",
      title: "昼休みに15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
  ]);
});

test("pipeline creates two insights and two candidates, then selectMissions returns the first one", async () => {
  const { normalizeHealthData, generateInsights, generateMissionCandidates, selectMissions } =
    await loadModules();

  const normalizedHealthData = normalizeHealthData({
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: 390,
    },
    steps: 3000,
  });

  const insights = generateInsights(normalizedHealthData);
  const candidates = generateMissionCandidates(insights);
  const selectedMissions = selectMissions(candidates);

  assert.deepEqual(insights, [
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 3000,
        thresholdSteps: 5000,
      },
    },
  ]);
  assert.deepEqual(candidates, [
    {
      id: "short-main-sleep-rest",
      sourceInsightIds: ["short_main_sleep"],
      type: "rest",
      title: "昼休みに15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
    {
      id: "low-activity-walk",
      sourceInsightIds: ["low_activity"],
      type: "activity",
      title: "今日は15分だけ外を歩く",
      rationale: "歩数が少なく、活動量が不足しています。",
    },
  ]);
  assert.deepEqual(selectedMissions, [candidates[0]]);
});
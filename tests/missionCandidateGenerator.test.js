const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModules() {
  const [{ normalizeHealthData }, { generateInsights }, { generateMissionCandidates }] = await Promise.all([
    import("../native/HealthPilotExpo/src/ai/normalizeHealthData.js"),
    import("../native/HealthPilotExpo/src/ai/insights/generateInsights.js"),
    import("../native/HealthPilotExpo/src/ai/missions/generateMissionCandidates.js"),
  ]);

  return {
    normalizeHealthData,
    generateInsights,
    generateMissionCandidates,
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
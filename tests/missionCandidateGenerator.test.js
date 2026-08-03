const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModules() {
  const [
    { normalizeHealthData },
    { generateInsights },
    { generateMissionCandidates, generateFallbackMissionCandidates },
    { selectMissions },
  ] =
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
    generateFallbackMissionCandidates,
    selectMissions,
  };
}

function byId(candidates, id) {
  return candidates.find((candidate) => candidate.id === id) || null;
}

test("generateMissionCandidates returns 5-10 related candidates for short_main_sleep", async () => {
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
  ]);

  assert.equal(candidates.length >= 5 && candidates.length <= 10, true);
  assert.deepEqual(
    candidates.slice(0, 3).map((candidate) => candidate.id),
    ["rest_eyes_closed_15min", "sleep_before_2300", "walk_after_dinner_10min"],
  );

  const rest = byId(candidates, "rest_eyes_closed_15min");
  assert.ok(rest);
  assert.equal(rest.type, "rest");
  assert.equal(rest.expectedImpact, 1);
  assert.equal(rest.estimatedDurationMinutes, 15);
  assert.deepEqual(rest.sourceInsightIds, ["short_main_sleep"]);
});

test("generateMissionCandidates returns 5-10 related candidates for low_activity", async () => {
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

  assert.equal(candidates.length >= 5 && candidates.length <= 10, true);
  assert.deepEqual(
    candidates.slice(0, 2).map((candidate) => candidate.id),
    ["walk_15min", "walk_after_dinner_10min"],
  );

  const walk = byId(candidates, "walk_15min");
  assert.ok(walk);
  assert.equal(walk.type, "activity");
  assert.equal(walk.expectedImpact, 1);
  assert.equal(walk.estimatedDurationMinutes, 15);
  assert.deepEqual(walk.sourceInsightIds, ["low_activity"]);
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

test("generateMissionCandidates deduplicates IDs and merges sourceInsightIds across insights", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    { id: "sleep_a", type: "short_main_sleep", severity: "moderate" },
    { id: "activity_b", type: "low_activity", severity: "moderate" },
  ]);

  assert.equal(candidates.length > 2, true);
  assert.equal(new Set(candidates.map((candidate) => candidate.id)).size, candidates.length);

  const shared = byId(candidates, "walk_after_dinner_10min");
  assert.ok(shared);
  assert.deepEqual(shared.sourceInsightIds, ["sleep_a", "activity_b"]);
});

test("generateMissionCandidates keeps candidate schema compatible and includes expectedImpact", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    { id: "short_main_sleep", type: "short_main_sleep" },
    { id: "low_activity", type: "low_activity" },
  ]);

  const sample = byId(candidates, "walk_15min");
  assert.ok(sample);
  assert.deepEqual(Object.keys(sample).sort(), [
    "estimatedDurationMinutes",
    "expectedImpact",
    "id",
    "rationale",
    "sourceInsightIds",
    "title",
    "type",
  ]);
  assert.equal(Number.isInteger(sample.expectedImpact), true);
  assert.equal(sample.expectedImpact >= 1 && sample.expectedImpact <= 3, true);
});

test("generateMissionCandidates preserves zero duration for constraint missions", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    { id: "short_main_sleep", type: "short_main_sleep" },
  ]);

  const sleepBefore2300 = byId(candidates, "sleep_before_2300");
  const noCaffeineAfter1500 = byId(candidates, "no_caffeine_after_1500");

  assert.ok(sleepBefore2300);
  assert.ok(noCaffeineAfter1500);
  assert.equal(sleepBefore2300.estimatedDurationMinutes, 0);
  assert.equal(noCaffeineAfter1500.estimatedDurationMinutes, 0);
});

test("generateMissionCandidates uses renamed low_activity mission ID", async () => {
  const { generateMissionCandidates } = await loadModules();

  const candidates = generateMissionCandidates([
    { id: "low_activity", type: "low_activity" },
  ]);

  const march = byId(candidates, "march_in_place_5min_easy");
  const oldStairs = byId(candidates, "stairs_5min_easy_pace");

  assert.ok(march);
  assert.equal(march.title, "その場で5分のやさしい足踏み");
  assert.equal(oldStairs, null);
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
  assert.equal(candidates.length >= 5 && candidates.length <= 10, true);
  assert.equal(candidates[0].id, "rest_eyes_closed_15min");
});

test("pipeline keeps top-three selection compatible when two insights are present", async () => {
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

  assert.deepEqual(
    selectedMissions.map((candidate) => candidate.id),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("generateFallbackMissionCandidates is sourced from library IDs and excludes existing", async () => {
  const { generateFallbackMissionCandidates } = await loadModules();

  const fallback = generateFallbackMissionCandidates([
    {
      id: "walk_after_dinner_10min",
      sourceInsightIds: ["low_activity"],
      type: "activity",
      title: "夕食後に10分歩く",
      rationale: "軽い活動で今日のリズムを整えるため",
      expectedImpact: 1,
      estimatedDurationMinutes: 10,
    },
  ]);

  assert.deepEqual(
    fallback.map((candidate) => candidate.id),
    ["sleep_before_2300", "no_caffeine_after_1500"],
  );
  assert.equal(new Set(fallback.map((candidate) => candidate.id)).size, fallback.length);
});

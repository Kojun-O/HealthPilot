const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModules() {
  const [
    { normalizeHealthData },
    { generateInsights },
    { generateMissionCandidates },
    { selectMissions },
  ] = await Promise.all([
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

test("selectMissions returns one candidate when input has one candidate", async () => {
  const { selectMissions } = await loadModules();
  const candidate = {
    id: "short-main-sleep-rest",
    sourceInsightIds: ["short_main_sleep"],
    type: "rest",
    title: "昼休みに15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
  };

  const selected = selectMissions([candidate]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0], candidate);
});

test("selectMissions returns only the first candidate when input has multiple candidates", async () => {
  const { selectMissions } = await loadModules();
  const first = {
    id: "short-main-sleep-rest",
    sourceInsightIds: ["short_main_sleep"],
    type: "rest",
    title: "昼休みに15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
  };
  const second = {
    id: "hydrate-water",
    sourceInsightIds: ["hydration_low"],
    type: "hydration",
    title: "コップ1杯の水を飲む",
    rationale: "水分不足の兆候があるため",
  };

  const selected = selectMissions([first, second]);

  assert.deepEqual(selected, [first]);
  assert.equal(selected[0], first);
});

test("selectMissions returns empty array for empty or invalid inputs", async () => {
  const { selectMissions } = await loadModules();

  assert.deepEqual(selectMissions([]), []);
  assert.deepEqual(selectMissions(null), []);
  assert.deepEqual(selectMissions(undefined), []);
  assert.deepEqual(selectMissions({}), []);
  assert.deepEqual(selectMissions("not-array"), []);
  assert.deepEqual(selectMissions(123), []);
});

test("selectMissions does not mutate input array or candidate objects", async () => {
  const { selectMissions } = await loadModules();
  const first = {
    id: "short-main-sleep-rest",
    sourceInsightIds: ["sleep_a"],
    type: "rest",
    title: "昼休みに15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
  };
  const second = {
    id: "walk-10",
    sourceInsightIds: ["activity_low"],
    type: "activity",
    title: "10分歩く",
    rationale: "活動量を補うため",
  };
  const candidates = [first, second];
  const beforeSnapshot = JSON.parse(JSON.stringify(candidates));

  const selected = selectMissions(candidates);

  assert.deepEqual(candidates, beforeSnapshot);
  assert.deepEqual(first.sourceInsightIds, ["sleep_a"]);
  assert.equal(first.title, "昼休みに15分、目を閉じて休む");
  assert.equal(first.rationale, "昨夜の主睡眠が7時間未満だったため");
  assert.equal(selected[0], first);
});

test("selection pipeline returns moderate short sleep mission for 390-minute main sleep", async () => {
  const {
    normalizeHealthData,
    generateInsights,
    generateMissionCandidates,
    selectMissions,
  } = await loadModules();

  const normalizedHealthData = normalizeHealthData({
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: 390,
    },
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
  assert.equal(selectedMissions.length, 1);
  assert.equal(selectedMissions[0].id, "short-main-sleep-rest");
  assert.equal(selectedMissions[0].title, "昼休みに15分、目を閉じて休む");
  assert.deepEqual(selectedMissions[0].sourceInsightIds, ["short_main_sleep"]);
  assert.equal(selectedMissions[0].rationale, "昨夜の主睡眠が7時間未満だったため");
});
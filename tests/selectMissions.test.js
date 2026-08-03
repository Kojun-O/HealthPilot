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
    id: "rest_eyes_closed_15min",
    sourceInsightIds: ["short_main_sleep"],
    type: "rest",
    title: "15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
    evidenceSummary: "短時間の閉眼休息は、主観的な眠気や疲労感を軽減する可能性があります。",
  };

  const selected = selectMissions([candidate]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0], candidate);
});

test("selectMissions returns candidates up to three when input has multiple candidates", async () => {
  const { selectMissions } = await loadModules();
  const first = {
    id: "rest_eyes_closed_15min",
    sourceInsightIds: ["short_main_sleep"],
    type: "rest",
    title: "15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
    evidenceSummary: "短時間の閉眼休息は、主観的な眠気や疲労感を軽減する可能性があります。",
  };
  const second = {
    id: "hydrate-water",
    sourceInsightIds: ["hydration_low"],
    type: "hydration",
    title: "コップ1杯の水を飲む",
    rationale: "水分不足の兆候があるため",
  };
  const third = {
    id: "sleep-before-2300",
    sourceInsightIds: ["sleep_late"],
    type: "sleep",
    title: "23時までに就寝",
    rationale: "睡眠リズムを整えるため",
  };
  const fourth = {
    id: "no-caffeine-after-1500",
    sourceInsightIds: ["sleep_light"],
    type: "sleep",
    title: "15時以降カフェインなし",
    rationale: "入眠を妨げないため",
  };

  const selected = selectMissions([first, second, third, fourth]);

  assert.deepEqual(selected, [first, second, third]);
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
    id: "rest_eyes_closed_15min",
    sourceInsightIds: ["sleep_a"],
    type: "rest",
    title: "15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
    evidenceSummary: "短時間の閉眼休息は、主観的な眠気や疲労感を軽減する可能性があります。",
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
  assert.equal(first.title, "15分、目を閉じて休む");
  assert.equal(first.rationale, "昨夜の主睡眠が7時間未満だったため");
  assert.equal(
    first.evidenceSummary,
    "短時間の閉眼休息は、主観的な眠気や疲労感を軽減する可能性があります。",
  );
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
  assert.equal(candidates.length >= 5 && candidates.length <= 10, true);
  assert.equal(candidates[0].id, "rest_eyes_closed_15min");
  assert.equal(selectedMissions.length, 3);
  assert.equal(selectedMissions[0].id, "rest_eyes_closed_15min");
  assert.equal(selectedMissions[0].title, "15分、目を閉じて休む");
  assert.deepEqual(selectedMissions[0].sourceInsightIds, ["short_main_sleep"]);
  assert.equal(selectedMissions[0].rationale, "昨夜の主睡眠が7時間未満だったため");
  assert.equal(selectedMissions[0].expectedImpact, 1);
});

test("selectMissions applies AI selections when valid", async () => {
  const { selectMissions } = await loadModules();

  const candidates = [
    {
      id: "rest_eyes_closed_15min",
      sourceInsightIds: ["short_main_sleep"],
      type: "rest",
      title: "15分、目を閉じて休む",
      rationale: "昨夜の主睡眠が7時間未満だったため",
    },
    {
      id: "walk_15min",
      sourceInsightIds: ["low_activity"],
      type: "activity",
      title: "15分歩く",
      rationale: "歩数が少なく、活動量が不足しています。",
    },
    {
      id: "sleep_before_2300",
      sourceInsightIds: [],
      type: "sleep",
      title: "23:00までに就寝",
      rationale: "明日の回復に向けて、今夜の睡眠時間を確保するため",
    },
  ];

  const selected = selectMissions(candidates, {
    aiSelectionResponse: {
      selections: [
        {
          missionId: "walk_15min",
          reason: "最初に軽い活動を優先",
          expectedImpact: 1,
          confidence: "high",
        },
        {
          missionId: "rest_eyes_closed_15min",
          reason: "回復行動を次に優先",
          expectedImpact: 1,
          confidence: "medium",
        },
      ],
      tomorrowCapacityComment: "",
      safetyNote: null,
    },
  });

  assert.deepEqual(
    selected.map((candidate) => candidate.id),
    ["walk_15min", "rest_eyes_closed_15min", "sleep_before_2300"],
  );
});

test("selectMissions filters invalid and duplicate AI selections and limits to three", async () => {
  const { selectMissions } = await loadModules();

  const candidates = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" },
    { id: "d", title: "D" },
  ];

  const selected = selectMissions(candidates, {
    aiSelectionResponse: {
      selections: [
        {
          missionId: "x",
          reason: "存在しないID",
          expectedImpact: 1,
          confidence: "high",
        },
        {
          missionId: "b",
          reason: "B",
          expectedImpact: 1,
          confidence: "high",
        },
        {
          missionId: "b",
          reason: "重複",
          expectedImpact: 2,
          confidence: "low",
        },
        {
          missionId: "a",
          reason: "A",
          expectedImpact: 1,
          confidence: "medium",
        },
        {
          missionId: "c",
          reason: "C",
          expectedImpact: 1,
          confidence: "medium",
        },
        {
          missionId: "d",
          reason: "上限超過",
          expectedImpact: 1,
          confidence: "medium",
        },
      ],
      tomorrowCapacityComment: "",
      safetyNote: null,
    },
  });

  assert.deepEqual(
    selected.map((candidate) => candidate.id),
    ["b", "a", "c"],
  );
});

test("selectMissions falls back to local selection when AI response is invalid or empty", async () => {
  const { selectMissions } = await loadModules();

  const candidates = [
    { id: "first", title: "First" },
    { id: "second", title: "Second" },
    { id: "third", title: "Third" },
    { id: "fourth", title: "Fourth" },
  ];

  assert.deepEqual(
    selectMissions(candidates, { aiSelectionResponse: null }).map((candidate) => candidate.id),
    ["first", "second", "third"],
  );
  assert.deepEqual(
    selectMissions(candidates, {
      aiSelectionResponse: {
        selections: [],
      },
    }).map((candidate) => candidate.id),
    ["first", "second", "third"],
  );
  assert.deepEqual(
    selectMissions(candidates, {
      aiSelectionResponse: {
        selections: [
          {
            missionId: "missing-id",
            reason: "",
            expectedImpact: 0,
            confidence: "medium",
          },
        ],
      },
    }).map((candidate) => candidate.id),
    ["first", "second", "third"],
  );
});

test("selectMissions exposes backend tomorrowCapacityComment on valid selections", async () => {
  const { selectMissions } = await loadModules();

  const candidates = [
    { id: "first", title: "First" },
    { id: "second", title: "Second" },
    { id: "third", title: "Third" },
  ];

  const selected = selectMissions(candidates, {
    aiSelectionResponse: {
      selections: [
        {
          missionId: "second",
          reason: "prioritize second",
          expectedImpact: 1,
          confidence: "high",
        },
      ],
      tomorrowCapacityComment: "backend tomorrow comment",
      safetyNote: null,
    },
  });

  assert.deepEqual(selected.map((candidate) => candidate.id), ["second", "first", "third"]);
  assert.equal(selected.tomorrowCapacityComment, "backend tomorrow comment");
  assert.equal(Object.prototype.propertyIsEnumerable.call(selected, "tomorrowCapacityComment"), false);
});

test("selectMissions accepts id alias for backend selections", async () => {
  const { selectMissions } = await loadModules();

  const candidates = [
    { id: "first", title: "First" },
    { id: "second", title: "Second" },
    { id: "third", title: "Third" },
  ];

  const selected = selectMissions(candidates, {
    aiSelectionResponse: {
      selections: [
        {
          id: "second",
          reason: "id alias",
          expectedImpact: 1,
          confidence: "high",
        },
      ],
      tomorrowCapacityComment: "backend tomorrow comment",
      safetyNote: null,
    },
  });

  assert.deepEqual(selected.map((candidate) => candidate.id), ["second", "first", "third"]);
});
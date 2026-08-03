const test = require("node:test");
const assert = require("node:assert/strict");

test("buildAiSelectionRequest returns minimum contract shape", async () => {
  const { buildAiSelectionRequest } = await import("../native/HealthPilotExpo/src/ai/missions/buildAiSelectionRequest.js");

  const request = buildAiSelectionRequest({
    date: "2026-07-28",
    health: {
      mainSleep: {
        durationMinutes: 390,
      },
    },
    checkIn: {
      energy: 3,
    },
    checkInNote: {
      text: "午後に不安感が強い",
      createdAt: "2026-08-03T03:00:00.000Z",
      updatedAt: "2026-08-03T03:15:00.000Z",
    },
    context: {
      freeText: "今日は集中力が下がり気味",
    },
    insights: [{ id: "short_main_sleep", type: "short_main_sleep" }],
    candidates: [
      {
        id: "rest_eyes_closed_15min",
        title: "15分、目を閉じて休む",
        rationale: "昨夜の主睡眠が7時間未満だったため",
        sourceInsightIds: ["short_main_sleep"],
      },
      {
        id: "",
        title: "invalid",
      },
    ],
  });

  assert.deepEqual(request, {
    date: "2026-07-28",
    health: {
      mainSleep: {
        durationMinutes: 390,
      },
    },
    checkIn: {
      energy: 3,
    },
    context: {
      freeText: "今日は集中力が下がり気味",
    },
    insights: [{ id: "short_main_sleep", type: "short_main_sleep" }],
    candidates: [
      {
        id: "rest_eyes_closed_15min",
        title: "15分、目を閉じて休む",
        why: "昨夜の主睡眠が7時間未満だったため",
        sourceInsightIds: ["short_main_sleep"],
      },
    ],
  });
});

test("normalizeAiSelectionResponse removes missing and duplicate mission IDs and limits to three", async () => {
  const { normalizeAiSelectionResponse } = await import("../native/HealthPilotExpo/src/ai/missions/normalizeAiSelectionResponse.js");

  const candidates = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
    { id: "c", title: "C" },
    { id: "d", title: "D" },
  ];

  const normalized = normalizeAiSelectionResponse(
    {
      selections: [
        {
          missionId: "missing",
          reason: "除外される",
          expectedImpact: 1,
          confidence: "high",
        },
        {
          missionId: "b",
          reason: "Bを優先",
          expectedImpact: "2",
          confidence: "HIGH",
        },
        {
          missionId: "b",
          reason: "重複のため除外",
          expectedImpact: 9,
          confidence: "low",
        },
        {
          missionId: "a",
          reason: null,
          expectedImpact: null,
          confidence: "invalid",
        },
        {
          missionId: "c",
          reason: "C",
          expectedImpact: Number.POSITIVE_INFINITY,
          confidence: "medium",
        },
        {
          missionId: "d",
          reason: "4件目は上限超過",
          expectedImpact: 1,
          confidence: "low",
        },
      ],
      tomorrowCapacityComment: 123,
      safetyNote: "",
    },
    candidates,
  );

  assert.deepEqual(normalized, {
    selections: [
      {
        missionId: "b",
        reason: "Bを優先",
        expectedImpact: 2,
        confidence: "high",
      },
      {
        missionId: "a",
        reason: "",
        expectedImpact: 0,
        confidence: "medium",
      },
      {
        missionId: "c",
        reason: "C",
        expectedImpact: 0,
        confidence: "medium",
      },
    ],
    tomorrowCapacityComment: "",
    safetyNote: null,
  });
});

test("normalizeAiSelectionResponse returns null for invalid response values", async () => {
  const { normalizeAiSelectionResponse } = await import("../native/HealthPilotExpo/src/ai/missions/normalizeAiSelectionResponse.js");

  assert.equal(normalizeAiSelectionResponse(null, []), null);
  assert.equal(normalizeAiSelectionResponse(undefined, []), null);
  assert.equal(normalizeAiSelectionResponse([], []), null);
  assert.equal(normalizeAiSelectionResponse("invalid", []), null);
  assert.equal(normalizeAiSelectionResponse({}, []), null);
  assert.equal(normalizeAiSelectionResponse({ selections: null }, []), null);
});

test("createAiSelectionClient uses HttpAiSelectionTransport by default", async () => {
  const { createAiSelectionClient } = await import("../native/HealthPilotExpo/src/ai/missions/aiSelectionClient.js");
  const { HttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  let called = false;
  const originalSelectMissions = HttpAiSelectionTransport.selectMissions;

  HttpAiSelectionTransport.selectMissions = async () => {
    called = true;
    return {
      selections: [
        {
          missionId: "a",
          reason: "http-default",
          expectedImpact: 1,
          confidence: "medium",
        },
      ],
      tomorrowCapacityComment: "ok",
      safetyNote: null,
    };
  };

  try {
    const client = createAiSelectionClient();
    const response = await client.selectMissions({
      candidates: [{ id: "a", title: "A" }],
    });

    assert.equal(called, true);
    assert.equal(Array.isArray(response.selections), true);
    assert.equal(response.selections[0].missionId, "a");
  } finally {
    HttpAiSelectionTransport.selectMissions = originalSelectMissions;
  }
});

test("createAiSelectionClient supports injected transport", async () => {
  const { createAiSelectionClient } = await import("../native/HealthPilotExpo/src/ai/missions/aiSelectionClient.js");

  const client = createAiSelectionClient({
    transport: {
      async selectMissions() {
        return {
          selections: [
            {
              missionId: "x",
              reason: "from injected transport",
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

  const response = await client.selectMissions({ candidates: [{ id: "x", title: "X" }] });

  assert.deepEqual(response.selections.map((selection) => selection.missionId), ["x"]);
});

test("MockTransport regression: deterministic selection order is preserved when explicitly injected", async () => {
  const { createAiSelectionClient } = await import("../native/HealthPilotExpo/src/ai/missions/aiSelectionClient.js");
  const { MockTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/mockTransport.js"
  );

  const client = createAiSelectionClient({
    transport: MockTransport,
  });

  const response = await client.selectMissions({
    candidates: [
      { id: "first", title: "First" },
      { id: "second", title: "Second" },
      { id: "third", title: "Third" },
      { id: "fourth", title: "Fourth" },
    ],
  });

  assert.deepEqual(
    response.selections.map((selection) => selection.missionId),
    ["first", "second", "third"],
  );
});

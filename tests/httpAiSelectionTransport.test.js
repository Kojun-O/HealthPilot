const test = require("node:test");
const assert = require("node:assert/strict");

test("HttpAiSelectionTransport returns backend JSON on success", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  let capturedUrl = "";
  let capturedOptions = null;

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            selections: [
              {
                missionId: "rest_eyes_closed_15min",
                reason: "ok",
                expectedImpact: 1,
                confidence: "medium",
              },
            ],
            tomorrowCapacityComment: "ok",
            safetyNote: null,
          };
        },
      };
    },
  });

  const response = await transport.selectMissions({ candidates: [{ id: "a", title: "A" }] });

  assert.equal(capturedUrl, "http://backend.local/ai/mission-selection");
  assert.equal(capturedOptions.method, "POST");
  assert.equal(capturedOptions.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(capturedOptions.body), {
    candidates: [{ id: "a", title: "A" }],
  });
  assert.equal(Array.isArray(response.selections), true);
});

test("HttpAiSelectionTransport throws for HTTP 400", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    fetchImpl: async () => ({
      ok: false,
      status: 400,
      async json() {
        return { error: "bad request" };
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 400/);
});

test("HttpAiSelectionTransport throws for HTTP 500", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      async json() {
        return { error: "internal" };
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 500/);
});

test("HttpAiSelectionTransport throws timeout error", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    timeoutMs: 5,
    fetchImpl: async (_url, options) => {
      await new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          const abortedError = new Error("aborted");
          abortedError.name = "AbortError";
          reject(abortedError);
        });
      });

      return {
        ok: true,
        status: 200,
        async json() {
          return {};
        },
      };
    },
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /timed out/);
});

test("HttpAiSelectionTransport throws on JSON parse failure", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        throw new SyntaxError("invalid json");
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /parse JSON/);
});

test("buildTodayMissions falls back to local selection when transport fails", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const failingTransport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionTransport: failingTransport,
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("buildTodayMissions falls back to local selection when transport times out", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const timeoutTransport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    timeoutMs: 5,
    fetchImpl: async (_url, options) => {
      await new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          const abortedError = new Error("aborted");
          abortedError.name = "AbortError";
          reject(abortedError);
        });
      });

      return {
        ok: true,
        status: 200,
        async json() {
          return {};
        },
      };
    },
  });

  const missions = await buildTodayMissions({
    insights: [
      { id: "short_main_sleep", type: "short_main_sleep" },
      { id: "low_activity", type: "low_activity" },
    ],
    normalizedHealthData: {},
    aiSelectionTransport: timeoutTransport,
  });

  assert.deepEqual(
    missions.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

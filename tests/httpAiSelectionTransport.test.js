const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_BACKEND_TOKEN = "app-dev-backend-token";

test("HttpAiSelectionTransport returns backend JSON on success", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  let capturedUrl = "";
  let capturedOptions = null;

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
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
  assert.equal(capturedOptions.headers.Authorization, `Bearer ${TEST_BACKEND_TOKEN}`);
  assert.deepEqual(JSON.parse(capturedOptions.body), {
    candidates: [{ id: "a", title: "A" }],
  });
  assert.equal(Array.isArray(response.selections), true);
});

test("HttpAiSelectionTransport throws for HTTP 401", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      headers: {
        get() {
          return "req-401";
        },
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 401/);
});

test("HttpAiSelectionTransport throws for HTTP 403", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      headers: {
        get() {
          return "req-403";
        },
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 403/);
});

test("HttpAiSelectionTransport throws for HTTP 429", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      headers: {
        get() {
          return "req-429";
        },
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 429/);
});

test("HttpAiSelectionTransport throws for HTTP 413", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
    fetchImpl: async () => ({
      ok: false,
      status: 413,
      headers: {
        get() {
          return "req-413";
        },
      },
    }),
  });

  await assert.rejects(() => transport.selectMissions({ candidates: [] }), /HTTP 413/);
});

test("HttpAiSelectionTransport throws for HTTP 500", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const transport = createHttpAiSelectionTransport({
    missionSelectionUrl: "http://backend.local/ai/mission-selection",
    backendAuthToken: TEST_BACKEND_TOKEN,
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      headers: {
        get() {
          return "req-500";
        },
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
    backendAuthToken: TEST_BACKEND_TOKEN,
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
    backendAuthToken: TEST_BACKEND_TOKEN,
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
    backendAuthToken: TEST_BACKEND_TOKEN,
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
    backendAuthToken: TEST_BACKEND_TOKEN,
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

test("buildTodayMissions falls back to local selection on auth and limit backend errors", async () => {
  const { buildTodayMissions } = await import("../native/HealthPilotExpo/src/ai/missions/buildTodayMissions.js");
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  for (const statusCode of [401, 403, 429, 413]) {
    const failingTransport = createHttpAiSelectionTransport({
      missionSelectionUrl: "http://backend.local/ai/mission-selection",
      backendAuthToken: TEST_BACKEND_TOKEN,
      fetchImpl: async () => ({
        ok: false,
        status: statusCode,
        headers: {
          get() {
            return `req-${statusCode}`;
          },
        },
      }),
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
  }
});

test("HttpAiSelectionTransport throws configuration error when token is missing", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const previousValue = process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN;
  delete process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN;

  try {
    assert.throws(
      () =>
        createHttpAiSelectionTransport({
          missionSelectionUrl: "http://backend.local/ai/mission-selection",
          fetchImpl: async () => ({
            ok: true,
            status: 200,
            async json() {
              return {};
            },
          }),
        }),
      /configuration error/i,
    );
  } finally {
    if (typeof previousValue === "string") {
      process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN = previousValue;
    } else {
      delete process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN;
    }
  }
});

test("HttpAiSelectionTransport configuration error does not leak token value", async () => {
  const { createHttpAiSelectionTransport } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/httpAiSelectionTransport.js"
  );

  const leakedValue = "SHOULD_NOT_APPEAR_IN_ERROR";
  const previousValue = process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN;
  process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN = "   ";

  try {
    assert.throws(() => createHttpAiSelectionTransport(), (error) => {
      assert.equal(typeof error.message, "string");
      assert.equal(error.message.includes(leakedValue), false);
      return /configuration error/i.test(error.message);
    });
  } finally {
    if (typeof previousValue === "string") {
      process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN = previousValue;
    } else {
      delete process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN;
    }
  }
});

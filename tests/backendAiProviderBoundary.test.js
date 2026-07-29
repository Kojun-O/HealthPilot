const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_BACKEND_TOKEN = "test-backend-token";
process.env.HEALTH_PILOT_BACKEND_TOKEN = TEST_BACKEND_TOKEN;

function createAuthHeaders() {
  return {
    Authorization: `Bearer ${TEST_BACKEND_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function startBackendServer(options = {}) {
  const { createBackendServer } = await import("../backend/server.js");
  const server = createBackendServer(options);

  await new Promise((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

test("missionSelectionService creation fails when provider is missing", async () => {
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  assert.throws(() => createMissionSelectionService(), /requires a provider/);
});

test("missionSelectionService creation fails when provider is invalid", async () => {
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  assert.throws(
    () =>
      createMissionSelectionService({
        provider: {},
      }),
    /must implement selectMissions/,
  );
});

test("missionSelectionService calls provider.selectMissions", async () => {
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  const request = {
    candidates: [{ id: "a", title: "A" }],
  };

  const expectedResponse = {
    selections: [],
    tomorrowCapacityComment: "from-provider",
    safetyNote: null,
  };

  const calls = [];
  const service = createMissionSelectionService({
    provider: {
      async selectMissions(receivedRequest) {
        calls.push(receivedRequest);
        return expectedResponse;
      },
    },
  });

  const response = await service.selectMissions(request);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], request);
  assert.deepEqual(response, expectedResponse);
});

test("backend returns provider response on success", async () => {
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  const providerResponse = {
    selections: [
      {
        missionId: "provider-id",
        reason: "from provider",
        expectedImpact: 1,
        confidence: "medium",
      },
    ],
    tomorrowCapacityComment: "provider-comment",
    safetyNote: null,
  };

  const backend = await startBackendServer({
    missionSelectionService: createMissionSelectionService({
      provider: {
        async selectMissions() {
          return providerResponse;
        },
      },
    }),
  });

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        candidates: [{ id: "candidate-id", title: "Candidate" }],
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), providerResponse);
  } finally {
    backend.server.close();
  }
});

test("backend returns 500 when provider throws", async () => {
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  const backend = await startBackendServer({
    missionSelectionService: createMissionSelectionService({
      provider: {
        async selectMissions() {
          throw new Error("provider failed");
        },
      },
    }),
  });

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        candidates: [{ id: "candidate-id", title: "Candidate" }],
      }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: "Internal Server Error",
    });
  } finally {
    backend.server.close();
  }
});

test("backend default startup uses fixed AI provider", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        candidates: [{ id: "fixed-id", title: "Fixed" }],
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      selections: [
        {
          missionId: "fixed-id",
          reason: "固定レスポンスによる選択",
          expectedImpact: 1,
          confidence: "medium",
        },
      ],
      tomorrowCapacityComment: "固定バックエンドレスポンス",
      safetyNote: null,
    });
  } finally {
    backend.server.close();
  }
});

test("fixed AI provider response contract is unchanged", async () => {
  const { createFixedAiProvider } = await import("../backend/ai/providers/fixedAiProvider.js");

  const provider = createFixedAiProvider();

  const payload = await provider.selectMissions({
    candidates: [{ id: "candidate-id", title: "Candidate" }],
  });

  assert.deepEqual(payload, {
    selections: [
      {
        missionId: "candidate-id",
        reason: "固定レスポンスによる選択",
        expectedImpact: 1,
        confidence: "medium",
      },
    ],
    tomorrowCapacityComment: "固定バックエンドレスポンス",
    safetyNote: null,
  });
});

const test = require("node:test");
const assert = require("node:assert/strict");

const TEST_BACKEND_TOKEN = "test-backend-token";

function setEnv(nextValues) {
  const previous = new Map();

  for (const [key, value] of Object.entries(nextValues)) {
    previous.set(key, process.env[key]);

    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const [key, value] of previous.entries()) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

function createAuthHeaders(token = TEST_BACKEND_TOKEN) {
  return {
    Authorization: `Bearer ${token}`,
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

test("provider env unset defaults to fixed provider", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: undefined,
  });

  try {
    const { createConfiguredMissionSelectionService } = await import("../backend/server.js");
    const configured = createConfiguredMissionSelectionService();

    const response = await configured.missionSelectionService.selectMissions({
      candidates: [{ id: "candidate-id", title: "Candidate" }],
    });

    assert.equal(configured.providerName, "fixed");
    assert.equal(response.selections[0].missionId, "candidate-id");
    assert.equal(response.tomorrowCapacityComment, "固定バックエンドレスポンス");
  } finally {
    restore();
  }
});

test("provider env fixed selects FixedAIProvider", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "fixed",
  });

  try {
    const { createConfiguredMissionSelectionService } = await import("../backend/server.js");
    const configured = createConfiguredMissionSelectionService();

    const response = await configured.missionSelectionService.selectMissions({
      candidates: [{ id: "fixed-id", title: "Fixed" }],
    });

    assert.equal(configured.providerName, "fixed");
    assert.equal(response.selections[0].missionId, "fixed-id");
  } finally {
    restore();
  }
});

test("provider env openai selects OpenAIProvider with fake client", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-5-mini",
  });

  try {
    const logs = [];
    const backend = await startBackendServer({
      logger: {
        info(message) {
          logs.push(String(message));
        },
      },
      openAiClientFactory() {
        return {
          async createStructuredResponse() {
            return {
              output: {
                selections: [
                  {
                    missionId: "openai-id",
                    reason: "from-openai",
                    expectedImpact: 2,
                    confidence: "high",
                  },
                ],
                tomorrowCapacityComment: "openai-comment",
                safetyNote: null,
              },
            };
          },
        };
      },
    });

    try {
      const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          candidates: [{ id: "openai-id", title: "OpenAI Candidate" }],
        }),
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        selections: [
          {
            missionId: "openai-id",
            reason: "from-openai",
            expectedImpact: 2,
            confidence: "high",
          },
        ],
        tomorrowCapacityComment: "openai-comment",
        safetyNote: null,
      });

      const joinedLogs = logs.join("\n");
      assert.equal(joinedLogs.includes("provider=openai"), true);
      assert.equal(joinedLogs.includes("provider success"), true);
    } finally {
      backend.server.close();
    }
  } finally {
    restore();
  }
});

test("unknown HEALTH_PILOT_AI_PROVIDER fails backend startup", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "unknown-provider",
  });

  try {
    const { createBackendServer } = await import("../backend/server.js");
    assert.throws(() => createBackendServer(), /HEALTH_PILOT_AI_PROVIDER must be one of: fixed, openai/);
  } finally {
    restore();
  }
});

test("openai provider without OPENAI_API_KEY fails backend startup", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "openai",
    OPENAI_API_KEY: undefined,
  });

  try {
    const { createBackendServer } = await import("../backend/server.js");
    assert.throws(() => createBackendServer(), /OpenAI API key is not configured/);
  } finally {
    restore();
  }
});

test("openai provider errors return HTTP 500 without backend fixed fallback", async () => {
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-5-mini",
  });

  try {
    const logs = [];
    const backend = await startBackendServer({
      logger: {
        info(message) {
          logs.push(String(message));
        },
      },
      openAiClientFactory() {
        return {
          async createStructuredResponse() {
            const error = new Error("rate limit");
            error.status = 429;
            throw error;
          },
        };
      },
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

      const joinedLogs = logs.join("\n");
      assert.equal(joinedLogs.includes("provider=openai"), true);
      assert.equal(joinedLogs.includes("provider fallback"), true);
      assert.equal(joinedLogs.includes("failureCategory="), true);
      assert.equal(joinedLogs.includes("固定バックエンドレスポンス"), false);
    } finally {
      backend.server.close();
    }
  } finally {
    restore();
  }
});

test("openai mode logs do not leak API key, backend token, prompt, or body text", async () => {
  const apiKey = "test-openai-key-secret";
  const secretBodyText = "very-sensitive-health-context";
  const restore = setEnv({
    HEALTH_PILOT_BACKEND_TOKEN: TEST_BACKEND_TOKEN,
    HEALTH_PILOT_AI_PROVIDER: "openai",
    OPENAI_API_KEY: apiKey,
    OPENAI_MODEL: "gpt-5-mini",
  });

  try {
    const logs = [];
    const backend = await startBackendServer({
      logger: {
        info(message) {
          logs.push(String(message));
        },
      },
      openAiClientFactory() {
        return {
          async createStructuredResponse() {
            return {
              output: {
                selections: [
                  {
                    missionId: "candidate-id",
                    reason: "ok",
                    expectedImpact: 1,
                    confidence: "medium",
                  },
                ],
                tomorrowCapacityComment: "ok",
                safetyNote: null,
              },
            };
          },
        };
      },
    });

    try {
      const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          candidates: [{ id: "candidate-id", title: "Candidate" }],
          context: {
            freeText: secretBodyText,
          },
        }),
      });

      assert.equal(response.status, 200);

      const joinedLogs = logs.join("\n");
      assert.equal(joinedLogs.includes(apiKey), false);
      assert.equal(joinedLogs.includes(TEST_BACKEND_TOKEN), false);
      assert.equal(joinedLogs.includes(secretBodyText), false);
      assert.equal(joinedLogs.includes("Authorization"), false);
    } finally {
      backend.server.close();
    }
  } finally {
    restore();
  }
});

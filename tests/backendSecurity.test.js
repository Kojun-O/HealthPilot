const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const TEST_BACKEND_TOKEN = "test-backend-token";
process.env.HEALTH_PILOT_BACKEND_TOKEN = TEST_BACKEND_TOKEN;

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

function createValidBody() {
  return {
    candidates: [{ id: "candidate-id", title: "Candidate" }],
  };
}

test("backend startup fails when HEALTH_PILOT_BACKEND_TOKEN is unset", () => {
  const backendEntryPath = path.resolve(__dirname, "../backend/server.js");

  const result = spawnSync(process.execPath, [backendEntryPath], {
    env: {
      ...process.env,
      HEALTH_PILOT_BACKEND_TOKEN: "",
    },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}${result.stdout}`, /HEALTH_PILOT_BACKEND_TOKEN/);
});

test("backend returns 401 when Authorization header is missing", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createValidBody()),
    });

    assert.equal(response.status, 401);
    assert.equal(response.headers.get("x-request-id")?.length > 0, true);
  } finally {
    backend.server.close();
  }
});

test("backend returns 401 when Authorization header is malformed", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        Authorization: "Token abc",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createValidBody()),
    });

    assert.equal(response.status, 401);
  } finally {
    backend.server.close();
  }
});

test("backend returns 403 when Authorization token does not match", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders("wrong-token"),
      body: JSON.stringify(createValidBody()),
    });

    assert.equal(response.status, 403);
  } finally {
    backend.server.close();
  }
});

test("backend returns 200 when Authorization token matches", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(createValidBody()),
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-request-id")?.length > 0, true);
  } finally {
    backend.server.close();
  }
});

test("backend logger does not include Authorization header or token", async () => {
  const logs = [];
  const logger = {
    info(message) {
      logs.push(String(message));
    },
  };

  const backend = await startBackendServer({ logger });

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        candidates: [{ id: "candidate-id", title: "Candidate" }],
        context: { freeText: "sensitive text" },
      }),
    });

    assert.equal(response.status, 200);

    const joinedLogs = logs.join("\n");

    assert.equal(joinedLogs.includes("Authorization"), false);
    assert.equal(joinedLogs.includes(TEST_BACKEND_TOKEN), false);
    assert.equal(joinedLogs.includes("sensitive text"), false);
  } finally {
    backend.server.close();
  }
});

test("backend returns 429 and Retry-After when rate limit is exceeded", async () => {
  const backend = await startBackendServer();

  try {
    for (let index = 0; index < 10; index += 1) {
      const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(createValidBody()),
      });

      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(createValidBody()),
    });

    assert.equal(limitedResponse.status, 429);
    assert.equal(Number(limitedResponse.headers.get("retry-after")) >= 1, true);
  } finally {
    backend.server.close();
  }
});

test("backend returns 413 when JSON body exceeds 64KB", async () => {
  const backend = await startBackendServer();

  try {
    const oversizedText = "x".repeat(70 * 1024);
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        candidates: [{ id: "candidate-id", title: oversizedText }],
      }),
    });

    assert.equal(response.status, 413);
  } finally {
    backend.server.close();
  }
});

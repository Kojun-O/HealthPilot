const test = require("node:test");
const assert = require("node:assert/strict");

test("backend default listen host is 0.0.0.0 for LAN device access", async () => {
  const { BACKEND_LISTEN_HOST } = await import("../backend/server.js");
  assert.equal(BACKEND_LISTEN_HOST, "0.0.0.0");
});

async function startBackendServer() {
  const { createBackendServer } = await import("../backend/server.js");
  const server = createBackendServer();

  await new Promise((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

test("backend mission selection returns up to 3 deterministic selections", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidates: [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
          { id: "c", title: "C" },
          { id: "d", title: "D" },
        ],
      }),
    });

    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.deepEqual(
      payload.selections.map((selection) => selection.missionId),
      ["a", "b", "c"],
    );
  } finally {
    backend.server.close();
  }
});

test("backend mission selection returns empty selections when candidates are empty", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidates: [],
      }),
    });

    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.deepEqual(payload.selections, []);
    assert.equal(payload.tomorrowCapacityComment, "固定バックエンドレスポンス");
    assert.equal(payload.safetyNote, null);
  } finally {
    backend.server.close();
  }
});

test("backend mission selection deduplicates duplicate mission IDs", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidates: [
          { id: "a", title: "A" },
          { id: "a", title: "A duplicate" },
          { id: "b", title: "B" },
          { id: "c", title: "C" },
        ],
      }),
    });

    assert.equal(response.status, 200);

    const payload = await response.json();

    assert.deepEqual(
      payload.selections.map((selection) => selection.missionId),
      ["a", "b", "c"],
    );
  } finally {
    backend.server.close();
  }
});

test("backend mission selection returns 400 for invalid request", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invalid: true,
      }),
    });

    assert.equal(response.status, 400);

    const payload = await response.json();

    assert.equal(typeof payload.error, "string");
  } finally {
    backend.server.close();
  }
});

test("backend mission selection response contract matches Sprint 36 canonical selections shape", async () => {
  const backend = await startBackendServer();

  try {
    const response = await fetch(`${backend.baseUrl}/ai/mission-selection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidates: [{ id: "candidate-id", title: "Candidate" }],
      }),
    });

    assert.equal(response.status, 200);

    const payload = await response.json();

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
  } finally {
    backend.server.close();
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");

test("buildOpenAiSelectionPrompt returns instructions and bounded input", async () => {
  const { buildOpenAiSelectionPrompt } = await import(
    "../backend/ai/providers/openai/openAiPromptBuilder.js"
  );

  const prompt = buildOpenAiSelectionPrompt({
    date: "2026-07-28",
    health: {
      shouldNotBeForwardedAsWholeObject: true,
    },
    checkIn: {
      energy: 2,
    },
    context: {
      freeText: "今日は頭が重い",
    },
    insights: [{ id: "sleep_short", type: "sleep_short" }],
    candidates: [
      {
        id: "rest_15",
        title: "15分休む",
        why: "主睡眠が短い",
        sourceInsightIds: ["sleep_short"],
      },
      {
        id: "",
        title: "invalid",
      },
    ],
  });

  assert.equal(typeof prompt.instructions, "string");
  assert.equal(prompt.instructions.includes("Select missions only from provided candidates."), true);
  assert.equal(prompt.instructions.includes("Never create new mission text."), true);
  assert.equal(prompt.instructions.includes("Return at most 3 selections."), true);
  assert.equal(prompt.instructions.includes("missionId must exactly match a candidate id"), true);
  assert.equal(prompt.instructions.includes("Treat recommendations as hypotheses"), true);
  assert.equal(prompt.instructions.includes("Build tomorrow, today."), true);
  assert.equal(prompt.instructions.includes("Reduce cognition."), true);
  assert.equal(prompt.instructions.includes("Action first."), true);
  assert.equal(prompt.instructions.includes("People decide."), true);

  assert.deepEqual(prompt.input, {
    date: "2026-07-28",
    checkIn: {
      energy: 2,
    },
    insights: [{ id: "sleep_short", type: "sleep_short" }],
    candidates: [
      {
        id: "rest_15",
        title: "15分休む",
        why: "主睡眠が短い",
        sourceInsightIds: ["sleep_short"],
      },
    ],
  });
});

test("OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA keeps response contract", async () => {
  const { OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA } = await import(
    "../backend/ai/providers/openai/openAiStructuredOutputSchema.js"
  );

  assert.equal(OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.additionalProperties, false);
  assert.deepEqual(OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.required, [
    "selections",
    "tomorrowCapacityComment",
    "safetyNote",
  ]);

  assert.equal(OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties.selections.maxItems, 3);
  assert.deepEqual(
    OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties.selections.items.properties.confidence.enum,
    ["low", "medium", "high"],
  );
  assert.equal(
    OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties.selections.items.properties.expectedImpact.minimum,
    -100,
  );
  assert.equal(
    OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties.selections.items.properties.expectedImpact.maximum,
    100,
  );
  assert.deepEqual(OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties.safetyNote.type, ["string", "null"]);
  assert.equal("selectedMissionIds" in OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA.properties, false);
});

test("createOpenAiProvider returns AI Selection Response from fake structured client", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const calls = [];
  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse(payload) {
        calls.push(payload);
        return {
          output: {
            selections: [
              {
                missionId: "candidate-a",
                reason: "短く実行しやすい",
                expectedImpact: 2,
                confidence: "high",
              },
            ],
            tomorrowCapacityComment: "回復余地あり",
            safetyNote: null,
          },
        };
      },
    },
  });

  const response = await provider.selectMissions({
    date: "2026-07-28",
    candidates: [{ id: "candidate-a", title: "A" }],
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, "gpt-4.1-mini");
  assert.equal(typeof calls[0].instructions, "string");
  assert.equal(Array.isArray(calls[0].input.candidates), true);
  assert.equal(typeof calls[0].schema, "object");

  assert.deepEqual(response, {
    selections: [
      {
        missionId: "candidate-a",
        reason: "短く実行しやすい",
        expectedImpact: 2,
        confidence: "high",
      },
    ],
    tomorrowCapacityComment: "回復余地あり",
    safetyNote: null,
  });
});

test("createOpenAiProvider rejects empty structured output", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        return {
          output: {
            selections: [],
            tomorrowCapacityComment: "",
            safetyNote: null,
          },
        };
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.name, "OpenAiProviderError");
    assert.equal(error?.kind, "invalid structured response");
    return true;
  });
});

test("createOpenAiProvider rejects invalid structured output", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        return {
          output: {
            selections: [{ reason: "id missing", expectedImpact: 1, confidence: "low" }],
            tomorrowCapacityComment: "ok",
            safetyNote: null,
          },
        };
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [{ id: "a", title: "A" }] }), (error) => {
    assert.equal(error?.name, "OpenAiProviderError");
    assert.equal(error?.kind, "invalid structured response");
    return true;
  });
});

test("createOpenAiProvider maps timeout error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        const error = new Error("request timeout");
        error.code = "ETIMEDOUT";
        throw error;
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "timeout");
    return true;
  });
});

test("createOpenAiProvider maps rate limit error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        const error = new Error("rate limit");
        error.status = 429;
        throw error;
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "rate limit");
    return true;
  });
});

test("createOpenAiProvider maps authentication error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        const error = new Error("unauthorized");
        error.status = 401;
        throw error;
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "authentication error");
    return true;
  });
});

test("createOpenAiProvider maps unknown provider error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        throw new Error("unexpected");
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "unknown provider error");
    return true;
  });
});

test("createOpenAiProvider maps configuration error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        const error = new Error("missing api key");
        error.code = "MISSING_API_KEY";
        throw error;
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "configuration error");
    return true;
  });
});

test("createOpenAiProvider maps missing OPENAI_API_KEY from real adapter", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const previousApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const provider = createOpenAiProvider({
    model: "gpt-5-mini",
    client: createOpenAiClient(),
  });

  try {
    await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
      assert.equal(error?.kind, "configuration error");
      return true;
    });
  } finally {
    if (previousApiKey == null) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousApiKey;
    }
  }
});

test("createOpenAiProvider maps refusal to provider error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const provider = createOpenAiProvider({
    model: "gpt-5-mini",
    client: createOpenAiClient({
      sdkClient: {
        responses: {
          async create() {
            return {
              status: "completed",
              output: [
                {
                  content: [
                    {
                      type: "refusal",
                      refusal: "Cannot comply",
                    },
                  ],
                },
              ],
            };
          },
        },
      },
    }),
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "invalid structured response");
    return true;
  });
});

test("createOpenAiProvider maps incomplete response to provider error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const provider = createOpenAiProvider({
    model: "gpt-5-mini",
    client: createOpenAiClient({
      sdkClient: {
        responses: {
          async create() {
            return {
              status: "incomplete",
            };
          },
        },
      },
    }),
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "invalid structured response");
    return true;
  });
});

test("createOpenAiProvider maps upstream unavailable error", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const provider = createOpenAiProvider({
    model: "gpt-4.1-mini",
    client: {
      async createStructuredResponse() {
        const error = new Error("service unavailable");
        error.status = 503;
        throw error;
      },
    },
  });

  await assert.rejects(() => provider.selectMissions({ candidates: [] }), (error) => {
    assert.equal(error?.kind, "upstream unavailable");
    return true;
  });
});

test("createOpenAiProvider requires injected client adapter", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  assert.throws(() => createOpenAiProvider({ model: "gpt-4.1-mini" }), /must implement createStructuredResponse/);
});

test("createOpenAiProvider uses default model constant when model is omitted", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const calls = [];
  const provider = createOpenAiProvider({
    client: {
      async createStructuredResponse(payload) {
        calls.push(payload);
        return {
          output: {
            selections: [
              {
                missionId: "candidate-a",
                reason: "default model",
                expectedImpact: 1,
                confidence: "medium",
              },
            ],
            tomorrowCapacityComment: "ok",
            safetyNote: null,
          },
        };
      },
    },
  });

  await provider.selectMissions({
    candidates: [{ id: "candidate-a", title: "A" }],
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, "gpt-5-mini");
});

test("OpenAI response shape does not leak outside provider boundary", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");
  const { createMissionSelectionService } = await import("../backend/missionSelectionService.js");

  const service = createMissionSelectionService({
    provider: createOpenAiProvider({
      model: "gpt-4.1-mini",
      client: {
        async createStructuredResponse() {
          return {
            response_id: "openai-internal",
            output: {
              selections: [
                {
                  missionId: "candidate-a",
                  reason: "simple",
                  expectedImpact: 1,
                  confidence: "medium",
                },
              ],
              tomorrowCapacityComment: "ok",
              safetyNote: null,
            },
          };
        },
      },
    }),
  });

  const response = await service.selectMissions({
    candidates: [{ id: "candidate-a", title: "A" }],
  });

  assert.equal("response_id" in response, false);
  assert.equal("output" in response, false);
  assert.deepEqual(response, {
    selections: [
      {
        missionId: "candidate-a",
        reason: "simple",
        expectedImpact: 1,
        confidence: "medium",
      },
    ],
    tomorrowCapacityComment: "ok",
    safetyNote: null,
  });
});

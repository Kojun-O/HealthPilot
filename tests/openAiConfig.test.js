const test = require("node:test");
const assert = require("node:assert/strict");

test("getOpenAiModel returns gpt-5-mini when OPENAI_MODEL is unset", async () => {
  const { getOpenAiModel } = await import("../backend/ai/providers/openai/openAiConfig.js");

  const previousModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_MODEL;

  try {
    assert.equal(getOpenAiModel(), "gpt-5-mini");
  } finally {
    if (previousModel == null) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
  }
});

test("getOpenAiModel returns OPENAI_MODEL when provided", async () => {
  const { getOpenAiModel } = await import("../backend/ai/providers/openai/openAiConfig.js");

  const previousModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "gpt-5";

  try {
    assert.equal(getOpenAiModel(), "gpt-5");
  } finally {
    if (previousModel == null) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
  }
});

test("getOpenAiModel returns gpt-5-mini when OPENAI_MODEL is blank", async () => {
  const { getOpenAiModel } = await import("../backend/ai/providers/openai/openAiConfig.js");

  const previousModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "   ";

  try {
    assert.equal(getOpenAiModel(), "gpt-5-mini");
  } finally {
    if (previousModel == null) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
  }
});

test("createOpenAiProvider passes resolved model to adapter", async () => {
  const { createOpenAiProvider } = await import("../backend/ai/providers/openAiProvider.js");

  const previousModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "gpt-5";

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
                reason: "resolved model",
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

  try {
    await provider.selectMissions({
      candidates: [{ id: "candidate-a", title: "A" }],
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, "gpt-5");
  } finally {
    if (previousModel == null) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = previousModel;
    }
  }
});

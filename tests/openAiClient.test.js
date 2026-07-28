const test = require("node:test");
const assert = require("node:assert/strict");

test("createOpenAiClient sends Responses API request with strict json_schema", async () => {
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const calls = [];
  const client = createOpenAiClient({
    timeoutMs: 4321,
    sdkClient: {
      responses: {
        async create(payload) {
          calls.push(payload);
          return {
            status: "completed",
            output_text: JSON.stringify({
              selections: [],
              tomorrowCapacityComment: "ok",
              safetyNote: null,
            }),
          };
        },
      },
    },
  });

  const response = await client.createStructuredResponse({
    model: "gpt-5-mini",
    instructions: "instruction",
    input: { candidates: [{ id: "a" }] },
    schema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, "gpt-5-mini");
  assert.equal(calls[0].instructions, "instruction");
  assert.equal(typeof calls[0].input, "string");
  assert.equal(calls[0].text.format.type, "json_schema");
  assert.equal(calls[0].text.format.name, "health_pilot_mission_selection");
  assert.equal(calls[0].text.format.strict, true);
  assert.equal(typeof calls[0].text.format.schema, "object");

  assert.deepEqual(response, {
    output: {
      selections: [],
      tomorrowCapacityComment: "ok",
      safetyNote: null,
    },
  });
});

test("createOpenAiClient throws REFUSAL when model refuses", async () => {
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const client = createOpenAiClient({
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
                    refusal: "refused",
                  },
                ],
              },
            ],
          };
        },
      },
    },
  });

  await assert.rejects(
    () =>
      client.createStructuredResponse({
        model: "gpt-5-mini",
        instructions: "instruction",
        input: { candidates: [] },
        schema: { type: "object" },
      }),
    (error) => {
      assert.equal(error?.code, "REFUSAL");
      return true;
    },
  );
});

test("createOpenAiClient throws INCOMPLETE_RESPONSE when response is incomplete", async () => {
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const client = createOpenAiClient({
    sdkClient: {
      responses: {
        async create() {
          return {
            status: "incomplete",
          };
        },
      },
    },
  });

  await assert.rejects(
    () =>
      client.createStructuredResponse({
        model: "gpt-5-mini",
        instructions: "instruction",
        input: { candidates: [] },
        schema: { type: "object" },
      }),
    (error) => {
      assert.equal(error?.code, "INCOMPLETE_RESPONSE");
      return true;
    },
  );
});

test("createOpenAiClient throws INVALID_STRUCTURED_RESPONSE for non-json output", async () => {
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const client = createOpenAiClient({
    sdkClient: {
      responses: {
        async create() {
          return {
            status: "completed",
            output_text: "not-json",
          };
        },
      },
    },
  });

  await assert.rejects(
    () =>
      client.createStructuredResponse({
        model: "gpt-5-mini",
        instructions: "instruction",
        input: { candidates: [] },
        schema: { type: "object" },
      }),
    (error) => {
      assert.equal(error?.code, "INVALID_STRUCTURED_RESPONSE");
      return true;
    },
  );
});

test("createOpenAiClient reads API key only from OPENAI_API_KEY", async () => {
  const { createOpenAiClient } = await import("../backend/ai/providers/openai/openAiClient.js");

  const previousApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const client = createOpenAiClient();

  try {
    await assert.rejects(
      () =>
        client.createStructuredResponse({
          model: "gpt-5-mini",
          instructions: "instruction",
          input: { candidates: [] },
          schema: { type: "object" },
        }),
      (error) => {
        assert.equal(error?.code, "MISSING_API_KEY");
        return true;
      },
    );
  } finally {
    if (previousApiKey == null) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousApiKey;
    }
  }
});

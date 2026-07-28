import { OPEN_AI_TIMEOUT_MS, readOpenAiApiKey } from "./openAiConfig.js";

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createRefusalError() {
  const error = new Error("Model refused structured output request");
  error.code = "REFUSAL";
  return error;
}

function createIncompleteError() {
  const error = new Error("OpenAI response is incomplete");
  error.code = "INCOMPLETE_RESPONSE";
  return error;
}

function createInvalidStructuredResponseError(cause) {
  const error = new Error("Invalid structured response payload");
  error.code = "INVALID_STRUCTURED_RESPONSE";
  error.cause = cause;
  return error;
}

function hasRefusal(response) {
  if (safeTrimString(response?.refusal)) {
    return true;
  }

  const outputItems = Array.isArray(response?.output) ? response.output : [];

  for (const item of outputItems) {
    if (item?.type === "refusal") {
      return true;
    }

    const contentItems = Array.isArray(item?.content) ? item.content : [];
    for (const content of contentItems) {
      if (content?.type === "refusal") {
        return true;
      }
    }
  }

  return false;
}

function extractOutputText(response) {
  const text = safeTrimString(response?.output_text);
  if (text) {
    return text;
  }

  const outputItems = Array.isArray(response?.output) ? response.output : [];
  const chunks = [];

  for (const item of outputItems) {
    const contentItems = Array.isArray(item?.content) ? item.content : [];

    for (const content of contentItems) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function parseStructuredOutput(response) {
  if (response?.status === "incomplete") {
    throw createIncompleteError();
  }

  if (hasRefusal(response)) {
    throw createRefusalError();
  }

  const outputText = extractOutputText(response);
  if (!outputText) {
    throw createInvalidStructuredResponseError();
  }

  try {
    const parsed = JSON.parse(outputText);

    if (!isPlainObject(parsed)) {
      throw createInvalidStructuredResponseError();
    }

    return parsed;
  } catch (error) {
    if (error?.code === "INVALID_STRUCTURED_RESPONSE") {
      throw error;
    }

    throw createInvalidStructuredResponseError(error);
  }
}

function createDefaultSdkClient({ timeoutMs }) {
  return async function resolveSdkClient() {
    const apiKey = readOpenAiApiKey();
    const { default: OpenAI } = await import("openai");

    return new OpenAI({
      apiKey,
      timeout: timeoutMs,
    });
  };
}

function buildResponsesPayload({ model, instructions, input, schema }) {
  return {
    model,
    instructions,
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "health_pilot_mission_selection",
        strict: true,
        schema,
      },
    },
  };
}

export function createOpenAiClient({ sdkClient, timeoutMs = OPEN_AI_TIMEOUT_MS } = {}) {
  let client = sdkClient || null;
  const resolveSdkClient = client ? null : createDefaultSdkClient({ timeoutMs });

  return {
    async createStructuredResponse({ model, instructions, input, schema }) {
      if (!client) {
        client = await resolveSdkClient();
      }

      const response = await client.responses.create(
        buildResponsesPayload({ model, instructions, input, schema }),
      );

      return {
        output: parseStructuredOutput(response),
      };
    },
  };
}

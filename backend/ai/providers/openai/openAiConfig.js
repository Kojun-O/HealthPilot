export const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
export const OPEN_AI_TIMEOUT_MS = 15000;

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function readOpenAiApiKey() {
  const apiKey = safeTrimString(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  return apiKey;
}

export function getOpenAiModel() {
  const configuredModel = safeTrimString(process.env.OPENAI_MODEL);
  return configuredModel || DEFAULT_OPENAI_MODEL;
}

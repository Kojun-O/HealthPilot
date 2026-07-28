function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function assertValidOpenAiClientAdapter(client) {
  if (!isPlainObject(client) || typeof client.createStructuredResponse !== "function") {
    throw new TypeError("OpenAI client adapter must implement createStructuredResponse(payload)");
  }
}

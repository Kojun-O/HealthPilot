const OPEN_AI_PROVIDER_ERROR_KINDS = new Set([
  "configuration error",
  "authentication error",
  "timeout",
  "rate limit",
  "invalid structured response",
  "upstream unavailable",
  "unknown provider error",
]);

function normalizedCode(error) {
  return typeof error?.code === "string" ? error.code.toUpperCase() : "";
}

function normalizedMessage(error) {
  return typeof error?.message === "string" ? error.message.toLowerCase() : "";
}

export class OpenAiProviderError extends Error {
  constructor(kind, cause) {
    super(`OpenAI provider error: ${kind}`);
    this.name = "OpenAiProviderError";
    this.kind = kind;
    this.cause = cause;
  }
}

export function createOpenAiProviderError(kind, cause) {
  const safeKind = OPEN_AI_PROVIDER_ERROR_KINDS.has(kind) ? kind : "unknown provider error";
  return new OpenAiProviderError(safeKind, cause);
}

export function mapOpenAiClientError(error) {
  if (error instanceof OpenAiProviderError) {
    return error;
  }

  const code = normalizedCode(error);
  const message = normalizedMessage(error);
  const status = Number.isInteger(error?.status) ? error.status : Number.isInteger(error?.statusCode) ? error.statusCode : null;

  if (
    code.includes("CONFIG") ||
    code.includes("MISSING_API_KEY") ||
    message.includes("configuration") ||
    message.includes("api key")
  ) {
    return createOpenAiProviderError("configuration error", error);
  }

  if (
    status === 401 ||
    status === 403 ||
    code.includes("AUTH") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return createOpenAiProviderError("authentication error", error);
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "ABORT_ERR" ||
    code.includes("TIMEOUT") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return createOpenAiProviderError("timeout", error);
  }

  if (status === 429 || code.includes("RATE_LIMIT") || message.includes("rate limit")) {
    return createOpenAiProviderError("rate limit", error);
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "ECONNRESET" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    code.includes("UPSTREAM") ||
    message.includes("service unavailable")
  ) {
    return createOpenAiProviderError("upstream unavailable", error);
  }

  return createOpenAiProviderError("unknown provider error", error);
}

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

function normalizedName(error) {
  return typeof error?.name === "string" ? error.name.toUpperCase() : "";
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
  const name = normalizedName(error);
  const message = normalizedMessage(error);
  const status = Number.isInteger(error?.status) ? error.status : Number.isInteger(error?.statusCode) ? error.statusCode : null;

  if (code.includes("REFUSAL") || message.includes("refus")) {
    return createOpenAiProviderError("invalid structured response", error);
  }

  if (code.includes("INCOMPLETE") || message.includes("incomplete")) {
    return createOpenAiProviderError("invalid structured response", error);
  }

  if (
    code.includes("CONFIG") ||
    code.includes("MISSING_API_KEY") ||
    name.includes("CONFIG") ||
    message.includes("configuration") ||
    message.includes("api key")
  ) {
    return createOpenAiProviderError("configuration error", error);
  }

  if (
    status === 401 ||
    status === 403 ||
    code.includes("AUTH") ||
    name === "AUTHENTICATIONERROR" ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return createOpenAiProviderError("authentication error", error);
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "ABORT_ERR" ||
    name === "APICONNECTIONTIMEOUTERROR" ||
    code.includes("TIMEOUT") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return createOpenAiProviderError("timeout", error);
  }

  if (status === 429 || code.includes("RATE_LIMIT") || name === "RATELIMITERROR" || message.includes("rate limit")) {
    return createOpenAiProviderError("rate limit", error);
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === "ECONNRESET" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    name === "APICONNECTIONERROR" ||
    code.includes("UPSTREAM") ||
    code.includes("NETWORK") ||
    message.includes("network") ||
    message.includes("service unavailable")
  ) {
    return createOpenAiProviderError("upstream unavailable", error);
  }

  return createOpenAiProviderError("unknown provider error", error);
}

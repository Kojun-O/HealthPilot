import http from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createMissionSelectionService } from "./missionSelectionService.js";
import { isValidAiSelectionRequest } from "./aiSelectionRequestValidator.js";
import { createFixedAiProvider } from "./ai/providers/fixedAiProvider.js";
import { createOpenAiProvider } from "./ai/providers/openAiProvider.js";
import { createOpenAiClient } from "./ai/providers/openai/openAiClient.js";
import { getOpenAiModel, readOpenAiApiKey } from "./ai/providers/openai/openAiConfig.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const MAX_JSON_BODY_BYTES = 64 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_PORT = Number(process.env.PORT || 8787);
const DEFAULT_HOST = process.env.HOST || "0.0.0.0";
const SUPPORTED_AI_PROVIDERS = new Set(["fixed", "openai"]);

export const BACKEND_LISTEN_HOST = DEFAULT_HOST;

class PayloadTooLargeError extends Error {
  constructor(message = "Request entity too large") {
    super(message);
    this.name = "PayloadTooLargeError";
    this.statusCode = 413;
  }
}

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredBackendTokenFromEnv() {
  const backendToken = safeTrimString(process.env.HEALTH_PILOT_BACKEND_TOKEN);

  if (!backendToken) {
    throw new Error("HEALTH_PILOT_BACKEND_TOKEN must be configured before backend startup");
  }

  return backendToken;
}

function parseBearerAuthorizationHeader(headerValue) {
  if (Array.isArray(headerValue)) {
    return { status: "malformed" };
  }

  if (typeof headerValue !== "string" || !headerValue.trim()) {
    return { status: "missing" };
  }

  const match = /^Bearer ([^\s]+)$/.exec(headerValue);

  if (!match) {
    return { status: "malformed" };
  }

  return {
    status: "ok",
    token: match[1],
  };
}

function timingSafeTokenEquals(expectedToken, receivedToken) {
  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const receivedBuffer = Buffer.from(receivedToken, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    const maxLength = Math.max(expectedBuffer.length, receivedBuffer.length, 1);
    const paddedExpected = Buffer.alloc(maxLength);
    const paddedReceived = Buffer.alloc(maxLength);
    expectedBuffer.copy(paddedExpected);
    receivedBuffer.copy(paddedReceived);

    timingSafeEqual(paddedExpected, paddedReceived);
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function createRateLimiter({ maxRequests = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW_MS } = {}) {
  const requestsByIp = new Map();

  return {
    check(ipAddress, nowMs = Date.now()) {
      const normalizedIp = safeTrimString(ipAddress) || "unknown";
      const windowStart = nowMs - windowMs;
      const previousTimestamps = requestsByIp.get(normalizedIp) || [];
      const activeTimestamps = previousTimestamps.filter((timestamp) => timestamp > windowStart);

      if (activeTimestamps.length >= maxRequests) {
        const earliestTimestamp = activeTimestamps[0] || nowMs;
        const retryAfterMs = Math.max(1, windowMs - (nowMs - earliestTimestamp));
        const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
        requestsByIp.set(normalizedIp, activeTimestamps);

        return {
          allowed: false,
          retryAfterSeconds,
        };
      }

      activeTimestamps.push(nowMs);
      requestsByIp.set(normalizedIp, activeTimestamps);

      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    },
  };
}

function readAiProviderFromEnv() {
  const provider = safeTrimString(process.env.HEALTH_PILOT_AI_PROVIDER).toLowerCase();

  if (!provider) {
    return "fixed";
  }

  if (!SUPPORTED_AI_PROVIDERS.has(provider)) {
    throw new Error("HEALTH_PILOT_AI_PROVIDER must be one of: fixed, openai");
  }

  return provider;
}

function readRequiredOpenAiModel() {
  const model = safeTrimString(getOpenAiModel());

  if (!model) {
    throw new Error("OPENAI_MODEL must resolve to a non-empty value when HEALTH_PILOT_AI_PROVIDER=openai");
  }

  return model;
}

export function createConfiguredMissionSelectionService({ openAiClientFactory = createOpenAiClient } = {}) {
  const providerName = readAiProviderFromEnv();

  if (providerName === "fixed") {
    return {
      providerName,
      missionSelectionService: createMissionSelectionService({
        provider: createFixedAiProvider(),
      }),
    };
  }

  if (providerName === "openai") {
    readOpenAiApiKey();
    const model = readRequiredOpenAiModel();
    const client = openAiClientFactory();

    return {
      providerName,
      missionSelectionService: createMissionSelectionService({
        provider: createOpenAiProvider({ client, model }),
      }),
    };
  }

  throw new Error("Unsupported HEALTH_PILOT_AI_PROVIDER configuration");
}

function toStatusMeta({ requestId, statusCode, startTimeMs, provider, failureCategory }) {
  return {
    requestId,
    status: statusCode,
    durationMs: Date.now() - startTimeMs,
    provider,
    failureCategory,
  };
}

function logBackendEvent(logger, eventName, meta) {
  const providerSegment = meta.provider ? ` provider=${meta.provider}` : "";
  const failureCategorySegment = meta.failureCategory ? ` failureCategory=${meta.failureCategory}` : "";

  logger.info(
    `${eventName}${providerSegment}${failureCategorySegment} requestId=${meta.requestId} status=${meta.status} durationMs=${meta.durationMs}`,
  );
}

function writeJson(response, statusCode, payload, { requestId, headers } = {}) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", JSON_CONTENT_TYPE);

  if (requestId) {
    response.setHeader("X-Request-Id", requestId);
  }

  if (headers && typeof headers === "object") {
    for (const [headerName, headerValue] of Object.entries(headers)) {
      response.setHeader(headerName, headerValue);
    }
  }

  response.end(JSON.stringify(payload));
}

async function readJsonBody(request, maxBytes = MAX_JSON_BODY_BYTES) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;

    if (totalBytes > maxBytes) {
      throw new PayloadTooLargeError();
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody.trim()) {
    return null;
  }

  return JSON.parse(rawBody);
}

async function handleMissionSelection(request, response, context) {
  const { missionSelectionService, backendToken, logger, rateLimiter, requestId, startTimeMs, providerName } = context;

  try {
    logBackendEvent(logger, "request received", toStatusMeta({
      provider: providerName,
      requestId,
      statusCode: 0,
      startTimeMs,
    }));

    const authHeader = parseBearerAuthorizationHeader(request.headers.authorization);

    if (authHeader.status === "missing") {
      writeJson(
        response,
        401,
        {
          error: "Unauthorized",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "authentication failure", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 401,
        startTimeMs,
      }));
      return;
    }

    if (authHeader.status === "malformed") {
      writeJson(
        response,
        401,
        {
          error: "Unauthorized",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "authentication failure", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 401,
        startTimeMs,
      }));
      return;
    }

    if (!timingSafeTokenEquals(backendToken, authHeader.token)) {
      writeJson(
        response,
        403,
        {
          error: "Forbidden",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "authentication failure", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 403,
        startTimeMs,
      }));
      return;
    }

    logBackendEvent(logger, "authentication success", toStatusMeta({
      provider: providerName,
      requestId,
      statusCode: 200,
      startTimeMs,
    }));

    const rateLimitResult = rateLimiter.check(request.socket?.remoteAddress);

    if (!rateLimitResult.allowed) {
      writeJson(
        response,
        429,
        {
          error: "Too Many Requests",
        },
        {
          requestId,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
          },
        },
      );
      logBackendEvent(logger, "request received", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 429,
        startTimeMs,
      }));
      return;
    }

    const body = await readJsonBody(request);

    if (!isValidAiSelectionRequest(body)) {
      writeJson(
        response,
        400,
        {
          error: "Invalid AI Selection Request",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "request received", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 400,
        startTimeMs,
      }));
      return;
    }

    const aiSelectionResponse = await missionSelectionService.selectMissions(body);
    writeJson(response, 200, aiSelectionResponse, { requestId });
    logBackendEvent(logger, "provider success", toStatusMeta({
      provider: providerName,
      requestId,
      statusCode: 200,
      startTimeMs,
    }));
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      writeJson(
        response,
        413,
        {
          error: "Payload Too Large",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "request received", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 413,
        startTimeMs,
      }));
      return;
    }

    if (error instanceof SyntaxError) {
      writeJson(
        response,
        400,
        {
          error: "Invalid JSON body",
        },
        {
          requestId,
        },
      );
      logBackendEvent(logger, "request received", toStatusMeta({
        provider: providerName,
        requestId,
        statusCode: 400,
        startTimeMs,
      }));
      return;
    }

    writeJson(
      response,
      500,
      {
        error: "Internal Server Error",
      },
      {
        requestId,
      },
    );
    logBackendEvent(logger, "provider fallback", toStatusMeta({
      provider: providerName,
      failureCategory: typeof error?.kind === "string" ? error.kind : "internal",
      requestId,
      statusCode: 500,
      startTimeMs,
    }));
  }
}

export function createBackendServer({
  logger = console,
  rateLimiter = createRateLimiter(),
  missionSelectionService,
  openAiClientFactory = createOpenAiClient,
} = {}) {
  const backendToken = readRequiredBackendTokenFromEnv();
  const configured = missionSelectionService
    ? {
      providerName: "custom",
      missionSelectionService,
    }
    : createConfiguredMissionSelectionService({ openAiClientFactory });

  logBackendEvent(logger, "provider configured", {
    provider: configured.providerName,
    requestId: "startup",
    status: 0,
    durationMs: 0,
  });

  return http.createServer(async (request, response) => {
    const requestId = randomUUID();
    const startTimeMs = Date.now();
    const requestUrl = new URL(request.url || "/", "http://localhost");

    if (requestUrl.pathname === "/ai/mission-selection" && request.method === "POST") {
      await handleMissionSelection(request, response, {
        missionSelectionService: configured.missionSelectionService,
        backendToken,
        logger,
        rateLimiter,
        requestId,
        startTimeMs,
        providerName: configured.providerName,
      });
      return;
    }

    writeJson(
      response,
      404,
      {
        error: "Not Found",
      },
      {
        requestId,
      },
    );
    logBackendEvent(logger, "request received", toStatusMeta({
      provider: configured.providerName,
      requestId,
      statusCode: 404,
      startTimeMs,
    }));
  });
}

const entryFilePath = process.argv[1] ? process.argv[1].replace(/\\/g, "/") : "";

if (fileURLToPath(import.meta.url).replace(/\\/g, "/") === entryFilePath) {
  try {
    const server = createBackendServer();

    server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
      // 0.0.0.0 allows other devices on the same LAN to connect during local development.
      // eslint-disable-next-line no-console
      console.log(`Health Pilot Backend listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exitCode = 1;
  }
}

import {
  getBackendAuthToken,
  getMissionSelectionUrl,
} from "./backendApiConfig.js";

const DEFAULT_TIMEOUT_MS = 0;
const HTTP_AI_SELECTION_TRANSPORT_SOURCE_FILE = import.meta.url;

function toFiniteTimeout(timeoutMs) {
  const numeric = Number(timeoutMs);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.round(numeric);
}

function createTimeoutController(timeoutMs, AbortControllerImpl) {
  const controller = new AbortControllerImpl();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeoutId);
    },
  };
}

function isAbortError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return error.name === "AbortError";
}

function buildHttpStatusError(status, requestId) {
  let message = `Backend transport HTTP ${status}`;

  if (status === 401) {
    message = "Backend transport unauthorized (HTTP 401)";
  } else if (status === 403) {
    message = "Backend transport forbidden (HTTP 403)";
  } else if (status === 429) {
    message = "Backend transport rate limited (HTTP 429)";
  } else if (status === 413) {
    message = "Backend transport payload too large (HTTP 413)";
  }

  if (requestId) {
    message = `${message}; requestId=${requestId}`;
  }

  const httpError = new Error(message);
  httpError.status = status;
  httpError.requestId = requestId || null;
  return httpError;
}

function toParsedPayload(payload) {
  if (typeof payload !== "string") {
    return payload;
  }

  if (!payload) {
    return undefined;
  }

  return JSON.parse(payload);
}

export function createHttpAiSelectionTransport(options = {}) {
  const fetchImpl = typeof options.fetchImpl === "function" ? options.fetchImpl : globalThis.fetch;
  const timeoutMs = toFiniteTimeout(options.timeoutMs);
  const AbortControllerImpl = options.AbortControllerImpl || globalThis.AbortController;
  const optionToken = typeof options.backendAuthToken === "string" ? options.backendAuthToken.trim() : "";
  const missionSelectionUrl = options.missionSelectionUrl || getMissionSelectionUrl();

  const backendAuthToken = optionToken || getBackendAuthToken();

  if (typeof fetchImpl !== "function") {
    throw new Error("HTTP transport requires fetch implementation");
  }

  if (timeoutMs > 0 && typeof AbortControllerImpl !== "function") {
    throw new Error("HTTP transport requires AbortController implementation");
  }

  if (!backendAuthToken) {
    throw new Error("HTTP transport requires backend auth token");
  }

  return {
    __transportName: "HttpAiSelectionTransport",
    __sourceFile: HTTP_AI_SELECTION_TRANSPORT_SOURCE_FILE,
    async selectMissions(request) {
      const timeoutController =
        timeoutMs > 0 ? createTimeoutController(timeoutMs, AbortControllerImpl) : null;

      try {
        const response = await fetchImpl(missionSelectionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${backendAuthToken}`,
          },
          body: JSON.stringify(request ?? {}),
          ...(timeoutController ? { signal: timeoutController.signal } : {}),
        });

        if (!response.ok) {
          throw buildHttpStatusError(response.status, response.headers?.get?.("x-request-id") || "");
        }

        try {
          let responseText = "";

          if (typeof response.clone === "function") {
            try {
              const cloned = response.clone();
              responseText = typeof cloned.text === "function" ? await cloned.text() : "";
            } catch {
              responseText = "";
            }
          } else if (typeof response.text === "function") {
            try {
              responseText = await response.text();
            } catch {
              responseText = "";
            }
          }

          let parsed;
          if (responseText) {
            parsed = toParsedPayload(responseText);
          } else if (typeof response.json === "function") {
            parsed = toParsedPayload(await response.json());
          } else {
            parsed = undefined;
          }

          // Dev signal for backend boundary success; payload body is intentionally not logged.
          console.info("BackendTransport success");
          return parsed;
        } catch {
          throw new Error("Backend transport failed to parse JSON response");
        }
      } catch (error) {
        if (isAbortError(error)) {
          throw new Error("Backend transport request timed out");
        }

        throw error;
      } finally {
        timeoutController?.clear();
      }
    },
  };
}

export const HttpAiSelectionTransport = {
  __transportName: "HttpAiSelectionTransport",
  __sourceFile: HTTP_AI_SELECTION_TRANSPORT_SOURCE_FILE,
  async selectMissions(request) {
    const transport = createHttpAiSelectionTransport();
    return transport.selectMissions(request);
  },
};

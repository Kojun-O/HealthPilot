import { getBackendAuthToken, getMissionSelectionUrl } from "./backendApiConfig.js";

const DEFAULT_TIMEOUT_MS = 1500;

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

export function createHttpAiSelectionTransport(options = {}) {
  const fetchImpl = typeof options.fetchImpl === "function" ? options.fetchImpl : globalThis.fetch;
  const timeoutMs = toFiniteTimeout(options.timeoutMs);
  const AbortControllerImpl = options.AbortControllerImpl || globalThis.AbortController;
  const missionSelectionUrl = options.missionSelectionUrl || getMissionSelectionUrl();
  const backendAuthToken =
    typeof options.backendAuthToken === "string" ? options.backendAuthToken.trim() : getBackendAuthToken();

  if (typeof fetchImpl !== "function") {
    throw new Error("HTTP transport requires fetch implementation");
  }

  if (typeof AbortControllerImpl !== "function") {
    throw new Error("HTTP transport requires AbortController implementation");
  }

  if (!backendAuthToken) {
    throw new Error("HTTP transport requires backend auth token");
  }

  return {
    async selectMissions(request) {
      const timeoutController = createTimeoutController(timeoutMs, AbortControllerImpl);

      try {
        const response = await fetchImpl(missionSelectionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${backendAuthToken}`,
          },
          body: JSON.stringify(request ?? {}),
          signal: timeoutController.signal,
        });

        if (!response.ok) {
          throw buildHttpStatusError(response.status, response.headers?.get?.("x-request-id") || "");
        }

        try {
          const payload = await response.json();
          // Dev signal for backend boundary success; payload body is intentionally not logged.
          console.info("BackendTransport success");
          return payload;
        } catch {
          throw new Error("Backend transport failed to parse JSON response");
        }
      } catch (error) {
        if (isAbortError(error)) {
          throw new Error("Backend transport request timed out");
        }

        throw error;
      } finally {
        timeoutController.clear();
      }
    },
  };
}

export const HttpAiSelectionTransport = {
  async selectMissions(request) {
    const transport = createHttpAiSelectionTransport();
    return transport.selectMissions(request);
  },
};

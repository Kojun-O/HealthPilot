import { getMissionSelectionUrl } from "./backendApiConfig.js";

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

export function createHttpAiSelectionTransport(options = {}) {
  const fetchImpl = typeof options.fetchImpl === "function" ? options.fetchImpl : globalThis.fetch;
  const timeoutMs = toFiniteTimeout(options.timeoutMs);
  const AbortControllerImpl = options.AbortControllerImpl || globalThis.AbortController;
  const missionSelectionUrl = options.missionSelectionUrl || getMissionSelectionUrl();

  if (typeof fetchImpl !== "function") {
    throw new Error("HTTP transport requires fetch implementation");
  }

  if (typeof AbortControllerImpl !== "function") {
    throw new Error("HTTP transport requires AbortController implementation");
  }

  return {
    async selectMissions(request) {
      const timeoutController = createTimeoutController(timeoutMs, AbortControllerImpl);

      try {
        const response = await fetchImpl(missionSelectionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request ?? {}),
          signal: timeoutController.signal,
        });

        if (!response.ok) {
          const httpError = new Error(`Backend transport HTTP ${response.status}`);
          httpError.status = response.status;
          throw httpError;
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

export const HttpAiSelectionTransport = createHttpAiSelectionTransport();

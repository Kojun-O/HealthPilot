const BACKEND_API_BASE_URL = "https://healthpilot-backend.onrender.com";
const BACKEND_API_BASE_URL_ENV_NAME = "EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL";
const BACKEND_TOKEN_ENV_NAME = "EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN";

function readEnvString(value) {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }

  return typeof value === "string" ? value.trim() : "";
}

export function getBackendApiBaseUrl() {
  return readEnvString(process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL) || BACKEND_API_BASE_URL;
}

export function getBackendAuthToken() {
  const backendAuthToken = readEnvString(process.env.EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN);

  if (!backendAuthToken) {
    throw new Error(`Backend transport configuration error: missing ${BACKEND_TOKEN_ENV_NAME}`);
  }

  return backendAuthToken;
}

export function getBackendTokenEnvName() {
  return BACKEND_TOKEN_ENV_NAME;
}

export function getBackendApiBaseUrlEnvName() {
  return BACKEND_API_BASE_URL_ENV_NAME;
}

export function getMissionSelectionUrl() {
  return `${getBackendApiBaseUrl().replace(/\/+$/, "")}/ai/mission-selection`;
}

export const BackendApiConfig = {
  getBackendApiBaseUrl,
  getBackendApiBaseUrlEnvName,
  getBackendAuthToken,
  getBackendTokenEnvName,
  getMissionSelectionUrl,
};

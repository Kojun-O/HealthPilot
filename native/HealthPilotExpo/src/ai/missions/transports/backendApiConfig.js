// Replace this value with your PC LAN IP once before running on iPhone device.
const BACKEND_API_BASE_URL = "http://192.168.0.11:8787";
const BACKEND_TOKEN_ENV_NAME = "EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN";

function readEnvString(name) {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }

  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function getBackendApiBaseUrl() {
  return BACKEND_API_BASE_URL;
}

export function getBackendAuthToken() {
  const backendAuthToken = readEnvString(BACKEND_TOKEN_ENV_NAME);

  if (!backendAuthToken) {
    throw new Error(`Backend transport configuration error: missing ${BACKEND_TOKEN_ENV_NAME}`);
  }

  return backendAuthToken;
}

export function getBackendTokenEnvName() {
  return BACKEND_TOKEN_ENV_NAME;
}

export function getMissionSelectionUrl() {
  return `${getBackendApiBaseUrl().replace(/\/+$/, "")}/ai/mission-selection`;
}

export const BackendApiConfig = {
  getBackendApiBaseUrl,
  getBackendAuthToken,
  getBackendTokenEnvName,
  getMissionSelectionUrl,
};

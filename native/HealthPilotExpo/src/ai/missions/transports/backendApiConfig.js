// Replace this value with your PC LAN IP once before running on iPhone device.
const BACKEND_API_BASE_URL = "http://192.168.0.11:8787";

export function getBackendApiBaseUrl() {
  return BACKEND_API_BASE_URL;
}

export function getMissionSelectionUrl() {
  return `${getBackendApiBaseUrl().replace(/\/+$/, "")}/ai/mission-selection`;
}

export const BackendApiConfig = {
  getBackendApiBaseUrl,
  getMissionSelectionUrl,
};

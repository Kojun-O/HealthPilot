const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL_ENV_NAME = "EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL";
const DEFAULT_RENDER_BASE_URL = "https://healthpilot-backend.onrender.com";

test("backendApiConfig uses Render backend URL by default", async () => {
  const { getBackendApiBaseUrl } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/backendApiConfig.js"
  );

  const previousValue = process.env[BASE_URL_ENV_NAME];
  delete process.env[BASE_URL_ENV_NAME];

  try {
    assert.equal(getBackendApiBaseUrl(), DEFAULT_RENDER_BASE_URL);
  } finally {
    if (typeof previousValue === "string") {
      process.env[BASE_URL_ENV_NAME] = previousValue;
    } else {
      delete process.env[BASE_URL_ENV_NAME];
    }
  }
});

test("backendApiConfig allows backend URL override via env", async () => {
  const { getBackendApiBaseUrl, getBackendApiBaseUrlEnvName } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/backendApiConfig.js"
  );

  const previousValue = process.env[BASE_URL_ENV_NAME];
  process.env[BASE_URL_ENV_NAME] = "  https://example.com/custom-backend/  ";

  try {
    assert.equal(getBackendApiBaseUrlEnvName(), BASE_URL_ENV_NAME);
    assert.equal(getBackendApiBaseUrl(), "https://example.com/custom-backend/");
  } finally {
    if (typeof previousValue === "string") {
      process.env[BASE_URL_ENV_NAME] = previousValue;
    } else {
      delete process.env[BASE_URL_ENV_NAME];
    }
  }
});

test("backendApiConfig builds mission selection URL without duplicate slash", async () => {
  const { getMissionSelectionUrl } = await import(
    "../native/HealthPilotExpo/src/ai/missions/transports/backendApiConfig.js"
  );

  const previousValue = process.env[BASE_URL_ENV_NAME];
  process.env[BASE_URL_ENV_NAME] = "https://example.com/custom-backend///";

  try {
    assert.equal(
      getMissionSelectionUrl(),
      "https://example.com/custom-backend/ai/mission-selection",
    );
  } finally {
    if (typeof previousValue === "string") {
      process.env[BASE_URL_ENV_NAME] = previousValue;
    } else {
      delete process.env[BASE_URL_ENV_NAME];
    }
  }
});

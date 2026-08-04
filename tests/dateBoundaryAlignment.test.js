const test = require("node:test");
const assert = require("node:assert/strict");

async function loadMockInputModule() {
  return import("../native/HealthPilotExpo/src/ai/aiInputDateKey.js");
}

async function loadDailyRecordModelModule() {
  return import("../native/HealthPilotExpo/src/storage/dailyRecordModel.js");
}

test("resolveAiInputDateKey uses local date key at UTC boundary", async () => {
  const { resolveAiInputDateKey } = await loadMockInputModule();

  const justAfterMidnightLocal = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 4,
    toISOString: () => {
      throw new Error("resolveAiInputDateKey must not use toISOString");
    },
  };

  assert.equal(resolveAiInputDateKey(justAfterMidnightLocal), "2026-08-04");
});

test("resolveAiInputDateKey returns local date key during daytime", async () => {
  const { resolveAiInputDateKey } = await loadMockInputModule();

  const daytimeLocal = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 4,
    toISOString: () => "2026-08-04T03:00:00.000Z",
  };

  assert.equal(resolveAiInputDateKey(daytimeLocal), "2026-08-04");
});

test("resolveRolloverDateKey updates currentDateKey when local date changes", async () => {
  const { resolveRolloverDateKey } = await loadDailyRecordModelModule();

  const nextLocalDate = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 4,
    toISOString: () => "2026-08-03T15:10:00.000Z",
  };

  assert.equal(resolveRolloverDateKey("2026-08-03", nextLocalDate), "2026-08-04");
  assert.equal(resolveRolloverDateKey("2026-08-04", nextLocalDate), "2026-08-04");
});

test("shouldRefreshInsightOnDateChange waits for hydration and refreshes once per date", async () => {
  const { shouldRefreshInsightOnDateChange } = await loadDailyRecordModelModule();

  assert.equal(
    shouldRefreshInsightOnDateChange({
      currentDateKey: "2026-08-04",
      lastInsightDateKey: "2026-08-03",
      isHydrated: false,
    }),
    false,
  );

  assert.equal(
    shouldRefreshInsightOnDateChange({
      currentDateKey: "2026-08-04",
      lastInsightDateKey: "2026-08-03",
      isHydrated: true,
    }),
    true,
  );

  assert.equal(
    shouldRefreshInsightOnDateChange({
      currentDateKey: "2026-08-04",
      lastInsightDateKey: "2026-08-04",
      isHydrated: true,
    }),
    false,
  );
});

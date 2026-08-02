const test = require("node:test");
const assert = require("node:assert/strict");

async function loadHookModule() {
  return import("../native/HealthPilotExpo/src/hooks/morningOutcomeLinking.js");
}

test("shouldPersistMorningOutcomeLink returns false when user has not provided check-in input", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: false,
  });

  assert.equal(canPersist, false);
});

test("shouldPersistMorningOutcomeLink returns true once when prior day has no current sourceDate", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
      morningOutcome: null,
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: true,
  });

  assert.equal(canPersist, true);
});

test("shouldPersistMorningOutcomeLink returns false after same-day sourceDate already exists", async () => {
  const { shouldPersistMorningOutcomeLink } = await loadHookModule();

  const canPersist = shouldPersistMorningOutcomeLink({
    previousRecord: {
      date: "2026-08-01",
      morningOutcome: {
        sourceDate: "2026-08-02",
        checkIn: {
          condition: 4,
          sleep: 3,
          focus: 4,
          mentalSpace: 3,
          activity: 2,
        },
      },
    },
    currentDateKey: "2026-08-02",
    hasUserCheckInInput: true,
  });

  assert.equal(canPersist, false);
});

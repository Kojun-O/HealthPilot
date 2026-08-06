const test = require("node:test");
const assert = require("node:assert/strict");

async function loadLifecycleModule() {
  return import("../native/HealthPilotExpo/src/hooks/checkInEventLifecycle.js");
}

test("flushes pending check-in event when app goes background before debounce", async () => {
  const {
    buildCommittedCheckInEvent,
    shouldFlushPendingCheckInEventOnAppStateChange,
  } = await loadLifecycleModule();

  assert.equal(shouldFlushPendingCheckInEventOnAppStateChange("active", "background"), true);

  const event = buildCommittedCheckInEvent({
    pendingTimestamp: "2026-08-06T08:02:00.000Z",
    checkInRatings: {
      condition: 4,
      sleep: 3,
      focus: 4,
      mentalSpace: 3,
      activity: 2,
    },
    lastCommittedTimestamp: null,
  });

  assert.deepEqual(event, {
    timestamp: "2026-08-06T08:02:00.000Z",
    condition: 4,
    sleep: 3,
    focus: 4,
    mentalSpace: 3,
    activity: 2,
  });
});

test("does not generate duplicate event after background flush when debounce later fires", async () => {
  const { buildCommittedCheckInEvent } = await loadLifecycleModule();

  const flushed = buildCommittedCheckInEvent({
    pendingTimestamp: "2026-08-06T13:14:00.000Z",
    checkInRatings: {
      condition: 5,
      sleep: 4,
      focus: 4,
      mentalSpace: 4,
      activity: 4,
    },
    lastCommittedTimestamp: null,
  });

  const debounceRetry = buildCommittedCheckInEvent({
    pendingTimestamp: "2026-08-06T13:14:00.000Z",
    checkInRatings: {
      condition: 5,
      sleep: 4,
      focus: 4,
      mentalSpace: 4,
      activity: 4,
    },
    lastCommittedTimestamp: flushed.timestamp,
  });

  assert.equal(flushed.timestamp, "2026-08-06T13:14:00.000Z");
  assert.equal(debounceRetry, null);
});

test("does not create event on background transition when no pending event exists", async () => {
  const {
    buildCommittedCheckInEvent,
    shouldFlushPendingCheckInEventOnAppStateChange,
  } = await loadLifecycleModule();

  assert.equal(shouldFlushPendingCheckInEventOnAppStateChange("active", "inactive"), true);

  const event = buildCommittedCheckInEvent({
    pendingTimestamp: null,
    checkInRatings: {
      condition: 3,
      sleep: 3,
      focus: 3,
      mentalSpace: 3,
      activity: 3,
    },
    lastCommittedTimestamp: null,
  });

  assert.equal(event, null);
});

test("normal debounce commit still creates one event when pending timestamp is new", async () => {
  const { buildCommittedCheckInEvent } = await loadLifecycleModule();

  const event = buildCommittedCheckInEvent({
    pendingTimestamp: "2026-08-06T21:37:00.000Z",
    checkInRatings: {
      condition: 2,
      sleep: 2,
      focus: 3,
      mentalSpace: 2,
      activity: 2,
    },
    lastCommittedTimestamp: "2026-08-06T20:00:00.000Z",
  });

  assert.deepEqual(event, {
    timestamp: "2026-08-06T21:37:00.000Z",
    condition: 2,
    sleep: 2,
    focus: 3,
    mentalSpace: 2,
    activity: 2,
  });
});

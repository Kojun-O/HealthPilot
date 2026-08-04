const test = require("node:test");
const assert = require("node:assert/strict");

async function loadHookModule() {
  return import("../native/HealthPilotExpo/src/hooks/missionLockDebugSnapshot.js");
}

test("debug snapshot can represent hydrated values", async () => {
  const { buildMissionLockDebugSnapshot } = await loadHookModule();

  const snapshot = buildMissionLockDebugSnapshot({
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    liveMissionIds: ["m.sleep", "m.walk", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    missionCompletionSource: { "m.sleep": true },
    nextSelectedMissionIds: null,
  });

  assert.deepEqual(snapshot, {
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    liveMissionIds: ["m.sleep", "m.walk", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    missionCompletionSource: { "m.sleep": true },
    nextSelectedMissionIds: null,
  });
});

test("debug snapshot reflects selectedMissionIds changes", async () => {
  const { buildMissionLockDebugSnapshot } = await loadHookModule();

  const before = buildMissionLockDebugSnapshot({
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    liveMissionIds: ["m.sleep", "m.walk", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    missionCompletionSource: {},
    nextSelectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
  });

  const after = buildMissionLockDebugSnapshot({
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.breathing", "m.focus"],
    liveMissionIds: ["m.sleep", "m.breathing", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.breathing", "m.focus"],
    missionCompletionSource: {},
    nextSelectedMissionIds: null,
  });

  assert.notDeepEqual(before.selectedMissionIds, after.selectedMissionIds);
  assert.deepEqual(after.selectedMissionIds, ["m.sleep", "m.breathing", "m.focus"]);
  assert.deepEqual(after.resolvedMissionIds, ["m.sleep", "m.breathing", "m.focus"]);
});

test("debug snapshot reflects missionCompletion changes", async () => {
  const { buildMissionLockDebugSnapshot } = await loadHookModule();

  const before = buildMissionLockDebugSnapshot({
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    liveMissionIds: ["m.sleep", "m.walk", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    missionCompletionSource: { "m.sleep": false },
    nextSelectedMissionIds: null,
  });

  const after = buildMissionLockDebugSnapshot({
    currentDateKey: "2026-08-04",
    isHydrated: true,
    selectedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    liveMissionIds: ["m.sleep", "m.walk", "m.focus"],
    persistedPresentedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    resolvedMissionIds: ["m.sleep", "m.walk", "m.focus"],
    missionCompletionSource: { "m.sleep": true },
    nextSelectedMissionIds: null,
  });

  assert.equal(before.missionCompletionSource["m.sleep"], false);
  assert.equal(after.missionCompletionSource["m.sleep"], true);
});

const test = require("node:test");
const assert = require("node:assert/strict");

async function loadDailyMissionSelectionModule() {
  return import("../native/HealthPilotExpo/src/hooks/dailyMissionSelection.js");
}

function createMission(definitionId, expectedImpact = 1) {
  return {
    definitionId,
    title: definitionId,
    expectedImpact,
    confidence: "Medium",
    why: "",
    sourceInsightIds: [],
  };
}

test("initial selection resolves from live missions and selected IDs can be derived for persistence", async () => {
  const { resolveDailyMissions, getNextSelectedMissionIds } = await loadDailyMissionSelectionModule();

  const liveMissions = [
    createMission("sleep_before_2300", 2),
    createMission("screen_off_30min_before_bed", 2),
    createMission("no_caffeine_after_1500", 2),
  ];

  const resolved = resolveDailyMissions({
    liveMissions,
    selectedMissionIds: [],
    persistedPresentedMissions: [],
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"],
  );

  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: [],
    resolvedMissions: resolved,
  });

  assert.deepEqual(
    nextSelectedMissionIds,
    ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"],
  );
});

test("same date keeps fixed missions even when AI selection changes", async () => {
  const { resolveDailyMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
  ];
  const changedAiMissions = [
    createMission("sleep_before_2300", 2),
    createMission("screen_off_30min_before_bed", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: changedAiMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"],
  );
});

test("same date stays fixed even if backend path effectively falls back to different local candidates", async () => {
  const { resolveDailyMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
  ];
  const fallbackLikeMissions = [
    createMission("rest_eyes_closed_15min", 1),
    createMission("walk_15min", 1),
    createMission("sleep_before_2300", 2),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: fallbackLikeMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"],
  );
});

test("check-in updates do not alter fixed mission IDs", async () => {
  const { resolveDailyMissions, getNextSelectedMissionIds } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
  ];
  const liveMissionsAfterCheckIn = [
    createMission("sleep_before_2300", 2),
    createMission("screen_off_30min_before_bed", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: liveMissionsAfterCheckIn,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: selectedMissionIds,
    resolvedMissions: resolved,
  });

  assert.equal(nextSelectedMissionIds, null);
});

test("mission completion mapping remains valid because fixed mission IDs are retained after reload-like re-fetch", async () => {
  const { resolveDailyMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
  ];
  const reloadMissions = [
    createMission("sleep_before_2300", 2),
    createMission("screen_off_30min_before_bed", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: reloadMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  const missionCompletion = {
    sleep_before_2300: true,
    screen_off_30min_before_bed: false,
    no_caffeine_after_1500: true,
  };

  const completionFlags = resolved.map((mission) => Boolean(missionCompletion[mission.definitionId]));

  assert.deepEqual(completionFlags, [true, false, true]);
});

test("next date can accept new mission selection", async () => {
  const { resolveDailyMissions, getNextSelectedMissionIds } = await loadDailyMissionSelectionModule();

  const previousDateSelectedMissionIds = ["sleep_before_2300", "screen_off_30min_before_bed", "no_caffeine_after_1500"];
  const newDateLiveMissions = [
    createMission("rest_eyes_closed_15min", 1),
    createMission("walk_15min", 1),
    createMission("sleep_before_2300", 2),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: newDateLiveMissions,
    selectedMissionIds: [],
    persistedPresentedMissions: [],
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );

  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: previousDateSelectedMissionIds,
    resolvedMissions: resolved,
  });

  assert.deepEqual(
    nextSelectedMissionIds,
    ["rest_eyes_closed_15min", "walk_15min", "sleep_before_2300"],
  );
});

test("supplements only unrecoverable persisted IDs", async () => {
  const { resolveDailyMissions, getNextSelectedMissionIds } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "missing_mission_id", "no_caffeine_after_1500"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
  ];
  const liveMissions = [
    createMission("sleep_before_2300", 2),
    createMission("screen_off_30min_before_bed", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );

  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: selectedMissionIds,
    resolvedMissions: resolved,
  });

  assert.deepEqual(
    nextSelectedMissionIds,
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );
});

test("does not propose selectedMissionIds overwrite before hydration", async () => {
  const { getNextSelectedMissionIds } = await loadDailyMissionSelectionModule();

  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: false,
    currentSelectedMissionIds: ["sleep_before_2300"],
    resolvedMissions: [createMission("rest_eyes_closed_15min", 1)],
  });

  assert.equal(nextSelectedMissionIds, null);
});

test("insight can arrive before hydration but missions are not displayed or committed pre-hydration", async () => {
  const {
    getNextSelectedMissionIds,
    resolveDailyMissions,
    resolveDisplayedMissions,
  } = await loadDailyMissionSelectionModule();

  const liveMissions = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions,
    selectedMissionIds: [],
    persistedPresentedMissions: [],
  });
  const displayed = resolveDisplayedMissions({
    isHydrated: false,
    resolvedMissions: resolved,
  });
  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: false,
    currentSelectedMissionIds: [],
    resolvedMissions: resolved,
  });

  assert.deepEqual(displayed, []);
  assert.equal(nextSelectedMissionIds, null);
});

test("after hydration, persisted selectedMissionIds are always used for mission display", async () => {
  const { resolveDailyMissions, resolveDisplayedMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
  ];
  const changedLiveMissions = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions: changedLiveMissions,
    selectedMissionIds,
    persistedPresentedMissions,
  });
  const displayed = resolveDisplayedMissions({
    isHydrated: true,
    resolvedMissions: resolved,
  });

  assert.deepEqual(
    displayed.map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );
});

test("after hydration with empty selectedMissionIds, live missions become first committed daily missions", async () => {
  const { getNextSelectedMissionIds, resolveDailyMissions, resolveDisplayedMissions } = await loadDailyMissionSelectionModule();

  const liveMissions = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const resolved = resolveDailyMissions({
    liveMissions,
    selectedMissionIds: [],
    persistedPresentedMissions: [],
  });
  const displayed = resolveDisplayedMissions({
    isHydrated: true,
    resolvedMissions: resolved,
  });
  const nextSelectedMissionIds = getNextSelectedMissionIds({
    isHydrated: true,
    currentSelectedMissionIds: [],
    resolvedMissions: resolved,
  });

  assert.deepEqual(
    displayed.map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "rest_eyes_closed_15min"],
  );
  assert.deepEqual(
    nextSelectedMissionIds,
    ["sleep_before_2300", "no_caffeine_after_1500", "rest_eyes_closed_15min"],
  );
});

test("pre-hydration reload equivalent does not alter persisted mission IDs", async () => {
  const { getNextSelectedMissionIds, resolveDailyMissions } = await loadDailyMissionSelectionModule();

  const persistedSelectedMissionIds = ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"];
  const liveBeforeHydrate = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const preHydrationResolved = resolveDailyMissions({
    liveMissions: liveBeforeHydrate,
    selectedMissionIds: [],
    persistedPresentedMissions: [],
  });
  const preHydrationNext = getNextSelectedMissionIds({
    isHydrated: false,
    currentSelectedMissionIds: persistedSelectedMissionIds,
    resolvedMissions: preHydrationResolved,
  });

  assert.equal(preHydrationNext, null);
});

test("after hydration, AI re-fetch changes live missions but displayed missions remain fixed", async () => {
  const { resolveDailyMissions, resolveDisplayedMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
  ];

  const firstLive = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("screen_off_30min_before_bed", 2),
  ];
  const secondLive = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];

  const firstResolved = resolveDailyMissions({
    liveMissions: firstLive,
    selectedMissionIds,
    persistedPresentedMissions,
  });
  const secondResolved = resolveDailyMissions({
    liveMissions: secondLive,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  assert.deepEqual(
    resolveDisplayedMissions({ isHydrated: true, resolvedMissions: firstResolved }).map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );
  assert.deepEqual(
    resolveDisplayedMissions({ isHydrated: true, resolvedMissions: secondResolved }).map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );
});

test("completion state stays aligned to fixed mission IDs after reload-like AI change", async () => {
  const { resolveDailyMissions } = await loadDailyMissionSelectionModule();

  const selectedMissionIds = ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"];
  const persistedPresentedMissions = [
    { id: "sleep_before_2300", title: "sleep_before_2300", expectedImpact: 2 },
    { id: "no_caffeine_after_1500", title: "no_caffeine_after_1500", expectedImpact: 2 },
    { id: "screen_off_30min_before_bed", title: "screen_off_30min_before_bed", expectedImpact: 2 },
  ];
  const reloadLive = [
    createMission("sleep_before_2300", 2),
    createMission("no_caffeine_after_1500", 2),
    createMission("rest_eyes_closed_15min", 1),
  ];
  const completionById = {
    sleep_before_2300: false,
    no_caffeine_after_1500: true,
    screen_off_30min_before_bed: false,
    rest_eyes_closed_15min: true,
  };

  const resolved = resolveDailyMissions({
    liveMissions: reloadLive,
    selectedMissionIds,
    persistedPresentedMissions,
  });

  assert.deepEqual(
    resolved.map((mission) => mission.definitionId),
    ["sleep_before_2300", "no_caffeine_after_1500", "screen_off_30min_before_bed"],
  );
  assert.deepEqual(
    resolved.map((mission) => Boolean(completionById[mission.definitionId])),
    [false, true, false],
  );
});

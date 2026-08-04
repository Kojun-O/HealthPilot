export function buildMissionLockDebugSnapshot({
  currentDateKey,
  isHydrated,
  selectedMissionIds,
  liveMissionIds,
  persistedPresentedMissionIds,
  resolvedMissionIds,
  missionCompletionSource,
  nextSelectedMissionIds,
} = {}) {
  return {
    currentDateKey,
    isHydrated,
    selectedMissionIds,
    liveMissionIds,
    persistedPresentedMissionIds,
    resolvedMissionIds,
    missionCompletionSource,
    nextSelectedMissionIds,
  };
}

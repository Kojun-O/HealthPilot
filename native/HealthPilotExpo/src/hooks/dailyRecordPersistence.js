export function buildPersistableDailyRecord({
  isHydrated,
  nextSelectedMissionIds,
  currentDateKey,
  healthSnapshot,
  checkInRatings,
  checkInEvent,
  checkInNoteText,
  presentedMissions,
  selectedMissionIds,
  missionCompletion,
  tomorrowCapacityPrediction,
} = {}) {
  if (!isHydrated || nextSelectedMissionIds) {
    return null;
  }

  return {
    date: currentDateKey,
    healthSnapshot,
    checkIn: checkInRatings,
    ...(checkInEvent && typeof checkInEvent === "object" ? { checkInEvent } : {}),
    checkInNote: checkInNoteText,
    presentedMissions,
    selectedMissionIds,
    missionCompletion,
    tomorrowCapacityPrediction,
  };
}
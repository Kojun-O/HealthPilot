export function buildPersistableDailyRecord({
  isHydrated,
  nextSelectedMissionIds,
  currentDateKey,
  healthSnapshot,
  checkInRatings,
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
    checkInNote: checkInNoteText,
    presentedMissions,
    selectedMissionIds,
    missionCompletion,
    tomorrowCapacityPrediction,
  };
}
export function shouldPersistMorningOutcomeLink({ previousRecord, currentDateKey, hasUserCheckInInput }) {
  if (!hasUserCheckInInput || !previousRecord || !currentDateKey) {
    return false;
  }

  return previousRecord?.morningOutcome?.sourceDate !== currentDateKey;
}

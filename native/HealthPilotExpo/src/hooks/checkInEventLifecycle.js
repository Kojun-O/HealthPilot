function clampCheckInValue(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function normalizeCheckInRatings(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    condition: clampCheckInValue(source.condition),
    sleep: clampCheckInValue(source.sleep),
    focus: clampCheckInValue(source.focus),
    mentalSpace: clampCheckInValue(source.mentalSpace),
    activity: clampCheckInValue(source.activity),
  };
}

export function shouldFlushPendingCheckInEventOnAppStateChange(previousState, nextState) {
  const wasActive = previousState === "active";
  const movedAwayFromActive = nextState === "inactive" || nextState === "background";
  return wasActive && movedAwayFromActive;
}

export function buildCommittedCheckInEvent({
  pendingTimestamp,
  checkInRatings,
  lastCommittedTimestamp,
}) {
  if (!pendingTimestamp || pendingTimestamp === lastCommittedTimestamp) {
    return null;
  }

  return {
    timestamp: pendingTimestamp,
    ...normalizeCheckInRatings(checkInRatings),
  };
}

const MAX_SELECTED_MISSIONS = 3;
const CONFIDENCE_LEVELS = new Set(["low", "medium", "high"]);

function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toFiniteNumberOrDefault(value, defaultValue) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : defaultValue;
}

function toCandidateIdSet(candidates) {
  const ids = new Set();

  if (!Array.isArray(candidates)) {
    return ids;
  }

  for (const candidate of candidates) {
    const candidateId = toStringOrEmpty(candidate?.id);
    if (candidateId) {
      ids.add(candidateId);
    }
  }

  return ids;
}

function normalizeSelections(responseSelections, candidateIds) {
  if (!Array.isArray(responseSelections)) {
    return null;
  }

  const selections = [];
  const selectedIdSet = new Set();

  for (const selection of responseSelections) {
    const missionId = toStringOrEmpty(selection?.missionId) || toStringOrEmpty(selection?.id);

    if (!missionId || selectedIdSet.has(missionId) || !candidateIds.has(missionId)) {
      continue;
    }

    const confidence = toStringOrEmpty(selection?.confidence).toLowerCase();

    selections.push({
      missionId,
      reason: toStringOrEmpty(selection?.reason),
      expectedImpact: toFiniteNumberOrDefault(selection?.expectedImpact, 0),
      confidence: CONFIDENCE_LEVELS.has(confidence) ? confidence : "medium",
    });
    selectedIdSet.add(missionId);

    if (selections.length >= MAX_SELECTED_MISSIONS) {
      break;
    }
  }

  return selections;
}

export function normalizeAiSelectionResponse(response, candidates) {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return null;
  }

  const candidateIds = toCandidateIdSet(candidates);
  const selections = normalizeSelections(response.selections, candidateIds);

  if (!selections) {
    return null;
  }

  const tomorrowCapacityComment = toStringOrEmpty(response.tomorrowCapacityComment);
  const safetyNote = toStringOrEmpty(response.safetyNote) || null;

  return {
    selections,
    tomorrowCapacityComment,
    safetyNote,
  };
}

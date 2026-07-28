const MAX_SELECTED_MISSIONS = 3;

function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidCandidate(candidate) {
  if (!isPlainObject(candidate)) {
    return false;
  }

  return Boolean(toStringOrEmpty(candidate.id)) && Boolean(toStringOrEmpty(candidate.title));
}

export function isValidAiSelectionRequest(request) {
  if (!isPlainObject(request)) {
    return false;
  }

  if (!Array.isArray(request.candidates)) {
    return false;
  }

  return request.candidates.every(isValidCandidate);
}

export function selectDeterministicMissionIds(candidates) {
  if (!Array.isArray(candidates)) {
    return [];
  }

  const selectedMissionIds = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const missionId = toStringOrEmpty(candidate?.id);

    if (!missionId || seen.has(missionId)) {
      continue;
    }

    selectedMissionIds.push(missionId);
    seen.add(missionId);

    if (selectedMissionIds.length >= MAX_SELECTED_MISSIONS) {
      break;
    }
  }

  return selectedMissionIds;
}

export function buildFixedAiSelectionResponse(request) {
  const selectedMissionIds = selectDeterministicMissionIds(request?.candidates);

  return {
    selections: selectedMissionIds.map((missionId) => ({
      missionId,
      reason: "固定レスポンスによる選択",
      expectedImpact: 1,
      confidence: "medium",
    })),
    tomorrowCapacityComment: "固定バックエンドレスポンス",
    safetyNote: null,
  };
}

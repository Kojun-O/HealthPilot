import { normalizeAiSelectionResponse } from "./normalizeAiSelectionResponse.js";

const MAX_SELECTED_MISSIONS = 3;

function logBackendTransportFallback() {
  // Dev signal only; no health payload is included.
  console.info("BackendTransport fallback");
}

function toCandidateId(candidate) {
  return typeof candidate?.id === "string" ? candidate.id.trim() : "";
}

function selectMissionsLocally(candidates) {
  return candidates.slice(0, MAX_SELECTED_MISSIONS);
}

function toSelectedMissionIdsFromSelections(selections) {
  if (!Array.isArray(selections)) {
    return [];
  }

  return selections
    .map((selection) => toCandidateId({ id: selection?.missionId }))
    .filter(Boolean)
    .slice(0, MAX_SELECTED_MISSIONS);
}

function selectMissionsByIds(candidates, selectedMissionIds) {
  const candidateById = new Map();

  for (const candidate of candidates) {
    const candidateId = toCandidateId(candidate);
    if (candidateId && !candidateById.has(candidateId)) {
      candidateById.set(candidateId, candidate);
    }
  }

  const selected = [];
  const selectedIds = new Set();

  for (const missionId of selectedMissionIds) {
    if (selected.length >= MAX_SELECTED_MISSIONS) {
      break;
    }

    const candidate = candidateById.get(missionId);

    if (!candidate || selectedIds.has(missionId)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(missionId);
  }

  // Keep legacy behavior of returning up to three missions even if AI selected fewer IDs.
  for (const candidate of candidates) {
    if (selected.length >= MAX_SELECTED_MISSIONS) {
      break;
    }

    const candidateId = toCandidateId(candidate);

    if (!candidateId || selectedIds.has(candidateId)) {
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidateId);
  }

  return selected;
}

export function selectMissions(candidates, options = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const localSelection = selectMissionsLocally(candidates);

  if (!Object.prototype.hasOwnProperty.call(options, "aiSelectionResponse")) {
    return localSelection;
  }

  try {
    const normalizedAiSelectionResponse = normalizeAiSelectionResponse(
      options.aiSelectionResponse,
      candidates,
    );

    if (!normalizedAiSelectionResponse) {
      logBackendTransportFallback();
      return localSelection;
    }

    const selectedMissionIds = toSelectedMissionIdsFromSelections(
      normalizedAiSelectionResponse.selections,
    );

    if (selectedMissionIds.length === 0) {
      logBackendTransportFallback();
      return localSelection;
    }

    return selectMissionsByIds(candidates, selectedMissionIds);
  } catch {
    logBackendTransportFallback();
    return localSelection;
  }
}
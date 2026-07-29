const MAX_SELECTED_MISSIONS = 3;
const MOCK_TRANSPORT_SOURCE_FILE = import.meta.url;

function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toUniqueMissionIds(candidates) {
  if (!Array.isArray(candidates)) {
    return [];
  }

  const ids = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const missionId = toStringOrEmpty(candidate?.id);

    if (!missionId || seen.has(missionId)) {
      continue;
    }

    ids.push(missionId);
    seen.add(missionId);

    if (ids.length >= MAX_SELECTED_MISSIONS) {
      break;
    }
  }

  return ids;
}

export const MockTransport = {
  __transportName: "MockTransport",
  __sourceFile: MOCK_TRANSPORT_SOURCE_FILE,
  async selectMissions(request = {}) {
    const selectedMissionIds = toUniqueMissionIds(request?.candidates);

    return {
      selections: selectedMissionIds.map((missionId) => ({
        missionId,
        reason: "Mock transport selected by candidate order.",
        expectedImpact: 1,
        confidence: "medium",
      })),
      tomorrowCapacityComment: "",
      safetyNote: null,
    };
  },
};
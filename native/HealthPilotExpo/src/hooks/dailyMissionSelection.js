import { getMissionStableId, getMissionStableIds } from "../ai/missionStableId.js";

const MAX_DAILY_MISSIONS = 3;

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}

function toMissionFromPresentedMission(presentedMission) {
  const id = typeof presentedMission?.id === "string" ? presentedMission.id.trim() : "";
  const title = typeof presentedMission?.title === "string" ? presentedMission.title.trim() : "";

  if (!id || !title) {
    return null;
  }

  const expectedImpact = Number(presentedMission?.expectedImpact);

  return {
    definitionId: id,
    title,
    expectedImpact: Number.isFinite(expectedImpact) ? Math.max(0, Math.round(expectedImpact)) : 0,
    confidence: "Medium",
    why: "",
    sourceInsightIds: [],
  };
}

function toPresentedMissionMap(presentedMissions) {
  const map = new Map();

  for (const presentedMission of Array.isArray(presentedMissions) ? presentedMissions : []) {
    const mission = toMissionFromPresentedMission(presentedMission);
    const missionId = getMissionStableId(mission);

    if (!missionId || map.has(missionId)) {
      continue;
    }

    map.set(missionId, mission);
  }

  return map;
}

function toLiveMissionMap(liveMissions) {
  const map = new Map();

  for (const mission of Array.isArray(liveMissions) ? liveMissions : []) {
    const missionId = getMissionStableId(mission);

    if (!missionId || map.has(missionId)) {
      continue;
    }

    map.set(missionId, mission);
  }

  return map;
}

export function resolveDailyMissions({
  liveMissions,
  selectedMissionIds,
  persistedPresentedMissions,
} = {}) {
  const limit = MAX_DAILY_MISSIONS;
  const normalizedSelectedMissionIds = toStringArray(selectedMissionIds);
  const liveMissionList = Array.isArray(liveMissions) ? liveMissions : [];
  const liveMissionMap = toLiveMissionMap(liveMissionList);
  const presentedMissionMap = toPresentedMissionMap(persistedPresentedMissions);
  const resolved = [];
  const resolvedIdSet = new Set();

  function pushMission(mission) {
    if (resolved.length >= limit) {
      return;
    }

    const missionId = getMissionStableId(mission);

    if (!missionId || resolvedIdSet.has(missionId)) {
      return;
    }

    resolved.push(mission);
    resolvedIdSet.add(missionId);
  }

  for (const missionId of normalizedSelectedMissionIds) {
    if (resolved.length >= limit) {
      break;
    }

    pushMission(
      liveMissionMap.get(missionId)
      || presentedMissionMap.get(missionId),
    );
  }

  for (const mission of liveMissionList) {
    if (resolved.length >= limit) {
      break;
    }

    pushMission(mission);
  }

  return resolved;
}

export function areMissionIdListsEqual(leftIds, rightIds) {
  const left = toStringArray(leftIds);
  const right = toStringArray(rightIds);

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function getNextSelectedMissionIds({
  isHydrated,
  currentSelectedMissionIds,
  resolvedMissions,
} = {}) {
  if (!isHydrated) {
    return null;
  }

  const nextSelectedMissionIds = getMissionStableIds(resolvedMissions);

  if (areMissionIdListsEqual(currentSelectedMissionIds, nextSelectedMissionIds)) {
    return null;
  }

  return nextSelectedMissionIds;
}

export function getMissionStableId(mission) {
  if (!mission || typeof mission !== "object") {
    return null;
  }

  if (typeof mission.definitionId === "string" && mission.definitionId.trim()) {
    return mission.definitionId.trim();
  }

  if (typeof mission.id === "string" && mission.id.trim()) {
    return mission.id.trim();
  }

  return null;
}

export function getMissionStableIds(missions) {
  if (!Array.isArray(missions)) {
    return [];
  }

  return missions
    .map((mission) => getMissionStableId(mission))
    .filter((missionId) => typeof missionId === "string" && missionId.trim());
}
const MAX_SELECTED_MISSIONS = 3;

export function selectMissions(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  return candidates.slice(0, MAX_SELECTED_MISSIONS);
}
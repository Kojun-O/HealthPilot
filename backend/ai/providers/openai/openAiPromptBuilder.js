const MAX_SELECTIONS = 3;

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickCandidateInput(candidate) {
  return {
    id: safeTrimString(candidate?.id),
    title: safeTrimString(candidate?.title),
    why: safeTrimString(candidate?.why),
    sourceInsightIds: Array.isArray(candidate?.sourceInsightIds)
      ? candidate.sourceInsightIds.filter((item) => typeof item === "string").map((item) => item.trim())
      : [],
  };
}

export function buildOpenAiSelectionPrompt(request) {
  const candidates = Array.isArray(request?.candidates)
    ? request.candidates.map(pickCandidateInput).filter((candidate) => candidate.id)
    : [];

  const instructions = [
    "You are Health Pilot AI decision support.",
    "Principles: Build tomorrow, today. Reduce cognition. Action first. People decide.",
    "Select missions only from provided candidates.",
    "Never create new mission text.",
    `Return at most ${MAX_SELECTIONS} selections.`,
    "Each missionId must exactly match a candidate id.",
    "Treat recommendations as hypotheses, not certainty.",
    "Do not make deterministic medical claims.",
    "Keep each reason concise and practical.",
    "If there are no valid candidates, return an empty selections array.",
  ].join("\n");

  const input = {
    date: safeTrimString(request?.date),
    checkIn: request?.checkIn && typeof request.checkIn === "object" ? request.checkIn : {},
    insights: Array.isArray(request?.insights) ? request.insights : [],
    candidates,
  };

  return {
    instructions,
    input,
  };
}

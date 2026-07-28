function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function toInsightArray(value) {
  return Array.isArray(value) ? value.slice() : [];
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}

function toRequestCandidate(candidate) {
  const id = toStringOrEmpty(candidate?.id);
  const title = toStringOrEmpty(candidate?.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    why: toStringOrEmpty(candidate?.why) || toStringOrEmpty(candidate?.rationale),
    sourceInsightIds: toStringArray(candidate?.sourceInsightIds),
  };
}

export function buildAiSelectionRequest(input = {}) {
  const candidates = Array.isArray(input?.candidates)
    ? input.candidates.map(toRequestCandidate).filter(Boolean)
    : [];

  return {
    date: toStringOrEmpty(input?.date),
    health: toPlainObject(input?.health),
    checkIn: toPlainObject(input?.checkIn),
    context: toPlainObject(input?.context),
    insights: toInsightArray(input?.insights),
    candidates,
  };
}

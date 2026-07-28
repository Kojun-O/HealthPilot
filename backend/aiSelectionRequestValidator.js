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

import { generateInsights } from "../insights/generateInsights.js";
import {
  generateFallbackMissionCandidates,
  generateMissionCandidates,
} from "./generateMissionCandidates.js";
import { selectMissions } from "./selectMissions.js";

const MAX_TODAY_MISSIONS = 3;

function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}

function toRoundedPositiveNumberOrDefault(value, defaultValue) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return defaultValue;
  }

  return Math.max(1, Math.round(numeric));
}

function resolveInsights(input) {
  if (Array.isArray(input?.insights)) {
    return input.insights;
  }

  return generateInsights(input?.normalizedHealthData ?? {});
}

function toTodayMission(candidate) {
  const definitionId = toStringOrEmpty(candidate?.id);
  const title = toStringOrEmpty(candidate?.title);

  if (!definitionId || !title) {
    return null;
  }

  return {
    definitionId,
    title,
    expectedImpact: toRoundedPositiveNumberOrDefault(candidate?.expectedImpact, 1),
    confidence: toStringOrEmpty(candidate?.confidence) || "Medium",
    why: toStringOrEmpty(candidate?.rationale),
    sourceInsightIds: toStringArray(candidate?.sourceInsightIds),
  };
}

export function buildTodayMissions(input) {
  const insights = resolveInsights(input);
  const candidates = generateMissionCandidates(insights);
  const fallbackCandidates = generateFallbackMissionCandidates(
    candidates,
    MAX_TODAY_MISSIONS,
  );
  const selectedMissions = selectMissions([...candidates, ...fallbackCandidates]);

  return selectedMissions.map(toTodayMission).filter(Boolean).slice(0, MAX_TODAY_MISSIONS);
}

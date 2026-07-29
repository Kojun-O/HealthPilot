import { generateInsights } from "../insights/generateInsights.js";
import {
  generateFallbackMissionCandidates,
  generateMissionCandidates,
} from "./generateMissionCandidates.js";
import { AISelectionClient, createAiSelectionClient } from "./aiSelectionClient.js";
import { buildAiSelectionRequest } from "./buildAiSelectionRequest.js";
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

function resolveAiSelectionClient(input) {
  if (input?.aiSelectionClient && typeof input.aiSelectionClient.selectMissions === "function") {
    return input.aiSelectionClient;
  }

  if (input?.aiSelectionTransport && typeof input.aiSelectionTransport.selectMissions === "function") {
    return createAiSelectionClient({
      transport: input.aiSelectionTransport,
    });
  }

  return AISelectionClient;
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

export async function buildTodayMissions(input) {
  const insights = resolveInsights(input);
  const candidates = generateMissionCandidates(insights);
  const fallbackCandidates = generateFallbackMissionCandidates(
    candidates,
    MAX_TODAY_MISSIONS,
  );
  const allCandidates = [...candidates, ...fallbackCandidates];
  const aiSelectionClient = resolveAiSelectionClient(input);

  let aiSelectionResponse = null;

  try {
    const aiSelectionRequest = buildAiSelectionRequest({
      date: input?.date,
      health: input?.health,
      checkIn: input?.checkIn,
      context: input?.context,
      insights,
      candidates: allCandidates,
    });

    console.info("MissionSelectionProbe route", {
      clientConstructorName: aiSelectionClient?.constructor?.name || "unknown",
      clientSourceFile:
        typeof aiSelectionClient?.__clientSourceFile === "string"
          ? aiSelectionClient.__clientSourceFile
          : "unknown",
      transportConstructorName:
        typeof aiSelectionClient?.__transportName === "string"
          ? aiSelectionClient.__transportName
          : "unknown",
      transportSourceFile:
        typeof aiSelectionClient?.__transportSourceFile === "string"
          ? aiSelectionClient.__transportSourceFile
          : "unknown",
    });

    console.info("MissionSelectionProbe client-call-start");
    aiSelectionResponse = await aiSelectionClient.selectMissions(aiSelectionRequest);
    console.info("MissionSelectionProbe client-call-result", {
      resultType: typeof aiSelectionResponse,
      resultIsNull: aiSelectionResponse === null,
      resultKeys:
        aiSelectionResponse && typeof aiSelectionResponse === "object"
          ? Object.keys(aiSelectionResponse)
          : [],
    });
  } catch (error) {
    console.info("MissionSelectionProbe client-call-error", {
      errorName: error?.name ?? "unknown",
      errorMessage: error?.message ?? "unknown",
    });
    aiSelectionResponse = null;
  }

  console.info("MissionSelectionProbe buildTodayMissionsInput", {
    aiSelectionResponseKeys:
      aiSelectionResponse && typeof aiSelectionResponse === "object" && !Array.isArray(aiSelectionResponse)
        ? Object.keys(aiSelectionResponse)
        : [],
  });

  const selectedMissions = selectMissions(allCandidates, {
    aiSelectionResponse,
  });

  const todayMissions = selectedMissions.map(toTodayMission).filter(Boolean).slice(0, MAX_TODAY_MISSIONS);

  if (typeof selectedMissions.tomorrowCapacityComment === "string") {
    Object.defineProperty(todayMissions, "tomorrowCapacityComment", {
      value: selectedMissions.tomorrowCapacityComment,
      enumerable: false,
      configurable: true,
    });
  }

  return todayMissions;
}

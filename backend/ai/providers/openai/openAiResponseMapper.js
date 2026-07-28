import { createOpenAiProviderError } from "./openAiErrorMapping.js";

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mapStructuredOutputToAiSelectionResponse(structuredOutput) {
  if (!isPlainObject(structuredOutput)) {
    throw createOpenAiProviderError("invalid structured response");
  }

  if (!Array.isArray(structuredOutput.selections)) {
    throw createOpenAiProviderError("invalid structured response");
  }

  const selections = structuredOutput.selections.map((selection) => {
    if (!isPlainObject(selection)) {
      throw createOpenAiProviderError("invalid structured response");
    }

    const missionId = safeTrimString(selection.missionId);

    if (!missionId) {
      throw createOpenAiProviderError("invalid structured response");
    }

    return {
      missionId,
      reason: safeTrimString(selection.reason),
      expectedImpact: Number.isFinite(selection.expectedImpact) ? selection.expectedImpact : 0,
      confidence: ["low", "medium", "high"].includes(selection.confidence) ? selection.confidence : "medium",
    };
  });

  if (
    selections.length === 0 &&
    safeTrimString(structuredOutput.tomorrowCapacityComment) === "" &&
    structuredOutput.safetyNote == null
  ) {
    throw createOpenAiProviderError("invalid structured response");
  }

  return {
    selections,
    tomorrowCapacityComment: safeTrimString(structuredOutput.tomorrowCapacityComment),
    safetyNote: typeof structuredOutput.safetyNote === "string" ? structuredOutput.safetyNote : null,
  };
}

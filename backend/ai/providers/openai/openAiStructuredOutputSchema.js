export const OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["selections", "tomorrowCapacityComment", "safetyNote"],
  properties: {
    selections: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["missionId", "reason", "expectedImpact", "confidence"],
        properties: {
          missionId: {
            type: "string",
            minLength: 1,
          },
          reason: {
            type: "string",
          },
          expectedImpact: {
            type: "number",
            minimum: -100,
            maximum: 100,
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
      },
    },
    tomorrowCapacityComment: {
      type: "string",
    },
    safetyNote: {
      type: ["string", "null"],
    },
  },
};

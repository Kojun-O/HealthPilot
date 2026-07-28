import { createAiProviderContract } from "../aiProvider.js";
import { assertValidOpenAiClientAdapter } from "./openai/openAiClientAdapterContract.js";
import { buildOpenAiSelectionPrompt } from "./openai/openAiPromptBuilder.js";
import { OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA } from "./openai/openAiStructuredOutputSchema.js";
import { getOpenAiModel } from "./openai/openAiConfig.js";
import { mapStructuredOutputToAiSelectionResponse } from "./openai/openAiResponseMapper.js";
import { createOpenAiProviderError, mapOpenAiClientError } from "./openai/openAiErrorMapping.js";

function safeTrimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createOpenAiProvider({ client, model } = {}) {
  assertValidOpenAiClientAdapter(client);

  const selectedModel = safeTrimString(model) || getOpenAiModel();
  if (!selectedModel) {
    throw createOpenAiProviderError("configuration error");
  }

  return createAiProviderContract({
    async selectMissions(request) {
      try {
        const prompt = buildOpenAiSelectionPrompt(request);

        const structured = await client.createStructuredResponse({
          model: selectedModel,
          instructions: prompt.instructions,
          input: prompt.input,
          schema: OPEN_AI_SELECTION_STRUCTURED_OUTPUT_SCHEMA,
        });

        if (!structured || typeof structured !== "object" || !("output" in structured)) {
          throw createOpenAiProviderError("invalid structured response");
        }

        return mapStructuredOutputToAiSelectionResponse(structured.output);
      } catch (error) {
        throw mapOpenAiClientError(error);
      }
    },
  });
}

import { mockAiInput } from "./mockInput";
import { mockAiOutput } from "./mockOutput";
import { insightSchema } from "./schema";
import { SYSTEM_PROMPT } from "./systemPrompt";

export async function generateHealthPilotInsight(input = mockAiInput) {
  console.log("Health Pilot AI input:", input);
  console.log("Health Pilot system prompt:", SYSTEM_PROMPT);
  console.log("Health Pilot insight schema:", insightSchema);

  // v0.1:
  // GPT API is not connected yet.
  // This is the single gateway for future AI generation.
  //
  // Future flow:
  // input + SYSTEM_PROMPT + insightSchema
  // -> GPT
  // -> structured Health Pilot insight
  //
  // Current flow:
  // mock input -> mock output

  return mockAiOutput;
}
import { mockAiInput } from "./mockInput";
import { mockAiOutput } from "./mockOutput";
import { SYSTEM_PROMPT } from "./systemPrompt";

export async function generateHealthPilotInsight(input = mockAiInput) {
  // v0.1:
  // GPT API is not connected yet.
  // This function is the single gateway for future AI generation.
  //
  // Future flow:
  // input + SYSTEM_PROMPT -> GPT -> structured Health Pilot insight
  //
  // Current flow:
  // mock input -> mock output

  console.log("Health Pilot AI input:", input);
  console.log("Health Pilot system prompt:", SYSTEM_PROMPT);

  return mockAiOutput;
}
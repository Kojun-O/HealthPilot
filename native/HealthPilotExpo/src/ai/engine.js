import { buildHealthPilotPrompt } from "./prompt";
import { mockAiInput } from "./mockInput";
import { mockAiOutput } from "./mockOutput";

export async function generateHealthPilotInsight(input = mockAiInput) {
  const prompt = buildHealthPilotPrompt(input);

  console.log("Health Pilot AI input:", input);
  console.log("Health Pilot prompt:", prompt);

  // v0.1:
  // GPT API is not connected yet.
  //
  // Future flow:
  // prompt -> GPT -> structured Health Pilot insight
  //
  // Current flow:
  // mock input -> mock output

  return mockAiOutput;
}
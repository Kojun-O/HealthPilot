import { buildHealthPilotPrompt } from "./prompt";
import { mockAiInput } from "./mockInput";
import { mockAiOutput } from "./mockOutput";
import { callOpenAiForInsight } from "./openaiClient";

const USE_GPT = false;

export async function generateHealthPilotInsight(input = mockAiInput) {
  const prompt = buildHealthPilotPrompt(input);

  console.log("Health Pilot AI input:", input);
  console.log("Health Pilot prompt:", prompt);

  if (USE_GPT) {
    return callOpenAiForInsight(prompt);
  }

  return mockAiOutput;
}
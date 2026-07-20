import { buildHealthPilotPrompt } from "./prompt";
import { buildAiInput } from "./mockInput";
import { generateBriefing } from "./generateBriefing";
import { mockAiOutput } from "./mockOutput";
import { callOpenAiForInsight } from "./openaiClient";

const USE_GPT = false;

export async function generateHealthPilotInsight(input) {
  const resolvedInput = input ?? (await buildAiInput()).input;
  const prompt = buildHealthPilotPrompt(resolvedInput);

  console.log("Health Pilot AI input:", resolvedInput);
  console.log("Health Pilot prompt:", prompt);

  if (USE_GPT) {
    return callOpenAiForInsight(prompt);
  }

  return {
    ...mockAiOutput,
    aiBriefing: generateBriefing(resolvedInput.normalizedHealthData),
  };
}
import { buildHealthPilotPrompt } from "./prompt.js";
import { buildAiInput } from "./mockInput.js";
import { generateBriefing } from "./generateBriefing.js";
import { mockAiOutput } from "./mockOutput.js";
import { callOpenAiForInsight } from "./openaiClient.js";
import { buildTodayMissions } from "./missions/buildTodayMissions.js";

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
    missions: await buildTodayMissions(resolvedInput),
    aiBriefing: generateBriefing(resolvedInput.normalizedHealthData),
  };
}
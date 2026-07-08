import { insightSchema } from "./schema";
import { SYSTEM_PROMPT } from "./systemPrompt";

export function buildHealthPilotPrompt(input) {
  return `
${SYSTEM_PROMPT}

Return only JSON.
Do not include markdown.
Do not include explanations outside JSON.

The JSON must follow this structure:

${JSON.stringify(insightSchema, null, 2)}

Input:

${JSON.stringify(input, null, 2)}
`;
}
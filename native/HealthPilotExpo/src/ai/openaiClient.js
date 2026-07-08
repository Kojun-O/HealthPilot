export async function callOpenAiForInsight(prompt) {
  // Do not call OpenAI directly from the mobile app.
  // API keys must never be stored inside the iPhone app.
  //
  // Future:
  // HealthPilot app
  // -> your backend
  // -> OpenAI API
  // -> structured JSON response

  throw new Error(
    "OpenAI API is not connected yet. Use backend proxy before enabling GPT."
  );
}
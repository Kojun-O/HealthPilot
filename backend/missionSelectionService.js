import { assertValidAiProvider } from "./ai/aiProvider.js";

export function createMissionSelectionService({ provider } = {}) {
  if (provider == null) {
    throw new TypeError("createMissionSelectionService requires a provider");
  }

  assertValidAiProvider(provider);

  return {
    async selectMissions(request) {
      return provider.selectMissions(request);
    },
  };
}

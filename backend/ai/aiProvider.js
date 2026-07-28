function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function assertValidAiProvider(provider) {
  if (!isPlainObject(provider) || typeof provider.selectMissions !== "function") {
    throw new TypeError("AIProvider must implement selectMissions(request)");
  }
}

export function createAiProviderContract(provider) {
  assertValidAiProvider(provider);
  return provider;
}

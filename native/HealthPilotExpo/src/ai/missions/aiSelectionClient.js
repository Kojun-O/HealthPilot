import { MockTransport } from "./transports/mockTransport.js";

function resolveTransport(transport) {
  if (transport && typeof transport.selectMissions === "function") {
    return transport;
  }

  return MockTransport;
}

export function createAiSelectionClient(options = {}) {
  const transport = resolveTransport(options.transport);

  return {
    async selectMissions(request) {
      return await transport.selectMissions(request);
    },
  };
}

// Backward-compatible alias for older imports.
export const createAISelectionClient = createAiSelectionClient;

export const AISelectionClient = createAiSelectionClient();
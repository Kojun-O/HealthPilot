import { MockTransport } from "./transports/mockTransport.js";
import { HttpAiSelectionTransport } from "./transports/httpAiSelectionTransport.js";

const AI_SELECTION_CLIENT_SOURCE_FILE = import.meta.url;

function resolveTransport(transport) {
  if (transport && typeof transport.selectMissions === "function") {
    return transport;
  }

  return HttpAiSelectionTransport;
}

export function createAiSelectionClient(options = {}) {
  const transport = resolveTransport(options.transport);
  const transportName =
    typeof transport?.__transportName === "string" && transport.__transportName
      ? transport.__transportName
      : transport?.constructor?.name || "UnknownTransport";
  const transportSourceFile =
    typeof transport?.__sourceFile === "string" && transport.__sourceFile
      ? transport.__sourceFile
      : "unknown";

  return {
    __clientSourceFile: AI_SELECTION_CLIENT_SOURCE_FILE,
    __transportName: transportName,
    __transportSourceFile: transportSourceFile,
    async selectMissions(request) {
      return await transport.selectMissions(request);
    },
  };
}

// Backward-compatible alias for older imports.
export const createAISelectionClient = createAiSelectionClient;

export const AISelectionClient = createAiSelectionClient();
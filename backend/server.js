import http from "node:http";
import { fileURLToPath } from "node:url";
import { buildFixedAiSelectionResponse, isValidAiSelectionRequest } from "./missionSelectionService.js";

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const DEFAULT_PORT = Number(process.env.PORT || 8787);
const DEFAULT_HOST = process.env.HOST || "0.0.0.0";

export const BACKEND_LISTEN_HOST = DEFAULT_HOST;

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function writeJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", JSON_CONTENT_TYPE);
  setCorsHeaders(response);
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody.trim()) {
    return null;
  }

  return JSON.parse(rawBody);
}

async function handleMissionSelection(request, response) {
  try {
    // Dev signal for request arrival without logging health payload content.
    console.info("Backend request received");
    const body = await readJsonBody(request);

    if (!isValidAiSelectionRequest(body)) {
      writeJson(response, 400, {
        error: "Invalid AI Selection Request",
      });
      return;
    }

    const fixedResponse = buildFixedAiSelectionResponse(body);
    writeJson(response, 200, fixedResponse);
  } catch (error) {
    if (error instanceof SyntaxError) {
      writeJson(response, 400, {
        error: "Invalid JSON body",
      });
      return;
    }

    writeJson(response, 500, {
      error: "Internal Server Error",
    });
  }
}

export function createBackendServer() {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://localhost");

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      setCorsHeaders(response);
      response.end();
      return;
    }

    if (requestUrl.pathname === "/ai/mission-selection" && request.method === "POST") {
      await handleMissionSelection(request, response);
      return;
    }

    writeJson(response, 404, {
      error: "Not Found",
    });
  });
}

const entryFilePath = process.argv[1] ? process.argv[1].replace(/\\/g, "/") : "";

if (fileURLToPath(import.meta.url).replace(/\\/g, "/") === entryFilePath) {
  const server = createBackendServer();

  server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Health Pilot Backend listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}`);
  });
}

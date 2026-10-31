import {
  hasValidOllamaApiKey,
  resolveOllamaModel,
  ALLOWED_OLLAMA_MODELS,
} from "../../server/ollamaClient";
import { BUSINESS_TOOLS } from "../../server/businessTools";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const connected = hasValidOllamaApiKey();
  const model = resolveOllamaModel();

  res.status(200).json({
    connected,
    provider: "Ollama Cloud",
    model,
    availableModels: ALLOWED_OLLAMA_MODELS,
    endpoints: [
      "POST /api/ai/chat",
      "POST /api/ai/analyze",
      "POST /api/ai/insights",
      "GET /api/ai/status",
    ],
    toolsCount: BUSINESS_TOOLS.length,
    tools: BUSINESS_TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
    })),
    ...(connected
      ? {}
      : {
          message:
            "OLLAMA_API_KEY is missing. Set OLLAMA_API_KEY in your environment variables.",
        }),
  });
}

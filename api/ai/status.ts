import {
  hasValidGeminiApiKey,
  GEMINI_FLASH_MODEL,
  ALLOWED_GEMINI_MODELS,
} from "../../server/geminiClient.ts";
import { BUSINESS_TOOL_DECLARATIONS } from "../../server/businessTools.ts";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const connected = hasValidGeminiApiKey();
  res.status(200).json({
    connected,
    model: GEMINI_FLASH_MODEL,
    availableModels: ALLOWED_GEMINI_MODELS,
    endpoints: [
      "POST /api/ai/chat",
      "POST /api/ai/analyze",
      "POST /api/ai/insights",
    ],
    toolsCount: BUSINESS_TOOL_DECLARATIONS.length,
    tools: BUSINESS_TOOL_DECLARATIONS.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    ...(connected
      ? {}
      : {
          message:
            "GEMINI_API_KEY is missing or set to a placeholder. Set GEMINI_API_KEY in Vercel Project Settings > Environment Variables.",
        }),
  });
}

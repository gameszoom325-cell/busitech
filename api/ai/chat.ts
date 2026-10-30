import { runBusinessAgentWithTools } from "../../server/businessTools.ts";
import { formatGeminiError } from "../../server/geminiClient.ts";
import type { AgentRolePersona } from "../../server/businessTools.ts";

const MAX_INPUT_CHARS = 50000;

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      prompt,
      message,
      history,
      snapshot,
      mode,
      model,
      rolePersona,
      useSearchGrounding,
    } = body;

    const rawPrompt =
      typeof prompt === "string"
        ? prompt
        : typeof message === "string"
        ? message
        : "";

    if (!rawPrompt.trim()) {
      res.status(400).json({
        error: "Please provide a non-empty prompt or message for AI chat.",
        code: "INVALID_REQUEST",
      });
      return;
    }

    if (rawPrompt.length > MAX_INPUT_CHARS) {
      res.status(400).json({
        error: `Input exceeds maximum allowed length of ${MAX_INPUT_CHARS} characters.`,
        code: "INPUT_TOO_LARGE",
      });
      return;
    }

    const result = await runBusinessAgentWithTools({
      prompt: rawPrompt.trim(),
      history: Array.isArray(history) ? history : [],
      snapshot,
      mode: mode === "command" ? "command" : "agent",
      model: typeof model === "string" ? model : undefined,
      rolePersona: rolePersona as AgentRolePersona | undefined,
      useSearchGrounding: Boolean(useSearchGrounding),
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    const formatted = formatGeminiError(
      err,
      "Failed to process AI chat request with Gemini API."
    );
    console.warn(`[/api/ai/chat] ${formatted.code}: ${formatted.message}`);
    res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
    });
  }
}

import OpenAI from "openai";
import {
  getNvidiaClient,
  NVIDIA_MODEL,
  formatNvidiaError,
} from "../../server/nvidiaClient.ts";

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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

    // Read the key inside the request handler (not at module load), and trim it
    const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
    if (!apiKey) {
      res.status(401).json({
        error:
          "NVIDIA API key is not configured. Please add NVIDIA_API_KEY in Vercel Project Settings > Environment Variables.",
        code: "MISSING_API_KEY",
      });
      return;
    }

    const client = getNvidiaClient(apiKey);

    const systemPrompt = `You are the AI Business Assistant for Contract2Action AI (Busitech).
You help enterprise users track contracts, audit legal obligations, monitor upcoming compliance deadlines, and triage human-in-the-loop approval workflows.
Platform routes: Overview (/overview), Contracts (/contracts), Obligations (/obligations), Approvals (/approvals), Activity Log (/activity), Settings (/settings).
Keep answers concise, direct, professional, and actionable.`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(body.messages) && body.messages.length > 0) {
      for (const m of body.messages) {
        messages.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || m.text || ""),
        });
      }
    } else if (Array.isArray(body.history) && body.history.length > 0) {
      for (const h of body.history) {
        messages.push({
          role:
            h.role === "model" || h.role === "assistant"
              ? "assistant"
              : "user",
          content: String(h.text || h.content || ""),
        });
      }
    }

    const userPrompt = String(body.message || body.prompt || "").trim();
    if (userPrompt) {
      messages.push({ role: "user", content: userPrompt });
    }

    if (messages.length === 1 && !userPrompt) {
      res.status(400).json({
        error: "Please provide a non-empty message or prompt.",
        code: "INVALID_REQUEST",
      });
      return;
    }

    // Client-side UI command detection for Command Bar navigation
    const clientActions: Array<{ type: string; payload: Record<string, unknown> }> = [];
    const lowerPrompt = userPrompt.toLowerCase();
    if (
      lowerPrompt.includes("go to contracts") ||
      lowerPrompt.includes("open contracts") ||
      lowerPrompt.includes("view contracts")
    ) {
      clientActions.push({ type: "NAVIGATE", payload: { route: "/contracts" } });
    } else if (
      lowerPrompt.includes("go to obligations") ||
      lowerPrompt.includes("open obligations") ||
      lowerPrompt.includes("view obligations")
    ) {
      clientActions.push({ type: "NAVIGATE", payload: { route: "/obligations" } });
    } else if (
      lowerPrompt.includes("go to approvals") ||
      lowerPrompt.includes("open approvals") ||
      lowerPrompt.includes("view approvals")
    ) {
      clientActions.push({ type: "NAVIGATE", payload: { route: "/approvals" } });
    } else if (
      lowerPrompt.includes("go to overview") ||
      lowerPrompt.includes("open overview")
    ) {
      clientActions.push({ type: "NAVIGATE", payload: { route: "/overview" } });
    } else if (
      lowerPrompt.includes("dark mode") ||
      lowerPrompt.includes("theme dark")
    ) {
      clientActions.push({ type: "SET_THEME", payload: { theme: "dark" } });
    } else if (
      lowerPrompt.includes("light mode") ||
      lowerPrompt.includes("theme light")
    ) {
      clientActions.push({ type: "SET_THEME", payload: { theme: "light" } });
    }

    // Route all model selections (including fallback option) to the working NVIDIA DeepSeek model
    const requestedModel = String(body.model || "").trim();
    const modelToUse = NVIDIA_MODEL;

    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 2048,
      stream: false,
    });

    const replyText =
      completion.choices[0]?.message?.content?.trim() ||
      "Action completed successfully.";

    res.status(200).json({
      reply: replyText,
      toolCalls: [],
      clientActions,
      suggestedFollowUps: [
        "Analyze portfolio risk distribution",
        "Show all overdue obligations",
        "Review pending human-gate approvals",
      ],
      modelUsed: modelToUse,
      requestedModel: requestedModel || modelToUse,
    });
  } catch (err: unknown) {
    const formatted = formatNvidiaError(
      err,
      "Failed to process request with NVIDIA DeepSeek API."
    );
    console.warn(`[/api/ai/chat] ${formatted.code}: ${formatted.message}`);
    res.status(formatted.status).json({
      error: formatted.message,
      code: formatted.code,
    });
  }
}

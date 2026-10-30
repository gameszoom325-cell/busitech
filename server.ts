import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  BUSINESS_TOOL_DECLARATIONS,
  runBusinessAgentWithTools,
  extractObligationsFromText,
  AgentRolePersona,
} from "./server/businessTools.ts";
import {
  GEMINI_FLASH_MODEL,
  ALLOWED_GEMINI_MODELS,
  hasValidGeminiApiKey,
  formatGeminiError,
} from "./server/geminiClient.ts";
import { buildContractMetadataPayload } from "./src/services/contractCache.ts";
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS } from "./src/data/mockData.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "5mb" }));

  /**
   * GET /api/contracts/metadata
   * Returns contract metadata, executive summaries, key clauses, and obligations preview
   * for Service Worker Cache Storage and localStorage offline resilience.
   */
  app.get("/api/contracts/metadata", (_req: Request, res: Response) => {
    const payload = buildContractMetadataPayload(
      MOCK_CONTRACTS,
      MOCK_OBLIGATIONS,
      "network",
      new Date().toISOString()
    );
    res.setHeader("Cache-Control", "no-cache");
    res.json(payload);
  });

  /**
   * GET /api/gemini/status
   * Returns Gemini service status, active models, and registered business tools.
   */
  app.get("/api/gemini/status", (_req: Request, res: Response) => {
    const connected = hasValidGeminiApiKey();
    res.json({
      connected,
      model: GEMINI_FLASH_MODEL,
      availableModels: ALLOWED_GEMINI_MODELS,
      toolsCount: BUSINESS_TOOL_DECLARATIONS.length,
      tools: BUSINESS_TOOL_DECLARATIONS.map((t) => ({
        name: t.name,
        description: t.description,
      })),
      ...(connected
        ? {}
        : {
            message:
              "GEMINI_API_KEY is missing or set to a placeholder. Add your key in .env or Settings > Secrets.",
          }),
    });
  });

  /**
   * POST /api/gemini/command
   * Fast AI Command Bar endpoint with function calling support.
   */
  app.post("/api/gemini/command", async (req: Request, res: Response) => {
    try {
      const { prompt, snapshot, model, useSearchGrounding } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({
          error: "Please provide a non-empty command prompt.",
          code: "INVALID_REQUEST",
        });
        return;
      }

      const result = await runBusinessAgentWithTools({
        prompt: prompt.trim(),
        snapshot,
        mode: "command",
        model,
        useSearchGrounding: Boolean(useSearchGrounding),
      });

      res.json(result);
    } catch (err: unknown) {
      console.error("Error in /api/gemini/command:", err);
      const formatted = formatGeminiError(
        err,
        "Failed to process command with Gemini API."
      );
      res.status(formatted.status).json({
        error: formatted.message,
        code: formatted.code,
      });
    }
  });

  /**
   * POST /api/gemini/agent
   * Multi-turn AI Business Agent endpoint with autonomous tool calling,
   * selectable Gemini models (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite),
   * role personas, and live Google Search Grounding.
   */
  app.post("/api/gemini/agent", async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        history,
        snapshot,
        model,
        rolePersona,
        useSearchGrounding,
      } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({
          error: "Please provide a message for the AI Business Agent.",
          code: "INVALID_REQUEST",
        });
        return;
      }

      const result = await runBusinessAgentWithTools({
        prompt: prompt.trim(),
        history: Array.isArray(history) ? history : [],
        snapshot,
        mode: "agent",
        model: typeof model === "string" ? model : undefined,
        rolePersona: rolePersona as AgentRolePersona | undefined,
        useSearchGrounding: Boolean(useSearchGrounding),
      });

      res.json(result);
    } catch (err: unknown) {
      console.error("Error in /api/gemini/agent:", err);
      const formatted = formatGeminiError(
        err,
        "Failed to run AI Business Agent with Gemini API."
      );
      res.status(formatted.status).json({
        error: formatted.message,
        code: formatted.code,
      });
    }
  });

  /**
   * POST /api/gemini/extract
   * Structured JSON contract clause & obligation extractor powered by Gemini responseSchema.
   */
  app.post("/api/gemini/extract", async (req: Request, res: Response) => {
    try {
      const { contractName, counterparty, contractText } = req.body || {};
      if (!contractText || typeof contractText !== "string" || !contractText.trim()) {
        res.status(400).json({
          error: "Please provide contract text to analyze.",
          code: "INVALID_REQUEST",
        });
        return;
      }

      const extraction = await extractObligationsFromText({
        contractName: contractName || "Master Services Agreement",
        counterparty: counterparty || "Enterprise Counterparty",
        contractText: contractText.trim(),
      });

      res.json(extraction);
    } catch (err: unknown) {
      console.error("Error in /api/gemini/extract:", err);
      const formatted = formatGeminiError(
        err,
        "Failed to extract contract obligations with Gemini API."
      );
      res.status(formatted.status).json({
        error: formatted.message,
        code: formatted.code,
      });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
        watch: process.env.DISABLE_HMR === "true" ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Busitech Server running on http://localhost:${PORT} (Gemini API key configured: ${hasValidGeminiApiKey()})`
    );
  });
}

startServer();

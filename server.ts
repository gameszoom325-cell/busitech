import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  BUSINESS_TOOL_DECLARATIONS,
  runBusinessAgentWithTools,
  extractObligationsFromText,
  generateBusinessInsights,
  AgentRolePersona,
} from "./server/businessTools.ts";
import {
  NVIDIA_MODEL,
  ALLOWED_MODELS,
  hasValidNvidiaApiKey,
  formatNvidiaError,
  getNvidiaClient,
} from "./server/nvidiaClient.ts";
import { formatGeminiError } from "./server/geminiClient.ts";
import { buildContractMetadataPayload } from "./src/services/contractCache.ts";
import { verifyAuth, optionalAuth, AuthenticatedRequest } from "./src/middleware/auth.ts";
import {
  syncUser,
  getUserPreferencesFromDb,
  updateUserPreferencesInDb,
} from "./src/db/users.ts";
import {
  getContractsFromDb,
  upsertContractInDb,
  getObligationsFromDb,
  upsertObligationInDb,
  getApprovalsFromDb,
  updateApprovalStatusInDb,
  getActivityLogsFromDb,
  appendActivityLogInDb,
} from "./src/db/repository.ts";

dotenv.config();

// Basic in-memory rate-limiting store for AI endpoints (per IP, 60 requests / minute)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitBucketing = new Map<
  string,
  { count: number; resetAt: number }
>();

function aiRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "local";
  const now = Date.now();
  const entry = rateLimitBucketing.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitBucketing.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(RATE_LIMIT_MAX_REQUESTS - 1)
    );
    next();
    return;
  }

  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(remaining));

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error:
        "Too many AI requests from this client. Please wait a moment before trying again.",
      code: "CLIENT_RATE_LIMITED",
    });
    return;
  }

  next();
}

const MAX_INPUT_CHARS = 50000;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "5mb" }));

  // Catch malformed JSON request bodies and return clean JSON instead of Express's default HTML error page
  app.use(
    (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
          error: "Invalid JSON payload provided in request body.",
          code: "INVALID_JSON_BODY",
        });
        return;
      }
      next(err);
    }
  );

  /**
   * POST /api/auth/sync & GET /api/user/profile
   * Verifies Firebase ID token and synchronizes the authenticated user into Cloud SQL.
   */
  const handleUserSync = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dbUser = await syncUser(req.user!, req.body?.preferences);
      res.json({ user: dbUser });
    } catch (error) {
      console.error("Failed to sync user to Cloud SQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  app.post("/api/auth/sync", verifyAuth, handleUserSync);
  app.get("/api/user/profile", verifyAuth, handleUserSync);

  /**
   * GET /api/user/preferences & PATCH /api/user/preferences
   * Reads or updates the user's deadline email alert preferences linked to their Firebase UID.
   */
  app.get(
    "/api/user/preferences",
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const uid =
          req.user?.uid ||
          (typeof req.query.uid === "string" ? req.query.uid : "");
        if (!uid) {
          res.status(400).json({ error: "User uid is required." });
          return;
        }
        const profile = await getUserPreferencesFromDb(uid);
        res.json({
          uid,
          preferences: {
            emailAlertsEnabled: profile?.emailAlertsEnabled ?? true,
            deadlineAlertLeadHours: profile?.deadlineAlertLeadHours ?? 48,
            highRiskAlertsOnly: profile?.highRiskAlertsOnly ?? false,
            dailyDigestEnabled: profile?.dailyDigestEnabled ?? true,
          },
          user: profile,
        });
      } catch (error) {
        console.error("Error reading user preferences:", error);
        res.status(500).json({ error: "Failed to load user preferences" });
      }
    }
  );

  app.patch(
    "/api/user/preferences",
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const {
          uid: bodyUid,
          email: bodyEmail,
          name: bodyName,
          emailAlertsEnabled,
          deadlineAlertLeadHours,
          highRiskAlertsOnly,
          dailyDigestEnabled,
        } = req.body || {};

        const uid = req.user?.uid || bodyUid;
        const email = req.user?.email || bodyEmail || "";
        const name = req.user?.name || bodyName;

        if (!uid) {
          res.status(400).json({ error: "User uid is required." });
          return;
        }

        const updatedUser = await updateUserPreferencesInDb(uid, email, name, {
          emailAlertsEnabled,
          deadlineAlertLeadHours,
          highRiskAlertsOnly,
          dailyDigestEnabled,
        });

        res.json({
          ok: true,
          user: updatedUser,
          preferences: {
            emailAlertsEnabled: updatedUser.emailAlertsEnabled,
            deadlineAlertLeadHours: updatedUser.deadlineAlertLeadHours,
            highRiskAlertsOnly: updatedUser.highRiskAlertsOnly,
            dailyDigestEnabled: updatedUser.dailyDigestEnabled,
          },
        });
      } catch (error) {
        console.error("Error updating user preferences:", error);
        res.status(500).json({ error: "Failed to update user preferences" });
      }
    }
  );

  /**
   * GET /api/contracts/metadata
   * Returns contract metadata, executive summaries, key clauses, and obligations preview
   * from Cloud SQL for Service Worker Cache Storage and localStorage offline resilience.
   */
  app.get("/api/contracts/metadata", async (_req: Request, res: Response) => {
    try {
      const [dbContracts, dbObligations] = await Promise.all([
        getContractsFromDb(),
        getObligationsFromDb(),
      ]);
      const payload = buildContractMetadataPayload(
        dbContracts,
        dbObligations,
        "network",
        new Date().toISOString()
      );
      res.setHeader("Cache-Control", "no-cache");
      res.json(payload);
    } catch (error) {
      console.error("Error fetching contract metadata:", error);
      res.status(500).json({ error: "Failed to load contract metadata" });
    }
  });

  /**
   * Cloud SQL REST Endpoints for Contracts, Obligations, Approvals, and Activity Logs
   */
  app.get("/api/contracts", optionalAuth, async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await getContractsFromDb();
    res.json({ contracts: rows });
  });

  app.post("/api/contracts", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const contract = req.body;
    if (!contract || !contract.id || !contract.name) {
      res.status(400).json({ error: "Contract id and name are required." });
      return;
    }
    const saved = await upsertContractInDb(contract, req.user?.uid);
    res.json({ contract: saved });
  });

  app.get("/api/obligations", optionalAuth, async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await getObligationsFromDb();
    res.json({ obligations: rows });
  });

  app.post("/api/obligations", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const obligation = req.body;
    if (!obligation || !obligation.id || !obligation.title) {
      res.status(400).json({ error: "Obligation id and title are required." });
      return;
    }
    const saved = await upsertObligationInDb(obligation);
    res.json({ obligation: saved });
  });

  app.get("/api/approvals", optionalAuth, async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await getApprovalsFromDb();
    res.json({ approvals: rows });
  });

  app.patch("/api/approvals/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, resolvedBy, resolvedAt } = req.body || {};
    if (!status) {
      res.status(400).json({ error: "Approval status is required." });
      return;
    }
    await updateApprovalStatusInDb(id, status, resolvedBy, resolvedAt);
    res.json({ ok: true, id, status });
  });

  app.get("/api/activity-logs", optionalAuth, async (_req: AuthenticatedRequest, res: Response) => {
    const rows = await getActivityLogsFromDb();
    res.json({ activityLogs: rows });
  });

  app.post("/api/activity-logs", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    const event = req.body;
    if (!event || !event.id || !event.action) {
      res.status(400).json({ error: "Activity log id and action are required." });
      return;
    }
    const saved = await appendActivityLogInDb(event);
    res.json({ activityLog: saved });
  });

  /**
   * Shared handler for GET /api/ai/status
   */
  const handleStatusRequest = (_req: Request, res: Response) => {
    const connected = hasValidNvidiaApiKey();
    res.json({
      connected,
      provider: "NVIDIA",
      model: NVIDIA_MODEL,
      availableModels: ALLOWED_MODELS,
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
              "NVIDIA_API_KEY is missing. Set NVIDIA_API_KEY in your environment variables.",
          }),
    });
  };

  app.get("/api/ai/status", handleStatusRequest);

  /**
   * POST /api/ai/chat
   * Powered by NVIDIA OpenAI-compatible API (DeepSeek V4.1 Flash)
   */
  app.post(
    "/api/ai/chat",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
      try {
        const body = req.body || {};
        const {
          prompt,
          message,
          messages: inputMessages,
          history,
        } = body;

        const client = getNvidiaClient();

        const systemPrompt = `You are the AI Business Assistant for Contract2Action AI (Busitech).
You help enterprise users track contracts, audit legal obligations, monitor upcoming compliance deadlines, and triage human-in-the-loop approval workflows.
Platform routes: Overview (/overview), Contracts (/contracts), Obligations (/obligations), Approvals (/approvals), Activity Log (/activity), Settings (/settings).
Keep answers concise, direct, professional, and actionable.`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ];

        if (Array.isArray(inputMessages) && inputMessages.length > 0) {
          for (const m of inputMessages) {
            messages.push({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content || m.text || ""),
            });
          }
        } else if (Array.isArray(history) && history.length > 0) {
          for (const h of history) {
            messages.push({
              role:
                h.role === "model" || h.role === "assistant"
                  ? "assistant"
                  : "user",
              content: String(h.text || h.content || ""),
            });
          }
        }

        const userPrompt = String(message || prompt || "").trim();
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

        const completion = await client.chat.completions.create({
          model: NVIDIA_MODEL,
          messages,
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 2048,
          stream: false,
        });

        const replyText =
          completion.choices[0]?.message?.content?.trim() ||
          "Action completed successfully.";

        res.json({
          reply: replyText,
          toolCalls: [],
          clientActions,
          suggestedFollowUps: [
            "Analyze portfolio risk distribution",
            "Show all overdue obligations",
            "Review pending human-gate approvals",
          ],
          modelUsed: NVIDIA_MODEL,
        });
      } catch (err: unknown) {
        const formatted = formatNvidiaError(
          err,
          "Failed to process AI chat request with NVIDIA DeepSeek API."
        );
        console.warn(`[/api/ai/chat] ${formatted.code}: ${formatted.message}`);
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  /**
   * POST /api/ai/analyze
   * Analyze business information, contract clauses, or operational data.
   * - When `contractText` is provided, extracts structured obligations, risk score, and clause summary.
   * - When general `data`, `prompt`, or `text` is provided, runs deep business/contract analysis via Gemini.
   */
  app.post(
    "/api/ai/analyze",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
      try {
        const {
          contractName,
          counterparty,
          contractText,
          prompt,
          data,
          text,
          snapshot,
          model,
        } = req.body || {};

        // Path 1: Structured Contract Clause & Obligation Extraction
        if (typeof contractText === "string" && contractText.trim()) {
          if (contractText.length > MAX_INPUT_CHARS) {
            res.status(400).json({
              error: `Contract text exceeds maximum length of ${MAX_INPUT_CHARS} characters.`,
              code: "INPUT_TOO_LARGE",
            });
            return;
          }

          const extraction = await extractObligationsFromText({
            contractName: contractName || "Master Services Agreement",
            counterparty: counterparty || "Enterprise Counterparty",
            contractText: contractText.trim(),
          });

          res.json(extraction);
          return;
        }

        // Path 2: General Business Information / Data Analysis
        const analysisInput =
          typeof prompt === "string" && prompt.trim()
            ? prompt.trim()
            : typeof text === "string" && text.trim()
            ? text.trim()
            : data !== undefined
            ? typeof data === "string"
              ? data.trim()
              : JSON.stringify(data)
            : "";

        if (!analysisInput) {
          res.status(400).json({
            error:
              "Please provide 'contractText', 'prompt', or 'data' to analyze.",
            code: "INVALID_REQUEST",
          });
          return;
        }

        if (analysisInput.length > MAX_INPUT_CHARS) {
          res.status(400).json({
            error: `Analysis input exceeds maximum length of ${MAX_INPUT_CHARS} characters.`,
            code: "INPUT_TOO_LARGE",
          });
          return;
        }

        const analysisResult = await runBusinessAgentWithTools({
          prompt: `Analyze the following business/contract information and provide structured findings, risk exposure, and recommended actions:\n\n${analysisInput}`,
          snapshot,
          mode: "agent",
          model: typeof model === "string" ? model : undefined,
          rolePersona: "risk_analyst",
        });

        res.json({
          analysis: analysisResult.reply,
          reply: analysisResult.reply,
          toolCalls: analysisResult.toolCalls,
          clientActions: analysisResult.clientActions,
          modelUsed: analysisResult.modelUsed,
        });
      } catch (err: unknown) {
        const formatted = formatGeminiError(
          err,
          "Failed to analyze business data with Gemini API."
        );
        console.warn(
          `[/api/ai/analyze] ${formatted.code}: ${formatted.message}`
        );
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  /**
   * POST /api/ai/insights
   * Generates executive business insights, portfolio health score, and priority actions.
   */
  app.post(
    "/api/ai/insights",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { focusArea, prompt, snapshot } = req.body || {};

        const insightsResult = await generateBusinessInsights({
          focusArea: typeof focusArea === "string" ? focusArea : undefined,
          prompt: typeof prompt === "string" ? prompt : undefined,
          snapshot,
        });

        res.json(insightsResult);
      } catch (err: unknown) {
        const formatted = formatGeminiError(
          err,
          "Failed to generate business insights with Gemini API."
        );
        console.warn(
          `[/api/ai/insights] ${formatted.code}: ${formatted.message}`
        );
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  /**
   * Backward-compatible aliases under /api/gemini/*
   */
  app.post(
    "/api/gemini/command",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
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
        const formatted = formatGeminiError(
          err,
          "Failed to process command with Gemini API."
        );
        console.warn(
          `[/api/gemini/command] ${formatted.code}: ${formatted.message}`
        );
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  app.post(
    "/api/gemini/agent",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
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
        const formatted = formatGeminiError(
          err,
          "Failed to run AI Business Agent with Gemini API."
        );
        console.warn(
          `[/api/gemini/agent] ${formatted.code}: ${formatted.message}`
        );
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  app.post(
    "/api/gemini/extract",
    aiRateLimitMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { contractName, counterparty, contractText } = req.body || {};
        if (
          !contractText ||
          typeof contractText !== "string" ||
          !contractText.trim()
        ) {
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
        const formatted = formatGeminiError(
          err,
          "Failed to extract contract obligations with Gemini API."
        );
        console.warn(
          `[/api/gemini/extract] ${formatted.code}: ${formatted.message}`
        );
        res.status(formatted.status).json({
          error: formatted.message,
          code: formatted.code,
        });
      }
    }
  );

  // Catch-all for any unmatched /api/* route BEFORE Vite middleware so API routes NEVER return index.html
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      code: "API_ROUTE_NOT_FOUND",
    });
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
      `Busitech Server running on http://localhost:${PORT} (NVIDIA API key configured: ${hasValidNvidiaApiKey()})`
    );
  });
}

startServer();

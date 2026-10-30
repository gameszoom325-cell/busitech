import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_APPROVALS,
  MOCK_ACTIVITY_LOGS,
} from "../data/mockData";
import { Obligation, ObligationCategory, RiskLevel } from "../types";

export interface ToolExecutionRecord {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface ClientSideAction {
  type:
    | "NAVIGATE"
    | "SET_THEME"
    | "ADD_OBLIGATION"
    | "RESOLVE_APPROVAL"
    | "SHOW_TOAST";
  payload: Record<string, unknown>;
}

export type GeminiModelTier =
  | "gemini-4-argon"
  | "gemini-3.8-flash"
  | "gemini-3.1-flash-lite";

export type AgentRolePersona = "ops_lead" | "legal_counsel" | "risk_analyst";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AgentTurnMessage {
  role: "user" | "model";
  text: string;
}

export interface GeminiAgentResponse {
  reply: string;
  toolCalls: ToolExecutionRecord[];
  clientActions: ClientSideAction[];
  suggestedFollowUps: string[];
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
}

export interface GeminiStatusResponse {
  connected: boolean;
  model: string;
  availableModels?: string[];
  toolsCount: number;
  tools: Array<{ name: string; description: string }>;
}

export interface ExtractedClauseObligation {
  title: string;
  clauseRef: string;
  description: string;
  ownerName: string;
  dueDate: string;
  risk: RiskLevel;
  category: ObligationCategory;
  cadence: string;
}

export interface GeminiExtractionResponse {
  summary: string;
  overallRiskScore: number;
  extractedObligations: ExtractedClauseObligation[];
}

export interface ActionExecutionCallbacks {
  onNavigate?: (route: string) => void;
  onSetTheme?: (theme: "light" | "dark" | "system") => void;
  onShowToast?: (
    message: string,
    type?: "success" | "info" | "warning" | "error"
  ) => void;
  onDataMutated?: () => void;
}

/**
 * Applies client-side mutations triggered by server-side Gemini tool calls
 * so the local UI state stays immediately synchronized.
 */
export function applyClientSideActions(
  actions: ClientSideAction[],
  callbacks?: ActionExecutionCallbacks
): void {
  if (!actions || !Array.isArray(actions)) return;

  let dataMutated = false;

  for (const action of actions) {
    switch (action.type) {
      case "ADD_OBLIGATION": {
        const obligation = action.payload.obligation as Obligation | undefined;
        if (
          obligation &&
          !MOCK_OBLIGATIONS.some((existing) => existing.id === obligation.id)
        ) {
          MOCK_OBLIGATIONS.unshift(obligation);
          MOCK_ACTIVITY_LOGS.unshift({
            id: `act_ai_${Date.now()}`,
            timestamp: "Just now",
            userName: "Busitech AI Agent",
            userRole: "Service",
            action: `Created obligation via tool call: ${obligation.title}`,
            target: `${obligation.contractName} (${obligation.clauseRef})`,
            hash: Math.random().toString(16).substring(2, 10),
            category: "Extraction",
          });
          dataMutated = true;
        }
        break;
      }

      case "RESOLVE_APPROVAL": {
        const id = String(action.payload.id || "");
        const decision = action.payload.decision as "Approved" | "Rejected";
        const comment = String(action.payload.comment || "");
        const target = MOCK_APPROVALS.find((a) => a.id === id);
        if (target) {
          target.status = decision;
          target.resolvedAt = new Date().toISOString();
          MOCK_ACTIVITY_LOGS.unshift({
            id: `act_ai_${Date.now()}`,
            timestamp: "Just now",
            userName: "Busitech AI Agent",
            userRole: "Admin",
            action: `${decision}: ${target.title}${comment ? ` ("${comment}")` : ""}`,
            target: `${target.contractRef} ${target.clauseRef}`,
            hash: Math.random().toString(16).substring(2, 10),
            category: "Approval",
          });
          dataMutated = true;
        }
        break;
      }

      case "NAVIGATE": {
        const route = String(action.payload.route || "");
        if (route && callbacks?.onNavigate) {
          callbacks.onNavigate(route);
        }
        break;
      }

      case "SET_THEME": {
        const theme = action.payload.theme as "light" | "dark" | "system";
        if (theme && callbacks?.onSetTheme) {
          callbacks.onSetTheme(theme);
        }
        break;
      }

      case "SHOW_TOAST": {
        const message = String(action.payload.message || "");
        const toastType =
          (action.payload.toastType as
            | "success"
            | "info"
            | "warning"
            | "error") || "info";
        if (message && callbacks?.onShowToast) {
          callbacks.onShowToast(message, toastType);
        }
        break;
      }
    }
  }

  if (dataMutated) {
    callbacks?.onDataMutated?.();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("c2a:data-updated"));
    }
  }
}

export interface BusinessInsightItem {
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  recommendation: string;
}

export interface GeminiInsightsResponse {
  summary: string;
  portfolioHealthScore: number;
  insights: BusinessInsightItem[];
  priorityActions: string[];
  modelUsed?: string;
}

/**
 * Safely reads and validates an HTTP response from the backend AI endpoints.
 * Never calls JSON.parse() on plain text or HTML responses without validation.
 */
async function parseApiJsonResponse<T>(
  res: Response,
  endpointName: string
): Promise<T> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const rawBody = await res.text();
  const trimmed = rawBody.trim();

  if (!trimmed) {
    throw new Error(
      `Invalid response received from ${endpointName}: Server returned an empty response (HTTP ${res.status}).`
    );
  }

  // Detect HTML error/warmup pages (e.g. from reverse proxies) before attempting JSON.parse
  const lowerPrefix = trimmed.slice(0, 60).toLowerCase();
  if (lowerPrefix.startsWith("<!doctype") || lowerPrefix.startsWith("<html")) {
    throw new Error(
      `Temporary backend gateway response (${endpointName}, HTTP ${res.status}). Please retry your request in a moment.`
    );
  }

  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!looksLikeJson) {
    // Plain text response — do not pass to JSON.parse()
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`AI service endpoint was not found (HTTP 404).`);
      }
      throw new Error(
        `Gemini request failed (${endpointName}, HTTP ${res.status}): ${trimmed.slice(0, 100)}`
      );
    }
    throw new Error(
      `Invalid response received from ${endpointName}: Expected JSON response but received plain text.`
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Invalid response received from ${endpointName}: Response body is not valid JSON (HTTP ${res.status}).`
    );
  }

  if (!res.ok) {
    const serverErrorMessage =
      typeof parsed?.error === "string" && parsed.error.trim()
        ? parsed.error.trim()
        : `Gemini request failed at ${endpointName} with HTTP ${res.status}.`;
    throw new Error(serverErrorMessage);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      `Invalid response received from ${endpointName}: Parsed payload was not a JSON object.`
    );
  }

  return parsed as T;
}

export const geminiService = {
  /**
   * Checks server-side Gemini connection status and registered tools via GET /api/ai/status.
   */
  async getStatus(): Promise<GeminiStatusResponse> {
    const res = await fetch("/api/ai/status");
    return parseApiJsonResponse<GeminiStatusResponse>(res, "Gemini Status");
  },

  /**
   * Sends a single-turn natural language command from the AI Command Bar (⌘K) to POST /api/ai/chat.
   */
  async executeCommand(
    prompt: string,
    callbacks?: ActionExecutionCallbacks
  ): Promise<GeminiAgentResponse> {
    if (!prompt || !prompt.trim()) {
      throw new Error("Please enter a command before submitting to Gemini.");
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        mode: "command",
        snapshot: {
          contracts: MOCK_CONTRACTS,
          obligations: MOCK_OBLIGATIONS,
          approvals: MOCK_APPROVALS,
        },
      }),
    });

    const data = await parseApiJsonResponse<GeminiAgentResponse>(
      res,
      "AI Command Bar (/api/ai/chat)"
    );

    if (typeof data.reply !== "string") {
      throw new Error(
        "Invalid response received from AI Command Bar: Missing model reply text."
      );
    }

    applyClientSideActions(data.clientActions || [], callbacks);
    return data;
  },

  /**
   * Sends a multi-turn message to the Busitech AI Business Agent via POST /api/ai/chat
   * with tool-calling, selectable Gemini model tier, role persona, and live Google Search Grounding.
   */
  async sendAgentMessage(
    prompt: string,
    history: AgentTurnMessage[],
    callbacks?: ActionExecutionCallbacks,
    options?: {
      model?: GeminiModelTier;
      rolePersona?: AgentRolePersona;
      useSearchGrounding?: boolean;
    }
  ): Promise<GeminiAgentResponse> {
    if (!prompt || !prompt.trim()) {
      throw new Error("Please enter a message for the AI Business Agent.");
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt.trim(),
        history,
        mode: "agent",
        model: options?.model,
        rolePersona: options?.rolePersona,
        useSearchGrounding: Boolean(options?.useSearchGrounding),
        snapshot: {
          contracts: MOCK_CONTRACTS,
          obligations: MOCK_OBLIGATIONS,
          approvals: MOCK_APPROVALS,
        },
      }),
    });

    const data = await parseApiJsonResponse<GeminiAgentResponse>(
      res,
      "AI Business Agent (/api/ai/chat)"
    );

    if (typeof data.reply !== "string") {
      throw new Error(
        "Invalid response received from AI Business Agent: Missing model reply text."
      );
    }

    applyClientSideActions(data.clientActions || [], callbacks);
    return data;
  },

  /**
   * Extracts structured obligations from raw contract text via POST /api/ai/analyze.
   */
  async extractContractObligations(params: {
    contractName: string;
    counterparty?: string;
    contractText: string;
  }): Promise<GeminiExtractionResponse> {
    if (!params.contractText || !params.contractText.trim()) {
      throw new Error("Please provide contract text before running extraction.");
    }

    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await parseApiJsonResponse<GeminiExtractionResponse>(
      res,
      "Contract Analyzer (/api/ai/analyze)"
    );

    if (
      typeof data.summary !== "string" ||
      !Array.isArray(data.extractedObligations)
    ) {
      throw new Error(
        "Invalid response received from Contract Obligation Extractor: Missing summary or obligations array."
      );
    }

    return data;
  },

  /**
   * Generates executive business insights across the contract portfolio via POST /api/ai/insights.
   */
  async getBusinessInsights(focusArea?: string): Promise<GeminiInsightsResponse> {
    const res = await fetch("/api/ai/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focusArea: focusArea || "overall portfolio governance",
        snapshot: {
          contracts: MOCK_CONTRACTS,
          obligations: MOCK_OBLIGATIONS,
          approvals: MOCK_APPROVALS,
        },
      }),
    });

    return parseApiJsonResponse<GeminiInsightsResponse>(
      res,
      "Business Insights (/api/ai/insights)"
    );
  },
};

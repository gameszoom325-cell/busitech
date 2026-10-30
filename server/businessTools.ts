import { FunctionDeclaration, Type } from "@google/genai";
import {
  getGeminiClient,
  GEMINI_FLASH_MODEL,
  ALLOWED_GEMINI_MODELS,
  SupportedGeminiModel,
} from "./geminiClient.ts";
import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_APPROVALS,
  MOCK_ACTIVITY_LOGS,
} from "../src/data/mockData.ts";
import {
  Contract,
  Obligation,
  ApprovalItem,
  ObligationCategory,
  RiskLevel,
  ObligationStatus,
} from "../src/types/index.ts";

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

export interface WorkspaceSnapshot {
  contracts?: Contract[];
  obligations?: Obligation[];
  approvals?: ApprovalItem[];
}

export interface AgentTurnMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Gemini Function Declarations for Busitech / Contract2Action AI
 */
export const BUSINESS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_contracts",
    description:
      "Search and filter active enterprise contracts by counterparty name, contract title, contract code, status, or risk flag.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            "Optional search keyword matching contract name, counterparty (e.g. Stripe, AWS, Salesforce, Datadog, DHL, Snowflake), or contract code.",
        },
        status: {
          type: Type.STRING,
          description:
            "Optional filter by contract status: 'Active', 'Pending Review', or 'Archived'.",
        },
        onlyWithRisk: {
          type: Type.BOOLEAN,
          description:
            "If true, only return contracts that have flagged risk items.",
        },
      },
    },
  },
  {
    name: "list_obligations",
    description:
      "Query contractual obligations and deadlines across all agreements. Filter by status, risk level, category, or keyword.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description:
            "Optional obligation status filter: 'Pending', 'In Progress', 'Completed', or 'Overdue'.",
        },
        risk: {
          type: Type.STRING,
          description:
            "Optional risk level filter: 'High', 'Medium', or 'Low'.",
        },
        category: {
          type: Type.STRING,
          description:
            "Optional category filter: 'Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', or 'SLA'.",
        },
        search: {
          type: Type.STRING,
          description:
            "Optional keyword to match obligation title, contract name, owner, or clause reference.",
        },
      },
    },
  },
  {
    name: "create_obligation",
    description:
      "Create and register a new contractual obligation or business action item in the Busitech Obligations Registry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Clear title of the obligation or action item.",
        },
        contractName: {
          type: Type.STRING,
          description:
            "Name of the associated contract (e.g. 'Stripe Enterprise MSA', 'AWS Cloud Addendum', 'Salesforce Service Agreement').",
        },
        clauseRef: {
          type: Type.STRING,
          description: "Contract clause reference (e.g. 'Clause §9.4', 'Section 14.2').",
        },
        description: {
          type: Type.STRING,
          description: "Detailed operational description of what must be completed.",
        },
        ownerName: {
          type: Type.STRING,
          description: "Assigned owner name (e.g. 'Alex Chen', 'Sarah J.', 'Marcus Vance', 'Elena Rostova').",
        },
        dueDate: {
          type: Type.STRING,
          description: "Target due date in YYYY-MM-DD format.",
        },
        risk: {
          type: Type.STRING,
          description: "Risk level: 'High', 'Medium', or 'Low'.",
        },
        category: {
          type: Type.STRING,
          description:
            "Category: 'Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', or 'SLA'.",
        },
      },
      required: ["title", "contractName", "dueDate", "risk", "category"],
    },
  },
  {
    name: "get_pending_approvals",
    description:
      "Retrieve human-in-the-loop approval queue items waiting for executive sign-off, including risk levels and contractual quotes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        statusFilter: {
          type: Type.STRING,
          description:
            "Filter approvals by status: 'Pending', 'Approved', 'Rejected', or 'ALL'. Defaults to 'Pending'.",
        },
      },
    },
  },
  {
    name: "resolve_approval",
    description:
      "Approve or reject a human-gate approval item by ID or title match, recording an audit comment.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        approvalIdOrTitle: {
          type: Type.STRING,
          description:
            "The approval ID (e.g. 'app_1', 'app_2', 'app_3') or title keyword (e.g. 'Termination Notice', 'SOC2', 'Calendar Sync').",
        },
        decision: {
          type: Type.STRING,
          description: "Decision to apply: 'Approved' or 'Rejected'.",
        },
        comment: {
          type: Type.STRING,
          description: "Audit trail rationale or executive note for the decision.",
        },
      },
      required: ["approvalIdOrTitle", "decision"],
    },
  },
  {
    name: "analyze_business_risk",
    description:
      "Run a comprehensive Busitech business intelligence & risk analysis across all contracts, obligations, and pending approvals.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        focusArea: {
          type: Type.STRING,
          description:
            "Optional focus area: 'financial', 'compliance', 'sla', 'renewals', or 'overall'.",
        },
      },
    },
  },
  {
    name: "draft_executive_notice",
    description:
      "Draft a formal legal or business notice (e.g. Non-Renewal Notice, SLA Credit Claim, Compliance Attestation) for a counterparty.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        noticeType: {
          type: Type.STRING,
          description:
            "Type of notice: 'Non-Renewal Notice', 'SLA Credit Claim', 'Audit Submission Cover Letter', or 'Breach Remediation Notice'.",
        },
        counterparty: {
          type: Type.STRING,
          description: "Counterparty organization name (e.g. 'Salesforce.com Inc.', 'Stripe Inc.', 'Amazon Web Services').",
        },
        contractRef: {
          type: Type.STRING,
          description: "Contract name and code reference.",
        },
        clauseRef: {
          type: Type.STRING,
          description: "Relevant contract section or clause number.",
        },
        keyPoints: {
          type: Type.STRING,
          description: "Key terms, dollar amounts, or dates to include in the formal notice.",
        },
      },
      required: ["noticeType", "counterparty", "contractRef"],
    },
  },
  {
    name: "navigate_workspace",
    description:
      "Navigate the user's browser to a specific application page or switch the UI theme mode.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        route: {
          type: Type.STRING,
          description:
            "Optional target route path: '/overview', '/contracts', '/obligations', '/approvals', '/upload', '/activity', '/agent', or '/admin'.",
        },
        theme: {
          type: Type.STRING,
          description:
            "Optional UI theme mode to set: 'light', 'dark', or 'system'.",
        },
      },
    },
  },
];

/**
 * Executes a single tool call requested by Gemini and collects any client-side UI actions.
 */
export function executeBusinessTool(
  name: string,
  args: Record<string, unknown>,
  snapshot?: WorkspaceSnapshot
): {
  toolResponse: Record<string, unknown>;
  clientActions: ClientSideAction[];
} {
  const contracts = snapshot?.contracts?.length
    ? snapshot.contracts
    : MOCK_CONTRACTS;
  const obligations = snapshot?.obligations?.length
    ? snapshot.obligations
    : MOCK_OBLIGATIONS;
  const approvals = snapshot?.approvals?.length
    ? snapshot.approvals
    : MOCK_APPROVALS;

  const clientActions: ClientSideAction[] = [];

  switch (name) {
    case "search_contracts": {
      const query = String(args.query || "").toLowerCase().trim();
      const status = String(args.status || "").toLowerCase().trim();
      const onlyWithRisk = Boolean(args.onlyWithRisk);

      const matched = contracts.filter((c) => {
        const matchesQuery =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.counterparty.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.type.toLowerCase().includes(query);
        const matchesStatus =
          !status || c.status.toLowerCase() === status;
        const matchesRisk = !onlyWithRisk || Boolean(c.hasRisk);
        return matchesQuery && matchesStatus && matchesRisk;
      });

      return {
        toolResponse: {
          count: matched.length,
          contracts: matched.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            counterparty: c.counterparty,
            type: c.type,
            status: c.status,
            obligationsCount: c.obligationsCount,
            hasRisk: Boolean(c.hasRisk),
            riskCount: c.riskCount || 0,
            nextDeadline: c.nextDeadline,
          })),
        },
        clientActions,
      };
    }

    case "list_obligations": {
      const status = String(args.status || "").toLowerCase().trim();
      const risk = String(args.risk || "").toLowerCase().trim();
      const category = String(args.category || "").toLowerCase().trim();
      const search = String(args.search || "").toLowerCase().trim();

      const matched = obligations.filter((o) => {
        const matchesStatus =
          !status || o.status.toLowerCase() === status;
        const matchesRisk = !risk || o.risk.toLowerCase() === risk;
        const matchesCat =
          !category || o.category.toLowerCase() === category;
        const matchesSearch =
          !search ||
          o.title.toLowerCase().includes(search) ||
          o.contractName.toLowerCase().includes(search) ||
          o.description.toLowerCase().includes(search) ||
          o.clauseRef.toLowerCase().includes(search) ||
          o.ownerName.toLowerCase().includes(search);
        return matchesStatus && matchesRisk && matchesCat && matchesSearch;
      });

      return {
        toolResponse: {
          count: matched.length,
          obligations: matched.map((o) => ({
            id: o.id,
            title: o.title,
            contractName: o.contractName,
            clauseRef: o.clauseRef,
            ownerName: o.ownerName,
            dueDate: o.dueDate,
            status: o.status,
            risk: o.risk,
            category: o.category,
            description: o.description,
          })),
        },
        clientActions,
      };
    }

    case "create_obligation": {
      const title = String(args.title || "Untitled Obligation").trim();
      const contractName = String(
        args.contractName || "Master Services Agreement"
      ).trim();
      const clauseRef = String(args.clauseRef || "Clause §1.1").trim();
      const description = String(
        args.description ||
          `Actionable obligation extracted by Busitech AI Agent for ${contractName}.`
      ).trim();
      const ownerName = String(args.ownerName || "Alex Chen").trim();
      const dueDate = String(args.dueDate || "2025-11-30").trim();
      const rawRisk = String(args.risk || "Medium").trim();
      const risk: RiskLevel =
        rawRisk === "High" || rawRisk === "Low" ? rawRisk : "Medium";

      const validCategories: ObligationCategory[] = [
        "Payment",
        "Delivery",
        "Inspection",
        "Compliance",
        "Reporting",
        "SLA",
      ];
      const rawCat = String(args.category || "Compliance").trim();
      const category: ObligationCategory = validCategories.includes(
        rawCat as ObligationCategory
      )
        ? (rawCat as ObligationCategory)
        : "Compliance";

      const initials =
        ownerName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join("") || "AI";

      const newObligation: Obligation = {
        id: `ob_ai_${Date.now()}`,
        title,
        tag: "AI AGENT",
        clauseRef,
        description,
        contractId: "ctr_stripe_msa",
        contractName,
        ownerName,
        ownerAvatar: initials,
        dueDate,
        dueDateFormatted: dueDate,
        status: "Pending" as ObligationStatus,
        risk,
        category,
        responsibleParty: "Acme Corp (Us)",
        verificationStatus: "Verified",
      };

      MOCK_OBLIGATIONS.unshift(newObligation);

      clientActions.push({
        type: "ADD_OBLIGATION",
        payload: { obligation: newObligation },
      });
      clientActions.push({
        type: "SHOW_TOAST",
        payload: {
          message: `Created obligation: "${title}"`,
          toastType: "success",
        },
      });

      return {
        toolResponse: {
          success: true,
          message: `Obligation "${title}" has been created and added to the registry.`,
          obligation: newObligation,
        },
        clientActions,
      };
    }

    case "get_pending_approvals": {
      const statusFilter = String(args.statusFilter || "Pending")
        .toLowerCase()
        .trim();

      const matched = approvals.filter((a) => {
        if (statusFilter === "all") return true;
        return a.status.toLowerCase() === statusFilter;
      });

      return {
        toolResponse: {
          count: matched.length,
          approvals: matched.map((a) => ({
            id: a.id,
            title: a.title,
            riskLevel: a.riskLevel,
            dueDateTag: a.dueDateTag,
            contractRef: a.contractRef,
            clauseRef: a.clauseRef,
            description: a.description,
            contractualBasisQuote: a.contractualBasisQuote,
            status: a.status,
          })),
        },
        clientActions,
      };
    }

    case "resolve_approval": {
      const needle = String(args.approvalIdOrTitle || "")
        .toLowerCase()
        .trim();
      const rawDecision = String(args.decision || "Approved").trim();
      const decision: "Approved" | "Rejected" =
        rawDecision.toLowerCase().startsWith("rej") ? "Rejected" : "Approved";
      const comment = String(
        args.comment || "Processed via Busitech AI Business Agent"
      ).trim();

      const target =
        approvals.find(
          (a) =>
            a.id.toLowerCase() === needle ||
            a.title.toLowerCase().includes(needle) ||
            a.contractRef.toLowerCase().includes(needle)
        ) || MOCK_APPROVALS.find((a) => a.status === "Pending");

      if (!target) {
        return {
          toolResponse: {
            success: false,
            error: `No matching approval item found for "${args.approvalIdOrTitle}".`,
          },
          clientActions,
        };
      }

      target.status = decision;
      target.resolvedAt = new Date().toISOString();

      const serverTarget = MOCK_APPROVALS.find((a) => a.id === target.id);
      if (serverTarget) {
        serverTarget.status = decision;
        serverTarget.resolvedAt = target.resolvedAt;
      }

      MOCK_ACTIVITY_LOGS.unshift({
        id: `act_ai_${Date.now()}`,
        timestamp: "Just now",
        userName: "Busitech AI Agent",
        userRole: "Admin",
        action: `${decision}: ${target.title} ("${comment}")`,
        target: `${target.contractRef} ${target.clauseRef}`,
        hash: Math.random().toString(16).substring(2, 10),
        category: "Approval",
      });

      clientActions.push({
        type: "RESOLVE_APPROVAL",
        payload: {
          id: target.id,
          decision,
          comment,
        },
      });
      clientActions.push({
        type: "SHOW_TOAST",
        payload: {
          message: `${decision} "${target.title}"`,
          toastType: decision === "Approved" ? "success" : "warning",
        },
      });

      return {
        toolResponse: {
          success: true,
          approvalId: target.id,
          title: target.title,
          contractRef: target.contractRef,
          decision,
          comment,
          resolvedAt: target.resolvedAt,
        },
        clientActions,
      };
    }

    case "analyze_business_risk": {
      const focusArea = String(args.focusArea || "overall").toLowerCase();
      const highRiskObligations = obligations.filter((o) => o.risk === "High");
      const overdueObligations = obligations.filter(
        (o) => o.status === "Overdue" || o.isOverdue
      );
      const pendingApprovals = approvals.filter((a) => a.status === "Pending");
      const riskyContracts = contracts.filter((c) => c.hasRisk);

      return {
        toolResponse: {
          focusArea,
          summaryMetrics: {
            totalActiveContracts: contracts.length,
            contractsWithFlaggedRisk: riskyContracts.length,
            totalTrackedObligations: obligations.length,
            highRiskObligationsCount: highRiskObligations.length,
            overdueObligationsCount: overdueObligations.length,
            pendingHumanGateApprovals: pendingApprovals.length,
            estimatedAutoRenewalExposureUSD: 48000,
            portfolioComplianceScore: "96.4%",
          },
          criticalBottlenecks: [
            ...overdueObligations.map((o) => ({
              type: "OVERDUE_OBLIGATION",
              id: o.id,
              title: o.title,
              contract: o.contractName,
              clause: o.clauseRef,
              owner: o.ownerName,
              dueDate: o.dueDate,
            })),
            ...pendingApprovals
              .filter((a) => a.riskLevel === "HIGH RISK")
              .map((a) => ({
                type: "HIGH_RISK_APPROVAL_GATE",
                id: a.id,
                title: a.title,
                contract: a.contractRef,
                clause: a.clauseRef,
                dueDateTag: a.dueDateTag,
              })),
          ],
          recommendations: [
            "Immediately approve and dispatch the Salesforce Section 14.2 Non-Renewal Notice to prevent a $48,000 automatic 12-month lock-in.",
            "Complete the AWS Reserved Instance quarterly true-up (Clause 4.1) before Oct 28 to optimize cloud compute commitment spend.",
            "Verify transmission of the SOC2 Type II Audit Report to Stripe Compliance Portal under Clause §9.4.",
          ],
        },
        clientActions,
      };
    }

    case "draft_executive_notice": {
      const noticeType = String(args.noticeType || "Formal Contractual Notice");
      const counterparty = String(args.counterparty || "Counterparty Legal Dept");
      const contractRef = String(args.contractRef || "Master Services Agreement");
      const clauseRef = String(args.clauseRef || "Applicable Clause");
      const keyPoints = String(
        args.keyPoints ||
          "Formal notification pursuant to the terms and conditions of the agreement."
      );
      const dateStr = new Date().toISOString().split("T")[0];

      const draftBody = [
        `OFFICIAL LEGAL & OPERATIONS NOTICE — ${noticeType.toUpperCase()}`,
        `Date: ${dateStr}`,
        `To: Legal & Contract Administration, ${counterparty}`,
        `From: Busitech / Contract2Action AI Governance Operations (Acme Corp)`,
        `Reference: ${contractRef} (${clauseRef})`,
        `------------------------------------------------------------------------`,
        `Dear ${counterparty} Legal & Account Team,`,
        ``,
        `Pursuant to ${clauseRef} of the ${contractRef}, Acme Corp hereby provides formal written notice regarding: ${noticeType}.`,
        ``,
        `Key Operational Particulars:`,
        `${keyPoints}`,
        ``,
        `Please confirm receipt of this electronic transmission within two (2) business days. This dispatch has been cryptographically logged in the Busitech Contract2Action Audit Ledger.`,
        ``,
        `Sincerely,`,
        `Authorized Legal & Operations Signatory`,
        `Acme Corp • Busitech Governance Platform`,
      ].join("\n");

      return {
        toolResponse: {
          noticeType,
          counterparty,
          contractRef,
          clauseRef,
          generatedAt: new Date().toISOString(),
          draftDocument: draftBody,
        },
        clientActions,
      };
    }

    case "navigate_workspace": {
      const route = args.route ? String(args.route).trim() : "";
      const theme = args.theme ? String(args.theme).toLowerCase().trim() : "";

      if (route) {
        clientActions.push({
          type: "NAVIGATE",
          payload: { route },
        });
      }
      if (theme === "light" || theme === "dark" || theme === "system") {
        clientActions.push({
          type: "SET_THEME",
          payload: { theme },
        });
      }

      return {
        toolResponse: {
          success: true,
          navigatedTo: route || null,
          themeApplied: theme || null,
        },
        clientActions,
      };
    }

    default:
      return {
        toolResponse: {
          error: `Unknown tool "${name}"`,
        },
        clientActions,
      };
  }
}

export type AgentRolePersona = "ops_lead" | "legal_counsel" | "risk_analyst";

export interface GroundingSource {
  title: string;
  uri: string;
}

const SYSTEM_INSTRUCTION = `You are the Busitech AI Business Agent powering the Contract2Action AI platform.
Your role is to help executives, legal ops, and procurement leads understand contracts, automate business actions, monitor deadlines, evaluate risk exposure, and execute workflows using your registered tools.

Guidelines:
1. Always use your tools (search_contracts, list_obligations, create_obligation, get_pending_approvals, resolve_approval, analyze_business_risk, draft_executive_notice, navigate_workspace) whenever the user asks about contracts, obligations, approvals, risk metrics, drafting notices, creating tasks, or navigating the app.
2. Be concise, executive, and action-oriented. Reference specific contract names, clause numbers (e.g., Section 14.2, Clause §9.4), owners, and deadlines.
3. Format responses cleanly with short bullet points or structured sections so they are easy to scan in both the AI Command Bar and the AI Business Agent workspace.`;

const ROLE_PERSONA_INSTRUCTIONS: Record<AgentRolePersona, string> = {
  ops_lead: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **Operations & SLA Compliance Lead**. Prioritize operational execution, SLA credit windows, owner accountability, upcoming deadlines, and human-gate approval velocity.`,
  legal_counsel: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **General Counsel & Clause Auditor**. Prioritize contractual language precision, indemnification caps, governing law, non-renewal notice deadlines, GDPR/SOC2 compliance clauses, and formal legal notice drafting.`,
  risk_analyst: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **Vendor Risk & Market Intelligence Analyst**. Prioritize counterparty financial/security exposure, regulatory developments (DORA, GDPR, SOC 2 Type II), concentration risk, and proactive mitigation strategies.`,
};

/**
 * Multi-turn Gemini Business Agent with support for:
 * - Selectable Gemini models: gemini-4-argon (Complex), gemini-3.8-flash (General/Search), gemini-3.1-flash-lite (Fast)
 * - Role-based system instructions (ops_lead, legal_counsel, risk_analyst)
 * - Automatic server-side Function Calling OR live Google Search Grounding (googleSearch tool with gemini-3.8-flash)
 */
export async function runBusinessAgentWithTools(params: {
  prompt: string;
  history?: AgentTurnMessage[];
  snapshot?: WorkspaceSnapshot;
  mode?: "command" | "agent";
  model?: string;
  rolePersona?: AgentRolePersona;
  useSearchGrounding?: boolean;
}): Promise<{
  reply: string;
  toolCalls: ToolExecutionRecord[];
  clientActions: ClientSideAction[];
  suggestedFollowUps: string[];
  modelUsed: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
}> {
  const ai = getGeminiClient();
  const toolCalls: ToolExecutionRecord[] = [];
  const clientActions: ClientSideAction[] = [];
  const groundingSources: GroundingSource[] = [];
  const searchQueries: string[] = [];

  // Build contents array from conversation history
  const contents: Array<Record<string, unknown>> = [];
  if (params.history && Array.isArray(params.history)) {
    for (const msg of params.history.slice(-12)) {
      if (msg.text && msg.text.trim()) {
        contents.push({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }
    }
  }
  contents.push({
    role: "user",
    parts: [{ text: params.prompt }],
  });

  const personaKey: AgentRolePersona =
    params.rolePersona && ROLE_PERSONA_INSTRUCTIONS[params.rolePersona]
      ? params.rolePersona
      : "ops_lead";

  const baseInstruction = ROLE_PERSONA_INSTRUCTIONS[personaKey];

  // Google Search Grounding mode MUST use gemini-3.8-flash and tools: [{ googleSearch: {} }]
  // without combining functionDeclarations in the same request.
  if (params.useSearchGrounding) {
    const contractsSummary = (params.snapshot?.contracts || MOCK_CONTRACTS)
      .map(
        (c) =>
          `${c.name} (${c.code}, Counterparty: ${c.counterparty}, Type: ${c.type}, Status: ${c.status}, Next Deadline: ${c.nextDeadlineToDisplay})`
      )
      .join("; ");

    const groundedSystemInstruction = `${baseInstruction}\n\nYou have live Google Search Grounding enabled. Use Google Search to retrieve up-to-date, accurate regulatory, security, financial, and counterparty news relevant to the user's question and our active contract portfolio (${contractsSummary}). Cite concrete facts and dates.`;

    const response = await ai.models.generateContent({
      model: GEMINI_FLASH_MODEL,
      contents: contents as any,
      config: {
        systemInstruction: groundedSystemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    if (
      !response ||
      !Array.isArray(response.candidates) ||
      response.candidates.length === 0
    ) {
      const invalidErr = new Error(
        "Invalid response received from Gemini Search Grounding: No candidates returned."
      ) as Error & { status?: number; code?: string };
      invalidErr.status = 502;
      invalidErr.code = "INVALID_GEMINI_RESPONSE";
      throw invalidErr;
    }

    const groundingMeta = response.candidates[0]?.groundingMetadata as
      | {
          groundingChunks?: Array<{
            web?: { uri?: string; title?: string };
          }>;
          webSearchQueries?: string[];
        }
      | undefined;

    if (groundingMeta?.groundingChunks) {
      const seenUris = new Set<string>();
      for (const chunk of groundingMeta.groundingChunks) {
        const uri = chunk.web?.uri;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          groundingSources.push({
            title: chunk.web?.title || uri,
            uri,
          });
        }
      }
    }

    if (Array.isArray(groundingMeta?.webSearchQueries)) {
      searchQueries.push(...groundingMeta.webSearchQueries);
    }

    const replyText =
      (typeof response.text === "string" && response.text.trim()) ||
      "Search grounding completed.";

    return {
      reply: replyText,
      toolCalls,
      clientActions,
      suggestedFollowUps: [
        "Check latest SOC 2 & DORA cloud compliance rules for 2025",
        "Search recent Stripe and Cloudflare SLA security advisories",
        "Look up GDPR cross-border data transfer updates for Snowflake DPA",
      ],
      modelUsed: GEMINI_FLASH_MODEL,
      groundingSources,
      searchQueries,
    };
  }

  const selectedModel: SupportedGeminiModel =
    params.model &&
    ALLOWED_GEMINI_MODELS.includes(params.model as SupportedGeminiModel)
      ? (params.model as SupportedGeminiModel)
      : GEMINI_FLASH_MODEL;

  const modeInstruction =
    params.mode === "command"
      ? `${baseInstruction}\nYou are responding inside the compact AI Command Bar (⌘K). Keep your final answer brief (2-5 sentences or a compact bullet list) and execute requested actions immediately via tools.`
      : baseInstruction;

  let maxTurns = 4;
  let finalReply = "";

  while (maxTurns > 0) {
    maxTurns--;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents as any,
      config: {
        systemInstruction: modeInstruction,
        tools: [{ functionDeclarations: BUSINESS_TOOL_DECLARATIONS }],
      },
    });

    if (!response || !Array.isArray(response.candidates) || response.candidates.length === 0) {
      const invalidErr = new Error(
        "Invalid response received from Gemini API: No response candidates were returned by the model."
      ) as Error & { status?: number; code?: string };
      invalidErr.status = 502;
      invalidErr.code = "INVALID_GEMINI_RESPONSE";
      throw invalidErr;
    }

    const candidateContent = response.candidates[0]?.content;
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      const textReply = typeof response.text === "string" ? response.text.trim() : "";
      if (!textReply && toolCalls.length === 0) {
        const emptyErr = new Error(
          "Invalid response received from Gemini API: The model returned neither text output nor tool calls."
        ) as Error & { status?: number; code?: string };
        emptyErr.status = 502;
        emptyErr.code = "INVALID_GEMINI_RESPONSE";
        throw emptyErr;
      }
      finalReply =
        textReply ||
        "Action completed. Let me know if you would like to inspect any specific contract or obligation.";
      break;
    }

    // Preserve the model's turn in the conversation history
    if (candidateContent) {
      contents.push(candidateContent as any);
    }

    // Execute all requested function calls and return their responses
    const functionResponseParts: Array<Record<string, unknown>> = [];

    for (const fc of functionCalls) {
      const fnName = fc.name || "unknown_tool";
      const fnArgs = (fc.args as Record<string, unknown>) || {};
      const { toolResponse, clientActions: newActions } = executeBusinessTool(
        fnName,
        fnArgs,
        params.snapshot
      );

      clientActions.push(...newActions);
      toolCalls.push({
        id: fc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: fnName,
        args: fnArgs,
        result: toolResponse,
        timestamp: new Date().toISOString(),
      });

      functionResponseParts.push({
        functionResponse: {
          id: fc.id,
          name: fnName,
          response: toolResponse,
        },
      });
    }

    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  const suggestedFollowUps = [
    "Analyze overall portfolio risk exposure",
    "Show all high-risk or overdue obligations",
    "Draft a non-renewal notice for Salesforce Section 14.2",
    "List pending human-gate approvals",
  ];

  return {
    reply: finalReply,
    toolCalls,
    clientActions,
    suggestedFollowUps,
    modelUsed: selectedModel,
    groundingSources,
    searchQueries,
  };
}

/**
 * Safely validates and parses a structured JSON response from Gemini,
 * stripping optional markdown code fences and ensuring plain text is never blindly parsed.
 */
function parseStructuredGeminiJson<T>(rawText: string | undefined, context: string): T {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    const emptyErr = new Error(
      `Invalid response received from Gemini (${context}): Model returned an empty response body.`
    ) as Error & { status?: number; code?: string };
    emptyErr.status = 502;
    emptyErr.code = "INVALID_GEMINI_RESPONSE";
    throw emptyErr;
  }

  let cleaned = rawText.trim();
  // Strip optional markdown code fences (e.g. ```json ... ```) if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  // Ensure the response looks like a JSON object or array before calling JSON.parse
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const nonJsonErr = new Error(
      `Invalid response received from Gemini (${context}): Expected structured JSON output, but received plain text.`
    ) as Error & { status?: number; code?: string };
    nonJsonErr.status = 502;
    nonJsonErr.code = "INVALID_GEMINI_RESPONSE";
    throw nonJsonErr;
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseErr: any) {
    const malformedErr = new Error(
      `Invalid response received from Gemini (${context}): Failed to parse JSON output (${parseErr?.message || "SyntaxError"}).`
    ) as Error & { status?: number; code?: string };
    malformedErr.status = 502;
    malformedErr.code = "INVALID_GEMINI_RESPONSE";
    throw malformedErr;
  }
}

/**
 * Structured JSON extraction of contractual obligations from raw contract text using Gemini responseSchema.
 */
export async function extractObligationsFromText(params: {
  contractName: string;
  counterparty?: string;
  contractText: string;
}): Promise<{
  summary: string;
  overallRiskScore: number;
  extractedObligations: Array<{
    title: string;
    clauseRef: string;
    description: string;
    ownerName: string;
    dueDate: string;
    risk: RiskLevel;
    category: ObligationCategory;
    cadence: string;
  }>;
}> {
  const ai = getGeminiClient();

  const prompt = `Extract all actionable business and legal obligations from the following contract text.
Contract Name: ${params.contractName}
Counterparty: ${params.counterparty || "Counterparty"}

Contract Text:
"""
${params.contractText}
"""`;

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: prompt,
    config: {
      systemInstruction:
        "You are a senior legal-ops contract extraction engine for Busitech Contract2Action AI. Extract concrete, actionable obligations with accurate clause references, owners, due dates (YYYY-MM-DD), risk levels ('High', 'Medium', 'Low'), and categories ('Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', 'SLA').",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description:
              "Executive summary of the contract clauses and key operational risks.",
          },
          overallRiskScore: {
            type: Type.INTEGER,
            description: "Overall contract risk score from 0 to 100.",
          },
          extractedObligations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Concise obligation title.",
                },
                clauseRef: {
                  type: Type.STRING,
                  description: "Clause or section number (e.g. 'Clause §9.4').",
                },
                description: {
                  type: Type.STRING,
                  description: "Actionable description of what needs to be done.",
                },
                ownerName: {
                  type: Type.STRING,
                  description:
                    "Recommended owner role or person (e.g. 'Legal Operations', 'Cloud Infrastructure', 'Security Officer').",
                },
                dueDate: {
                  type: Type.STRING,
                  description: "Target deadline in YYYY-MM-DD format.",
                },
                risk: {
                  type: Type.STRING,
                  description: "Must be 'High', 'Medium', or 'Low'.",
                },
                category: {
                  type: Type.STRING,
                  description:
                    "Must be one of: 'Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', 'SLA'.",
                },
                cadence: {
                  type: Type.STRING,
                  description:
                    "Cadence such as 'Annual', 'Quarterly', 'One-time', or 'Trigger-based'.",
                },
              },
              required: [
                "title",
                "clauseRef",
                "description",
                "ownerName",
                "dueDate",
                "risk",
                "category",
                "cadence",
              ],
            },
          },
        },
        required: ["summary", "overallRiskScore", "extractedObligations"],
      },
    },
  });

  if (!response || !Array.isArray(response.candidates) || response.candidates.length === 0) {
    const noCandidateErr = new Error(
      "Invalid response received from Gemini (Contract Extraction): No candidates returned."
    ) as Error & { status?: number; code?: string };
    noCandidateErr.status = 502;
    noCandidateErr.code = "INVALID_GEMINI_RESPONSE";
    throw noCandidateErr;
  }

  const parsed = parseStructuredGeminiJson<{
    summary?: unknown;
    overallRiskScore?: unknown;
    extractedObligations?: unknown;
  }>(response.text, "Contract Obligation Extraction");

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.extractedObligations)
  ) {
    const schemaErr = new Error(
      "Invalid response received from Gemini (Contract Obligation Extraction): Response JSON did not match the required extraction schema."
    ) as Error & { status?: number; code?: string };
    schemaErr.status = 502;
    schemaErr.code = "INVALID_GEMINI_RESPONSE";
    throw schemaErr;
  }

  return {
    summary: parsed.summary,
    overallRiskScore:
      typeof parsed.overallRiskScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.overallRiskScore)))
        : 50,
    extractedObligations: parsed.extractedObligations as Array<{
      title: string;
      clauseRef: string;
      description: string;
      ownerName: string;
      dueDate: string;
      risk: RiskLevel;
      category: ObligationCategory;
      cadence: string;
    }>,
  };
}

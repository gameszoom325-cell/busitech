import type OpenAI from "openai";
import {
  getOllamaClient,
  resolveOllamaModel,
  formatOllamaError,
} from "./ollamaClient.ts";
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
  role: "user" | "model" | "assistant";
  text?: string;
  content?: string;
}

export interface BusinessToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Standard OpenAI / Ollama Tool Declarations for Busitech Contract2Action AI
 */
export const BUSINESS_TOOLS: BusinessToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_contracts",
      description:
        "Search and filter active enterprise contracts by counterparty name, contract title, contract code, status, or risk flag.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Optional search keyword matching contract name, counterparty (e.g. Stripe, AWS, Salesforce, Datadog, DHL, Snowflake), or contract code.",
          },
          status: {
            type: "string",
            description:
              "Optional filter by contract status: 'Active', 'Pending Review', or 'Archived'.",
          },
          onlyWithRisk: {
            type: "boolean",
            description:
              "If true, only return contracts that have flagged risk items.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_obligations",
      description:
        "Query contractual obligations and deadlines across all agreements. Filter by status, risk level, category, or keyword.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description:
              "Optional obligation status filter: 'Pending', 'In Progress', 'Completed', or 'Overdue'.",
          },
          risk: {
            type: "string",
            description:
              "Optional risk level filter: 'High', 'Medium', or 'Low'.",
          },
          category: {
            type: "string",
            description:
              "Optional category filter: 'Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', or 'SLA'.",
          },
          search: {
            type: "string",
            description:
              "Optional keyword to match obligation title, contract name, owner, or clause reference.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_obligation",
      description:
        "Create and register a new contractual obligation or business action item in the Busitech Obligations Registry.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Clear title of the obligation or action item.",
          },
          contractName: {
            type: "string",
            description:
              "Name of the associated contract (e.g. 'Stripe Enterprise MSA', 'AWS Cloud Addendum', 'Salesforce Service Agreement').",
          },
          clauseRef: {
            type: "string",
            description: "Contract clause reference (e.g. 'Clause §9.4', 'Section 14.2').",
          },
          description: {
            type: "string",
            description: "Detailed operational description of what must be completed.",
          },
          ownerName: {
            type: "string",
            description: "Assigned owner name (e.g. 'Alex Chen', 'Sarah J.', 'Marcus Vance', 'Elena Rostova').",
          },
          dueDate: {
            type: "string",
            description: "Target due date in YYYY-MM-DD format.",
          },
          risk: {
            type: "string",
            description: "Risk level: 'High', 'Medium', or 'Low'.",
            enum: ["High", "Medium", "Low"],
          },
          category: {
            type: "string",
            description:
              "Category: 'Payment', 'Delivery', 'Inspection', 'Compliance', 'Reporting', or 'SLA'.",
            enum: ["Payment", "Delivery", "Inspection", "Compliance", "Reporting", "SLA"],
          },
        },
        required: ["title", "contractName", "dueDate", "risk", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_approvals",
      description:
        "Retrieve human-in-the-loop approval items waiting for executive sign-off, risk tiering, or escalation.",
      parameters: {
        type: "object",
        properties: {
          statusFilter: {
            type: "string",
            description:
              "Optional filter: 'Pending', 'Approved', 'Rejected', or 'ALL'. Defaults to 'Pending'.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resolve_approval",
      description:
        "Approve or reject a human-gate approval item by ID or title keyword match, and log an audit reason.",
      parameters: {
        type: "object",
        properties: {
          approvalIdOrTitle: {
            type: "string",
            description:
              "The approval ID (e.g. 'appr_001') or matching contract/title substring.",
          },
          decision: {
            type: "string",
            description: "Must be 'Approved' or 'Rejected'.",
            enum: ["Approved", "Rejected"],
          },
          comment: {
            type: "string",
            description:
              "Required rationale or condition for this human-in-the-loop audit log.",
          },
        },
        required: ["approvalIdOrTitle", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_business_risk",
      description:
        "Run business intelligence & portfolio risk analysis across all contracts, obligations, and approvals.",
      parameters: {
        type: "object",
        properties: {
          focusArea: {
            type: "string",
            description:
              "Optional focus area: 'financial', 'compliance', 'sla', 'renewals', or 'overall'.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_executive_notice",
      description:
        "Draft a formal legal or operational notice for an enterprise counterparty (e.g., Non-Renewal Notice, SLA Credit Claim, Audit Notice).",
      parameters: {
        type: "object",
        properties: {
          noticeType: {
            type: "string",
            description:
              "Type of formal notice, e.g. 'Non-Renewal Notice', 'SLA Credit Claim', 'Audit Request', 'Breach Notice'.",
          },
          counterparty: {
            type: "string",
            description: "Name of the counterparty organization (e.g. 'Salesforce Inc.', 'Amazon Web Services').",
          },
          contractRef: {
            type: "string",
            description: "Contract name and code reference.",
          },
          clauseRef: {
            type: "string",
            description: "Contract section or clause reference (e.g. 'Section 14.2', 'Clause §9.4').",
          },
          keyPoints: {
            type: "string",
            description: "Specific terms, deadline dates, amounts, or reasons to include.",
          },
        },
        required: ["noticeType", "counterparty", "contractRef"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_workspace",
      description:
        "Navigate the user's browser to any platform page or switch the visual color theme.",
      parameters: {
        type: "object",
        properties: {
          route: {
            type: "string",
            description:
              "Destination route: '/overview', '/contracts', '/obligations', '/approvals', '/activity', '/settings', or '/agent'.",
          },
          theme: {
            type: "string",
            description: "Switch visual theme: 'light', 'dark', or 'system'.",
            enum: ["light", "dark", "system"],
          },
        },
      },
    },
  },
];

/**
 * Backwards compatibility export for modules expecting BUSINESS_TOOL_DECLARATIONS
 */
export const BUSINESS_TOOL_DECLARATIONS = BUSINESS_TOOLS.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  parameters: t.function.parameters,
}));

/**
 * Executes a single tool call requested by Ollama and collects any client-side UI actions.
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
            dueDate: o.dueDate,
            status: o.status,
            risk: o.risk,
            category: o.category,
            ownerName: o.ownerName,
            cadence: o.cadence,
          })),
        },
        clientActions,
      };
    }

    case "create_obligation": {
      const title = String(args.title || "").trim();
      const contractName = String(args.contractName || "General Contract").trim();
      const clauseRef = String(args.clauseRef || "General Section").trim();
      const description = String(
        args.description || "Actionable obligation registered by Ollama Agent"
      ).trim();
      const ownerName = String(args.ownerName || "Alex Chen").trim();
      const dueDate = String(
        args.dueDate ||
          new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
      ).trim();
      const risk = (args.risk as RiskLevel) || "Medium";
      const category = (args.category as ObligationCategory) || "Compliance";

      const matchedContract = contracts.find(
        (c) =>
          c.name.toLowerCase().includes(contractName.toLowerCase()) ||
          contractName.toLowerCase().includes(c.name.toLowerCase())
      );

      const newId = `ob_ai_${Date.now()}`;
      const newObligation: Obligation = {
        id: newId,
        title,
        contractId: matchedContract ? matchedContract.id : "c_custom",
        contractName: matchedContract ? matchedContract.name : contractName,
        clauseRef,
        description,
        ownerName,
        dueDate,
        dueDateFormatted: new Date(dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "Pending" as ObligationStatus,
        risk,
        category,
        isOverdue: new Date(dueDate).getTime() < Date.now(),
        responsibleParty: "Our Organization",
        verificationStatus: "Verified",
        cadence: "One-time",
      };

      clientActions.push({
        type: "ADD_OBLIGATION",
        payload: { obligation: newObligation },
      });

      clientActions.push({
        type: "SHOW_TOAST",
        payload: {
          message: `Obligation created: "${title}" (${dueDate})`,
          toastType: "success",
        },
      });

      return {
        toolResponse: {
          success: true,
          obligationId: newId,
          created: {
            title: newObligation.title,
            contractName: newObligation.contractName,
            clauseRef: newObligation.clauseRef,
            dueDate: newObligation.dueDate,
            risk: newObligation.risk,
            category: newObligation.category,
            ownerName: newObligation.ownerName,
          },
          message: `Obligation "${title}" successfully registered in the platform registry.`,
        },
        clientActions,
      };
    }

    case "get_pending_approvals": {
      const filter = String(args.statusFilter || "Pending").trim();
      const filtered = approvals.filter((a) => {
        if (!filter || filter.toUpperCase() === "ALL") return true;
        return a.status.toLowerCase() === filter.toLowerCase();
      });

      return {
        toolResponse: {
          count: filtered.length,
          approvals: filtered.map((a) => ({
            id: a.id,
            title: a.title,
            contractRef: a.contractRef,
            clauseRef: a.clauseRef,
            riskLevel: a.riskLevel,
            riskScore: a.riskScore,
            status: a.status,
            dueDateTag: a.dueDateTag,
          })),
        },
        clientActions,
      };
    }

    case "resolve_approval": {
      const targetQuery = String(args.approvalIdOrTitle || "").toLowerCase().trim();
      const decision = String(args.decision || "").trim() as
        | "Approved"
        | "Rejected";
      const comment = String(args.comment || "Resolved by Ollama Agent").trim();

      const target = approvals.find(
        (a) =>
          a.id.toLowerCase() === targetQuery ||
          a.title.toLowerCase().includes(targetQuery) ||
          a.contractRef.toLowerCase().includes(targetQuery)
      );

      if (!target) {
        return {
          toolResponse: {
            success: false,
            error: `Could not find any approval item matching "${targetQuery}".`,
            availablePendingApprovals: approvals
              .filter((a) => a.status === "Pending")
              .map((a) => `${a.id}: ${a.title}`),
          },
          clientActions,
        };
      }

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
          message: `${decision}: "${target.title}"`,
          toastType: decision === "Approved" ? "success" : "warning",
        },
      });

      return {
        toolResponse: {
          success: true,
          approvalId: target.id,
          title: target.title,
          decision,
          comment,
          resolvedAt: new Date().toISOString(),
          message: `Approval item ${target.id} marked as ${decision}.`,
        },
        clientActions,
      };
    }

    case "analyze_business_risk": {
      const focus = String(args.focusArea || "overall").toLowerCase().trim();

      const totalContracts = contracts.length;
      const contractsWithRisk = contracts.filter((c) => c.hasRisk);
      const highRiskObligations = obligations.filter((o) => o.risk === "High");
      const overdueObligations = obligations.filter((o) => o.status === "Overdue");
      const pendingApprovals = approvals.filter((a) => a.status === "Pending");
      const highRiskApprovals = pendingApprovals.filter(
        (a) => a.riskLevel === "HIGH RISK"
      );

      const highRiskCount = contractsWithRisk.length + highRiskObligations.length;
      const healthScore = Math.max(
        40,
        Math.min(98, 100 - highRiskCount * 5 - overdueObligations.length * 8)
      );

      return {
        toolResponse: {
          focusArea: focus,
          portfolioHealthScore: healthScore,
          metrics: {
            totalContracts,
            contractsWithRisk: contractsWithRisk.length,
            highRiskObligationsCount: highRiskObligations.length,
            overdueObligationsCount: overdueObligations.length,
            pendingApprovalsCount: pendingApprovals.length,
            highRiskApprovalsCount: highRiskApprovals.length,
          },
          keyExposures: [
            ...contractsWithRisk.map(
              (c) =>
                `Contract ${c.code} (${c.counterparty}) has ${c.riskCount || 1} flagged risk items.`
            ),
            ...highRiskObligations.map(
              (o) =>
                `High Risk Obligation: "${o.title}" in ${o.contractName} due on ${o.dueDate}.`
            ),
          ].slice(0, 5),
          recommendedAction:
            overdueObligations.length > 0
              ? `Triage ${overdueObligations.length} overdue obligations immediately to prevent contractual penalties.`
              : `Review ${highRiskApprovals.length} high-risk approval gates awaiting executive resolution.`,
        },
        clientActions,
      };
    }

    case "draft_executive_notice": {
      const noticeType = String(args.noticeType || "Operational Notice").trim();
      const counterparty = String(args.counterparty || "Counterparty Inc.").trim();
      const contractRef = String(args.contractRef || "Agreement").trim();
      const clauseRef = String(args.clauseRef || "Governing Clause").trim();
      const keyPoints = String(args.keyPoints || "Per contractual terms").trim();

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const draftedNotice = `FORMAL NOTICE OF ${noticeType.toUpperCase()}
Date: ${dateStr}
To: ${counterparty} (Legal & Operations Department)
From: Contract Administration & Legal Operations, Busitech Enterprise
Subject: Notice regarding ${contractRef} - ${clauseRef}

Dear Legal Operations Team at ${counterparty},

This official correspondence serves as formal notice under ${clauseRef} of the ${contractRef} between our organizations.

Summary of Matter:
${keyPoints}

In accordance with our contractual terms, we request your prompt acknowledgment of this notice within five (5) business days. All rights and remedies under the agreement remain fully reserved.

Sincerely,
Contract Administration & Legal Operations
Busitech Enterprise Platform`;

      return {
        toolResponse: {
          success: true,
          noticeType,
          counterparty,
          contractRef,
          clauseRef,
          draftedText: draftedNotice,
          message: `Formal ${noticeType} drafted for ${counterparty}. Ready for executive export or delivery.`,
        },
        clientActions,
      };
    }

    case "navigate_workspace": {
      const route = String(args.route || "").trim();
      const theme = (args.theme as "light" | "dark" | "system") || undefined;

      if (route) {
        clientActions.push({
          type: "NAVIGATE",
          payload: { route },
        });
      }

      if (theme) {
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
1. Always use your registered tools (search_contracts, list_obligations, create_obligation, get_pending_approvals, resolve_approval, analyze_business_risk, draft_executive_notice, navigate_workspace) whenever the user asks about contracts, obligations, approvals, risk metrics, drafting notices, creating tasks, or navigating the app.
2. Be concise, executive, and action-oriented. Reference specific contract names, clause numbers (e.g., Section 14.2, Clause §9.4), owners, and deadlines.
3. Format responses cleanly with short bullet points or structured sections so they are easy to scan in both the AI Command Bar and the AI Business Agent workspace.`;

const ROLE_PERSONA_INSTRUCTIONS: Record<AgentRolePersona, string> = {
  ops_lead: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **Operations & SLA Compliance Lead**. Prioritize operational execution, SLA credit windows, owner accountability, upcoming deadlines, and human-gate approval velocity.`,
  legal_counsel: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **General Counsel & Clause Auditor**. Prioritize contractual language precision, indemnification caps, governing law, non-renewal notice deadlines, GDPR/SOC2 compliance clauses, and formal legal notice drafting.`,
  risk_analyst: `${SYSTEM_INSTRUCTION}\n\nActive Persona: **Vendor Risk & Market Intelligence Analyst**. Prioritize counterparty financial/security exposure, regulatory developments (DORA, GDPR, SOC 2 Type II), concentration risk, and proactive mitigation strategies.`,
};

/**
 * Multi-turn Ollama Business Agent with support for:
 * - Model: gemma4:31b-cloud (configurable via OLLAMA_MODEL or request parameter)
 * - Role-based system instructions (ops_lead, legal_counsel, risk_analyst)
 * - Full function calling with 8 workspace tools
 * - Automatic client action generation
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
  const client = getOllamaClient();
  const modelToUse = resolveOllamaModel(params.model);

  const toolCalls: ToolExecutionRecord[] = [];
  const clientActions: ClientSideAction[] = [];
  const groundingSources: GroundingSource[] = [];
  const searchQueries: string[] = [];

  const personaKey: AgentRolePersona = params.rolePersona || "ops_lead";
  const systemInstruction = ROLE_PERSONA_INSTRUCTIONS[personaKey];

  // Construct message thread for OpenAI-compatible chat completions
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstruction },
  ];

  if (params.history && Array.isArray(params.history)) {
    for (const msg of params.history.slice(-12)) {
      const text = String(msg.text || msg.content || "").trim();
      if (text) {
        messages.push({
          role: msg.role === "model" || msg.role === "assistant" ? "assistant" : "user",
          content: text,
        });
      }
    }
  }

  messages.push({
    role: "user",
    content: params.prompt,
  });

  // Client-side UI command detection for navigation/theme commands
  const lowerPrompt = params.prompt.toLowerCase();
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

  let finalReply = "";
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages,
      tools: BUSINESS_TOOLS as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = completion.choices[0];
    if (!choice || !choice.message) {
      break;
    }

    const message = choice.message;
    messages.push(message);

    // If the model did not request tool calls, we have the final assistant reply
    if (!message.tool_calls || message.tool_calls.length === 0) {
      finalReply = message.content?.trim() || "";
      break;
    }

    // Execute requested tools
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "function") {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }

        const { toolResponse, clientActions: newActions } = executeBusinessTool(
          toolCall.function.name,
          args,
          params.snapshot
        );

        clientActions.push(...newActions);
        toolCalls.push({
          id: toolCall.id,
          name: toolCall.function.name,
          args,
          result: toolResponse,
          timestamp: new Date().toISOString(),
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResponse),
        });
      }
    }
  }

  if (!finalReply) {
    finalReply = "Actions evaluated and executed successfully.";
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
    modelUsed: modelToUse,
    groundingSources,
    searchQueries,
  };
}

/**
 * Safely parses structured JSON from Ollama responses, stripping markdown code fences.
 */
function parseStructuredJson<T>(rawText: string | undefined, context: string): T {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    const emptyErr = new Error(
      `Invalid response received from Ollama (${context}): Model returned an empty response body.`
    ) as Error & { status?: number; code?: string };
    emptyErr.status = 500;
    emptyErr.code = "INVALID_OLLAMA_RESPONSE";
    throw emptyErr;
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  // Locate the outermost JSON block if the model included conversational filler
  const firstCurly = cleaned.indexOf("{");
  const firstSquare = cleaned.indexOf("[");
  if (firstCurly !== -1 || firstSquare !== -1) {
    const startIndex =
      firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)
        ? firstCurly
        : firstSquare;
    const lastIndex =
      startIndex === firstCurly
        ? cleaned.lastIndexOf("}")
        : cleaned.lastIndexOf("]");
    if (lastIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, lastIndex + 1);
    }
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseErr: any) {
    const malformedErr = new Error(
      `Invalid response received from Ollama (${context}): Failed to parse JSON output (${parseErr?.message || "SyntaxError"}).`
    ) as Error & { status?: number; code?: string };
    malformedErr.status = 500;
    malformedErr.code = "INVALID_OLLAMA_RESPONSE";
    throw malformedErr;
  }
}

/**
 * Structured JSON extraction of contractual obligations from raw contract text using Ollama.
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
  const client = getOllamaClient();
  const model = resolveOllamaModel();

  const systemInstruction = `You are a legal-operations contract extraction engine for Busitech Contract2Action AI.
Extract concrete, actionable obligations from the provided contract text.
You MUST output valid, parseable JSON conforming exactly to this structure:
{
  "summary": "Executive summary of contract obligations and exposure",
  "overallRiskScore": 0-100,
  "extractedObligations": [
    {
      "title": "Concise obligation title",
      "clauseRef": "e.g. Clause §9.4 or Section 14.2",
      "description": "What must be executed",
      "ownerName": "Recommended owner role or person (e.g. 'Legal Operations', 'Cloud Infrastructure')",
      "dueDate": "YYYY-MM-DD",
      "risk": "High" | "Medium" | "Low",
      "category": "Payment" | "Delivery" | "Inspection" | "Compliance" | "Reporting" | "SLA",
      "cadence": "Annual" | "Quarterly" | "One-time" | "Trigger-based"
    }
  ]
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Contract Name: ${params.contractName}
Counterparty: ${params.counterparty || "Counterparty"}

Contract Text:
"""
${params.contractText}
"""`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const rawText = completion.choices[0]?.message?.content || "";
  const parsed = parseStructuredJson<{
    summary?: unknown;
    overallRiskScore?: unknown;
    extractedObligations?: unknown;
  }>(rawText, "Contract Obligation Extraction");

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.extractedObligations)
  ) {
    const schemaErr = new Error(
      "Invalid response received from Ollama (Contract Obligation Extraction): Response JSON did not match the required extraction schema."
    ) as Error & { status?: number; code?: string };
    schemaErr.status = 500;
    schemaErr.code = "INVALID_OLLAMA_RESPONSE";
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

export interface BusinessInsightItem {
  title: string;
  category: string;
  impact: "High" | "Medium" | "Low";
  recommendation: string;
}

/**
 * Generates executive business insights across the Busitech contract & obligation portfolio using Ollama.
 */
export async function generateBusinessInsights(params?: {
  focusArea?: string;
  prompt?: string;
  snapshot?: WorkspaceSnapshot;
}): Promise<{
  summary: string;
  portfolioHealthScore: number;
  insights: BusinessInsightItem[];
  priorityActions: string[];
  modelUsed: string;
}> {
  const client = getOllamaClient();
  const model = resolveOllamaModel();

  const contracts = params?.snapshot?.contracts?.length
    ? params.snapshot.contracts
    : MOCK_CONTRACTS;
  const obligations = params?.snapshot?.obligations?.length
    ? params.snapshot.obligations
    : MOCK_OBLIGATIONS;
  const approvals = params?.snapshot?.approvals?.length
    ? params.snapshot.approvals
    : MOCK_APPROVALS;

  const focusArea = (params?.focusArea || params?.prompt || "overall portfolio governance").trim();

  const portfolioContext = {
    focusArea,
    contractsCount: contracts.length,
    riskyContracts: contracts
      .filter((c) => c.hasRisk)
      .map((c) => ({
        name: c.name,
        counterparty: c.counterparty,
        riskCount: c.riskCount,
        nextDeadline: c.nextDeadlineToDisplay,
      })),
    highRiskOrOverdueObligations: obligations
      .filter((o) => o.risk === "High" || o.status === "Overdue")
      .map((o) => ({
        title: o.title,
        contractName: o.contractName,
        clauseRef: o.clauseRef,
        owner: o.ownerName,
        dueDate: o.dueDate,
        status: o.status,
        risk: o.risk,
      })),
    pendingApprovals: approvals
      .filter((a) => a.status === "Pending")
      .map((a) => ({
        title: a.title,
        contractRef: a.contractRef,
        clauseRef: a.clauseRef,
        riskLevel: a.riskLevel,
        dueDateTag: a.dueDateTag,
      })),
  };

  const systemInstruction = `You are the Chief Legal & Business Intelligence Strategist for Busitech Contract2Action AI.
Produce concise, data-backed executive insights, a portfolio health score (0-100), and concrete priority actions.
You MUST output valid, parseable JSON conforming exactly to this structure:
{
  "summary": "Executive overview of portfolio health and key exposures",
  "portfolioHealthScore": 0-100,
  "insights": [
    {
      "title": "Insight title",
      "category": "Category name",
      "impact": "High" | "Medium" | "Low",
      "recommendation": "Strategic recommendation"
    }
  ],
  "priorityActions": [
    "Concrete action item 1",
    "Concrete action item 2"
  ]
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Generate executive business insights and strategic recommendations for our Busitech contract governance portfolio.
Focus Area: ${focusArea}
Portfolio Data: ${JSON.stringify(portfolioContext)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const rawText = completion.choices[0]?.message?.content || "";
  const parsed = parseStructuredJson<{
    summary?: unknown;
    portfolioHealthScore?: unknown;
    insights?: unknown;
    priorityActions?: unknown;
  }>(rawText, "Business Insights");

  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Portfolio insights generated.",
    portfolioHealthScore:
      typeof parsed.portfolioHealthScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.portfolioHealthScore)))
        : 88,
    insights: Array.isArray(parsed.insights)
      ? (parsed.insights as BusinessInsightItem[])
      : [],
    priorityActions: Array.isArray(parsed.priorityActions)
      ? (parsed.priorityActions as string[])
      : [],
    modelUsed: model,
  };
}

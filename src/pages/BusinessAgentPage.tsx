import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  Wrench,
  CheckCircle2,
  FileText,
  PlusCircle,
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  ArrowRight,
  Zap,
  Globe,
  ExternalLink,
  Cpu,
  UserCheck,
} from "lucide-react";
import {
  geminiService,
  AgentTurnMessage,
  ToolExecutionRecord,
  ExtractedClauseObligation,
  GeminiExtractionResponse,
  GeminiModelTier,
  AgentRolePersona,
  GroundingSource,
} from "../services/geminiService";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

interface ChatEntry {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  modelUsed?: string;
  toolCalls?: ToolExecutionRecord[];
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
}

const MODEL_OPTIONS: Array<{
  id: GeminiModelTier;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: "deepseek-ai/deepseek-v4.1-flash",
    label: "DeepSeek V4.1 Flash",
    badge: "NVIDIA NIM",
    description: "High-speed reasoning, enterprise contract analysis & obligation triage",
  },
  {
    id: "gemini-3.8-flash",
    label: "DeepSeek V4.1 Flash (Fallback)",
    badge: "NVIDIA NIM",
    description: "Resilient fallback routing via NVIDIA DeepSeek endpoint",
  },
];

const ROLE_PERSONAS: Array<{
  id: AgentRolePersona;
  label: string;
  subtitle: string;
}> = [
  {
    id: "ops_lead",
    label: "Operations & SLA Lead",
    subtitle: "Focuses on SLA credits, deadlines & approvals",
  },
  {
    id: "legal_counsel",
    label: "General Counsel & Auditor",
    subtitle: "Focuses on liability caps, GDPR/SOC2 & formal notices",
  },
  {
    id: "risk_analyst",
    label: "Vendor Risk & Market Analyst",
    subtitle: "Focuses on counterparty risk & regulatory news",
  },
];

const AGENT_PLAYBOOKS = [
  {
    id: "pb_risk",
    title: "Portfolio Risk Audit",
    subtitle: "Run analyze_business_risk across all 24 contracts",
    useSearch: false,
    prompt:
      "Run a full business risk analysis across our portfolio, highlight critical bottlenecks, and list recommended executive actions.",
  },
  {
    id: "pb_overdue",
    title: "Overdue & High-Risk Triage",
    subtitle: "Query list_obligations for urgent clauses",
    useSearch: false,
    prompt:
      "List all High risk and Overdue obligations across our contracts and tell me which owners need immediate follow-up.",
  },
  {
    id: "pb_search_reg",
    title: "Live Web Search: Cloud & SOC 2 Compliance",
    subtitle: "Regulatory Search via DeepSeek V4.1 Flash",
    useSearch: true,
    prompt:
      "Search and analyze the latest 2025 enterprise SOC 2 Type II, DORA, and GDPR cloud vendor compliance requirements impacting Stripe, AWS, and Snowflake contracts.",
  },
  {
    id: "pb_notice",
    title: "Draft Non-Renewal Notice",
    subtitle: "Generate formal legal notice via draft_executive_notice",
    useSearch: false,
    prompt:
      "Draft an official Non-Renewal Notice for Salesforce.com Inc. under the Salesforce Enterprise Service Agreement (Section 14.2) to prevent the $48,000 automatic 12-month renewal.",
  },
  {
    id: "pb_create",
    title: "Log New SLA Obligation",
    subtitle: "Invoke create_obligation tool in registry",
    useSearch: false,
    prompt:
      "Create a new High risk SLA obligation titled 'Verify Q4 Multi-Region Failover SLA' for 'AWS Cloud Addendum' (Clause §6.2) assigned to 'Marcus Vance' due on '2025-11-25'.",
  },
];

const SAMPLE_CONTRACT_CLAUSE = `SECTION 9.4 — SECURITY ASSURANCE & AUDIT OBLIGATIONS.
Vendor shall maintain SOC 2 Type II certification throughout the Term and furnish Customer with an attested copy of its annual SOC 2 Type II audit report within thirty (30) calendar days of issuance, no later than December 15, 2025.

SECTION 11.2 — UPTIME SLA & PENALTY REBATE CREDITS.
Vendor guarantees 99.95% monthly platform availability. In the event of a Severity-1 outage exceeding 15 minutes, Vendor shall notify Customer Security Operations within four (4) hours and apply a 15% service credit reconciliation within ten (10) business days of quarter end (November 30, 2025).

SECTION 14.2 — AUTOMATIC RENEWAL & TERMINATION NOTICE.
This Agreement shall automatically renew for successive twelve (12) month periods at standard enterprise list rates ($48,000/year) unless either party delivers written notice of non-renewal at least sixty (60) days prior to the expiration of the current term (October 28, 2025).`;

export const BusinessAgentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"agent" | "extractor">("agent");
  const [selectedModel, setSelectedModel] =
    useState<GeminiModelTier>("deepseek-ai/deepseek-v4.1-flash");
  const [selectedPersona, setSelectedPersona] =
    useState<AgentRolePersona>("ops_lead");
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);

  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome_msg",
      role: "model",
      text: "Hello! I am the **Busitech AI Business Agent** powered by **NVIDIA DeepSeek V4.1 Flash** (`deepseek-ai/deepseek-v4.1-flash`). You can customize my role persona above.\n\nSelect an executive playbook on the right or ask me any question about your contracts, obligations, or approvals below.",
      timestamp: "Ready",
      modelUsed: "deepseek-ai/deepseek-v4.1-flash",
      toolCalls: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedToolCallId, setExpandedToolCallId] = useState<string | null>(
    null
  );
  const [registeredTools, setRegisteredTools] = useState<
    Array<{ name: string; description: string }>
  >([]);

  // Clause Extractor state
  const [contractName, setContractName] = useState(
    "Master Services Agreement v5.0"
  );
  const [counterparty, setCounterparty] = useState("Cloudflare Inc.");
  const [contractText, setContractText] = useState(SAMPLE_CONTRACT_CLAUSE);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<GeminiExtractionResponse | null>(null);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    geminiService
      .getStatus()
      .then((status) => {
        if (status.tools) {
          setRegisteredTools(status.tools);
        }
      })
      .catch(() => {
        // fallback list if status endpoint is still warming
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const allSessionToolCalls = messages.flatMap((m) => m.toolCalls || []);

  const handleSendMessage = async (
    promptOverride?: string,
    forceSearchGrounding?: boolean
  ) => {
    const textToSend = (promptOverride ?? input).trim();
    if (!textToSend || isSending) return;

    if (!promptOverride) {
      setInput("");
    }

    const searchActive = forceSearchGrounding ?? useSearchGrounding;
    if (forceSearchGrounding !== undefined) {
      setUseSearchGrounding(forceSearchGrounding);
    }

    const userMsg: ChatEntry = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const historyForApi: AgentTurnMessage[] = messages
      .filter((m) => m.id !== "welcome_msg")
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await geminiService.sendAgentMessage(
        textToSend,
        historyForApi,
        {
          onNavigate: (route) => navigate(route),
          onSetTheme: (theme) => setTheme(theme),
          onShowToast: (msg, type) => showToast(msg, type || "info"),
        },
        {
          model: searchActive ? "gemini-3.8-flash" : selectedModel,
          rolePersona: selectedPersona,
          useSearchGrounding: searchActive,
        }
      );

      const agentMsg: ChatEntry = {
        id: `ai_${Date.now()}`,
        role: "model",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        modelUsed:
          response.modelUsed ||
          (searchActive ? "gemini-3.8-flash" : selectedModel),
        toolCalls: response.toolCalls || [],
        groundingSources: response.groundingSources || [],
        searchQueries: response.searchQueries || [],
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const errText =
        err?.message ||
        "Failed to reach AI API. Please verify your NVIDIA_API_KEY in Vercel Project Settings.";
      showToast(errText, "error");
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: `⚠️ Error: ${errText}`,
          timestamp: "Error",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleRunExtractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim() || isExtracting) return;

    setIsExtracting(true);
    setSavedIndices([]);
    try {
      const res = await geminiService.extractContractObligations({
        contractName: contractName.trim() || "Enterprise Agreement",
        counterparty: counterparty.trim() || "Counterparty",
        contractText: contractText.trim(),
      });
      setExtractionResult(res);
      showToast(
        `Extracted ${res.extractedObligations.length} obligations with DeepSeek`,
        "success"
      );
    } catch (err: any) {
      showToast(
        err?.message || "Failed to extract obligations from contract text",
        "error"
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveExtractedObligation = async (
    item: ExtractedClauseObligation,
    idx: number
  ) => {
    if (savedIndices.includes(idx)) return;
    try {
      await api.addObligation({
        title: item.title,
        tag: "AI EXTRACTED",
        clauseRef: item.clauseRef,
        description: item.description,
        contractId: "ctr_stripe_msa",
        contractName,
        ownerName: item.ownerName,
        ownerAvatar:
          item.ownerName
            .split(" ")
            .map((p) => p[0]?.toUpperCase())
            .slice(0, 2)
            .join("") || "AI",
        dueDate: item.dueDate,
        dueDateFormatted: item.dueDate,
        status: "Pending",
        risk: item.risk,
        category: item.category,
        responsibleParty: "Acme Corp (Us)",
        verificationStatus: "Verified",
        cadence: item.cadence,
      });
      setSavedIndices((prev) => [...prev, idx]);
      showToast(`Added "${item.title}" to Obligations Registry`, "success");
    } catch (err: any) {
      showToast(err?.message || "Could not save obligation", "error");
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full min-w-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase font-mono">
              NVIDIA DEEPSEEK AGENT • CONTRACT REASONING & ACTIONS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-primary)] shrink-0" />
            <span>Busitech AI Business Agent</span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Multi-turn conversational chatbot powered by NVIDIA DeepSeek (deepseek-ai/deepseek-v4.1-flash) for contract analysis, obligation tracking, and structured reasoning.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("agent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "agent"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI Business Chatbot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("extractor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "extractor"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>AI Clause Extractor</span>
          </button>
        </div>
      </div>

      {activeTab === "agent" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* LEFT 2 COLUMNS: CONVERSATIONAL BUSINESS AGENT */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col overflow-hidden h-[680px] max-h-[82dvh]">
            {/* Agent Top Bar & Model / Role / Grounding Controls */}
            <div className="p-3 sm:px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    AI
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--color-text-main)] truncate">
                      Busitech Multi-Turn Contract & Operations Chatbot
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-text-muted)] truncate">
                      {useSearchGrounding
                        ? "Regulatory Search Active (DeepSeek V4.1 Flash)"
                        : `${selectedModel} • 8 Workspace Tools Active`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: "welcome_msg",
                        role: "model",
                        text: "Conversation reset. Select a model tier, role persona, or playbook below.",
                        timestamp: "Ready",
                        modelUsed: selectedModel,
                        toolCalls: [],
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] transition-colors cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>

              {/* Model Tier Selector + Persona Selector + Google Search Grounding Toggle */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-border-subtle)]">
                {/* Model Selector */}
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                  <select
                    aria-label="Select AI Model"
                    value={useSearchGrounding ? "gemini-3.8-flash" : selectedModel}
                    disabled={useSearchGrounding}
                    onChange={(e) =>
                      setSelectedModel(e.target.value as GeminiModelTier)
                    }
                    className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[11px] font-semibold text-[var(--color-text-main)] focus:outline-hidden disabled:opacity-60"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Persona Selector */}
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                  <select
                    aria-label="Select Chatbot Role Persona"
                    value={selectedPersona}
                    onChange={(e) =>
                      setSelectedPersona(e.target.value as AgentRolePersona)
                    }
                    className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[11px] font-semibold text-[var(--color-text-main)] focus:outline-hidden"
                  >
                    {ROLE_PERSONAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        Role: {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Google Search Grounding Toggle */}
                <button
                  type="button"
                  onClick={() => setUseSearchGrounding((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ml-auto ${
                    useSearchGrounding
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-main)]"
                  }`}
                  title="Enable live regulatory search via NVIDIA DeepSeek"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Regulatory Search: {useSearchGrounding ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[84%] rounded-2xl px-4 py-3 text-xs sm:text-sm space-y-2.5 ${
                      msg.role === "user"
                        ? "bg-[var(--color-primary)] text-white rounded-br-xs shadow-xs"
                        : "bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-bl-xs"
                    }`}
                  >
                    {/* Tool Calls Executed in this turn */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="space-y-1.5 pb-2 border-b border-[var(--color-border)]">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-primary-text)] flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 shrink-0" />
                          <span>
                            Invoked {msg.toolCalls.length} AI{" "}
                            {msg.toolCalls.length === 1 ? "Tool" : "Tools"}
                          </span>
                        </div>
                        {msg.toolCalls.map((tc) => {
                          const isExpanded = expandedToolCallId === tc.id;
                          return (
                            <div
                              key={tc.id}
                              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedToolCallId(
                                    isExpanded ? null : tc.id
                                  )
                                }
                                className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                                  <span className="font-mono font-bold text-[11px] text-[var(--color-primary-text)]">
                                    {tc.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] truncate">
                                    ({Object.keys(tc.args || {}).join(", ")})
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
                                )}
                              </button>
                              {isExpanded && (
                                <div className="p-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] font-mono text-[10px] space-y-1.5">
                                  <div className="text-[var(--color-text-subtle)]">
                                    Input Args:
                                  </div>
                                  <pre className="p-2 rounded bg-[var(--color-bg-card)] text-[var(--color-text-main)] overflow-x-auto">
                                    {JSON.stringify(tc.args, null, 2)}
                                  </pre>
                                  <div className="text-[var(--color-text-subtle)]">
                                    Output Result:
                                  </div>
                                  <pre className="p-2 rounded bg-[var(--color-bg-card)] text-[var(--color-text-main)] overflow-x-auto max-h-44">
                                    {JSON.stringify(tc.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap leading-relaxed break-words">
                      {msg.text}
                    </div>

                    {/* Google Search Grounding Sources */}
                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="pt-2.5 border-t border-[var(--color-border)] space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-primary-text)] flex items-center gap-1.5">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>
                            Google Search Grounded Sources ({msg.groundingSources.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.groundingSources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-primary)] text-[11px] font-medium text-[var(--color-primary-text)] transition-colors max-w-xs truncate"
                            >
                              <span className="truncate">{src.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-subtle)] mt-1 px-1 font-mono">
                    {msg.role === "user"
                      ? "You"
                      : `Busitech Agent (${msg.modelUsed || selectedModel})`}{" "}
                    • {msg.timestamp}
                  </span>
                </div>
              ))}

              {isSending && (
                <div className="flex items-start gap-2.5">
                  <div className="rounded-2xl rounded-bl-xs border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] px-4 py-3 text-xs flex items-center gap-2 text-[var(--color-text-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] shrink-0" />
                    <span>
                      {useSearchGrounding
                        ? "Searching live regulatory data with DeepSeek V4.1 Flash..."
                        : `Reasoning with ${selectedModel} and executing workspace tools...`}
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  useSearchGrounding
                    ? "Ask a Google Search grounded question about vendor compliance, DORA/SOC2, or counterparty news..."
                    : "Ask the AI Business Agent to audit risks, search contracts, create obligations, or approve items..."
                }
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs sm:text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden focus:border-[var(--color-primary)] min-w-0"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PLAYBOOKS & LIVE TOOL REGISTRY */}
          <div className="space-y-4 min-w-0">
            {/* Autonomous Playbooks Card */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[var(--color-primary)]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)]">
                    One-Click Agent Playbooks
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold">
                  Tools + Search
                </span>
              </div>

              <div className="space-y-2">
                {AGENT_PLAYBOOKS.map((pb) => (
                  <button
                    key={pb.id}
                    type="button"
                    disabled={isSending}
                    onClick={() => handleSendMessage(pb.prompt, pb.useSearch)}
                    className="w-full p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary-border)] text-left transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5">
                        {pb.useSearch && (
                          <Globe className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                        )}
                        <span>{pb.title}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-subtle)] group-hover:text-[var(--color-primary)] shrink-0" />
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      {pb.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Registered Function Declarations & Trace */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[var(--color-primary)]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)]">
                    Registered AI Tools
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-[var(--color-success)] font-bold">
                  {allSessionToolCalls.length} calls run
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {(registeredTools.length > 0
                  ? registeredTools
                  : [
                      {
                        name: "search_contracts",
                        description: "Filter contracts by counterparty or risk",
                      },
                      {
                        name: "list_obligations",
                        description: "Query deadlines by status, risk, category",
                      },
                      {
                        name: "create_obligation",
                        description: "Register new obligation in workspace",
                      },
                      {
                        name: "get_pending_approvals",
                        description: "Fetch human-gate approval queue",
                      },
                      {
                        name: "resolve_approval",
                        description: "Approve or reject pending items",
                      },
                      {
                        name: "analyze_business_risk",
                        description: "Compute portfolio risk telemetry",
                      },
                      {
                        name: "draft_executive_notice",
                        description: "Generate formal legal notices",
                      },
                      {
                        name: "navigate_workspace",
                        description: "Navigate routes or toggle theme",
                      },
                    ]
                ).map((tool) => (
                  <div
                    key={tool.name}
                    className="p-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] text-xs"
                  >
                    <div className="font-mono font-bold text-[11px] text-[var(--color-primary-text)]">
                      {tool.name}()
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 mt-0.5">
                      {tool.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: AI STRUCTURED CLAUSE EXTRACTOR */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Clause Input Form */}
          <form
            onSubmit={handleRunExtractor}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-main)]">
                  Structured Contract Obligation Extractor
                </h2>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Uses AI schema analysis to extract actionable obligations
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold">
                responseSchema
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                  Contract Title
                </label>
                <input
                  type="text"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs text-[var(--color-text-main)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                  Counterparty
                </label>
                <input
                  type="text"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs text-[var(--color-text-main)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                  Contract Clauses / Raw Legal Text
                </label>
                <button
                  type="button"
                  onClick={() => setContractText(SAMPLE_CONTRACT_CLAUSE)}
                  className="text-[11px] font-semibold text-[var(--color-primary-text)] hover:underline cursor-pointer"
                >
                  Reset Sample Clauses
                </button>
              </div>
              <textarea
                rows={10}
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste contract sections or legal clauses here..."
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs font-mono text-[var(--color-text-main)] leading-relaxed focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={isExtracting || !contractText.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Structured Obligations with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Actionable Obligations</span>
                </>
              )}
            </button>
          </form>

          {/* Right: Extracted Results */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-main)]">
                  Extracted Actionable Obligations
                </h2>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  One-click import into the Busitech Obligations Registry
                </p>
              </div>
              {extractionResult && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]">
                  Risk Score: {extractionResult.overallRiskScore}/100
                </span>
              )}
            </div>

            {!extractionResult ? (
              <div className="py-16 text-center space-y-2 text-[var(--color-text-muted)]">
                <CheckSquare className="w-8 h-8 mx-auto text-[var(--color-text-subtle)]" />
                <div className="text-xs font-semibold">
                  Click &ldquo;Extract Actionable Obligations&rdquo; to analyze clauses
                </div>
                <p className="text-[11px] text-[var(--color-text-subtle)] max-w-sm mx-auto">
                  AI will parse deadlines, risk levels, responsible owners, and clause references into structured records.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] text-xs text-[var(--color-text-main)] leading-relaxed">
                  <span className="font-bold text-[var(--color-primary-text)] block mb-1">
                    Executive Summary:
                  </span>
                  {extractionResult.summary}
                </div>

                <div className="space-y-3">
                  {extractionResult.extractedObligations.map((ob, idx) => {
                    const isSaved = savedIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-[var(--color-text-main)]">
                              {ob.title}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                              {ob.clauseRef} • Owner: {ob.ownerName} • Due:{" "}
                              {ob.dueDate}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              ob.risk === "High"
                                ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]"
                                : ob.risk === "Medium"
                                ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]"
                                : "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
                            }`}
                          >
                            {ob.risk} Risk • {ob.category}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                          {ob.description}
                        </p>

                        <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">
                            Cadence: {ob.cadence}
                          </span>
                          <button
                            type="button"
                            disabled={isSaved}
                            onClick={() =>
                              handleSaveExtractedObligation(ob, idx)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isSaved
                                ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
                                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Saved to Registry</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add to Obligations</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

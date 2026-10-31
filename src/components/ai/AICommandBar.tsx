import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import {
  geminiService,
  GeminiAgentResponse,
  ToolExecutionRecord,
} from "../../services/geminiService";
import { useToast } from "../../context/ToastContext";
import { useTheme } from "../../context/ThemeContext";

interface AICommandBarProps {
  onClosePalette?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Go to obligations",
  "List all high risk obligations",
  "Show pending approvals",
  "Switch to dark mode",
  "Draft a non-renewal notice for Salesforce",
];

export const AICommandBar: React.FC<AICommandBarProps> = ({
  onClosePalette,
  placeholder = "Ask AI to navigate, triage risk, or draft notices...",
  autoFocus = false,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiAgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setTheme } = useTheme();

  const handleExecute = async (overrideQuery?: string) => {
    const queryToRun = (overrideQuery ?? query).trim();
    if (!queryToRun || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await geminiService.executeCommand(queryToRun, {
        onNavigate: (route) => {
          onClosePalette?.();
          navigate(route);
        },
        onSetTheme: (theme) => {
          setTheme(theme);
        },
        onShowToast: (msg, type) => {
          showToast(msg, type || "info");
        },
      });
      setResult(response);
    } catch (err: any) {
      const msg = String(err?.message || "");
      let friendly = "Unable to process AI command. Please try again shortly.";

      if (
        msg.includes("MISSING_API_KEY") ||
        msg.includes("OLLAMA_API_KEY") ||
        msg.includes("Missing Ollama API Key") ||
        msg.includes("Missing NVIDIA API Key") ||
        msg.includes("NVIDIA_API_KEY") ||
        msg.includes("Missing Gemini API Key")
      ) {
        friendly =
          "Ollama Cloud API key is not configured. Please add OLLAMA_API_KEY in your .env file.";
      } else if (msg.includes("404") || msg.includes("NOT_FOUND")) {
        friendly =
          "AI service endpoint is temporarily unavailable. Please retry in a moment.";
      } else if (
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("RATE_LIMITED") ||
        msg.includes("RESOURCE_EXHAUSTED")
      ) {
        friendly =
          "AI request rate limit reached. Please wait a moment before trying again.";
      } else if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("ECONNREFUSED")
      ) {
        friendly =
          "Network connection failed. Please check your network and Ollama Cloud endpoint.";
      } else if (
        err?.message &&
        !err.message.includes("<!doctype") &&
        !err.message.includes("<html") &&
        err.message.length < 120
      ) {
        friendly = err.message;
      }

      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xs focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0 animate-pulse" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden min-w-0"
          />

          {loading ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
              <span className="hidden sm:inline">Executing...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleExecute()}
              disabled={!query.trim()}
              className="px-3 py-1 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Run</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        {!result && !error && (
          <div className="mt-2 flex flex-wrap gap-1.5 px-1">
            <span className="text-[11px] text-[var(--color-text-subtle)] mr-1 self-center">
              Try:
            </span>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setQuery(p);
                  handleExecute(p);
                }}
                className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border)] transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1 min-w-0">
            <div className="font-bold">AI Command Error</div>
            <div className="break-words">{error}</div>
          </div>
        </div>
      )}

      {/* AI Execution Result & Tool Calls */}
      {result && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3.5 space-y-3 animate-in fade-in duration-150">
          {/* Executed Tool Calls Badges */}
          {result.toolCalls && result.toolCalls.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)] flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-[var(--color-primary)]" />
                <span>
                  AI Tool Calls Executed ({result.toolCalls.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {result.toolCalls.map((tc: ToolExecutionRecord) => {
                  const isExpanded = expandedToolId === tc.id;
                  return (
                    <div
                      key={tc.id}
                      className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] overflow-hidden text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedToolId(isExpanded ? null : tc.id)
                        }
                        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                          <span className="font-mono font-bold text-[11px] text-[var(--color-primary-text)]">
                            {tc.name}()
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)] truncate font-mono">
                            {JSON.stringify(tc.args)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] space-y-1.5 font-mono text-[10px]">
                          <div className="text-[var(--color-text-subtle)]">
                            Arguments:
                          </div>
                          <pre className="p-2 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] overflow-x-auto">
                            {JSON.stringify(tc.args, null, 2)}
                          </pre>
                          <div className="text-[var(--color-text-subtle)]">
                            Tool Output:
                          </div>
                          <pre className="p-2 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)] overflow-x-auto max-h-40">
                            {JSON.stringify(tc.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Response Text */}
          <div className="text-xs sm:text-sm text-[var(--color-text-main)] whitespace-pre-wrap leading-relaxed">
            {result.reply}
          </div>

          {/* Footer link to open full AI Business Agent */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">
              Model: {result.modelUsed || "gemma4:31b-cloud"} • Ollama Cloud
            </span>
            <button
              type="button"
              onClick={() => {
                onClosePalette?.();
                navigate("/agent");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-text)] hover:underline cursor-pointer"
            >
              <span>Open AI Business Agent Workspace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

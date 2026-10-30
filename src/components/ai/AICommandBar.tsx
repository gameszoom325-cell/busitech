import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Loader2,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Terminal,
} from "lucide-react";
import {
  geminiService,
  GeminiAgentResponse,
  ToolExecutionRecord,
} from "../../services/geminiService";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";

interface AICommandBarProps {
  initialQuery?: string;
  onClosePalette?: () => void;
  compact?: boolean;
}

const QUICK_AI_COMMANDS = [
  "Analyze overall business risk exposure",
  "List all high-risk and overdue obligations",
  "Show pending human-gate approvals",
  "Create a High risk SLA obligation for AWS Cloud due 2025-11-20",
  "Draft a Non-Renewal Notice for Salesforce Section 14.2",
];

export const AICommandBar: React.FC<AICommandBarProps> = ({
  initialQuery = "",
  onClosePalette,
  compact = false,
}) => {
  const [prompt, setPrompt] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiAgentResponse | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { showToast } = useToast();

  const handleRunCommand = async (commandText?: string) => {
    const queryToRun = (commandText ?? prompt).trim();
    if (!queryToRun || isLoading) return;

    if (commandText) {
      setPrompt(commandText);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiService.executeCommand(queryToRun, {
        onNavigate: (route) => {
          navigate(route);
          onClosePalette?.();
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
      setError(
        err?.message ||
          "Unable to execute AI command. Check your Gemini API key in Settings > Secrets."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRunCommand();
    }
  };

  return (
    <div className="space-y-3">
      {/* Command Input Box */}
      <div className="rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-bg-card-subtle)] p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 shrink-0" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Busitech AI to search contracts, create obligations, approve items, or analyze risk..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden min-w-0"
            disabled={isLoading}
          />
          <button
            onClick={() => handleRunCommand()}
            disabled={isLoading || !prompt.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Run AI</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Command Suggestions */}
        {!compact && (
          <div className="mt-2.5 pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-subtle)] flex items-center gap-1 mr-1">
              <Terminal className="w-3 h-3" />
              Try:
            </span>
            {QUICK_AI_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleRunCommand(cmd)}
                disabled={isLoading}
                className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:border-[var(--color-primary-border)] transition-colors truncate max-w-[260px] cursor-pointer"
              >
                {cmd}
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
            <div className="font-bold">Gemini Command Error</div>
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
                  Gemini Tool Calls Executed ({result.toolCalls.length})
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
              Model: gemini-3.8-flash • Server-side Tool Calling
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

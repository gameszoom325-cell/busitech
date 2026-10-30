import React from "react";
import {
  X,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Scale,
  DollarSign,
  Database,
  WifiOff,
  ExternalLink,
  Clock,
} from "lucide-react";
import { ContractSummaryMetadata } from "../../services/contractCache";
import { SmartExportButton } from "./SmartExportModal";

interface ContractSummaryModalProps {
  summary: ContractSummaryMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAnalysis: (contractId: string) => void;
  isOfflineMode: boolean;
  cacheSource: string;
  syncedAt: string;
}

export const ContractSummaryModal: React.FC<ContractSummaryModalProps> = ({
  summary,
  isOpen,
  onClose,
  onOpenFullAnalysis,
  isOfflineMode,
  cacheSource,
  syncedAt,
}) => {
  if (!isOpen || !summary) return null;

  const formattedSyncTime = (() => {
    try {
      return new Date(syncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Cached";
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-modal)] overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]">
                  {summary.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isOfflineMode
                      ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]"
                      : "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
                  }`}
                >
                  {isOfflineMode ? (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Offline Cached Snapshot ({cacheSource})</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3" />
                      <span>Synced & Cached ({formattedSyncTime})</span>
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--color-text-main)] mt-1 truncate">
                {summary.name}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Counterparty: <strong className="text-[var(--color-text-main)]">{summary.counterparty}</strong> • {summary.type} • {summary.fileSize}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            aria-label="Close summary modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)]/35 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-text)] flex items-center justify-between">
              <span>Cached Executive Summary</span>
              <span className="font-mono text-[10px]">Available Offline</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-text-main)] leading-relaxed">
              {summary.executiveSummary}
            </p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] font-medium">
                <DollarSign className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Annual Value</span>
              </div>
              <div className="font-mono font-bold text-sm text-[var(--color-text-main)]">
                {summary.annualContractValue}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] font-medium">
                <Scale className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Governing Law</span>
              </div>
              <div className="font-semibold text-xs text-[var(--color-text-main)]">
                {summary.governingLaw}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Next Milestone</span>
              </div>
              <div className="font-mono font-bold text-xs text-[var(--color-text-main)]">
                {summary.nextDeadlineToDisplay}
              </div>
            </div>
          </div>

          {/* Renewal Terms */}
          <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[var(--color-text-main)] block">
                  Renewal & Notice Terms
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {summary.renewalTerms}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                summary.hasRisk
                  ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]"
                  : "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]"
              }`}
            >
              {summary.hasRisk ? "High Risk Flagged" : "Standard Risk"}
            </span>
          </div>

          {/* Key Cached Clauses */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Cached Key Clauses ({summary.keyClauses.length})
            </h3>
            <div className="space-y-2">
              {summary.keyClauses.map((clause, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-xs text-[var(--color-text-main)]">
                      <span className="font-mono text-[var(--color-primary-text)] mr-1.5">
                        {clause.clauseRef}
                      </span>
                      {clause.title}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        clause.riskLevel === "High"
                          ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"
                          : clause.riskLevel === "Medium"
                          ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                          : "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                      }`}
                    >
                      {clause.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {clause.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cached Obligations Snapshot */}
          {summary.obligationsPreview.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Tracked Obligations Snapshot ({summary.obligationsPreview.length} of{" "}
                {summary.obligationsCount})
              </h3>
              <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
                {summary.obligationsPreview.map((ob) => (
                  <div
                    key={ob.id}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[var(--color-text-main)] truncate">
                        {ob.title}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        {ob.clauseRef} • Owner: {ob.ownerName} • Due:{" "}
                        {ob.dueDateFormatted}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ob.status === "Overdue" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Overdue</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary-text)]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{ob.status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-2 flex-wrap">
          <SmartExportButton
            label="Export Summary (PDF/CSV)"
            defaultContractId={summary.contractId}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullAnalysis(summary.contractId);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              <span>Inspect Clause Analysis</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

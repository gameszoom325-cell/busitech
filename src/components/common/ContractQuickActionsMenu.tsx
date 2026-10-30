import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Flag,
  Archive,
  FileDown,
  Check,
  ChevronUp,
  X,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { Contract, Obligation } from '../../types';
import { ContractSummaryMetadata } from '../../services/contractCache';

export interface ContractQuickActionsMenuProps {
  contractId: string;
  contractName: string;
  contractCode: string;
  counterparty: string;
  currentStatus: Contract['status'];
  isFlaggedForReview: boolean;
  summary?: ContractSummaryMetadata;
  obligations: Obligation[];
  onFlagForReview: () => void;
  onArchiveContract: () => void;
  onExportSummary: (format?: 'pdf' | 'csv') => void;
}

export const ContractQuickActionsMenu: React.FC<ContractQuickActionsMenuProps> = ({
  contractName,
  contractCode,
  currentStatus,
  isFlaggedForReview,
  onFlagForReview,
  onArchiveContract,
  onExportSummary
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [recentAction, setRecentAction] = useState<'flag' | 'archive' | 'export' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Alt+Q toggles Quick Actions menu, Escape closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const triggerActionFeedback = (actionType: 'flag' | 'archive' | 'export') => {
    setRecentAction(actionType);
    setTimeout(() => {
      setRecentAction(prev => (prev === actionType ? null : prev));
    }, 1800);
  };

  const handleFlagClick = () => {
    onFlagForReview();
    triggerActionFeedback('flag');
  };

  const handleArchiveClick = () => {
    onArchiveContract();
    triggerActionFeedback('archive');
  };

  const handleExportClick = (format: 'pdf' | 'csv' = 'pdf') => {
    onExportSummary(format);
    triggerActionFeedback('export');
  };

  const isArchived = currentStatus === 'Archived';

  return (
    <div
      ref={menuRef}
      data-testid="quick-actions-floating-container"
      aria-label="Contract Quick Actions Floating Menu"
      className="fixed bottom-20 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 select-none"
    >
      {/* Expanded Floating Menu Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Quick Actions Menu"
          className="w-72 sm:w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[var(--color-text-main)] truncate">
                  Quick Actions
                </div>
                <div className="text-[10px] font-mono text-[var(--color-text-muted)] truncate">
                  {contractCode} • {currentStatus}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Collapse Quick Actions menu"
              className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* One-Click Action Buttons */}
          <div className="space-y-1.5">
            {/* 1. Flag for Review */}
            <button
              type="button"
              role="menuitem"
              data-testid="quick-action-flag-review"
              onClick={handleFlagClick}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[42px] ${
                isFlaggedForReview
                  ? 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isFlaggedForReview
                      ? 'bg-[var(--color-warning)] text-white'
                      : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                  }`}
                >
                  {recentAction === 'flag' ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Flag className="w-3.5 h-3.5 shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    Flag for Review
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                    {isFlaggedForReview
                      ? 'Currently flagged (click to clear flag)'
                      : 'Mark contract for human legal review'}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  isFlaggedForReview
                    ? 'bg-[var(--color-bg-card)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]'
                    : 'text-[var(--color-text-subtle)]'
                }`}
              >
                {isFlaggedForReview ? 'FLAGGED' : '1-Click'}
              </span>
            </button>

            {/* 2. Archive */}
            <button
              type="button"
              role="menuitem"
              data-testid="quick-action-archive"
              onClick={handleArchiveClick}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer min-h-[42px] ${
                isArchived
                  ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isArchived
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-neutral-chip-bg)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {recentAction === 'archive' ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : isArchived ? (
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    Archive
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                    {isArchived
                      ? 'Archived in vault (click to restore Active)'
                      : 'Move contract to read-only archive'}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  isArchived
                    ? 'bg-[var(--color-bg-card)] text-[var(--color-info-text)] border border-[var(--color-info-border)]'
                    : 'text-[var(--color-text-subtle)]'
                }`}
              >
                {isArchived ? 'ARCHIVED' : '1-Click'}
              </span>
            </button>

            {/* 3. Export Summary */}
            <div className="flex items-stretch gap-1.5">
              <button
                type="button"
                role="menuitem"
                data-testid="quick-action-export-summary"
                onClick={() => handleExportClick('pdf')}
                className="flex-1 flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] hover:bg-[var(--color-bg-hover)] text-[var(--color-primary-text)] text-left transition-all cursor-pointer min-h-[42px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white shrink-0">
                    {recentAction === 'export' ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      Export Summary
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                      Download {contractName.split(' ')[0]} executive brief (PDF)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0">
                  PDF
                </span>
              </button>

              <button
                type="button"
                title="Export Summary as CSV"
                aria-label="Export Summary as CSV"
                data-testid="quick-action-export-summary-csv"
                onClick={() => handleExportClick('csv')}
                className="px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                <span className="text-[9px] font-mono font-bold">CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill / Trigger Button */}
      <button
        type="button"
        data-testid="quick-actions-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label="Toggle Quick Actions floating menu"
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-95 min-h-[42px]"
      >
        <Zap className="w-4 h-4 shrink-0" />
        <span>Quick Actions</span>
        {(isFlaggedForReview || isArchived) && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-white/20 text-white">
            {isArchived ? 'Archived' : 'Flagged'}
          </span>
        )}
        <ChevronUp
          className={`w-3.5 h-3.5 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
};

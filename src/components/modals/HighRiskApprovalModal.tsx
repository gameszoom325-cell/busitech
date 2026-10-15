import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { ApprovalItem } from '../../types';
import { StatusChip } from '../common/StatusChip';

interface HighRiskApprovalModalProps {
  isOpen: boolean;
  item: ApprovalItem | null;
  onClose: () => void;
  onConfirm: (comment: string) => void;
}

export const HighRiskApprovalModal: React.FC<HighRiskApprovalModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please provide a substantive audit note justifying this high-risk authorization (min 5 chars).');
      return;
    }
    setError('');
    onConfirm(comment.trim());
    setComment('');
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-danger-bg)] shrink-0 min-h-[48px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
            <div className="truncate min-w-0">
              <h3 className="text-sm font-bold text-[var(--color-danger-text)] truncate">
                Human-in-the-Loop Risk Gate
              </h3>
              <p className="text-[11px] text-[var(--color-danger-text)] opacity-90 truncate">
                Explicit signoff justification required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusChip label="HIGH RISK" variant="danger" dot dotColor="red" />
              <span className="text-xs font-semibold text-[var(--color-text-main)] truncate">{item.title}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {item.contractRef} • {item.clauseRef}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-xs text-[var(--color-text-main)] font-serif italic break-words">
            {item.contractualBasisQuote}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
              Legal / Operational Justification *
            </label>
            <p className="text-[11px] text-[var(--color-text-muted)] mb-2">
              This note will be permanently hashed into the immutable activity log alongside your user signature.
            </p>
            <textarea
              rows={3}
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Reviewed with General Counsel; non-renewal notice confirmed."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-danger)] resize-none"
            />
            {error && <p className="text-[11px] text-[var(--color-danger-text)] mt-1">{error}</p>}
          </div>

          {/* Execution Checklines */}
          <div className="space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
              <span>Generates pre-filled notice letter from legal template</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
              <span>Logs a certified dispatch record in the Activity Log with a hash</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] shrink-0 pb-[var(--safe-bottom)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity shadow-xs min-h-[44px]"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Confirm & Dispatch Notice</span>
          </button>
        </div>
      </div>
    </div>
  );
};

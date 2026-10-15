import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Shield,
  ShieldCheck,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  KeyRound,
  FileCheck2,
  History,
  Lock,
  Edit,
  X,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_APPROVALS } from '../data/mockData';
import { ApprovalItem } from '../types';
import { Avatar } from '../components/common/Avatar';
import { HighRiskApprovalModal } from '../components/modals/HighRiskApprovalModal';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [approvals, setApprovals] = useState<ApprovalItem[]>(MOCK_APPROVALS);
  const [highRiskItemToApprove, setHighRiskItemToApprove] = useState<ApprovalItem | null>(null);

  const handleAction = (item: ApprovalItem, actionType: 'approve' | 'edit' | 'reject' | 'assign' | 'dismiss') => {
    if (actionType === 'approve' && item.riskLevel === 'HIGH RISK') {
      setHighRiskItemToApprove(item);
      return;
    }

    if (actionType === 'approve') {
      setApprovals(prev => prev.filter(a => a.id !== item.id));
      showToast(`Action approved: ${item.title}`, 'success');
    } else if (actionType === 'reject') {
      setApprovals(prev => prev.filter(a => a.id !== item.id));
      showToast(`Action rejected: ${item.title}`, 'info');
    } else if (actionType === 'edit') {
      showToast(`Draft editor opened for ${item.title}`, 'info');
    } else if (actionType === 'assign') {
      showToast(`Assigned ${item.title} to Security Team lead`, 'success');
    } else if (actionType === 'dismiss') {
      setApprovals(prev => prev.filter(a => a.id !== item.id));
      showToast(`Action dismissed: ${item.title}`, 'info');
    }
  };

  const handleConfirmHighRisk = (comment: string) => {
    if (!highRiskItemToApprove) return;
    setApprovals(prev => prev.filter(a => a.id !== highRiskItemToApprove.id));
    showToast(`High-risk action confirmed & dispatched: "${comment}"`, 'success');
    setHighRiskItemToApprove(null);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1 flex items-center gap-1.5 truncate">
          <span>WORKFLOW ENGINE</span>
          <span>/</span>
          <span className="font-mono text-[var(--color-primary)]">HUMAN_GATE_STAGE_01</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Pending Approvals
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Review and authorize automated actions generated from contract obligations before execution.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
              <span>{approvals.length} Pending</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] shrink-0" />
              <span>1 High Risk</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>14 Approved</span>
            </span>
          </div>
        </div>
      </div>

      {/* Human Gate Banner */}
      <div className="p-3.5 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-[var(--color-primary)] text-white shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-xs text-[var(--color-text-main)] leading-relaxed break-words">
            <strong className="font-semibold">Human-in-the-loop governance:</strong> Critical financial disbursements, legal notices, and subprocessor additions require explicit confirmation by authorized team leads.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] tracking-wider uppercase shrink-0 whitespace-nowrap self-start sm:self-center">
          HUMAN GATE
        </span>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: APPROVAL CARDS (LEFT) & SAFEGUARDS / SESSION (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: PENDING APPROVAL CARDS */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {approvals.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CheckCircle2 className="w-10 h-10 text-[var(--color-success)] mx-auto mb-3 shrink-0" />
              <h3 className="text-sm font-bold text-[var(--color-text-main)]">
                All Pending Approvals Authorized
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                No contract actions currently require human-in-the-loop review.
              </p>
            </div>
          ) : (
            approvals.map(item => {
              const isHighRisk = item.riskLevel === 'HIGH RISK';
              const isMedRisk = item.riskLevel === 'MEDIUM RISK';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-3 sm:space-y-4 min-w-0"
                >
                  {/* Top line with Risk Tag and Due Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isHighRisk
                            ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]'
                            : isMedRisk
                            ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]'
                            : 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isHighRisk
                              ? 'bg-[var(--color-danger)]'
                              : isMedRisk
                              ? 'bg-[var(--color-warning)]'
                              : 'bg-[var(--color-info)]'
                          }`}
                        />
                        <span>{item.riskLevel}</span>
                      </span>

                      <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-main)] truncate">
                        {item.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 self-start sm:self-auto ${
                        isHighRisk
                          ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
                          : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {item.dueDateTag}
                    </span>
                  </div>

                  {/* Subtitle / Contract Ref */}
                  <div className="text-xs text-[var(--color-text-muted)] font-medium truncate">
                    {item.contractRef} • {item.clauseRef}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-text-main)] leading-relaxed break-words">
                    {item.description}
                  </p>

                  {/* Extracted Contractual Basis Quote Box */}
                  <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[var(--color-text-subtle)] gap-2">
                      <span className="truncate">EXTRACTED CONTRACTUAL BASIS</span>
                      {item.basisMatchPercent && (
                        <span className="font-mono text-[var(--color-success-text)] bg-[var(--color-success-bg)] px-1.5 py-0.2 rounded border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
                          {item.basisMatchPercent}
                        </span>
                      )}
                    </div>
                    <p className="font-serif italic text-xs leading-relaxed text-[var(--color-text-main)] break-words">
                      {item.contractualBasisQuote}
                    </p>
                  </div>

                  {/* Execution checklines */}
                  {item.actions && item.actions.length > 0 && (
                    <div className="space-y-1 text-[11px] text-[var(--color-text-muted)]">
                      {item.actions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0 mt-0.5" />
                          <span className="break-words">{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons: Min 44px tap target on mobile */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)] flex-wrap">
                    <button
                      onClick={() => handleAction(item, 'approve')}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[44px] sm:min-h-[36px]"
                    >
                      {item.primaryButtonLabel}
                    </button>

                    {item.secondaryButtonLabel && (
                      <button
                        onClick={() =>
                          handleAction(item, item.secondaryButtonLabel === 'Edit Draft' ? 'edit' : 'assign')
                        }
                        className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px] sm:min-h-[36px]"
                      >
                        {item.secondaryButtonLabel}
                      </button>
                    )}

                    {item.thirdButtonLabel && (
                      <button
                        onClick={() => handleAction(item, 'reject')}
                        className="px-3 py-2 text-xs font-medium text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] rounded-lg transition-colors ml-auto min-h-[44px] sm:min-h-[36px]"
                      >
                        {item.thirdButtonLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: SAFEGUARDS + RECENTLY APPROVED + SIGN-OFF SESSION */}
        <div className="space-y-4 min-w-0">
          {/* Execution Safeguards */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-3 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-main)] truncate">Execution Safeguards</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0">
                Active
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0">
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                    Cryptographic Signature
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                    Required for sensitive workflows
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0">
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                    Cross-Clause Validation
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                    Multi-clause dependency checks
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0">
                  <History className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                    Immutable Audit Trail
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                    SHA-256 state tracking
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recently Approved */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-3 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-main)] truncate">Recently Approved</span>
              <button
                onClick={() => navigate('/activity')}
                className="text-[11px] font-semibold text-[var(--color-primary-text)] hover:underline shrink-0"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-main)] truncate">
                  <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                  <span className="truncate">AWS SLA credit claim</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] pl-5 truncate">
                  Approved by {user?.name || 'Sarah J.'}
                </div>
                <div className="text-[10px] text-[var(--color-text-subtle)] pl-5">Yesterday at 4:18 PM</div>
              </div>

              <div className="space-y-1 pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-main)] truncate">
                  <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                  <span className="truncate">Datadog DPA Addendum</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] pl-5 truncate">
                  Signed & Archived via DocuSign
                </div>
                <div className="text-[10px] text-[var(--color-text-subtle)] pl-5">Oct 21, 2025</div>
              </div>
            </div>
          </div>

          {/* Active Signoff Session Card */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex items-center justify-between min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={user?.name || 'Sarah Jenkins'}
                initials={user?.avatarText}
                size="md"
                showStatus
                isOnline={true}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--color-text-main)] truncate">
                  Active Signoff Session
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  {user?.name || 'Sarah Jenkins'} ({user?.authLevel || 'Auth Lv 3'})
                </div>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* High-Risk Comment Requirement Modal */}
      <HighRiskApprovalModal
        isOpen={!!highRiskItemToApprove}
        item={highRiskItemToApprove}
        onClose={() => setHighRiskItemToApprove(null)}
        onConfirm={handleConfirmHighRisk}
      />
    </div>
  );
};

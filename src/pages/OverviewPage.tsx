import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Filter,
  Download,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_CONTRACTS } from '../data/mockData';
import { ObligationsBarChart } from '../components/charts/ObligationsBarChart';
import { RiskDonutChart } from '../components/charts/RiskDonutChart';

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [filterViewActive, setFilterViewActive] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Ayush';

  const handleExportCSV = () => {
    showToast('Exporting Recent Contracts CSV...', 'info');
    const headers = ['Contract Name', 'ID', 'Counterparty', 'Obligations', 'Next Deadline'];
    const rows = MOCK_CONTRACTS.slice(0, 4).map(c => [
      `"${c.name}"`,
      `"${c.code}"`,
      `"${c.counterparty}"`,
      c.obligationsCount,
      c.nextDeadlineToDisplay
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'recent_contracts_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Recent contracts CSV exported successfully', 'success');
  };

  const handleReviewAndSend = (taskName: string) => {
    showToast(`Navigating to ${taskName} approval review`, 'info');
    navigate('/approvals');
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* HEADER SECTION - Fluid flex wrap */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-text-main)] uppercase whitespace-nowrap">
              OPERATIONAL ENGINE ACTIVE
            </span>
          </div>
          {/* Heading */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
            Hello, {firstName}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
            Here's what needs your attention across your contracts and obligations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => {
              setFilterViewActive(!filterViewActive);
              showToast(filterViewActive ? 'Showing default view' : 'Filter view enabled', 'info');
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors min-h-[40px] sm:min-h-[36px] ${
              filterViewActive
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border-[var(--color-primary-border)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Filter View</span>
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Upload Contract</span>
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS IN A RESPONSIVE GRID: 2 columns on phone, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Contracts */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Active Contracts</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
              +2
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight tabular-nums">
              24
            </div>
            <div className="text-[10px] sm:text-[11px] text-[var(--color-text-subtle)] truncate mt-0.5">
              18 counterparties
            </div>
          </div>
          <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-success)] rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Pending Approvals</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] shrink-0 whitespace-nowrap">
              Review
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight tabular-nums">
              3
            </div>
            <div className="text-[10px] sm:text-[11px] text-[var(--color-text-subtle)] truncate mt-0.5">
              High priority
            </div>
          </div>
          <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: '45%' }} />
          </div>
        </div>

        {/* Card 3: Upcoming Deadlines */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Upcoming Deadlines</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] shrink-0 whitespace-nowrap">
              14 days
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight tabular-nums">
              7
            </div>
            <div className="text-[10px] sm:text-[11px] text-[var(--color-text-subtle)] truncate mt-0.5">
              Audits & renewals
            </div>
          </div>
          <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-info)] rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Card 4: Overdue Obligations */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Overdue Obligations</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] shrink-0 whitespace-nowrap">
              Action
            </span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-danger)] tracking-tight tabular-nums">
              1
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-danger-text)] uppercase tracking-wider">
              Critical
            </span>
          </div>
          <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-danger)] rounded-full" style={{ width: '90%' }} />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION (Tables on desktop, stacked on tablet/mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: RECENT CONTRACTS */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col overflow-hidden min-w-0 h-auto">
          {/* Card Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-bold text-[var(--color-text-main)] truncate">Recent Contracts</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0 whitespace-nowrap">
                Live Sync
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Download CSV"
                aria-label="Download CSV"
              >
                <Download className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => setFilterViewActive(!filterViewActive)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Filter rows"
                aria-label="Filter rows"
              >
                <Filter className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* DESKTOP/TABLET TABLE VIEW (≥ 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                  <th className="py-3 px-5">Contract Name</th>
                  <th className="py-3 px-4">Counterparty</th>
                  <th className="py-3 px-4">Obligations</th>
                  <th className="py-3 px-4 text-right">Next Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs">
                {MOCK_CONTRACTS.slice(0, 4).map(contract => (
                  <tr
                    key={contract.id}
                    onClick={() => navigate(`/contracts/${contract.id}/analysis`)}
                    className="hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary-text)] shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors truncate max-w-xs">
                            {contract.name}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
                            ID: {contract.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--color-text-main)] font-medium whitespace-nowrap">
                      {contract.counterparty}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {contract.hasRisk ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{contract.obligationsCount} extracted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]">
                          <span>{contract.obligationsCount} extracted</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[var(--color-text-main)] whitespace-nowrap">
                      {contract.nextDeadlineToDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE STACKED CARDS VIEW (< 640px) - Zero horizontal scroll */}
          <div className="sm:hidden divide-y divide-[var(--color-border)]">
            {MOCK_CONTRACTS.slice(0, 4).map(contract => (
              <div
                key={contract.id}
                onClick={() => navigate(`/contracts/${contract.id}/analysis`)}
                className="p-3.5 hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover)] cursor-pointer transition-colors space-y-2 min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span className="font-semibold text-xs text-[var(--color-text-main)] truncate">
                      {contract.name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)] shrink-0">
                    {contract.nextDeadlineToDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                    {contract.counterparty} • <span className="font-mono">{contract.code}</span>
                  </span>

                  {contract.hasRisk ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] shrink-0">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{contract.obligationsCount}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] shrink-0">
                      <span>{contract.obligationsCount}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] truncate">
              Showing 4 of 24 contracts
            </span>
            <button
              onClick={() => navigate('/contracts')}
              className="font-semibold text-[var(--color-primary-text)] hover:text-[var(--color-primary-hover)] flex items-center gap-1 transition-colors shrink-0 min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ATTENTION REQUIRED + AGENT NOTE */}
        <div className="space-y-4 min-w-0">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <span className="text-sm font-bold text-[var(--color-text-main)] truncate">Attention Required</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] shrink-0">
                3 URGENT
              </span>
            </div>

            {/* 3 Mini Cards */}
            <div className="mt-3 space-y-3">
              {/* Mini card 1 */}
              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--color-text-main)] truncate">
                      Quarterly Security Audit Certificate
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] uppercase tracking-wider shrink-0">
                    CRITICAL
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  Cloudflare Enterprise MSA
                </div>
                <div className="flex items-center gap-1 text-[var(--color-danger-text)] font-semibold text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Deadline: Tomorrow, 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">Clause §9.4</span>
                  <button
                    onClick={() => handleReviewAndSend('Quarterly Security Audit Certificate')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[36px]"
                  >
                    Review & Send
                  </button>
                </div>
              </div>

              {/* Mini card 2 */}
              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--color-text-main)] truncate">
                      Notice of Renewal Intent (60-day clause)
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] uppercase tracking-wider shrink-0">
                    6D LEFT
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  Salesforce Service Agreement
                </div>
                <div className="flex items-center gap-1 text-[var(--color-text-muted)] font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Deadline: Oct 28, 2025</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">Clause §14.2</span>
                  <button
                    onClick={() => handleReviewAndSend('Notice of Renewal Intent')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[36px]"
                  >
                    Approve Notice
                  </button>
                </div>
              </div>

              {/* Mini card 3 */}
              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-info)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--color-text-main)] truncate">
                      Annual SOC2 Type II Report Upload
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] uppercase tracking-wider shrink-0">
                    UPCOMING
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  HubSpot DPA
                </div>
                <div className="flex items-center gap-1 text-[var(--color-text-muted)] font-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Deadline: Nov 05, 2025</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-mono text-[var(--color-text-subtle)]">Compliance Rule</span>
                  <button
                    onClick={() => {
                      showToast('Opening secure upload connector', 'info');
                      navigate('/upload');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[36px]"
                  >
                    Upload Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Note */}
          <div className="p-4 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span className="text-xs font-bold text-[var(--color-primary-text)]">
                Contract2Action Agent
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-main)] leading-relaxed break-words">
              3 draft notifications were prepared from trigger conditions. They are waiting for your approval before anything is sent.
            </p>
          </div>
        </div>
      </div>

      {/* INSIGHTS ROW: REAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
        <div className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <ObligationsBarChart />
        </div>
        <div className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <RiskDonutChart />
        </div>
      </div>
    </div>
  );
};

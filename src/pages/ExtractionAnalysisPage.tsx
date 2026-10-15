import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  Check,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Search,
  Filter,
  Download,
  Eye,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import { StatusChip } from '../components/common/StatusChip';
import { useToast } from '../context/ToastContext';
import { MOCK_ANALYSIS_OBLIGATIONS } from '../data/mockData';
import { Obligation } from '../types';

export const ExtractionAnalysisPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedObligation, setSelectedObligation] = useState<Obligation>(MOCK_ANALYSIS_OBLIGATIONS[2]);
  const [docViewMode, setDocViewMode] = useState<'extracted' | 'original'>('extracted');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [partyFilter, setPartyFilter] = useState<'All' | 'Acme Corp (Us)' | 'Mutual' | 'Counterparty (Stripe)'>('All');

  const filteredObligations = partyFilter === 'All'
    ? MOCK_ANALYSIS_OBLIGATIONS
    : MOCK_ANALYSIS_OBLIGATIONS.filter(o => o.responsibleParty === partyFilter);

  const handleLocateInText = () => {
    setIsHighlighted(true);
    showToast('Jumped to Section 14.5 in source document', 'info');
    setTimeout(() => {
      const el = document.getElementById('clause-quote-box');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setIsHighlighted(false), 2500);
  };

  const handleApproveWorkflow = () => {
    showToast('Workflow approved: 5 obligations scheduled to active registry', 'success');
    navigate('/obligations');
  };

  const handleConfirmTask = () => {
    showToast(`Obligation task confirmed: ${selectedObligation.title}`, 'success');
  };

  const handleExportCSV = () => {
    const headers = ['Obligation', 'Clause', 'Responsible', 'Deadline', 'Status'];
    const rows = MOCK_ANALYSIS_OBLIGATIONS.map(o => [
      `"${o.title}"`,
      `"${o.clauseRef}"`,
      `"${o.responsibleParty}"`,
      `"${o.dueDateFormatted}"`,
      o.verificationStatus || 'Verified'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'stripe_msa_extracted_obligations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Extraction data exported to CSV', 'success');
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-32 sm:pb-28 w-full min-w-0">
      {/* Top Breadcrumb & Title Section */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase mb-1 truncate">
          CONTRACTS / STRIPE ENTERPRISE MSA / EXTRACTION ANALYSIS
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="flex items-center flex-wrap gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Stripe Enterprise Master Services Agreement (2025)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>6 Obligations Extracted</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/obligations')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              Review Obligations
            </button>
            <button
              onClick={handleApproveWorkflow}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Approve Workflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-[var(--color-primary)] text-white shrink-0">
            <Sparkles className="w-4 h-4 shrink-0" />
          </div>
          <p className="text-xs text-[var(--color-text-main)] leading-relaxed break-words">
            <strong className="font-semibold">AI-Assisted Extraction:</strong> obligations were parsed from legal language and cross-referenced with section clauses. Highlighted items indicate conditional ambiguity requiring legal counsel review.
          </p>
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono text-[var(--color-primary-text)] shrink-0 self-start sm:self-center font-medium whitespace-nowrap">
          Demo model • Verified clauses
        </div>
      </div>

      {/* 3 STAT CARDS: 1 col on small phones, 3 cols on tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Clauses Scanned */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider truncate">
              TOTAL CLAUSES SCANNED
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
              48
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
              across 19 pages
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 ml-2">
            <Layers className="w-5 h-5 shrink-0" />
          </div>
        </div>

        {/* Actionable Obligations */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider truncate">
              ACTIONABLE OBLIGATIONS
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
              6
            </div>
            <div className="text-[11px] text-[var(--color-success-text)] font-medium mt-0.5 truncate">
              5 Ready • 1 Flagged
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success)] flex items-center justify-center shrink-0 ml-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </div>
        </div>

        {/* High Confidence Score */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider truncate">
              HIGH CONFIDENCE SCORE
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
              94%
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
              5/6 passed threshold
            </div>
          </div>
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 ml-2">
            <svg viewBox="0 0 36 36" className="w-11 h-11 sm:w-12 sm:h-12 transform -rotate-90">
              <path
                className="text-[var(--color-border-subtle)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--color-primary)]"
                strokeDasharray="94, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-[var(--color-text-main)]">
              94%
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT: Stacks on tablets & phones below lg breakpoint */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: EXTRACTED ACTION ITEMS */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex flex-col overflow-hidden min-w-0 h-auto">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[var(--color-text-main)] truncate">Extracted Action Items</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0 whitespace-nowrap">
                6 items
              </span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-[var(--color-text-muted)] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
                <span className="hidden xs:inline">Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] shrink-0" />
                <span className="hidden xs:inline">Ambiguous</span>
              </div>
            </div>
          </div>

          {/* DESKTOP/TABLET TABLE VIEW (≥ 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                  <th className="py-3 px-5">Obligation & Action Item</th>
                  <th className="py-3 px-4">Responsible</th>
                  <th className="py-3 px-4 text-right">Deadline / Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-xs">
                {filteredObligations.map(item => {
                  const isSelected = selectedObligation.id === item.id;
                  const isAmbiguous = item.verificationStatus === 'Ambiguous';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedObligation(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-primary-light)] border-l-4 border-[var(--color-primary)]'
                          : 'hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-start gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              isAmbiguous ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold ${isSelected ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-text-main)]'} truncate`}>
                                {item.title}
                              </span>
                              {item.tag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] shrink-0">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-main)]">
                          {item.responsibleParty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-[11px]">
                        <span className={isAmbiguous ? 'text-[var(--color-danger-text)] font-semibold' : 'text-[var(--color-text-main)]'}>
                          {item.dueDateFormatted}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE STACKED CARDS VIEW (< 640px) */}
          <div className="sm:hidden divide-y divide-[var(--color-border)]">
            {filteredObligations.map(item => {
              const isSelected = selectedObligation.id === item.id;
              const isAmbiguous = item.verificationStatus === 'Ambiguous';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedObligation(item)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-2 min-h-[44px] ${
                    isSelected
                      ? 'bg-[var(--color-primary-light)] border-l-4 border-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isAmbiguous ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
                        }`}
                      />
                      <span className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                        {item.title}
                      </span>
                    </div>
                    {item.tag && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] shrink-0">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                      {item.responsibleParty}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-text-subtle)]">
                      {item.dueDateFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <span className="text-[var(--color-text-muted)] truncate">
              Showing 5 of 6 obligations • <span className="font-mono">ID: CTR-2025-STRIPE-MSA</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Export CSV</span>
              </button>

              <select
                value={partyFilter}
                onChange={e => setPartyFilter(e.target.value as any)}
                className="px-2 py-1 text-xs font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[36px]"
              >
                <option value="All">All Parties</option>
                <option value="Acme Corp (Us)">Acme Corp (Us)</option>
                <option value="Mutual">Mutual</option>
                <option value="Counterparty (Stripe)">Counterparty (Stripe)</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CLAUSE INSPECTOR PANEL + AUDIT VAULT */}
        <div className="space-y-4 min-w-0">
          {/* Clause Inspector */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <h3 className="text-sm font-bold text-[var(--color-text-main)] truncate">Clause Inspector</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0">
                SEC 14.1
              </span>
            </div>

            {/* Source document line */}
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-[var(--color-text-muted)] font-medium uppercase text-[10px] tracking-wider shrink-0">
                SOURCE DOCUMENT
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono text-[11px] text-[var(--color-text-main)] truncate">Stripe_MSA_Final.pdf</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
                  Matched
                </span>
              </div>
            </div>

            {/* Document Viewer Toggle */}
            <div className="flex items-center justify-between gap-2 p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDocViewMode('extracted')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors min-h-[32px] ${
                    docViewMode === 'extracted'
                      ? 'bg-[var(--color-bg-card)] text-[var(--color-primary-text)] font-semibold shadow-xs'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  Extracted
                </button>
                <button
                  onClick={() => setDocViewMode('original')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors min-h-[32px] ${
                    docViewMode === 'original'
                      ? 'bg-[var(--color-bg-card)] text-[var(--color-primary-text)] font-semibold shadow-xs'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  Original
                </button>
              </div>

              <button
                onClick={handleLocateInText}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary-text)] hover:underline shrink-0 min-h-[32px] pr-1"
              >
                <Crosshair className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Locate</span>
              </button>
            </div>

            {/* Quote Card */}
            <div
              id="clause-quote-box"
              className={`p-3.5 sm:p-4 rounded-lg border bg-[var(--color-bg-card-subtle)] border-l-4 border-l-[var(--color-primary)] transition-all duration-200 ${
                isHighlighted
                  ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-light)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-2 gap-2">
                <span className="font-semibold text-[var(--color-text-main)] truncate">
                  {selectedObligation.section || 'Section 14.5 • Term & Termination'}
                </span>
                <span className="font-mono text-[10px] shrink-0">
                  {selectedObligation.pageLine || 'Page 14, Line 22'}
                </span>
              </div>
              <p className="font-serif italic text-xs leading-relaxed text-[var(--color-text-main)] break-words">
                “Either party may terminate this Agreement at the end of the Initial Term by providing written notice of non-renewal to the other party no later than sixty (60) days prior to the expiration date...”
              </p>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-border-subtle)] flex-wrap">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] whitespace-nowrap">
                  Notice: {selectedObligation.noticeThreshold || '60 Days'}
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] border border-[var(--color-border)] whitespace-nowrap">
                  Type: {selectedObligation.cadence || 'Recurring'}
                </span>
              </div>
            </div>

            {/* AI Parsing Analysis */}
            <div className="space-y-2 text-xs pt-1">
              <div className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">
                AI PARSING ANALYSIS
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)] gap-2">
                <span className="text-[var(--color-text-muted)] shrink-0">Extracted Action</span>
                <span className="font-semibold text-[var(--color-text-main)] truncate">Send Non-Renewal Notice</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)] gap-2">
                <span className="text-[var(--color-text-muted)] shrink-0">Assigned Lead</span>
                <span className="font-semibold text-[var(--color-text-main)] truncate">Legal Operations (Sarah J.)</span>
              </div>
              <div className="flex items-center justify-between py-1 gap-2">
                <span className="text-[var(--color-text-muted)] shrink-0">Downstream</span>
                <span className="text-[11px] font-mono text-[var(--color-primary-text)] flex items-center gap-1 truncate">
                  <span className="truncate">Jira Automation</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--color-neutral-chip-bg)] text-[var(--color-text-muted)] shrink-0">Planned</span>
                </span>
              </div>
            </div>

            {/* Confirm Obligation Task CTA */}
            <button
              onClick={handleConfirmTask}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[44px]"
            >
              Confirm Obligation Task
            </button>
          </div>

          {/* Deterministic Audit Vault Card */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--color-success)] shrink-0" />
              <h4 className="text-xs font-bold text-[var(--color-text-main)] truncate">
                Deterministic Audit Vault
              </h4>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed break-words">
              Every approval is recorded in the activity log with automated timestamping and cryptographic hash generation.
            </p>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR: Reserves safe area bottom */}
      <div className="fixed bottom-0 md:bottom-0 left-0 right-0 z-[var(--z-sticky)] p-3 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] shadow-lg flex items-center justify-between px-3 sm:px-6 lg:px-8 pb-[calc(0.75rem+var(--safe-bottom))]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-main)] truncate min-w-0 mr-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
          <span className="truncate">5 of 6 obligations ready</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/obligations')}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[40px] sm:min-h-[36px]"
          >
            Edit
          </button>
          <button
            onClick={handleApproveWorkflow}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};

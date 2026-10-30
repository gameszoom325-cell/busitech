import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  ShieldAlert,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import {
  generateSmartPDF,
  generateSmartCSV,
  SmartExportOptions
} from '../../services/smartExport';
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS, MOCK_APPROVALS } from '../../data/mockData';
import { Contract, Obligation } from '../../types';
import { useToast } from '../../context/ToastContext';

interface SmartExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContractId?: string;
  customContracts?: Contract[];
  customObligations?: Obligation[];
}

export const SmartExportModal: React.FC<SmartExportModalProps> = ({
  isOpen,
  onClose,
  defaultContractId = 'ALL',
  customContracts,
  customObligations
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeContracts, setIncludeContracts] = useState(true);
  const [includeObligations, setIncludeObligations] = useState(true);
  const [includeRiskAssessment, setIncludeRiskAssessment] = useState(true);
  const [contractFilterId, setContractFilterId] = useState(defaultContractId);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const contractsList = customContracts ?? MOCK_CONTRACTS;
  const obligationsList = customObligations ?? MOCK_OBLIGATIONS;

  const handleRunExport = () => {
    if (!includeContracts && !includeObligations && !includeRiskAssessment) {
      showToast('Select at least one report section to export', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      const options: SmartExportOptions = {
        format,
        includeContracts,
        includeObligations,
        includeRiskAssessment,
        contractFilterId,
        customContracts: contractsList,
        customObligations: obligationsList
      };

      const fileName =
        format === 'pdf'
          ? generateSmartPDF(options)
          : generateSmartCSV(options);

      showToast(
        `Smart Export downloaded: ${fileName} (${format.toUpperCase()})`,
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast(
        err?.message || 'Failed to generate export report',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--color-text-main)] truncate">
                Smart Export Report Builder
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                Download formatted PDF or CSV reports for contracts, obligations &amp; risk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            aria-label="Close Smart Export modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. Export Format Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
              1. Choose Report Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  format === 'pdf'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/50 ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[var(--color-text-main)]">
                    Formatted PDF Report
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Executive layout with tables, KPIs &amp; risk cards
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  format === 'csv'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/50 ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[var(--color-text-main)]">
                    Structured CSV Data
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Spreadsheet-ready multi-section audit export
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Contract Scope Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
              2. Contract Scope
            </label>
            <select
              value={contractFilterId}
              onChange={e => setContractFilterId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)] text-xs font-medium text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)]"
            >
              <option value="ALL">
                Full Enterprise Portfolio ({contractsList.length} Contracts)
              </option>
              {contractsList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.counterparty} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Included Sections Checkboxes */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
              3. Report Sections to Include
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includeRiskAssessment}
                  onChange={e => setIncludeRiskAssessment(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)]"
                />
                <ShieldAlert className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--color-text-main)]">
                    Risk Assessments &amp; Approvals
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    Risk distribution tiers, compliance KPIs &amp; {MOCK_APPROVALS.length} approval gates
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-subtle)]">
                Included
              </span>
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includeContracts}
                  onChange={e => setIncludeContracts(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)]"
                />
                <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--color-text-main)]">
                    Contract Summaries
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    Counterparty metadata, contract codes, status &amp; next deadlines
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-subtle)]">
                {contractFilterId === 'ALL' ? contractsList.length : 1} items
              </span>
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includeObligations}
                  onChange={e => setIncludeObligations(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)]"
                />
                <CheckSquare className="w-4 h-4 text-[var(--color-info)] shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--color-text-main)]">
                    Extracted Obligations &amp; Deadlines
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    Clause references, owners, risk levels &amp; due dates
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-subtle)]">
                {obligationsList.length} items
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleRunExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>
              Download {format.toUpperCase()} Report
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface SmartExportButtonProps {
  label?: string;
  defaultContractId?: string;
  customContracts?: Contract[];
  customObligations?: Obligation[];
  variant?: 'primary' | 'outline';
}

export const SmartExportButton: React.FC<SmartExportButtonProps> = ({
  label = 'Smart Export',
  defaultContractId = 'ALL',
  customContracts,
  customObligations,
  variant = 'outline'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs min-h-[40px] sm:min-h-[36px] cursor-pointer ${
          variant === 'primary'
            ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
            : 'border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)]'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
        <span className="whitespace-nowrap">{label}</span>
      </button>

      <SmartExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultContractId={defaultContractId}
        customContracts={customContracts}
        customObligations={customObligations}
      />
    </>
  );
};

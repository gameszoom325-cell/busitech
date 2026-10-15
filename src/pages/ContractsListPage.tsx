import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MOCK_CONTRACTS } from '../data/mockData';
import { Contract } from '../types';

export const ContractsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [counterpartyFilter, setCounterpartyFilter] = useState('All');

  const counterparties = Array.from(new Set(contracts.map(c => c.counterparty)));

  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (counterpartyFilter !== 'All' && c.counterparty !== counterpartyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.counterparty.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Contract Name', 'ID', 'Counterparty', 'Type', 'Obligations', 'Next Deadline', 'Status'];
    const rows = filteredContracts.map(c => [
      `"${c.name}"`,
      `"${c.code}"`,
      `"${c.counterparty}"`,
      `"${c.type}"`,
      c.obligationsCount,
      c.nextDeadlineToDisplay,
      c.status
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'contracts_registry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Contracts registry exported to CSV', 'success');
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1 truncate">
          PLATFORM / CONTRACT REPOSITORY
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Contracts
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Centralized repository of active vendor, customer, and partner agreements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Export CSV</span>
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
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search contracts by name, code or vendor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] sm:min-h-[36px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={counterpartyFilter}
            onChange={e => setCounterpartyFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="All">All Counterparties</option>
            {counterparties.map(cp => (
              <option key={cp} value={cp}>
                {cp}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Contracts Table / Stacked Cards */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
        {/* DESKTOP/TABLET TABLE (≥ 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                <th className="py-3.5 px-5">CONTRACT NAME & ID</th>
                <th className="py-3.5 px-4">COUNTERPARTY</th>
                <th className="py-3.5 px-4">CATEGORY</th>
                <th className="py-3.5 px-4">OBLIGATIONS</th>
                <th className="py-3.5 px-4">NEXT DEADLINE</th>
                <th className="py-3.5 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                    No contracts matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/contracts/${c.id}/analysis`)}
                    className="hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] group-hover:scale-105 transition-transform shrink-0">
                          <FileText className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors truncate max-w-xs">
                            {c.name}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">
                            ID: {c.code} • {c.fileSize || '3.4 MB'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-[var(--color-text-main)] whitespace-nowrap">
                      {c.counterparty}
                    </td>

                    <td className="py-4 px-4 text-[var(--color-text-muted)] whitespace-nowrap">
                      {c.type}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {c.hasRisk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{c.obligationsCount} obligations</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]">
                          <span>{c.obligationsCount} extracted</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-[var(--color-text-main)] whitespace-nowrap">
                      {c.nextDeadlineToDisplay}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.status === 'Active'
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]'
                            : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            c.status === 'Active' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'
                          }`}
                        />
                        <span>{c.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS VIEW (< 640px) */}
        <div className="sm:hidden divide-y divide-[var(--color-border)]">
          {filteredContracts.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/contracts/${c.id}/analysis`)}
              className="p-3.5 hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-hover)] cursor-pointer transition-colors space-y-2 min-h-[44px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <span className="font-semibold text-xs text-[var(--color-text-main)] truncate">
                    {c.name}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    c.status === 'Active'
                      ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                      : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                {c.counterparty} • <span className="font-mono">{c.code}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border-subtle)]">
                <span className="text-[11px] text-[var(--color-primary-text)] font-medium">
                  {c.obligationsCount} obligations
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-subtle)]">
                  Next: {c.nextDeadlineToDisplay}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{filteredContracts.length} agreements</span>
          <span className="truncate ml-2">Click to inspect</span>
        </div>
      </div>
    </div>
  );
};

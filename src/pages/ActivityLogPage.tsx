import React, { useState } from 'react';
import {
  History,
  Download,
  Search,
  RotateCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { ActivityEvent } from '../types';

export const ActivityLogPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs] = useState<ActivityEvent[]>(MOCK_ACTIVITY_LOGS);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    if (categoryFilter !== 'All' && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Category', 'Action Taken', 'Target Reference', 'Cryptographic Hash'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.target}"`,
      `"${l.hash}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'c2a_audit_activity_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Activity log exported to CSV', 'success');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Approval':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0">
            APPROVAL
          </span>
        );
      case 'Extraction':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] shrink-0">
            EXTRACTION
          </span>
        );
      case 'System':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] shrink-0">
            SYSTEM
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] border border-[var(--color-border)] shrink-0">
            {category.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1 flex items-center gap-2 truncate">
          <span>GOVERNANCE</span>
          <span>/</span>
          <span className="text-[var(--color-primary)]">IMMUTABLE LOG</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Activity Log
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Verifiable audit trail of contract uploads, parsing runs, and human-in-the-loop signoffs.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs shrink-0 min-h-[40px] sm:min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity by user, action, target, or hash..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] sm:min-h-[36px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="All">All Event Types</option>
            <option value="Approval">Approvals</option>
            <option value="Extraction">Extractions</option>
            <option value="System">System Actions</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              showToast('Activity log refreshed', 'info');
            }}
            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
            title="Reset filters"
          >
            <RotateCw className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Activity Table / Stacked Cards */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
        {/* DESKTOP/TABLET TABLE (≥ 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                <th className="py-3.5 px-5">TIMESTAMP</th>
                <th className="py-3.5 px-4">USER & ROLE</th>
                <th className="py-3.5 px-4">EVENT TYPE</th>
                <th className="py-3.5 px-4">ACTION TAKEN</th>
                <th className="py-3.5 px-4">TARGET CLAUSE / REF</th>
                <th className="py-3.5 px-4 text-right">HASH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap text-[var(--color-text-muted)]">
                      {log.timestamp}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--color-text-main)] truncate max-w-[120px]">{log.userName}</div>
                      <div className="text-[10px] text-[var(--color-text-subtle)]">{log.userRole}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(log.category)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[var(--color-text-main)]">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4 text-[var(--color-text-muted)]">
                      {log.target}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-subtle)]">
                        {log.hash}
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
          {filteredLogs.map(log => (
            <div key={log.id} className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-xs text-[var(--color-text-main)]">{log.userName}</div>
                  <div className="text-[10px] text-[var(--color-text-subtle)]">{log.timestamp}</div>
                </div>
                {getCategoryBadge(log.category)}
              </div>

              <div className="text-xs text-[var(--color-text-main)] font-medium break-words">
                {log.action}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--color-border-subtle)] gap-2">
                <span className="text-[var(--color-text-muted)] truncate max-w-[200px]">
                  {log.target}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-subtle)] shrink-0">
                  {log.hash}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{filteredLogs.length} events</span>
          <span className="font-mono text-[10px] sm:text-[11px]">SHA-256 Chain</span>
        </div>
      </div>
    </div>
  );
};

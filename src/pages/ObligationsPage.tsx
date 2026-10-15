import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Plus,
  Search,
  Filter,
  RotateCw,
  FileText,
  Clock,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MOCK_OBLIGATIONS, MOCK_CONTRACTS } from '../data/mockData';
import { Obligation, ObligationStatus } from '../types';
import { Avatar } from '../components/common/Avatar';
import { ManualObligationModal } from '../components/modals/ManualObligationModal';

export const ObligationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [obligations, setObligations] = useState<Obligation[]>(MOCK_OBLIGATIONS);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'In Progress' | 'Completed' | 'Overdue'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState('All Contracts');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Tab counts
  const counts = useMemo(() => {
    return {
      All: 28,
      Pending: 12,
      'In Progress': 9,
      Completed: 6,
      Overdue: 1
    };
  }, []);

  // Filtered rows
  const filteredObligations = useMemo(() => {
    return obligations.filter(ob => {
      // Tab filter
      if (activeTab === 'Pending' && ob.status !== 'Pending') return false;
      if (activeTab === 'In Progress' && ob.status !== 'In Progress') return false;
      if (activeTab === 'Completed' && ob.status !== 'Completed') return false;
      if (activeTab === 'Overdue' && ob.status !== 'Overdue') return false;

      // Contract filter
      if (selectedContract !== 'All Contracts' && ob.contractName !== selectedContract) return false;

      // Priority/Risk filter
      if (selectedPriority !== 'All Priorities') {
        if (selectedPriority === 'High Risk' && ob.risk !== 'High') return false;
        if (selectedPriority === 'Medium Risk' && ob.risk !== 'Medium') return false;
        if (selectedPriority === 'Low Risk' && ob.risk !== 'Low') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ob.title.toLowerCase().includes(q) ||
          ob.contractName.toLowerCase().includes(q) ||
          ob.ownerName.toLowerCase().includes(q) ||
          ob.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [obligations, activeTab, selectedContract, selectedPriority, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredObligations.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredObligations.map(o => o.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const updated = new Set(selectedRowIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedRowIds(updated);
  };

  const handleExportCSV = () => {
    const headers = ['Task / Obligation', 'Related Contract', 'Owner', 'Due Date', 'Status', 'Risk Tier'];
    const rows = filteredObligations.map(o => [
      `"${o.title}"`,
      `"${o.contractName}"`,
      `"${o.ownerName}"`,
      `"${o.dueDateFormatted.replace('\n', ' - ')}"`,
      o.status,
      o.risk
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `obligations_registry_${activeTab.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Obligations exported to CSV', 'success');
  };

  const handleAddManualObligation = (newOb: Omit<Obligation, 'id'>) => {
    const created: Obligation = {
      ...newOb,
      id: `ob_${Date.now()}`
    };
    setObligations(prev => [created, ...prev]);
  };

  const getStatusChip = (status: ObligationStatus) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--color-info-border)] shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] shrink-0" />
            <span>In Progress</span>
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] shrink-0" />
            <span>Overdue</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shrink-0" />
            <span>Completed</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] border border-[var(--color-neutral-chip-border)] shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-subtle)] shrink-0" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1 flex items-center gap-2 truncate">
          <span>AI-EXTRACTED OPS</span>
          <span>/</span>
          <span className="text-[var(--color-primary)]">LIVE REGISTRY</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Obligations
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Track, manage, and execute active commitments extracted from signed contracts.
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
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Add Obligation</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 STAT CARDS: 2 col on phone, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase">
            <span className="truncate">COMMITMENTS</span>
            <Layers className="w-4 h-4 text-[var(--color-primary)] shrink-0 ml-1" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tabular-nums">
              28
            </span>
            <span className="flex items-center text-[11px] font-semibold text-[var(--color-success-text)] shrink-0">
              <ArrowUpRight className="w-3 h-3 shrink-0" />
              100%
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase">
            <span className="truncate">IN PROGRESS</span>
            <Clock className="w-4 h-4 text-[var(--color-info)] shrink-0 ml-1" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tabular-nums">
              9
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] truncate">
              32.1% load
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase">
            <span className="truncate">CRITICAL SLA</span>
            <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0 ml-1" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-danger)] tabular-nums">
              1
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[var(--color-danger-text)] truncate">
              Action Req.
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase">
            <span className="truncate">COMPLIANCE</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 ml-1" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-main)] tabular-nums">
              96.4%
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-success-text)] shrink-0">
              +1.2%
            </span>
          </div>
        </div>
      </div>

      {/* TABS & AUTO-SYNC HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Pending', 'In Progress', 'Completed', 'Overdue'] as const).map(tab => {
            const count = counts[tab];
            const isActive = activeTab === tab;
            const isOverdue = tab === 'Overdue';

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isOverdue && count > 0
                      ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] font-bold'
                      : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-subtle)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] shrink-0 truncate">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
          <span className="truncate">Auto-synced from 14 active contracts</span>
        </div>
      </div>

      {/* FILTER BAR: Responsive wrapping */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter by task, contract or owner..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[40px] sm:min-h-[36px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedContract}
            onChange={e => setSelectedContract(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="All Contracts">All Contracts</option>
            {MOCK_CONTRACTS.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px] flex-1 sm:flex-initial"
          >
            <option value="All Priorities">All Priorities</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedContract('All Contracts');
              setSelectedPriority('All Priorities');
              showToast('Filters refreshed', 'info');
            }}
            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center shrink-0"
            title="Reset filters"
            aria-label="Reset filters"
          >
            <RotateCw className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* TABLE / STACKED CARDS WRAPPER */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
        {/* DESKTOP/TABLET TABLE VIEW (≥ 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.size === filteredObligations.length && filteredObligations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                </th>
                <th className="py-3 px-4">TASK / OBLIGATION</th>
                <th className="py-3 px-4">RELATED CONTRACT</th>
                <th className="py-3 px-4">OWNER</th>
                <th className="py-3 px-4">DUE DATE</th>
                <th className="py-3 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-xs">
              {filteredObligations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--color-text-muted)]">
                    No obligations matched your filters.
                  </td>
                </tr>
              ) : (
                filteredObligations.map(ob => {
                  const isChecked = selectedRowIds.has(ob.id);

                  return (
                    <tr
                      key={ob.id}
                      className={`hover:bg-[var(--color-bg-hover)] transition-colors ${
                        isChecked ? 'bg-[var(--color-primary-light)]' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(ob.id)}
                          className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="max-w-md">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[var(--color-text-main)] truncate">
                              {ob.title}
                            </span>
                            {ob.tag && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                  ob.tag.includes('CRITICAL')
                                    ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]'
                                    : 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]'
                                }`}
                              >
                                {ob.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                            {ob.description}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate('/contracts/ctr_stripe_msa/analysis')}
                          className="flex items-center gap-1.5 text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors group"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                          <span className="underline decoration-[var(--color-border)] group-hover:decoration-[var(--color-primary)] truncate max-w-[160px]">
                            {ob.contractName}
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={ob.ownerName} initials={ob.ownerAvatar} size="xs" />
                          <span className="font-medium text-[var(--color-text-main)] truncate">{ob.ownerName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>
                          {ob.isOverdue ? (
                            <div className="text-[var(--color-danger-text)] font-bold text-xs">
                              {ob.overdueText || 'Overdue (2d ago)'}
                            </div>
                          ) : (
                            <div className="font-semibold text-[var(--color-text-main)]">
                              {ob.dueDateFormatted.split('\n')[0]}
                            </div>
                          )}
                          <div className="text-[10px] text-[var(--color-text-subtle)] font-mono">
                            {ob.dueDateFormatted.split('\n')[1] || ob.dueDate}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {getStatusChip(ob.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS VIEW (< 768px) - Zero horizontal scroll */}
        <div className="md:hidden divide-y divide-[var(--color-border)]">
          {filteredObligations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
              No obligations matched your filters.
            </div>
          ) : (
            filteredObligations.map(ob => {
              const isChecked = selectedRowIds.has(ob.id);

              return (
                <div
                  key={ob.id}
                  className={`p-3.5 space-y-2.5 transition-colors ${
                    isChecked ? 'bg-[var(--color-primary-light)]' : 'hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectRow(ob.id)}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] shrink-0 min-h-[20px] min-w-[20px]"
                      />
                      <span className="font-semibold text-xs text-[var(--color-text-main)] truncate">
                        {ob.title}
                      </span>
                    </div>
                    {getStatusChip(ob.status)}
                  </div>

                  {ob.tag && (
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                        ob.tag.includes('CRITICAL')
                          ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]'
                          : 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]'
                      }`}
                    >
                      {ob.tag}
                    </span>
                  )}

                  <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">
                    {ob.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border-subtle)] gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar name={ob.ownerName} initials={ob.ownerAvatar} size="xs" />
                      <span className="text-[11px] text-[var(--color-text-main)] truncate">{ob.ownerName}</span>
                    </div>

                    <div className="text-right shrink-0">
                      {ob.isOverdue ? (
                        <span className="text-[10px] font-bold text-[var(--color-danger-text)]">
                          {ob.overdueText || 'Overdue'}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                          {ob.dueDateFormatted.split('\n')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pagination */}
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[var(--color-text-muted)] text-center sm:text-left">
            Showing 1-7 of 28 obligations • Page {currentPage} of 4
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 transition-colors min-h-[36px]"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Prev</span>
            </button>

            {[1, 2, 3, 4].map(pg => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-md font-mono text-xs flex items-center justify-center transition-colors min-h-[36px] ${
                  currentPage === pg
                    ? 'bg-[var(--color-primary)] text-white font-bold'
                    : 'border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)]'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, 4))}
              disabled={currentPage === 4}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 transition-colors min-h-[36px]"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Obligation Modal */}
      <ManualObligationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddManualObligation}
      />
    </div>
  );
};

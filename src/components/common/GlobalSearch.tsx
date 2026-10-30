import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  CheckSquare,
  History,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  MOCK_CONTRACTS,
  MOCK_OBLIGATIONS,
  MOCK_ACTIVITY_LOGS
} from '../../data/mockData';

interface GlobalSearchProps {
  onOpenCommandPalette?: () => void;
}

type SearchCategory = 'all' | 'contracts' | 'obligations' | 'activity';

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onOpenCommandPalette
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [refreshTick, setRefreshTick] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keep search index synced when AI tools or modals add obligations/logs
  useEffect(() => {
    const handleUpdate = () => setRefreshTick(t => t + 1);
    window.addEventListener('c2a:data-updated', handleUpdate);
    return () => window.removeEventListener('c2a:data-updated', handleUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const { matchedContracts, matchedObligations, matchedLogs } = useMemo(() => {
    const contracts = MOCK_CONTRACTS.filter(c => {
      if (!normalizedQuery) return true;
      return (
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.counterparty.toLowerCase().includes(normalizedQuery) ||
        c.code.toLowerCase().includes(normalizedQuery) ||
        c.type.toLowerCase().includes(normalizedQuery) ||
        c.status.toLowerCase().includes(normalizedQuery)
      );
    }).slice(0, 4);

    const obligations = MOCK_OBLIGATIONS.filter(o => {
      if (!normalizedQuery) return true;
      return (
        o.title.toLowerCase().includes(normalizedQuery) ||
        o.description.toLowerCase().includes(normalizedQuery) ||
        o.clauseRef.toLowerCase().includes(normalizedQuery) ||
        o.contractName.toLowerCase().includes(normalizedQuery) ||
        o.ownerName.toLowerCase().includes(normalizedQuery) ||
        o.category.toLowerCase().includes(normalizedQuery)
      );
    }).slice(0, 4);

    const logs = MOCK_ACTIVITY_LOGS.filter(log => {
      if (!normalizedQuery) return true;
      return (
        log.action.toLowerCase().includes(normalizedQuery) ||
        log.target.toLowerCase().includes(normalizedQuery) ||
        log.userName.toLowerCase().includes(normalizedQuery) ||
        log.userRole.toLowerCase().includes(normalizedQuery) ||
        log.category.toLowerCase().includes(normalizedQuery) ||
        log.hash.toLowerCase().includes(normalizedQuery)
      );
    }).slice(0, 4);

    return {
      matchedContracts: contracts,
      matchedObligations: obligations,
      matchedLogs: logs
    };
  }, [normalizedQuery, refreshTick]);

  const totalResults =
    (activeCategory === 'all' || activeCategory === 'contracts'
      ? matchedContracts.length
      : 0) +
    (activeCategory === 'all' || activeCategory === 'obligations'
      ? matchedObligations.length
      : 0) +
    (activeCategory === 'all' || activeCategory === 'activity'
      ? matchedLogs.length
      : 0);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && totalResults > 0) {
      e.preventDefault();
      if (
        (activeCategory === 'all' || activeCategory === 'contracts') &&
        matchedContracts.length > 0
      ) {
        handleNavigate(`/contracts/${matchedContracts[0].id}/analysis`);
      } else if (
        (activeCategory === 'all' || activeCategory === 'obligations') &&
        matchedObligations.length > 0
      ) {
        handleNavigate('/obligations');
      } else if (
        (activeCategory === 'all' || activeCategory === 'activity') &&
        matchedLogs.length > 0
      ) {
        handleNavigate('/activity');
      }
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Desktop / Large Screen Inline Search Input */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] focus-within:border-[var(--color-primary)] transition-colors w-56 xl:w-72 min-h-[36px]">
        <Search className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search contracts, obligations, logs..."
          aria-label="Global search for contracts, obligations, and activity logs"
          className="w-full bg-transparent text-xs text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden min-w-0"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] p-0.5 shrink-0 cursor-pointer"
            aria-label="Clear global search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Open AI Command Bar (⌘K)"
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--color-primary-border)] bg-[var(--color-primary-light)] text-[var(--color-primary-text)] hover:opacity-80 shrink-0 cursor-pointer"
            >
              ⌘K
            </button>
          )
        )}
      </div>

      {/* Tablet / Mobile Search Trigger Button (< 1024px) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
        aria-label="Open global search"
      >
        <Search className="w-4 h-4 shrink-0" />
      </button>

      {/* Dropdown Search Popover */}
      {isOpen && (
        <div
          className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[440px] max-h-[80dvh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] z-[var(--z-dropdown)] overflow-hidden animate-in fade-in duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile Input Bar inside Dropdown */}
          <div className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
            <Search className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search contracts, obligations, activity..."
              autoFocus
              className="w-full bg-transparent text-xs text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'contracts', label: `Contracts (${matchedContracts.length})` },
                  { id: 'obligations', label: `Obligations (${matchedObligations.length})` },
                  { id: 'activity', label: `Activity (${matchedLogs.length})` }
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-3 space-y-3.5 max-h-[60dvh]">
            {totalResults === 0 ? (
              <div className="py-8 text-center space-y-1.5">
                <div className="text-xs font-semibold text-[var(--color-text-main)]">
                  No matches found for &ldquo;{query}&rdquo;
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Try searching by counterparty, clause number, owner name, or audit action.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Contracts Section */}
                {(activeCategory === 'all' || activeCategory === 'contracts') &&
                  matchedContracts.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                        <span>Contracts ({matchedContracts.length})</span>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/contracts')}
                          className="text-[var(--color-primary-text)] hover:underline font-semibold cursor-pointer"
                        >
                          View all
                        </button>
                      </div>
                      {matchedContracts.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            handleNavigate(`/contracts/${c.id}/analysis`)
                          }
                          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] truncate">
                                {c.name}
                              </div>
                              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                                {c.counterparty} •{' '}
                                <span className="font-mono">{c.code}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-subtle)] shrink-0">
                            {c.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* 2. Obligations Section */}
                {(activeCategory === 'all' || activeCategory === 'obligations') &&
                  matchedObligations.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                        <span>Obligations ({matchedObligations.length})</span>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/obligations')}
                          className="text-[var(--color-primary-text)] hover:underline font-semibold cursor-pointer"
                        >
                          View all
                        </button>
                      </div>
                      {matchedObligations.map(ob => (
                        <button
                          key={ob.id}
                          type="button"
                          onClick={() => handleNavigate('/obligations')}
                          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CheckSquare className="w-4 h-4 text-[var(--color-info)] shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] truncate">
                                {ob.title}
                              </div>
                              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                                {ob.contractName} • {ob.clauseRef} • {ob.ownerName}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--color-text-subtle)] shrink-0">
                            {ob.dueDate}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                {/* 3. Activity Logs Section */}
                {(activeCategory === 'all' || activeCategory === 'activity') &&
                  matchedLogs.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                        <span>Activity Logs ({matchedLogs.length})</span>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/activity')}
                          className="text-[var(--color-primary-text)] hover:underline font-semibold cursor-pointer"
                        >
                          View all
                        </button>
                      </div>
                      {matchedLogs.map(log => (
                        <button
                          key={log.id}
                          type="button"
                          onClick={() => handleNavigate('/activity')}
                          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <History className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] truncate">
                                {log.action}
                              </div>
                              <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                                {log.userName} ({log.userRole}) • {log.target}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--color-text-subtle)] shrink-0">
                            {log.timestamp}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Footer: Launch AI Command Bar */}
          {onOpenCommandPalette && (
            <div className="px-3.5 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--color-text-muted)] truncate">
                Need AI analysis or tool execution?
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCommandPalette();
                }}
                className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary-text)] hover:underline shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open AI Command Bar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

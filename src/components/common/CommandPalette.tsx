import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  X,
  Upload,
  Sparkles,
  Bot,
  History
} from 'lucide-react';
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS, MOCK_ACTIVITY_LOGS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AICommandBar } from '../ai/AICommandBar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'ai'>('ai');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationItems = [
    { id: 'nav_agent', title: 'Open AI Business Agent Studio', path: '/agent', icon: <Bot className="w-4 h-4 text-[var(--color-primary)] shrink-0" /> },
    { id: 'nav_overview', title: 'Go to Overview', path: '/overview', icon: <ArrowRight className="w-4 h-4 shrink-0" /> },
    { id: 'nav_contracts', title: 'Browse All Contracts', path: '/contracts', icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: 'nav_upload', title: 'Upload New Contract', path: '/upload', icon: <Upload className="w-4 h-4 shrink-0" /> },
    { id: 'nav_obligations', title: 'Manage Obligations Registry', path: '/obligations', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
    { id: 'nav_approvals', title: 'Pending Approvals (Human Gate)', path: '/approvals', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
    ...(isAdmin ? [{ id: 'nav_admin', title: 'Admin Governance Portal', path: '/admin', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> }] : [])
  ];

  const filteredContracts = MOCK_CONTRACTS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.counterparty.toLowerCase().includes(query.toLowerCase()) ||
    c.code.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredObligations = MOCK_OBLIGATIONS.filter(o =>
    o.title.toLowerCase().includes(query.toLowerCase()) ||
    o.description.toLowerCase().includes(query.toLowerCase()) ||
    o.clauseRef.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredActivityLogs = MOCK_ACTIVITY_LOGS.filter(log =>
    log.action.toLowerCase().includes(query.toLowerCase()) ||
    log.target.toLowerCase().includes(query.toLowerCase()) ||
    log.userName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const themeItems = [
    { id: 'th_light', title: 'Light', action: () => setTheme('light'), icon: <Sun className="w-4 h-4 shrink-0" /> },
    { id: 'th_dark', title: 'Dark', action: () => setTheme('dark'), icon: <Moon className="w-4 h-4 shrink-0" /> },
    { id: 'th_sys', title: 'System', action: () => setTheme('system'), icon: <Laptop className="w-4 h-4 shrink-0" /> }
  ];

  const handleSelectNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-start justify-center sm:pt-16 p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88dvh] flex flex-col rounded-t-2xl sm:rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Mode Switcher Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'ai'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>AI Command Bar (Gemini)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'search'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Quick Filter & Nav</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono border border-[var(--color-border)] text-[var(--color-text-subtle)] bg-[var(--color-bg-card)] shrink-0">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] shrink-0 cursor-pointer"
              aria-label="Close command palette"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {mode === 'ai' ? (
          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            <AICommandBar onClosePalette={onClose} />

            {/* Quick Navigation Footer inside AI mode */}
            <div className="pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="px-1 py-1 text-[10px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                Direct Workspace Shortcuts
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                {navigationItems.slice(0, 6).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.path)}
                    className="flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-xs border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors truncate cursor-pointer"
                  >
                    {item.icon}
                    <span className="truncate font-medium">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] shrink-0 min-h-[48px]">
              <Search className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search contracts, obligations, clauses..."
                className="w-full bg-transparent text-xs sm:text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] focus:outline-hidden min-h-[36px]"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] p-1 shrink-0"
                  aria-label="Clear query"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>

            {/* Results List with smooth internal scroll */}
            <div className="overflow-y-auto p-3 space-y-4 flex-1">
              {/* Contracts Section */}
              {filteredContracts.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                    Contracts ({filteredContracts.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredContracts.map(contract => (
                      <button
                        key={contract.id}
                        onClick={() => handleSelectNav(`/contracts/${contract.id}/analysis`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px] group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                          <div className="truncate min-w-0">
                            <div className="font-medium truncate group-hover:text-[var(--color-primary)]">
                              {contract.name}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                              {contract.counterparty} • <span className="font-mono">{contract.code}</span>
                            </div>
                          </div>
                        </div>
                        <span className="hidden sm:inline text-[11px] text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                          Open →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Obligations Section */}
              {filteredObligations.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                    Obligations ({filteredObligations.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredObligations.map(ob => (
                      <button
                        key={ob.id}
                        onClick={() => handleSelectNav('/obligations')}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px] group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare className="w-4 h-4 text-[var(--color-info)] shrink-0" />
                          <div className="truncate min-w-0">
                            <div className="font-medium truncate group-hover:text-[var(--color-primary)]">{ob.title}</div>
                            <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                              {ob.clauseRef} • {ob.contractName}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-text-subtle)] shrink-0 ml-2">{ob.dueDate}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Logs Section */}
              {filteredActivityLogs.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                    Activity Logs ({filteredActivityLogs.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredActivityLogs.map(log => (
                      <button
                        key={log.id}
                        onClick={() => handleSelectNav('/activity')}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px] group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <History className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
                          <div className="truncate min-w-0">
                            <div className="font-medium truncate group-hover:text-[var(--color-primary)]">{log.action}</div>
                            <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                              {log.userName} ({log.userRole}) • {log.target}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-text-subtle)] shrink-0 ml-2">{log.timestamp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Section */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                  Navigation
                </div>
                <div className="space-y-1 mt-1">
                  {navigationItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px]"
                    >
                      <div className="flex items-center gap-2.5 text-[var(--color-text-muted)] truncate min-w-0">
                        {item.icon}
                        <span className="text-[var(--color-text-main)] font-medium truncate">{item.title}</span>
                      </div>
                      <span className="hidden sm:inline text-[10px] font-mono text-[var(--color-text-subtle)] shrink-0 ml-2">{item.path}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Switcher in Palette */}
              <div>
                <div className="px-2 py-1 text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                  Theme Mode
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {themeItems.map(th => (
                    <button
                      key={th.id}
                      onClick={() => {
                        th.action();
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors min-h-[44px]"
                    >
                      {th.icon}
                      <span>{th.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

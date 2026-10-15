import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  ShieldAlert,
  History,
  ShieldCheck,
  Search,
  Bell,
  Upload,
  Sun,
  Moon,
  Laptop,
  ChevronDown,
  Settings,
  LogOut,
  Menu,
  X,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { CommandPalette } from '../common/CommandPalette';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isGuest, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('Acme Corp • Prod');

  const workspaces = [
    'Acme Corp • Prod',
    'Acme Corp • Staging',
    'EMEA Subsidiary • Prod'
  ];

  const navItems = [
    { name: 'Overview', path: '/overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { name: 'Contracts', path: '/contracts', icon: <FileText className="w-4 h-4 shrink-0" /> },
    { name: 'Obligations', path: '/obligations', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
    { name: 'Approvals', path: '/approvals', icon: <ShieldAlert className="w-4 h-4 shrink-0" /> },
    { name: 'Activity Log', path: '/activity', icon: <History className="w-4 h-4 shrink-0" /> },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> }] : [])
  ];

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/analysis')) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] font-medium whitespace-nowrap">
          <span>Platform</span>
          <span>/</span>
          <span>Console</span>
          <span>/</span>
          <span className="text-[var(--color-primary)] font-semibold truncate max-w-[120px]">Extraction Analysis</span>
        </span>
      );
    }
    if (path === '/upload') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] font-medium whitespace-nowrap">
          <span>Platform</span>
          <span>/</span>
          <span>Contracts</span>
          <span>/</span>
          <span className="text-[var(--color-primary)] font-semibold">Upload</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] font-medium whitespace-nowrap">
        <span>Platform</span>
        <span>/</span>
        <span className="text-[var(--color-text-main)] font-semibold">Console</span>
      </span>
    );
  };

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true, state: { message: 'You have been signed out' } });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-bg-page)] text-[var(--color-text-main)]">
      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="bg-[var(--color-warning-bg)] border-b border-[var(--color-warning-border)] text-[var(--color-warning-text)] px-3 py-1.5 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 font-medium truncate min-w-0">
            <Info className="w-4 h-4 shrink-0" />
            <span className="truncate">Guest Mode • Limited demo environment</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold underline shrink-0 hover:opacity-80"
          >
            Sign in
          </button>
        </div>
      )}

      {/* TOP BAR - Fits on one line at all widths */}
      <header className="sticky top-0 z-[var(--z-header)] h-14 bg-[var(--color-bg-header)] border-b border-[var(--color-border)] px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0">
        {/* Left: Mobile Menu Trigger + Brand + Breadcrumbs */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="md:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 shrink-0" />
          </button>

          {/* Brand Logo & Wordmark */}
          <NavLink to="/overview" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-[var(--color-primary-hover)] transition-colors shrink-0">
              C2A
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--color-text-main)] whitespace-nowrap shrink-0">
              Contract2Action
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[var(--color-primary-light)] text-[var(--color-primary-text)] uppercase border border-[var(--color-primary-border)] shrink-0">
              AI OPS
            </span>
          </NavLink>

          {/* Breadcrumb: Collapses below 1024px */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-[var(--color-border)]">
            {getBreadcrumbs()}
          </div>
        </div>

        {/* Right: Search + Notifications + Upload + Theme + User */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Search: Full box on lg screens, icon on smaller screens */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border-hover)] transition-colors w-40 xl:w-56"
          >
            <Search className="w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
            <span className="truncate">Search...</span>
            <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
              ⌘K
            </span>
          </button>

          {/* Search Icon button for screens < 1024px */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Open search command palette"
          >
            <Search className="w-4 h-4 shrink-0" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-danger)] ring-2 ring-[var(--color-bg-header)]" />
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-3 z-[var(--z-dropdown)] text-xs animate-in fade-in duration-150"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)] font-semibold text-[var(--color-text-main)]">
                  <span>Notifications</span>
                  <span className="text-[10px] text-[var(--color-primary-text)] cursor-pointer">Mark all read</span>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map(n => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-border)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-[var(--color-text-main)] line-clamp-2">{n.title}</span>
                        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-1" />}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-subtle)] mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* "Upload Contract" Button: Label hidden below 480px, icon preserved */}
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs shrink-0 min-h-[36px]"
            title="Upload Contract"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Upload Contract</span>
          </button>

          {/* Theme Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] shrink-0">
            <button
              onClick={() => setTheme('light')}
              title="Light theme"
              className={`p-1 rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark theme"
              className={`p-1 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setTheme('system')}
              title="System theme"
              className={`hidden sm:inline-flex p-1 rounded-md transition-colors ${
                theme === 'system'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          {/* User Avatar Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 p-1 rounded-full hover:ring-2 hover:ring-[var(--color-primary-border)] transition-all shrink-0 min-w-[36px] min-h-[36px] justify-center"
              aria-label="User profile menu"
            >
              <Avatar
                name={user?.name || 'Authorized Lead'}
                initials={user?.avatarText}
                picture={user?.picture}
                size="sm"
                showStatus
                isOnline={user?.isOnline ?? true}
              />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-2 z-[var(--z-dropdown)] text-xs animate-in fade-in duration-150"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-[var(--color-border)]">
                  <div className="font-bold text-[var(--color-text-main)] truncate">{user?.name || 'Current User'}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email || 'user@example.com'}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary-text)]">
                      {user?.role || 'Member'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-subtle)] font-mono">{user?.authLevel || 'Auth Lv 2'}</span>
                  </div>
                </div>

                <div className="py-1">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      <span>Admin Governance</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsCommandOpen(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                    <span>Command Palette (⌘K)</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY WITH RESPONSIVE SIDEBAR AND MAIN CONTENT */}
      <div className="flex-1 flex min-h-0 min-w-0">
        {/* SIDEBAR: Full (>=1024px) / Icon Rail (768px-1023px) / Hidden (<768px) */}
        <aside className="hidden md:flex flex-col w-16 lg:w-56 xl:w-60 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] shrink-0 transition-all duration-150">
          {/* Workspace Switcher */}
          <div className="p-3 border-b border-[var(--color-border)]">
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] transition-colors text-xs font-semibold text-[var(--color-text-main)] min-h-[36px]"
                title={activeWorkspace}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
                  <span className="hidden lg:inline truncate">{activeWorkspace}</span>
                </div>
                <ChevronDown className="hidden lg:inline w-3.5 h-3.5 text-[var(--color-text-subtle)] shrink-0" />
              </button>

              {showWorkspaceMenu && (
                <div
                  className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-1 z-[var(--z-dropdown)] text-xs animate-in fade-in duration-100"
                  onClick={e => e.stopPropagation()}
                >
                  {workspaces.map(ws => (
                    <button
                      key={ws}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeWorkspace === ws
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-semibold'
                          : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      {ws}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
                    isActive
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
                  }`
                }
                title={item.name}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden lg:inline whitespace-nowrap">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom Profile Block */}
          <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                name={user?.name || 'Current User'}
                initials={user?.avatarText}
                picture={user?.picture}
                size="md"
                showStatus
                isOnline={user?.isOnline ?? true}
              />
              <div className="hidden lg:block min-w-0">
                <div className="text-xs font-bold text-[var(--color-text-main)] truncate">
                  {user?.name || 'Current User'}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                  {user?.department || (user?.role === 'Admin' ? 'Head of Operations' : user?.role || 'Operations Lead')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCommandOpen(true)}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors"
              title="Settings & Palette"
            >
              <Settings className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {showMobileDrawer && (
          <div
            className="fixed inset-0 z-[var(--z-drawer)] bg-black/60 flex md:hidden"
            onClick={() => setShowMobileDrawer(false)}
          >
            <div
              className="w-72 max-w-[85vw] bg-[var(--color-bg-card)] h-full p-4 flex flex-col justify-between shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      C2A
                    </div>
                    <span className="font-bold text-sm text-[var(--color-text-main)]">Contract2Action</span>
                  </div>
                  <button
                    onClick={() => setShowMobileDrawer(false)}
                    className="p-1 rounded-md text-[var(--color-text-muted)]"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1">
                  {navItems.map(item => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setShowMobileDrawer(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold min-h-[44px] ${
                          isActive
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                        }`
                      }
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={user?.name || 'User'} initials={user?.avatarText} size="sm" />
                  <div className="text-xs truncate">
                    <div className="font-semibold text-[var(--color-text-main)] truncate">{user?.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-[var(--color-danger-text)] rounded-lg hover:bg-[var(--color-danger-bg)] shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT: Padded for bottom navigation and action bars */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR: 5 items max, tap targets >= 44x44px */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--color-bg-header)] border-t border-[var(--color-border)] px-1 flex items-center justify-around z-[var(--z-bottom-nav)] pb-[var(--safe-bottom)]">
        <NavLink
          to="/overview"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-w-[48px] min-h-[44px] ${
              isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Overview</span>
        </NavLink>

        <NavLink
          to="/contracts"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-w-[48px] min-h-[44px] ${
              isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'
            }`
          }
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Contracts</span>
        </NavLink>

        <NavLink
          to="/upload"
          className="flex flex-col items-center justify-center -mt-4 w-11 h-11 rounded-full bg-[var(--color-primary)] text-white shadow-md active:scale-95 transition-transform shrink-0"
          title="Upload Contract"
        >
          <Upload className="w-5 h-5 shrink-0" />
        </NavLink>

        <NavLink
          to="/obligations"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-w-[48px] min-h-[44px] ${
              isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'
            }`
          }
        >
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Obligations</span>
        </NavLink>

        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-w-[48px] min-h-[44px] ${
              isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'
            }`
          }
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Approvals</span>
        </NavLink>
      </nav>

      {/* Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  History,
  Settings,
  Download,
  Search,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_USERS, MOCK_GUESTS, MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { Avatar } from '../components/common/Avatar';

export const AdminPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'guests' | 'audit' | 'settings'>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [demoMode, setDemoMode] = useState(true);

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredGuests = MOCK_GUESTS.filter(g =>
    g.fullName.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.phone.includes(guestSearch)
  );

  const handleExportUsers = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Auth Level'];
    const rows = MOCK_USERS.map(u => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department || 'N/A'}"`,
      `"${u.authLevel || 'Auth Lv 2'}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'c2a_users_registry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Users exported to CSV', 'success');
  };

  const handleExportGuests = () => {
    const headers = ['Registration ID', 'Full Name', 'Age', 'Phone', 'Registered At'];
    const rows = MOCK_GUESTS.map(g => [
      `"${g.id}"`,
      `"${g.fullName}"`,
      g.age,
      `"${g.phone}"`,
      `"${g.registeredAt}"`
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'c2a_guest_registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Guest registrations exported to CSV', 'success');
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-danger-text)] uppercase mb-1 flex items-center gap-1.5 truncate">
          <Lock className="w-3.5 h-3.5 text-[var(--color-danger)] shrink-0" />
          <span>RESTRICTED PLATFORM GOVERNANCE / ADMIN ONLY</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
              Admin Governance Portal
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
              Signed in as Administrator: <span className="font-semibold text-[var(--color-text-main)]">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)] font-bold whitespace-nowrap">
              ROOT AUTHORIZATION
            </span>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs: Horizontal scrollable */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
          { id: 'users', label: 'Users', icon: <Users className="w-4 h-4 shrink-0" /> },
          { id: 'guests', label: 'Guests', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
          { id: 'audit', label: 'Audit Log', icon: <History className="w-4 h-4 shrink-0" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] sm:min-h-[36px] ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase truncate block">Total Users</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
                {MOCK_USERS.length + MOCK_GUESTS.length}
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] truncate block">3 Admins</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase truncate block">Guest Reviews</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
                {MOCK_GUESTS.length}
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] truncate block">Demo sessions</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase truncate block">Ingested</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
                24
              </div>
              <span className="text-[10px] text-[var(--color-success-text)] font-medium truncate block">100% indexed</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase truncate block">Approvals</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-main)] mt-1 tabular-nums">
                14
              </div>
              <span className="text-[10px] text-[var(--color-primary-text)] truncate block">Human Gate</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] min-w-0 col-span-2 sm:col-span-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-subtle)] uppercase truncate block">Failed Analyses</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[var(--color-success-text)] mt-1 tabular-nums">
                0
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] truncate block">Zero faults</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-main)]">Governance Summary</h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed break-words">
              This system operates in strict human-in-the-loop mode. Automated trigger conditions formulate draft notices and tasks, but no external notifications, financial transactions, or legal dispatches occur without explicit cryptographic signoff from authorized operations leads.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] shrink-0" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px]"
              />
            </div>

            <button
              onClick={handleExportUsers}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Export Users CSV</span>
            </button>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                    <th className="py-3 px-5">USER</th>
                    <th className="py-3 px-4">EMAIL</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} initials={u.avatarText} size="sm" showStatus isOnline={u.isOnline} />
                          <span className="font-semibold text-[var(--color-text-main)] truncate">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--color-text-muted)] whitespace-nowrap">{u.email}</td>
                      <td className="py-3.5 px-4 text-[var(--color-text-main)] whitespace-nowrap">{u.department || 'Operations'}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'Admin'
                              ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]'
                              : 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-[11px] text-[var(--color-success-text)] font-medium">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border)]">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={u.name} initials={u.avatarText} size="sm" showStatus isOnline={u.isOnline} />
                      <span className="font-semibold text-xs text-[var(--color-text-main)] truncate">{u.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        u.role === 'Admin'
                          ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
                          : 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)]'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--color-text-muted)] truncate">{u.email}</div>
                  <div className="text-[11px] text-[var(--color-text-subtle)] truncate">{u.department || 'Operations'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GUEST REGISTRATIONS */}
      {activeTab === 'guests' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-xs text-[var(--color-warning-text)]">
            <strong>Privacy Notice:</strong> Personal data, handle with care. These records reflect visitors who registered through the guest onboarding form.
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] shrink-0" />
              <input
                type="text"
                value={guestSearch}
                onChange={e => setGuestSearch(e.target.value)}
                placeholder="Search guest by name or phone..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[40px] sm:min-h-[36px]"
              />
            </div>

            <button
              onClick={handleExportGuests}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] transition-colors shadow-xs min-h-[40px] sm:min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Export Guests CSV</span>
            </button>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                    <th className="py-3 px-5">NAME</th>
                    <th className="py-3 px-4">AGE</th>
                    <th className="py-3 px-4">PHONE</th>
                    <th className="py-3 px-4">CONSENT</th>
                    <th className="py-3 px-4 text-right">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs">
                  {filteredGuests.map(g => (
                    <tr key={g.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[var(--color-text-main)]">{g.fullName}</td>
                      <td className="py-3.5 px-4 font-mono">{g.age}</td>
                      <td className="py-3.5 px-4 font-mono text-[var(--color-text-muted)]">{g.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)] whitespace-nowrap">
                          Consent Signed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[var(--color-text-subtle)] whitespace-nowrap">
                        {g.registeredAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="sm:hidden divide-y divide-[var(--color-border)]">
              {filteredGuests.map(g => (
                <div key={g.id} className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--color-text-main)]">{g.fullName}</span>
                    <span className="text-[10px] text-[var(--color-success-text)] font-semibold">Consent Signed</span>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--color-text-muted)]">{g.phone} • Age {g.age}</div>
                  <div className="text-[10px] font-mono text-[var(--color-text-subtle)]">{g.registeredAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] overflow-hidden min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                    <th className="py-3 px-5">TIMESTAMP</th>
                    <th className="py-3 px-4">USER</th>
                    <th className="py-3 px-4">ACTION</th>
                    <th className="py-3 px-4 text-right">HASH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {MOCK_ACTIVITY_LOGS.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--color-bg-hover)]">
                      <td className="py-3 px-5 text-[var(--color-text-muted)] whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--color-text-main)] whitespace-nowrap">{log.userName}</td>
                      <td className="py-3 px-4 text-[var(--color-text-main)]">{log.action}</td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-[var(--color-text-subtle)] whitespace-nowrap">{log.hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-5">
          <div className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-main)]">Extraction Engine Parameters</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-text-main)]">
                  Confidence Score Threshold
                </span>
                <span className="font-mono font-bold text-[var(--color-primary-text)]">
                  {confidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={70}
                max={99}
                value={confidenceThreshold}
                onChange={e => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Clauses extracted with confidence lower than {confidenceThreshold}% are automatically routed to legal review.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[var(--color-text-main)]">Demo Mode Environment</div>
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  Simulated contract data
                </div>
              </div>
              <button
                onClick={() => {
                  setDemoMode(!demoMode);
                  showToast(demoMode ? 'Live API mode armed (Phase 2)' : 'Demo mode restored', 'info');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors min-h-[36px] shrink-0 ${
                  demoMode
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]'
                    : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]'
                }`}
              >
                {demoMode ? 'Demo Active' : 'Live Armed'}
              </button>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => showToast('System settings saved', 'success')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[44px]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

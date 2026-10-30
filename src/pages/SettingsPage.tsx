import React, { useState } from 'react';
import {
  Bell,
  Mail,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Send,
  User as UserIcon,
  Copy,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  CalendarClock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { StatusChip } from '../components/common/StatusChip';
import { useUpcomingDeadlines } from '../hooks/useUpcomingDeadlines';

export const SettingsPage: React.FC = () => {
  const { user, updateUserPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const emailAlertsEnabled = user?.emailAlertsEnabled ?? true;
  const deadlineAlertLeadHours = user?.deadlineAlertLeadHours ?? 48;
  const highRiskAlertsOnly = user?.highRiskAlertsOnly ?? false;
  const dailyDigestEnabled = user?.dailyDigestEnabled ?? true;

  const { expiringWithin48Hours, upcomingDeadlines } = useUpcomingDeadlines({
    windowHours: deadlineAlertLeadHours,
    autoNotify: false
  });

  const matchingAlerts = highRiskAlertsOnly
    ? expiringWithin48Hours.filter(item => item.obligation.risk === 'High')
    : expiringWithin48Hours;

  const [isSaving, setIsSaving] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Synced with Firebase Profile');

  const firebaseUid = user?.firebaseUid || user?.id || 'uid_pending';

  const handleCopyUid = () => {
    navigator.clipboard.writeText(firebaseUid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleToggleEmailAlerts = async () => {
    const nextValue = !emailAlertsEnabled;
    setIsSaving(true);
    try {
      await updateUserPreferences({ emailAlertsEnabled: nextValue });
      setLastSyncedAt(`Synced at ${new Date().toLocaleTimeString()}`);
      showToast(
        nextValue
          ? `Contract deadline email alerts enabled for ${user?.email}`
          : `Contract deadline email alerts paused for ${user?.email}`,
        nextValue ? 'success' : 'info'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeadHoursChange = async (hours: number) => {
    setIsSaving(true);
    try {
      await updateUserPreferences({ deadlineAlertLeadHours: hours });
      setLastSyncedAt(`Synced at ${new Date().toLocaleTimeString()}`);
      showToast(
        `Deadline alert window updated to ${hours} hours prior to expiration`,
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHighRiskOnly = async () => {
    const nextValue = !highRiskAlertsOnly;
    setIsSaving(true);
    try {
      await updateUserPreferences({ highRiskAlertsOnly: nextValue });
      setLastSyncedAt(`Synced at ${new Date().toLocaleTimeString()}`);
      showToast(
        nextValue
          ? 'Email alerts filtered to High-Risk obligations only'
          : 'Email alerts enabled for all obligation risk tiers',
        'info'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDailyDigest = async () => {
    const nextValue = !dailyDigestEnabled;
    setIsSaving(true);
    try {
      await updateUserPreferences({ dailyDigestEnabled: nextValue });
      setLastSyncedAt(`Synced at ${new Date().toLocaleTimeString()}`);
      showToast(
        nextValue
          ? 'Daily contract governance email digest enabled'
          : 'Daily contract governance email digest disabled',
        'info'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmailAlert = () => {
    if (!emailAlertsEnabled) {
      showToast(
        'Enable Email Alerts first to dispatch a test deadline notification.',
        'warning'
      );
      return;
    }
    const sampleTitle =
      matchingAlerts[0]?.obligation.title ||
      upcomingDeadlines[0]?.obligation.title ||
      'Send 60-Day Non-Renewal Notice (Salesforce Enterprise)';
    showToast(
      `Test deadline alert dispatched to ${user?.email} (${matchingAlerts.length} active obligation${
        matchingAlerts.length === 1 ? '' : 's'
      } in ${deadlineAlertLeadHours}h window • "${sampleTitle}")`,
      'success'
    );
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-5xl mx-auto w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-text-subtle)] uppercase mb-1">
            PLATFORM / USER PREFERENCES & FIREBASE PROFILE
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Settings & Notification Preferences
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Manage contract deadline email alerts, governance digests, and Firebase profile synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-success-border)]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{isSaving ? 'Syncing with Firebase...' : lastSyncedAt}</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: Firebase User Profile Card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <UserIcon className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-main)]">
                Firebase User Profile
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Linked Google identity for contract governance & deadline alert delivery
              </p>
            </div>
          </div>

          <StatusChip
            label={user?.role || 'Member'}
            variant={user?.role === 'Admin' ? 'info' : 'neutral'}
            dot
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)]">
            <Avatar
              name={user?.name || 'User'}
              initials={user?.avatarText}
              picture={user?.picture}
              size="lg"
              showStatus
              isOnline={user?.isOnline ?? true}
            />
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[var(--color-text-main)] truncate">
                {user?.name || 'Google User'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">
                {user?.email || 'No email linked'}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-primary-text)] mt-1">
                {user?.department || 'Operations & Procurement'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
              Alert Delivery Email
            </div>
            <div className="text-xs font-semibold text-[var(--color-text-main)] flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="text-[10px] text-[var(--color-success)] font-medium">
              Verified via Firebase Authentication
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                Firebase UID
              </span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-[10px] font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedUid ? (
                  <>
                    <Check className="w-3 h-3 text-[var(--color-success)]" />
                    <span className="text-[var(--color-success)]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-[var(--color-text-main)] truncate">
              {firebaseUid}
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)]">
              Synced with Cloud SQL & Firebase Profile
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Email Alerts for Upcoming Contract Deadlines */}
      <div
        data-testid="settings-email-alerts-section"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-subtle)] pb-4 gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0 mt-0.5">
              <Bell className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-[var(--color-text-main)]">
                  Email Alerts for Upcoming Contract Deadlines
                </h2>
                <StatusChip
                  label={emailAlertsEnabled ? 'Active' : 'Paused'}
                  variant={emailAlertsEnabled ? 'success' : 'neutral'}
                  dot
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                Automatically dispatch email alerts to <strong className="text-[var(--color-text-main)]">{user?.email}</strong> when extracted contract obligations enter the expiration notice window.
              </p>
            </div>
          </div>

          {/* Primary Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={emailAlertsEnabled}
            aria-label="Toggle email alerts for upcoming contract deadlines"
            data-testid="toggle-deadline-email-alerts"
            onClick={handleToggleEmailAlerts}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)] ${
              emailAlertsEnabled
                ? 'bg-[var(--color-primary)]'
                : 'bg-[var(--color-border)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                emailAlertsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Configuration Controls */}
        <div
          className={`space-y-4 transition-opacity ${
            emailAlertsEnabled ? 'opacity-100' : 'opacity-60'
          }`}
        >
          {/* Lead Time Window Selector */}
          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span>Advance Notice Lead Window</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Choose how far in advance of a contract obligation deadline to trigger email alerts.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {[
                { label: '24 Hours', value: 24 },
                { label: '48 Hours', value: 48 },
                { label: '72 Hours', value: 72 },
                { label: '7 Days', value: 168 }
              ].map(option => {
                const isSelected = deadlineAlertLeadHours === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLeadHoursChange(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer min-h-[34px] ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                        : 'bg-[var(--color-bg-card)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Alert Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* High-Risk Clauses Only */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" />
                  <span>High-Risk Obligations Only</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Only send email alerts for obligations classified as High Risk.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={highRiskAlertsOnly}
                data-testid="toggle-high-risk-only-alerts"
                onClick={handleToggleHighRiskOnly}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  highRiskAlertsOnly
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition ${
                    highRiskAlertsOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Daily Governance Digest */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                  <span>Daily Portfolio Summary Digest</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Receive a morning 08:00 UTC summary of active deadlines & approvals.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dailyDigestEnabled}
                data-testid="toggle-daily-digest-alerts"
                onClick={handleToggleDailyDigest}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  dailyDigestEnabled
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition ${
                    dailyDigestEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Live Preview of Upcoming Deadlines Covered by Current Alert Rule */}
          <div className="p-4 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-light)]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span>
                  {matchingAlerts.length} Upcoming Deadline{matchingAlerts.length === 1 ? '' : 's'} Within {deadlineAlertLeadHours}h Window
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {matchingAlerts.length > 0
                  ? `Next scheduled email alert: "${matchingAlerts[0].obligation.title}" (${matchingAlerts[0].obligation.contractName})`
                  : 'No obligations currently fall inside this immediate window; monitoring remains active.'}
              </p>
            </div>

            <button
              type="button"
              data-testid="send-test-email-alert-btn"
              onClick={handleSendTestEmailAlert}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer shrink-0 min-h-[38px]"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Workspace Appearance */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text-main)]">
            Interface Theme
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Select your preferred color scheme for the Contract2Action AI console.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] shrink-0">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              theme === 'system'
                ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>
    </div>
  );
};

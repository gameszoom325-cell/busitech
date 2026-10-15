import React, { useState, useEffect, useRef, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  History,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Lock,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authService, RateLimitState } from '../services/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithGoogle, loginAsGuest, authNotice, clearAuthNotice } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // If already logged in, redirect to /overview
  useEffect(() => {
    if (user) {
      const fromPath = (location.state as any)?.from?.pathname;
      const target = authService.sanitizeRedirectUrl(fromPath);
      navigate(target, { replace: true });
    }
  }, [user, navigate, location.state]);

  // View state: 'card' (default) | 'guest-form'
  const [viewMode, setViewMode] = useState<'card' | 'guest-form'>('card');

  // Form states & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Rate Limiting
  const [rateLimit, setRateLimit] = useState<RateLimitState>(authService.getRateLimitStatus());

  useEffect(() => {
    if (rateLimit.isLocked && rateLimit.remainingSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimit(prev => {
          if (prev.remainingSeconds <= 1) {
            clearInterval(timer);
            return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimit.isLocked, rateLimit.remainingSeconds]);

  // Guest Form fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot hidden field

  // Guest validation errors & touched flags
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Input refs for autofocus on first error
  const nameInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const consentInputRef = useRef<HTMLInputElement>(null);

  // Modal dialog states for Privacy and Terms
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  // Notice banners from route redirection or logout
  const locationMessage = (location.state as any)?.message;
  const activeNotice = locationMessage || authNotice;

  // Clear notice on unmount or view change
  useEffect(() => {
    return () => {
      clearAuthNotice();
    };
  }, [clearAuthNotice]);

  // Accessible IDs
  const nameErrorId = useId();
  const ageErrorId = useId();
  const phoneErrorId = useId();
  const consentErrorId = useId();

  // Field validation rules
  const validateField = (field: string, val: any) => {
    let error = '';
    if (field === 'fullName') {
      const trimmed = String(val || '').trim();
      if (!trimmed) {
        error = 'Full name is required';
      } else if (trimmed.length < 2 || trimmed.length > 60) {
        error = 'Full name must be between 2 and 60 characters';
      } else if (!/^[a-zA-Z\s'\-]+$/.test(trimmed)) {
        error = 'Only letters, spaces, hyphens, and apostrophes are allowed';
      }
    } else if (field === 'age') {
      const num = Number(val);
      if (!val || String(val).trim() === '') {
        error = 'Age is required';
      } else if (isNaN(num) || !Number.isInteger(num)) {
        error = 'Age must be a whole number';
      } else if (num < 10 || num > 120) {
        error = 'Age must be between 10 and 120';
      }
    } else if (field === 'phone') {
      const clean = String(val || '').replace(/[\s\-]/g, '');
      if (!clean) {
        error = 'Phone number is required';
      } else if (!/^(\+91)?[6-9]\d{9}$/.test(clean)) {
        error = 'Enter a valid 10-digit mobile number (e.g. 9876543210 or +919876543210)';
      }
    } else if (field === 'consent') {
      if (!val) {
        error = 'You must agree to demo data storage to continue';
      }
    }
    return error;
  };

  const handleBlur = (field: string, val: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, val);
    setGuestErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllGuestFields = () => {
    const nameErr = validateField('fullName', fullName);
    const ageErr = validateField('age', age);
    const phoneErr = validateField('phone', phone);
    const consentErr = validateField('consent', consent);

    const errs: Record<string, string> = {};
    if (nameErr) errs.fullName = nameErr;
    if (ageErr) errs.age = ageErr;
    if (phoneErr) errs.phone = phoneErr;
    if (consentErr) errs.consent = consentErr;

    setGuestErrors(errs);
    setTouched({ fullName: true, age: true, phone: true, consent: true });

    // Focus first invalid input
    if (nameErr && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (ageErr && ageInputRef.current) {
      ageInputRef.current.focus();
    } else if (phoneErr && phoneInputRef.current) {
      phoneInputRef.current.focus();
    } else if (consentErr && consentInputRef.current) {
      consentInputRef.current.focus();
    }

    return Object.keys(errs).length === 0;
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Bot honeypot check
    if (honeypot) {
      setGeneralError('Invalid submission request');
      return;
    }

    // Rate limit check
    const currentLimit = authService.getRateLimitStatus();
    if (currentLimit.isLocked) {
      setRateLimit(currentLimit);
      setGeneralError(`Too many sign-in attempts. Locked for ${currentLimit.remainingSeconds}s.`);
      return;
    }

    if (!validateAllGuestFields()) {
      return;
    }

    setIsLoading(true);
    try {
      await loginAsGuest({
        fullName: fullName.trim(),
        age: Number(age),
        phone: phone.trim(),
        consent,
        honeypot
      });
      setIsSuccess(true);
      showToast(`Welcome, ${fullName.trim()}! Demo Guest Session created.`, 'success');

      // Navigate after brief visual confirmation
      setTimeout(() => {
        const fromPath = (location.state as any)?.from?.pathname;
        const target = authService.sanitizeRedirectUrl(fromPath);
        navigate(target, { replace: true });
      }, 400);
    } catch (err: any) {
      const updatedLimit = authService.getRateLimitStatus();
      setRateLimit(updatedLimit);
      setGeneralError(err.message || 'Failed to authenticate guest account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsLoading(true);

    try {
      // Direct Firebase Authentication Google Sign-In Popup
      const signedInUser = await loginWithGoogle();
      setIsSuccess(true);
      showToast(`Signed in as ${signedInUser.name} (${signedInUser.email})`, 'success');

      setTimeout(() => {
        const fromPath = (location.state as any)?.from?.pathname;
        const target = authService.sanitizeRedirectUrl(fromPath);
        navigate(target, { replace: true });
      }, 400);
    } catch (err: any) {
      setGeneralError(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[var(--color-bg-page)] text-[var(--color-text-main)] w-full overflow-x-hidden selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary)]">
      {/* Top right Theme Switcher (accessible, 44px tap targets) */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)]">
        <button
          onClick={() => setTheme('light')}
          title="Light theme"
          aria-label="Light theme"
          className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            theme === 'light'
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <Sun className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          title="Dark theme"
          aria-label="Dark theme"
          className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <Moon className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={() => setTheme('system')}
          title="System theme"
          aria-label="System theme"
          className={`hidden sm:flex p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center ${
            theme === 'system'
              ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <Laptop className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Main Split-Screen Container on Desktop, Centered on Tablet, Full-width on Mobile */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ========================================================= */}
          {/* LEFT PANEL (~55% width on desktop, 7 cols of 12)          */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 lg:pr-4">
            {/* Brand Logo & Eyebrow */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-extrabold text-sm sm:text-base shadow-md shrink-0">
                C2A
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[var(--color-text-main)]">
                    Contract2Action AI
                  </span>
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] uppercase shrink-0">
                    AI OPS
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  Enterprise Contract Execution & Human Governance Gateway
                </p>
              </div>
            </div>

            {/* Headline & Subline */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text-main)] tracking-tight leading-tight">
                Understand the Contract.{' '}
                <span className="text-[var(--color-primary)] block sm:inline">
                  Automate the Action.
                </span>{' '}
                Track the Outcome.
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-xl leading-relaxed">
                Turn contract obligations into approved, tracked business tasks. A human must authorize every high-risk commitment before execution.
              </p>
            </div>

            {/* Three Feature Rows with Icons */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-start gap-3.5 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
                <div className="p-2 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--color-text-main)]">
                    Extract obligations from any contract
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    Automated clause parsing extracts deadlines, responsible counterparties, and notice triggers with clause-level citations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
                <div className="p-2 rounded-lg bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--color-text-main)]">
                    Human approval before action
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    Stage-01 human-in-the-loop gate requires explicit confirmation and mandatory audit notes on high-risk workflows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-xs">
                <div className="p-2 rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success-text)] shrink-0 mt-0.5">
                  <History className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--color-text-main)]">
                    Complete audit trail
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    Cryptographic SHA-256 state tracking of all extracted tasks, resolutions, and governance actions.
                  </p>
                </div>
              </div>
            </div>

            {/* Subtle Abstract Geometric SVG Pattern (clean, static, lightweight) */}
            <div className="hidden lg:block pt-2">
              <svg className="w-full h-12 text-[var(--color-border-subtle)] opacity-40" viewBox="0 0 400 48" fill="none">
                <circle cx="12" cy="24" r="3" fill="currentColor" />
                <circle cx="64" cy="24" r="3" fill="currentColor" />
                <circle cx="116" cy="24" r="3" fill="currentColor" />
                <circle cx="168" cy="24" r="3" fill="currentColor" />
                <circle cx="220" cy="24" r="3" fill="currentColor" />
                <circle cx="272" cy="24" r="3" fill="currentColor" />
                <circle cx="324" cy="24" r="3" fill="currentColor" />
                <circle cx="376" cy="24" r="3" fill="currentColor" />
                <line x1="12" y1="24" x2="376" y2="24" stroke="currentColor" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL (~45% width on desktop, 5 cols of 12)         */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-[440px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-5 sm:p-7 space-y-5 transition-all">
              
              {/* Card Header */}
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-main)] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Sign in to continue to Contract2Action.
                </p>
              </div>

              {/* Status Notice Banners (Signed Out / Session Expired) */}
              {activeNotice && !generalError && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3 rounded-xl border border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)] text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{activeNotice}</span>
                </div>
              )}

              {/* General Error Banner */}
              {generalError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] text-xs flex items-start gap-2.5 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block">Authentication Error</span>
                    <span className="leading-snug">{generalError}</span>
                  </div>
                  <button
                    onClick={() => setGeneralError(null)}
                    aria-label="Dismiss error"
                    className="p-1 hover:opacity-75"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Rate Limit Countdown Banner */}
              {rateLimit.isLocked && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Rate limit active: Too many failed attempts.</span>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-warning-border)] shrink-0">
                    {rateLimit.remainingSeconds}s
                  </span>
                </div>
              )}

              {/* Signing In Progress Indicator */}
              {isSuccess && (
                <div className="p-3 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)] text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Signing you in...</span>
                </div>
              )}

              {/* VIEW MODE 1: Standard Card (Google Primary + Guest Secondary Button) */}
              {viewMode === 'card' && (
                <div className="space-y-4">
                  {/* Google Sign-in Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isSuccess || rateLimit.isLocked}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] active:scale-[0.99] text-[var(--color-text-main)] font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)] shrink-0" />
                    ) : (
                      /* Official Google 'G' Mark SVG */
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    )}
                    <span>{isLoading ? 'Connecting to Google...' : 'Login with Google'}</span>
                  </button>

                  {/* Divider with "or" */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="w-full border-t border-[var(--color-border)]" />
                    <span className="absolute px-3 bg-[var(--color-bg-card)] text-[11px] font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  {/* Secondary Guest Button */}
                  <button
                    onClick={() => {
                      setGeneralError(null);
                      setViewMode('guest-form');
                    }}
                    disabled={isLoading || isSuccess}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)] font-semibold text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <span>Continue as Guest</span>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              )}

              {/* VIEW MODE 2: Expandable Guest Form */}
              {viewMode === 'guest-form' && (
                <form
                  onSubmit={handleGuestSubmit}
                  noValidate
                  className="space-y-3.5 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-text)]">
                      Guest Demo Registration
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGeneralError(null);
                        setViewMode('card');
                      }}
                      className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center gap-1 min-h-[36px] px-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  {/* Honeypot field (hidden from legitimate users, catches bots) */}
                  <div className="opacity-0 absolute -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                    <label htmlFor="website_hp">Leave empty</label>
                    <input
                      type="text"
                      id="website_hp"
                      name="website_hp"
                      value={honeypot}
                      onChange={e => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Field 1: Full Name */}
                  <div className="space-y-1">
                    <label
                      htmlFor="guest-full-name"
                      className="block text-xs font-semibold text-[var(--color-text-main)]"
                    >
                      Full Name <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id="guest-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value);
                        if (touched.fullName) handleBlur('fullName', e.target.value);
                      }}
                      onBlur={() => handleBlur('fullName', fullName)}
                      aria-invalid={!!guestErrors.fullName}
                      aria-describedby={guestErrors.fullName ? nameErrorId : undefined}
                      placeholder="e.g. Sarah Jenkins"
                      maxLength={60}
                      className={`w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] min-h-[44px] transition-colors focus:outline-hidden focus:ring-2 ${
                        guestErrors.fullName
                          ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
                          : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                      }`}
                    />
                    {guestErrors.fullName && (
                      <p id={nameErrorId} className="text-[11px] text-[var(--color-danger-text)] font-medium">
                        {guestErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Field 2: Age */}
                  <div className="space-y-1">
                    <label
                      htmlFor="guest-age"
                      className="block text-xs font-semibold text-[var(--color-text-main)]"
                    >
                      Age <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      ref={ageInputRef}
                      id="guest-age"
                      type="number"
                      required
                      min={10}
                      max={120}
                      value={age}
                      onChange={e => {
                        setAge(e.target.value);
                        if (touched.age) handleBlur('age', e.target.value);
                      }}
                      onBlur={() => handleBlur('age', age)}
                      aria-invalid={!!guestErrors.age}
                      aria-describedby={guestErrors.age ? ageErrorId : undefined}
                      placeholder="e.g. 29"
                      className={`w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] min-h-[44px] transition-colors focus:outline-hidden focus:ring-2 ${
                        guestErrors.age
                          ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
                          : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                      }`}
                    />
                    {guestErrors.age && (
                      <p id={ageErrorId} className="text-[11px] text-[var(--color-danger-text)] font-medium">
                        {guestErrors.age}
                      </p>
                    )}
                  </div>

                  {/* Field 3: Phone Number */}
                  <div className="space-y-1">
                    <label
                      htmlFor="guest-phone"
                      className="block text-xs font-semibold text-[var(--color-text-main)]"
                    >
                      Phone Number <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      ref={phoneInputRef}
                      id="guest-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={e => {
                        setPhone(e.target.value);
                        if (touched.phone) handleBlur('phone', e.target.value);
                      }}
                      onBlur={() => handleBlur('phone', phone)}
                      aria-invalid={!!guestErrors.phone}
                      aria-describedby={guestErrors.phone ? phoneErrorId : undefined}
                      placeholder="e.g. 9876543210 or +919876543210"
                      className={`w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border bg-[var(--color-bg-input)] text-[var(--color-text-main)] placeholder-[var(--color-text-subtle)] min-h-[44px] transition-colors focus:outline-hidden focus:ring-2 ${
                        guestErrors.phone
                          ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
                          : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
                      }`}
                    />
                    {guestErrors.phone && (
                      <p id={phoneErrorId} className="text-[11px] text-[var(--color-danger-text)] font-medium">
                        {guestErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Field 4: Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        ref={consentInputRef}
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={e => {
                          setConsent(e.target.checked);
                          if (touched.consent) handleBlur('consent', e.target.checked);
                        }}
                        onBlur={() => handleBlur('consent', consent)}
                        aria-invalid={!!guestErrors.consent}
                        aria-describedby={guestErrors.consent ? consentErrorId : undefined}
                        className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4 shrink-0"
                      />
                      <span className="text-xs text-[var(--color-text-main)] leading-tight">
                        I agree that my details may be stored for this demo.
                      </span>
                    </label>
                    {guestErrors.consent && (
                      <p id={consentErrorId} className="text-[11px] text-[var(--color-danger-text)] font-medium mt-1">
                        {guestErrors.consent}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isSuccess || rateLimit.isLocked}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Validating Session...</span>
                      </>
                    ) : (
                      <span>Enter as Guest</span>
                    )}
                  </button>
                </form>
              )}

              {/* Note on limited access */}
              <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Guest accounts have limited access (sandboxed demo). Sign in with Google for full access, contract creation, and governance approvals.
              </div>

              {/* Footer Links (Terms, Privacy, Hackathon Attribution) */}
              <div className="pt-2 border-t border-[var(--color-border-subtle)] text-center space-y-1.5 text-xs text-[var(--color-text-subtle)]">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-[var(--color-text-main)] underline underline-offset-2 transition-colors min-h-[32px] px-1"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-[var(--color-text-main)] underline underline-offset-2 transition-colors min-h-[32px] px-1"
                  >
                    Terms of Service
                  </button>
                </div>
                <div className="text-[10px] font-mono tracking-tight text-[var(--color-text-subtle)]">
                  Genie X Hub Hackathon • Project Eclipse • SRMIST VDP
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* PRIVACY POLICY MODAL                                      */}
      {/* ========================================================= */}
      {activeModal === 'privacy' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text-main)]">
                Privacy Policy & Demo Data Handling
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <p>
                <strong>1. Demonstration Scope:</strong> Contract2Action AI is an enterprise contract intelligence and execution platform. In demo mode, personal contact details collected via Guest entry are used strictly for session verification and access analytics.
              </p>
              <p>
                <strong>2. Data Retention:</strong> Guest entries are stored in a sandboxed demonstration repository and automatically scheduled for deletion after 30 days. No contact details are shared or sold to external third parties.
              </p>
              <p>
                <strong>3. Audit Logs:</strong> System actions, clause inspections, and approval events generate immutable SHA-256 state audit records visible to authorized platform administrators.
              </p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TERMS OF SERVICE MODAL                                    */}
      {/* ========================================================= */}
      {activeModal === 'terms' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-base font-bold text-[var(--color-text-main)]">
                Terms of Service
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <p>
                <strong>1. Human-in-the-Loop Governance:</strong> Automated obligations and notifications generated by Contract2Action AI require explicit confirmation from an authorized human lead prior to legal or financial dispatch.
              </p>
              <p>
                <strong>2. Role Restrictions:</strong> Administrative governance routes (/admin) are restricted strictly to designated platform administrators. Unauthorized access attempts are monitored and recorded.
              </p>
              <p>
                <strong>3. Prototype Notice:</strong> Developed for the Genie X Hub Hackathon (Project Eclipse, Team Titan Attacks, SRMIST VDP).
              </p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

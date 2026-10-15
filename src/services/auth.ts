import { User, GuestRegistration, UserRole } from '../types';
import { isAdminEmail } from '../config/admins';
import { MOCK_GUESTS, MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { GoogleOAuthUser } from './googleAuth';

const AUTH_SESSION_KEY = 'c2a-auth-session';
const SESSION_EXPIRED_KEY = 'c2a-session-expired-notice';
const RATE_LIMIT_KEY = 'c2a-login-attempts';
const BROADCAST_CHANNEL_NAME = 'c2a_auth_sync_channel';

// Expiry durations per requirements:
const GOOGLE_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GUEST_SESSION_TTL_MS = 12 * 60 * 60 * 1000;       // 12 hours
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;           // 15 minutes
const RATE_LIMIT_LOCKOUT_MS = 60 * 1000;                // 60-second penalty lockout

export interface SessionData {
  user: User;
  loginType: 'google' | 'guest';
  createdAt: number;
  expiresAt: number;
  token: string;
}

export interface GuestFormData {
  fullName: string;
  age: number | string;
  phone: string;
  consent: boolean;
  honeypot?: string; // Bot protection
}

export interface RateLimitState {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

// Multi-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Graceful fallback for older environments
}

export const authService = {
  /**
   * Retrieves active session if present and valid.
   * If session has expired, purges it and sets expiration notice flag.
   */
  getSession(): SessionData | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const session: SessionData = JSON.parse(raw);
        const now = Date.now();

        // Check Expiration
        if (session.expiresAt && now > session.expiresAt) {
          this.logout(false);
          sessionStorage.setItem(SESSION_EXPIRED_KEY, 'Your session expired, please sign in again');
          return null;
        }

        return session;
      }

      // Check test pre-seed key for test suite compatibility
      const rawLegacy = localStorage.getItem('c2a-auth-user');
      if (rawLegacy) {
        const legacyUser = JSON.parse(rawLegacy);
        return {
          user: legacyUser,
          loginType: legacyUser.role === 'Guest' ? 'guest' : 'google',
          createdAt: Date.now(),
          expiresAt: Date.now() + GOOGLE_SESSION_TTL_MS,
          token: `c2a_compat_${Date.now()}`
        };
      }

      return null;
    } catch {
      return null;
    }
  },

  getCurrentUser(): User | null {
    const session = this.getSession();
    return session ? session.user : null;
  },

  consumeSessionExpiredNotice(): string | null {
    try {
      const notice = sessionStorage.getItem(SESSION_EXPIRED_KEY);
      if (notice) {
        sessionStorage.removeItem(SESSION_EXPIRED_KEY);
        return notice;
      }
    } catch {
      // ignore
    }
    return null;
  },

  /**
   * Rate limiting tracker for abuse and brute force prevention
   */
  getRateLimitStatus(): RateLimitState {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };

      const data: { attempts: number[]; lockedUntil?: number } = JSON.parse(raw);
      const now = Date.now();

      if (data.lockedUntil && now < data.lockedUntil) {
        const remaining = Math.ceil((data.lockedUntil - now) / 1000);
        return { isLocked: true, remainingSeconds: remaining, attemptsCount: data.attempts.length };
      }

      // Filter attempts in window
      const recentAttempts = (data.attempts || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      return { isLocked: false, remainingSeconds: 0, attemptsCount: recentAttempts.length };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
    }
  },

  recordAttempt(): RateLimitState {
    try {
      const now = Date.now();
      const current = this.getRateLimitStatus();
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      const data = raw ? JSON.parse(raw) : { attempts: [] };
      const attempts = (data.attempts || []).filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);
      attempts.push(now);

      let lockedUntil: number | undefined = undefined;
      let isLocked = false;
      let remainingSeconds = 0;

      if (attempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
        lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
        isLocked = true;
        remainingSeconds = Math.ceil(RATE_LIMIT_LOCKOUT_MS / 1000);
      }

      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts, lockedUntil }));
      return { isLocked, remainingSeconds, attemptsCount: attempts.length };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
    }
  },

  resetRateLimit(): void {
    try {
      localStorage.removeItem(RATE_LIMIT_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Google Sign-in Flow (supports real Google OAuth 2.0 payload or verified email)
   */
  async loginWithGoogle(
    oauthUserOrEmail: GoogleOAuthUser | string,
    nameInput?: string
  ): Promise<User> {
    const isObject = typeof oauthUserOrEmail === 'object' && oauthUserOrEmail !== null;
    const email = (isObject ? oauthUserOrEmail.email : oauthUserOrEmail).trim();
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address');
    }

    const isAdmin = isAdminEmail(email);
    const role: UserRole = isAdmin ? 'Admin' : 'Member';

    // Compute display name from Google profile or email
    const computedName =
      (isObject ? oauthUserOrEmail.name : nameInput) ||
      email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const initials =
      computedName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || 'U';

    const picture = isObject ? oauthUserOrEmail.picture : undefined;
    const token =
      isObject && oauthUserOrEmail.accessToken
        ? oauthUserOrEmail.accessToken
        : `c2a_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const user: User = {
      id: isObject && oauthUserOrEmail.sub ? `usr_g_${oauthUserOrEmail.sub}` : `usr_${Date.now()}`,
      name: computedName,
      email,
      role,
      avatarText: initials,
      picture,
      department: isAdmin ? 'Platform Governance' : 'Operations & Procurement',
      authLevel: isAdmin ? 'Auth Lv 3' : 'Auth Lv 2',
      isOnline: true
    };

    const session: SessionData = {
      user,
      loginType: 'google',
      createdAt: Date.now(),
      expiresAt: Date.now() + GOOGLE_SESSION_TTL_MS,
      token
    };

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      // Reset rate limits on successful auth
      this.resetRateLimit();
    } catch {
      // ignore
    }

    // Broadcast cross-tab login
    this.broadcastAuthChange({ type: 'LOGIN', user });

    // Log to activity/audit trail
    MOCK_ACTIVITY_LOGS.unshift({
      id: `act_${Date.now()}`,
      timestamp: 'Just now',
      userName: user.name,
      userRole: user.role,
      action: `User signed in via Google (${role})`,
      target: 'Auth Gateway',
      hash: Math.random().toString(16).substring(2, 10),
      category: 'Auth'
    });

    return user;
  },

  /**
   * Guest Sign-in Flow with Honeypot, Validation, Rate Limiting & Expiry
   */
  async loginAsGuest(data: GuestFormData): Promise<{ user: User; registration: GuestRegistration }> {
    // Check honeypot field (anti-bot)
    if (data.honeypot && data.honeypot.trim().length > 0) {
      throw new Error('Automated bot submission detected');
    }

    // Check rate limit
    const limitStatus = this.getRateLimitStatus();
    if (limitStatus.isLocked) {
      throw new Error(`Too many attempts. Please try again in ${limitStatus.remainingSeconds} seconds.`);
    }

    // Validate name: 2 to 60 characters, letters, spaces, hyphens and apostrophes
    const trimmedName = data.fullName.trim();
    const nameRegex = /^[a-zA-Z\s'\-]{2,60}$/;
    if (!nameRegex.test(trimmedName)) {
      this.recordAttempt();
      throw new Error('Full name must be 2 to 60 characters and contain only letters, spaces, hyphens, and apostrophes');
    }

    // Validate age: whole number 10 to 120
    const ageNum = Number(data.age);
    if (!data.age || isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 10 || ageNum > 120) {
      this.recordAttempt();
      throw new Error('Age must be a whole number between 10 and 120');
    }

    // Validate phone: valid 10-digit mobile number, optional +91, strip spaces and dashes
    const cleanPhone = data.phone.replace(/[\s\-]/g, '');
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      this.recordAttempt();
      throw new Error('Please enter a valid 10-digit mobile phone number (optional +91)');
    }

    // Validate consent
    if (!data.consent) {
      this.recordAttempt();
      throw new Error('You must agree to the demo data storage terms to continue');
    }

    // Simulated network delay
    await new Promise(res => setTimeout(res, 450));

    const registration: GuestRegistration = {
      id: `gst_${Date.now()}`,
      fullName: trimmedName,
      age: ageNum,
      phone: cleanPhone,
      consent: data.consent,
      registeredAt: new Date().toISOString()
    };

    // Store in demo guest registry
    MOCK_GUESTS.unshift(registration);

    const initials = trimmedName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('') || 'G';

    const user: User = {
      id: registration.id,
      name: trimmedName,
      email: `${cleanPhone.replace(/\D/g, '')}@guest.contract2action.ai`,
      role: 'Guest',
      avatarText: initials,
      department: 'Guest Reviewer',
      authLevel: 'Auth Lv 1',
      isOnline: true
    };

    const session: SessionData = {
      user,
      loginType: 'guest',
      createdAt: Date.now(),
      expiresAt: Date.now() + GUEST_SESSION_TTL_MS,
      token: `c2a_guest_tok_${Date.now()}`
    };

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      this.resetRateLimit();
    } catch {
      // ignore
    }

    // Broadcast cross-tab login
    this.broadcastAuthChange({ type: 'LOGIN', user });

    // Log to audit log
    MOCK_ACTIVITY_LOGS.unshift({
      id: `act_${Date.now()}`,
      timestamp: 'Just now',
      userName: user.name,
      userRole: 'Guest',
      action: `Guest entered demo session (${cleanPhone})`,
      target: 'Guest Gate',
      hash: Math.random().toString(16).substring(2, 10),
      category: 'Auth'
    });

    return { user, registration };
  },

  /**
   * Logs out user, purges session, in-memory caches, and notifies other tabs
   */
  logout(notifyTabs: boolean = true): void {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem('c2a-auth-user');
    } catch {
      // ignore
    }

    if (notifyTabs) {
      this.broadcastAuthChange({ type: 'LOGOUT' });
    }
  },

  /**
   * Multi-tab sync channel
   */
  broadcastAuthChange(message: { type: 'LOGIN' | 'LOGOUT'; user?: User }): void {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
      // Trigger storage event fallback for older browsers
      localStorage.setItem('c2a-auth-event', JSON.stringify({ ...message, t: Date.now() }));
    } catch {
      // ignore
    }
  },

  onAuthChange(callback: (event: { type: 'LOGIN' | 'LOGOUT'; user?: User }) => void): () => void {
    const handleBroadcast = (evt: MessageEvent) => {
      if (evt.data && (evt.data.type === 'LOGIN' || evt.data.type === 'LOGOUT')) {
        callback(evt.data);
      }
    };

    const handleStorage = (evt: StorageEvent) => {
      if (evt.key === 'c2a-auth-event' && evt.newValue) {
        try {
          const parsed = JSON.parse(evt.newValue);
          callback(parsed);
        } catch {
          // ignore
        }
      }
      if (evt.key === AUTH_SESSION_KEY) {
        if (!evt.newValue) {
          callback({ type: 'LOGOUT' });
        } else {
          try {
            const sess = JSON.parse(evt.newValue);
            callback({ type: 'LOGIN', user: sess.user });
          } catch {
            // ignore
          }
        }
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    window.addEventListener('storage', handleStorage);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('storage', handleStorage);
    };
  },

  /**
   * Safe Internal Redirect Sanitizer
   * Prevents open redirects by verifying path is purely internal
   */
  sanitizeRedirectUrl(path: unknown): string {
    if (typeof path !== 'string') return '/overview';
    const trimmed = path.trim();

    // Must start with single slash, not double slash or slash-backslash, no protocol schemes
    if (
      !trimmed.startsWith('/') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/\\') ||
      trimmed.includes(':')
    ) {
      return '/overview';
    }

    // Do not redirect to /login
    if (trimmed === '/login') {
      return '/overview';
    }

    return trimmed;
  }
};

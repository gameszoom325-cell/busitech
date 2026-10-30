import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider, firebaseConfig } from "../lib/firebase";
import { User, UserRole, UserAlertPreferences } from "../types";
import { isAdminEmail } from "../config/admins";

const FIREBASE_USER_PREFS_PREFIX = "c2a-firebase-user-prefs:";

export const DEFAULT_USER_ALERT_PREFERENCES: UserAlertPreferences = {
  emailAlertsEnabled: true,
  deadlineAlertLeadHours: 48,
  highRiskAlertsOnly: false,
  dailyDigestEnabled: true,
};

/**
 * Reads stored alert preferences for a given Firebase UID or email.
 */
export function getStoredFirebaseUserPreferences(
  uidOrEmail?: string
): UserAlertPreferences {
  if (!uidOrEmail || typeof window === "undefined") {
    return { ...DEFAULT_USER_ALERT_PREFERENCES };
  }
  try {
    const raw = localStorage.getItem(
      `${FIREBASE_USER_PREFS_PREFIX}${uidOrEmail}`
    );
    if (!raw) return { ...DEFAULT_USER_ALERT_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      emailAlertsEnabled:
        typeof parsed.emailAlertsEnabled === "boolean"
          ? parsed.emailAlertsEnabled
          : DEFAULT_USER_ALERT_PREFERENCES.emailAlertsEnabled,
      deadlineAlertLeadHours:
        typeof parsed.deadlineAlertLeadHours === "number"
          ? parsed.deadlineAlertLeadHours
          : DEFAULT_USER_ALERT_PREFERENCES.deadlineAlertLeadHours,
      highRiskAlertsOnly:
        typeof parsed.highRiskAlertsOnly === "boolean"
          ? parsed.highRiskAlertsOnly
          : DEFAULT_USER_ALERT_PREFERENCES.highRiskAlertsOnly,
      dailyDigestEnabled:
        typeof parsed.dailyDigestEnabled === "boolean"
          ? parsed.dailyDigestEnabled
          : DEFAULT_USER_ALERT_PREFERENCES.dailyDigestEnabled,
    };
  } catch {
    return { ...DEFAULT_USER_ALERT_PREFERENCES };
  }
}

/**
 * Saves alert preferences locally keyed by Firebase UID and email.
 */
export function saveStoredFirebaseUserPreferences(
  user: Pick<User, "id" | "firebaseUid" | "email">,
  prefs: Partial<UserAlertPreferences>
): UserAlertPreferences {
  const keyUid = user.firebaseUid || user.id;
  const current = getStoredFirebaseUserPreferences(keyUid || user.email);
  const next: UserAlertPreferences = {
    ...current,
    ...prefs,
  };

  if (typeof window !== "undefined") {
    try {
      if (keyUid) {
        localStorage.setItem(
          `${FIREBASE_USER_PREFS_PREFIX}${keyUid}`,
          JSON.stringify(next)
        );
      }
      if (user.email) {
        localStorage.setItem(
          `${FIREBASE_USER_PREFS_PREFIX}${user.email}`,
          JSON.stringify(next)
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  return next;
}

/**
 * Maps a Firebase User object to the application's internal User model,
 * preserving Full Name, Gmail Address, Profile Photo, Firebase User ID (UID),
 * and deadline email alert preferences.
 */
export function mapFirebaseUserToAppUser(fbUser: FirebaseUser): User {
  const email = fbUser.email || "";
  const isAdmin = isAdminEmail(email);
  const role: UserRole = isAdmin ? "Admin" : "Member";

  const fullName =
    fbUser.displayName ||
    (email
      ? email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Google User");

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const savedPrefs = getStoredFirebaseUserPreferences(fbUser.uid || email);

  return {
    id: fbUser.uid,
    firebaseUid: fbUser.uid,
    name: fullName,
    email: email,
    picture: fbUser.photoURL || undefined,
    role,
    avatarText: initials,
    department: isAdmin ? "Platform Governance" : "Operations & Procurement",
    authLevel: isAdmin ? "Auth Lv 3" : "Auth Lv 2",
    isOnline: true,
    emailAlertsEnabled: savedPrefs.emailAlertsEnabled,
    deadlineAlertLeadHours: savedPrefs.deadlineAlertLeadHours,
    highRiskAlertsOnly: savedPrefs.highRiskAlertsOnly,
    dailyDigestEnabled: savedPrefs.dailyDigestEnabled,
  };
}

/**
 * Synchronizes the authenticated Firebase user and their alert preferences with the backend
 * via POST /api/auth/sync.
 */
export async function syncFirebaseUserToBackend(
  idToken: string,
  preferences?: Partial<UserAlertPreferences>
): Promise<UserAlertPreferences | null> {
  try {
    const response = await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ preferences }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.user) {
        return {
          emailAlertsEnabled: data.user.emailAlertsEnabled ?? true,
          deadlineAlertLeadHours: data.user.deadlineAlertLeadHours ?? 48,
          highRiskAlertsOnly: data.user.highRiskAlertsOnly ?? false,
          dailyDigestEnabled: data.user.dailyDigestEnabled ?? true,
        };
      }
    }
  } catch (err) {
    console.warn("User sync to Cloud SQL deferred:", err);
  }
  return null;
}

/**
 * Syncs updated deadline email alert preferences to Firebase user profile store & backend Cloud SQL.
 */
export async function syncUserPreferencesToBackend(
  user: User,
  prefs: Partial<UserAlertPreferences>
): Promise<UserAlertPreferences> {
  const merged = saveStoredFirebaseUserPreferences(user, prefs);
  const uid = user.firebaseUid || user.id;

  try {
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers = {
        ...headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        uid,
        email: user.email,
        name: user.name,
        ...merged,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.preferences) {
        return saveStoredFirebaseUserPreferences(user, data.preferences);
      }
    }
  } catch (err) {
    console.warn("Preferences sync to backend deferred (saved locally):", err);
  }

  return merged;
}

/**
 * Reusable Google Login function using Firebase Authentication popup
 */
export async function loginWithGoogleFirebase(): Promise<{
  user: User;
  credential: UserCredential;
}> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const appUser = mapFirebaseUserToAppUser(credential.user);
    return { user: appUser, credential };
  } catch (err: any) {
    const message = getFriendlyFirebaseAuthError(err);
    throw new Error(message);
  }
}

/**
 * Reusable Logout function using Firebase Authentication
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Firebase sign-out error:", err);
  }
}

/**
 * Subscribes to Firebase Authentication state changes.
 * Automatically keeps the user logged in across page refreshes.
 */
export function subscribeToFirebaseAuth(
  callback: (appUser: User | null, rawUser: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(
    auth,
    (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const appUser = mapFirebaseUserToAppUser(fbUser);
        callback(appUser, fbUser);
      } else {
        callback(null, null);
      }
    },
    (error) => {
      console.error("Firebase onAuthStateChanged error:", error);
      callback(null, null);
    }
  );
}

/**
 * Maps Firebase Auth error codes to helpful, user-friendly messages
 */
export function getFriendlyFirebaseAuthError(error: any): string {
  if (!error) return "Authentication failed. Please try again.";

  const code: string = error.code || "";
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing authentication.";
    case "auth/popup-blocked":
      return "Google sign-in popup was blocked by your browser. Please enable popups for this site.";
    case "auth/cancelled-popup-request":
      return "Previous sign-in popup was cancelled because a new request was made.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection and try again.";
    case "auth/unauthorized-domain":
      return `This app domain is not yet authorized in the Firebase Console (${firebaseConfig.authDomain}).`;
    case "auth/operation-not-allowed":
      return "Google Sign-In provider is not enabled in Firebase Authentication.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email address using different credentials.";
    default:
      return error.message || "Google authentication failed. Please try again.";
  }
}

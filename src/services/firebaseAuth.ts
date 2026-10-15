import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../config/firebase';
import { User, UserRole } from '../types';
import { isAdminEmail } from '../config/admins';

/**
 * Maps a Firebase User object to the application's internal User model,
 * preserving Full Name, Gmail Address, Profile Photo, and Firebase User ID (UID).
 */
export function mapFirebaseUserToAppUser(fbUser: FirebaseUser): User {
  const email = fbUser.email || '';
  const isAdmin = isAdminEmail(email);
  const role: UserRole = isAdmin ? 'Admin' : 'Member';

  const fullName =
    fbUser.displayName ||
    (email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Google User');

  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';

  return {
    id: fbUser.uid, // Firebase User ID
    firebaseUid: fbUser.uid, // Explicit Firebase UID
    name: fullName, // Full name
    email: email, // Gmail address
    picture: fbUser.photoURL || undefined, // Profile photo
    role,
    avatarText: initials,
    department: isAdmin ? 'Platform Governance' : 'Operations & Procurement',
    authLevel: isAdmin ? 'Auth Lv 3' : 'Auth Lv 2',
    isOnline: true
  };
}

/**
 * Reusable Google Login function using Firebase Authentication popup
 */
export async function loginWithGoogleFirebase(): Promise<{ user: User; credential: UserCredential }> {
  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
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
    console.error('Firebase sign-out error:', err);
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
      console.error('Firebase onAuthStateChanged error:', error);
      callback(null, null);
    }
  );
}

/**
 * Maps Firebase Auth error codes to helpful, user-friendly messages
 */
export function getFriendlyFirebaseAuthError(error: any): string {
  if (!error) return 'Authentication failed. Please try again.';

  const code: string = error.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please enable popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in popup was cancelled because a new request was made.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This app domain is not yet authorized in the Firebase Console (contract2action.firebaseapp.com).';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In provider is not enabled in Firebase Authentication.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address using different credentials.';
    default:
      return error.message || 'Google authentication failed. Please try again.';
  }
}

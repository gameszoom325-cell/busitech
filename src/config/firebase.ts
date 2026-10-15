import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

/**
 * Official Firebase Configuration for Contract2Action AI
 */
export const firebaseConfig = {
  apiKey: "AIzaSyCyz3M84cMq4EgrHsPgGvGKo_7QBw8KmHA",
  authDomain: "contract2action.firebaseapp.com",
  projectId: "contract2action",
  storageBucket: "contract2action.firebasestorage.app",
  messagingSenderId: "583416030100",
  appId: "1:583416030100:web:851a813ade05985946a581",
  measurementId: "G-FSFTNNZWQ0"
};

// Initialize Firebase (safely singleton)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firebase Authentication
export const auth: Auth = getAuth(app);

// Enable GoogleAuthProvider with account selection prompt
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

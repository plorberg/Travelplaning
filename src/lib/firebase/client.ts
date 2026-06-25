import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Client Firebase config. These values are identifiers, not secrets — they are
// meant to ship to the browser (access is controlled by Firebase auth settings,
// authorized domains, and our server-side session verification).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialise lazily so server-rendering the sign-in/out buttons never calls
// getAuth() at import time. Doing that eagerly crashes the whole page (HTTP
// 500) when the NEXT_PUBLIC_FIREBASE_* config is missing/not yet inlined.
// Auth is only needed in the browser, when the user actually signs in/out.
let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export const googleProvider = new GoogleAuthProvider();

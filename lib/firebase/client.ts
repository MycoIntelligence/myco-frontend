"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  const authDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim();
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
  const storageBucket = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim();
  const messagingSenderId = (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim();
  const appId = (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (cachedAuth) return cachedAuth;

  const config = getFirebaseClientConfig();
  if (!config) return null;

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
  cachedAuth = getAuth(cachedApp);
  return cachedAuth;
}

export function mapFirebaseAuthError(error: unknown): {
  message: string;
  code: string;
  isCancelled: boolean;
} {
  const err = error as { code?: string; message?: string; customData?: { email?: string } } | null;
  const code = typeof err?.code === "string" ? err.code : "auth/unknown";

  switch (code) {
    case "auth/account-exists-with-different-credential": {
      const email = err?.customData?.email ? ` (${err.customData.email})` : "";
      return {
        code,
        isCancelled: false,
        message: `An account already exists with this email${email} using a different sign-in provider. Sign in with your original provider or work email and password.`,
      };
    }
    case "auth/popup-closed-by-user":
      return {
        code,
        isCancelled: true,
        message: "Sign-in window was closed before completing authentication.",
      };
    case "auth/cancelled-popup-request":
      return {
        code,
        isCancelled: true,
        message: "Another sign-in popup request is already in progress.",
      };
    case "auth/popup-blocked":
      return {
        code,
        isCancelled: false,
        message: "Sign-in popup was blocked by your browser. Allow popups for this site and try again.",
      };
    case "auth/network-request-failed":
      return {
        code,
        isCancelled: false,
        message: "Network error while contacting authentication service. Check your connection and try again.",
      };
    case "auth/unauthorized-domain":
      return {
        code,
        isCancelled: false,
        message: "This domain is not authorized in Firebase Authentication settings.",
      };
    case "auth/operation-not-allowed":
      return {
        code,
        isCancelled: false,
        message: "This sign-in provider is not enabled yet in Firebase Console.",
      };
    default:
      return {
        code,
        isCancelled: false,
        message: err?.message || "Unable to complete sign-in. Please try again.",
      };
  }
}

export async function loginWithGoogle(): Promise<{ idToken: string; user: User }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw Object.assign(new Error("Google sign-in is not configured."), {
      code: "myco/firebase-not-configured",
    });
  }
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function loginWithGitHub(): Promise<{ idToken: string; user: User }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw Object.assign(new Error("GitHub sign-in is not configured."), {
      code: "myco/firebase-not-configured",
    });
  }
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("user:email");

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function logoutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  try {
    await signOut(auth);
  } catch {
    // Ignore client cleanup errors during sign-out
  }
}

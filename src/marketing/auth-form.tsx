"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { confirmEmail, signOut, submitCredentials } from "@/app/(marketing)/auth/actions";
import { accountPath, type AccountIntent } from "@/lib/account-paths";
import {
  getFirebaseClientConfig,
  loginWithGitHub,
  loginWithGoogle,
  logoutFirebase,
  mapFirebaseAuthError,
} from "@/lib/firebase/client";
import { clearWebsiteSessionCache, setWebsiteSessionProfile } from "./website-session";
import styles from "./account.module.css";

export function AuthForm({ mode, intent, configured }: {
  mode: "signup" | "login";
  intent: AccountIntent;
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(submitCredentials.bind(null, mode), {});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null);
  const [oauthError, setOauthError] = useState("");
  const isSignup = mode === "signup";
  const firebaseEnabled = Boolean(getFirebaseClientConfig());

  async function handleSocialSignIn(provider: "google" | "github") {
    if (!configured || oauthProvider || pending) return;
    setOauthError("");
    setOauthProvider(provider);

    try {
      const authResult =
        provider === "github" ? await loginWithGitHub() : await loginWithGoogle();

      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: authResult.idToken, intent }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        profile?: { name?: string };
      };

      if (!response.ok || !result.ok) {
        setOauthError(result.error || "Unable to complete sign-in. Please try again.");
        setOauthProvider(null);
        return;
      }

      clearWebsiteSessionCache();
      if (result.profile?.name) {
        setWebsiteSessionProfile({ name: result.profile.name });
      }
      window.location.assign(result.redirectTo || "/");
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      setOauthError(mapped.message);
      setOauthProvider(null);
    }
  }

  return (
    <>
      <h1 id="account-heading">{isSignup ? "Create your Myco account" : "Sign in to Myco"}</h1>
      <p className={styles.intro}>
        {isSignup ? "Get started with Myco PR Review." : "Enter your work email or sign in with Google or GitHub."}
      </p>
      {firebaseEnabled && (
        <div className={styles.oauthSection}>
          <div className={styles.oauthButtons}>
            <button
              type="button"
              className={styles.oauthButton}
              disabled={!configured || Boolean(oauthProvider) || pending}
              onClick={() => void handleSocialSignIn("google")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>{oauthProvider === "google" ? "Connecting Google…" : "Continue with Google"}</span>
            </button>
            <button
              type="button"
              className={styles.oauthButton}
              disabled={!configured || Boolean(oauthProvider) || pending}
              onClick={() => void handleSocialSignIn("github")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.438 9.63 8.205 11.19.6.11.82-.26.82-.57 0-.28-.01-1.03-.02-2.02-3.338.71-4.042-1.58-4.042-1.58-.546-1.36-1.333-1.72-1.333-1.72-1.089-.73.083-.72.083-.72 1.205.08 1.838 1.21 1.838 1.21 1.07 1.81 2.809 1.29 3.495.98.108-.76.417-1.29.76-1.58-2.665-.3-5.466-1.31-5.466-5.84 0-1.29.465-2.34 1.235-3.17-.124-.3-.535-1.5.117-3.13 0 0 1.008-.32 3.3 1.21.957-.26 1.983-.39 3.003-.4 1.02.01 2.047.14 3.006.4 2.29-1.53 3.296-1.21 3.296-1.21.654 1.63.243 2.83.12 3.13.77.83 1.233 1.88 1.233 3.17 0 4.54-2.807 5.54-5.48 5.83.43.36.815 1.08.815 2.18 0 1.57-.015 2.84-.015 3.23 0 .31.216.69.825.57C20.565 21.92 24 17.5 24 12.29 24 5.78 18.627.5 12 .5Z" />
              </svg>
              <span>{oauthProvider === "github" ? "Connecting GitHub…" : "Continue with GitHub"}</span>
            </button>
          </div>
          {oauthError && <p className={styles.error} role="alert">{oauthError}</p>}
          <div className={styles.oauthDivider}><span>or continue with email</span></div>
        </div>
      )}
      <form action={action} className={styles.form} onSubmit={clearWebsiteSessionCache}>
        <input type="hidden" name="intent" value={intent} />
        {isSignup && (
          <div className={styles.field}>
            <label htmlFor="fullName">Full name <span className={styles.required} aria-hidden="true">*</span></label>
            <input id="fullName" name="fullName" autoComplete="name" required maxLength={100}
              value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="email">Work email <span className={styles.required} aria-hidden="true">*</span></label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none"
            spellCheck={false} required maxLength={254}
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password <span className={styles.required} aria-hidden="true">*</span></label>
          <div className={styles.password}>
            <input id="password" name="password" type={passwordVisible ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"} required
              minLength={isSignup ? 8 : undefined} maxLength={isSignup ? 72 : 1024}
              aria-describedby={isSignup ? "password-hint" : undefined} />
            <button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible(!passwordVisible)}>
              {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {isSignup && <span id="password-hint" className={styles.hint}>Use at least 8 characters, including an uppercase letter and a special character.</span>}
        </div>
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        {!configured && <p className={styles.notice} id="auth-unavailable">This preview can’t create accounts or sign you in yet.</p>}
        <button className={styles.button} type="submit" disabled={pending || !configured}
          aria-describedby={!configured ? "auth-unavailable" : undefined}>
          {pending ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
      <p className={styles.switch}>
        {isSignup ? "Already have an account?" : "New to Myco?"}{" "}
        <Link href={accountPath(isSignup ? "/login" : "/signup", intent)}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </>
  );
}

export function ConfirmEmailForm({ token, code, configured }: {
  token?: string;
  code?: string;
  configured: boolean;
}) {
  const [state, action, pending] = useActionState(confirmEmail, {});

  return (
    <form action={action} className={styles.form} onSubmit={clearWebsiteSessionCache}>
      {token && <input type="hidden" name="token" value={token} />}
      {code && <input type="hidden" name="code" value={code} />}
      {!configured && <p className={styles.notice}>Account confirmation is unavailable right now.</p>}
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      <button className={styles.button} disabled={pending || !configured}>
        {pending ? "Confirming…" : "Confirm email"} <ArrowRight size={17} aria-hidden="true" />
      </button>
    </form>
  );
}

function SignOutSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.textButton} type="submit" disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function SignOutForm() {
  return (
    <form
      action={signOut}
      className={styles.switch}
      onSubmit={() => {
        setWebsiteSessionProfile(null);
        void logoutFirebase();
      }}
    >
      <SignOutSubmitButton />
    </form>
  );
}

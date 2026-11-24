"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { confirmEmail, submitCredentials } from "@/app/(marketing)/auth/actions";
import { accountPath, type AccountIntent } from "@/lib/account-paths";
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
  const isSignup = mode === "signup";

  return (
    <>
      <h1 id="account-heading">{isSignup ? "Create your account" : "Sign in to Myco"}</h1>
      <p className={styles.intro}>
        {isSignup ? "Get started with Myco code review." : "Enter your email and password to continue."}
      </p>
      <form action={action} className={styles.form}>
        <input type="hidden" name="intent" value={intent} />
        {isSignup && (
          <div className={styles.field}>
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" autoComplete="name" required maxLength={100}
              value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none"
            spellCheck={false} required maxLength={254}
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
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
          {isSignup && <span id="password-hint" className={styles.hint}>Use at least 8 characters.</span>}
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
    <form action={action} className={styles.form}>
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

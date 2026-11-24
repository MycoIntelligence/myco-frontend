"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { trialLoginHref } from "@/lib/account-paths";
import { useWebsiteSession } from "./website-session";
import { trialEmailSchema, trialGitHubUsernameSchema, trialRequestSchema } from "@/lib/schema";
import "./trial-request.css";

const dialogId = "free-trial-request";
const intro = "Share your details and we’ll review your request. We’ll email you an onboarding guide to get started.";

export function TrialRequestButton({ className, children }: { className: string; children?: ReactNode }) {
  const profile = useWebsiteSession();
  const router = useRouter();

  function openForm() {
    if (!profile) {
      router.push(trialLoginHref);
      return;
    }

    const dialog = document.getElementById(dialogId);
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
  }

  return (
    <button type="button" className={`trial-request-button ${className}`} aria-haspopup={profile ? "dialog" : undefined} aria-controls={profile ? dialogId : undefined} onClick={openForm}>
      {children ?? "Request a free trial"}
    </button>
  );
}

export function TrialRequestDialog() {
  const profile = useWebsiteSession();
  const router = useRouter();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!profile || pathname !== "/" || !dialog.current) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("trial") !== "open") return;

    if (!dialog.current.open) dialog.current.showModal();
    url.searchParams.delete("trial");
    window.history.replaceState(null, "", url);
  }, [pathname, profile]);

  function validateOnBlur(input: HTMLInputElement) {
    const schema = input.name === "workEmail" ? trialEmailSchema : trialGitHubUsernameSchema;
    const result = schema.safeParse(input.value);
    if (!result.success) {
      setFieldErrors((previous) => ({ ...previous, [input.name]: result.error.issues[0]?.message }));
    }
  }

  function fieldFeedback(name: string) {
    return fieldErrors[name] && (
      <p id={`trial-error-${name}`} className="trial-dialog-field-error" role="alert">{fieldErrors[name]}</p>
    );
  }

  function fieldAttributes(name: string) {
    return {
      name,
      "aria-invalid": fieldErrors[name] ? true : undefined,
      "aria-describedby": fieldErrors[name] ? `trial-error-${name}` : undefined,
      onChange: () => setFieldErrors((previous) => (
        previous[name] ? { ...previous, [name]: undefined } : previous
      )),
      readOnly: sending,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form)), kind: "trial" };
    const validation = trialRequestSchema.safeParse(payload);
    setError("");

    function showFieldErrors(errors: Record<string, string>) {
      setFieldErrors(errors);
      const firstField = form.elements.namedItem(Object.keys(errors)[0]);
      if (firstField instanceof HTMLInputElement && dialog.current?.open) firstField.focus();
    }

    if (!validation.success) {
      const errors = Object.entries(validation.error.flatten().fieldErrors);
      showFieldErrors(Object.fromEntries(errors.map(([name, messages]) => [name, messages[0]])));
      return;
    }

    setFieldErrors({});
    pending.current = true;
    setSending(true);

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        dialog.current?.close();
        router.push(trialLoginHref);
        return;
      }

      const result = await response.json();
      if (response.ok && result.ok) {
        if (dialog.current?.open) closeButton.current?.focus();
        setSent(true);
      } else if (result.errors) {
        showFieldErrors(result.errors);
      } else {
        setError(result.message || "We couldn’t send your request. Try again.");
      }
    } catch {
      setError("We couldn’t send your request. Try again.");
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return (
    <dialog
      id={dialogId}
      ref={dialog}
      className="trial-dialog"
      aria-labelledby="trial-dialog-title"
      aria-describedby="trial-dialog-intro"
      onClose={() => { if (sent) setSent(false); }}
    >
      <button ref={closeButton} type="button" className="trial-dialog-close" aria-label="Close free trial form" onClick={() => dialog.current?.close()}>
        <span aria-hidden="true">×</span>
      </button>
      <p className="trial-dialog-badge">14 days of free code review</p>
      <h2 id="trial-dialog-title">{sent ? "Request received" : "Request a free trial"}</h2>
      <p id="trial-dialog-intro" role={sent ? "status" : undefined}>
        {sent ? "We’ll review your details and email you an onboarding guide." : intro}
      </p>
      {!sent && (
        <form onSubmit={submit} method="post" noValidate>
          <div className="trial-dialog-name-fields">
            <div>
              <label htmlFor="free-trial-first-name">First name<span className="trial-dialog-required" aria-hidden="true">*</span></label>
              <input id="free-trial-first-name" {...fieldAttributes("firstName")} autoComplete="given-name" placeholder="Alex" required maxLength={60} />
              {fieldFeedback("firstName")}
            </div>
            <div>
              <label htmlFor="free-trial-last-name">Last name<span className="trial-dialog-required" aria-hidden="true">*</span></label>
              <input id="free-trial-last-name" {...fieldAttributes("lastName")} autoComplete="family-name" placeholder="Jones" required maxLength={60} />
              {fieldFeedback("lastName")}
            </div>
          </div>

          <label htmlFor="free-trial-email">Work email<span className="trial-dialog-required" aria-hidden="true">*</span></label>
          <input id="free-trial-email" {...fieldAttributes("workEmail")} type="email" autoComplete="email" placeholder="alex@acme.com" onBlur={(event) => validateOnBlur(event.currentTarget)} required maxLength={254} />
          {fieldFeedback("workEmail")}

          <label htmlFor="free-trial-github">GitHub username or profile URL<span className="trial-dialog-required" aria-hidden="true">*</span></label>
          <input id="free-trial-github" {...fieldAttributes("githubUsername")} autoCapitalize="off" spellCheck={false} placeholder="alex-jones or github.com/alex-jones" onBlur={(event) => validateOnBlur(event.currentTarget)} required maxLength={256} />
          {fieldFeedback("githubUsername")}

          <div className="trial-dialog-trap" aria-hidden="true">
            <label htmlFor="free-trial-website">Website</label>
            <input id="free-trial-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <button className="trial-dialog-submit" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Request a free trial"} <span aria-hidden="true">→</span>
          </button>
          {error && <p className="trial-dialog-error" role="alert">{error}</p>}
        </form>
      )}
    </dialog>
  );
}

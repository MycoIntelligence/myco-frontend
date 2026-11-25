"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { trialEmailSchema, trialGitHubUsernameSchema, trialRequestSchema } from "@/lib/schema";
import "./trial-request.css";

type RequestKind = "trial" | "upgrade";
const intro = "Share your details and we’ll review your request. We’ll email you an onboarding guide to get started.";

export function TrialRequestButton({ className, children, kind = "trial" }: { className: string; children?: ReactNode; kind?: RequestKind }) {
  const dialogId = `free-${kind}-request`;
  function openForm() {
    const dialog = document.getElementById(dialogId);
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
  }

  return (
    <button type="button" className={`trial-request-button ${className}`} aria-haspopup="dialog" aria-controls={dialogId} onClick={openForm}>
      {children ?? "Request a free trial"}
    </button>
  );
}

export function TrialRequestDialog({ kind = "trial" }: { kind?: RequestKind }) {
  const upgrade = kind === "upgrade";
  const dialogId = `free-${kind}-request`;
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  function validateOnBlur(input: HTMLInputElement) {
    const schema = input.name === "workEmail" ? trialEmailSchema : trialGitHubUsernameSchema;
    const result = schema.safeParse(input.value);
    if (!result.success) {
      setFieldErrors((previous) => ({ ...previous, [input.name]: result.error.issues[0]?.message }));
    }
  }

  function fieldFeedback(name: string) {
    return fieldErrors[name] && (
      <p id={`${dialogId}-error-${name}`} className="trial-dialog-field-error" role="alert">{fieldErrors[name]}</p>
    );
  }

  function fieldAttributes(name: string) {
    return {
      name,
      "aria-invalid": fieldErrors[name] ? true : undefined,
      "aria-describedby": fieldErrors[name] ? `${dialogId}-error-${name}` : undefined,
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
    const payload = { ...Object.fromEntries(new FormData(form)), kind };
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
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-intro`}
      onClose={() => { if (sent) setSent(false); }}
    >
      <button ref={closeButton} type="button" className="trial-dialog-close" aria-label={upgrade ? "Close upgrade form" : "Close free trial form"} onClick={() => dialog.current?.close()}>
        <span aria-hidden="true">×</span>
      </button>
      {!upgrade && <p className="trial-dialog-badge">14 days of free code review</p>}
      <h2 id={`${dialogId}-title`}>{sent ? "Request received" : upgrade ? "Upgrade to Pro" : "Request a free trial"}</h2>
      <p className="trial-dialog-intro" id={`${dialogId}-intro`} role={sent ? "status" : undefined}>
        {upgrade ? (sent ? "We’ve received your upgrade request. We’ll follow up at your work email." : "Tell us where to reach you. We’ll email you the next steps for upgrading your team to Myco Pro.") : sent ? "We’ll review your details and email you an onboarding guide." : intro}
      </p>
      {!sent && (
        <form onSubmit={submit} method="post" noValidate>
          <div className="trial-dialog-name-fields">
            <div>
              <label htmlFor={`${dialogId}-first-name`}>First name<span className="trial-dialog-required" aria-hidden="true">*</span></label>
              <input id={`${dialogId}-first-name`} {...fieldAttributes("firstName")} autoComplete="given-name" placeholder="Alex" required maxLength={60} />
              {fieldFeedback("firstName")}
            </div>
            <div>
              <label htmlFor={`${dialogId}-last-name`}>Last name<span className="trial-dialog-required" aria-hidden="true">*</span></label>
              <input id={`${dialogId}-last-name`} {...fieldAttributes("lastName")} autoComplete="family-name" placeholder="Jones" required maxLength={60} />
              {fieldFeedback("lastName")}
            </div>
          </div>

          <label htmlFor={`${dialogId}-email`}>Work email<span className="trial-dialog-required" aria-hidden="true">*</span></label>
          <input id={`${dialogId}-email`} {...fieldAttributes("workEmail")} type="email" autoComplete="email" placeholder="alex@acme.com" onBlur={(event) => validateOnBlur(event.currentTarget)} required maxLength={254} />
          {fieldFeedback("workEmail")}

          <label htmlFor={`${dialogId}-github`}>GitHub username or profile URL<span className="trial-dialog-required" aria-hidden="true">*</span></label>
          <input id={`${dialogId}-github`} {...fieldAttributes("githubUsername")} autoCapitalize="off" spellCheck={false} placeholder="alex-jones or github.com/alex-jones" onBlur={(event) => validateOnBlur(event.currentTarget)} required maxLength={256} />
          {fieldFeedback("githubUsername")}

          {upgrade && <>
            <label htmlFor={`${dialogId}-developers`}>Number of developers</label>
            <input id={`${dialogId}-developers`} {...fieldAttributes("developerCount")} inputMode="numeric" maxLength={9} placeholder="e.g. 5" />
            {fieldFeedback("developerCount")}
          </>}

          <div className="trial-dialog-trap" aria-hidden="true">
            <label htmlFor={`${dialogId}-website`}>Website</label>
            <input id={`${dialogId}-website`} name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <button className="trial-dialog-submit" type="submit" disabled={sending}>
            {sending ? "Sending…" : upgrade ? "Request an upgrade" : "Request a free trial"} <span aria-hidden="true">→</span>
          </button>
          {error && <p className="trial-dialog-error" role="alert">{error}</p>}
        </form>
      )}
    </dialog>
  );
}

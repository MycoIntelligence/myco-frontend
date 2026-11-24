"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import "./trial-request.css";

const dialogId = "free-trial-request";
const intro = "Enter your details below. Once we approve your request, you can try Myco free for 14 days.";

export function TrialRequestButton({ className, children }: { className: string; children?: ReactNode }) {
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

export function TrialRequestDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const fields = new FormData(event.currentTarget);

    pending.current = true;
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fields), kind: "trial" }),
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        if (dialog.current?.open) closeButton.current?.focus();
        setSent(true);
      } else {
        setError(Object.values(result.errors ?? {}).join(" ") || result.message || "We couldn’t send your request. Try again.");
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
        {sent ? "We’ll review your request and email you with next steps." : intro}
      </p>
      {!sent && (
        <form onSubmit={submit} method="post">
          <label htmlFor="free-trial-name">Full name</label>
          <input id="free-trial-name" name="fullName" autoComplete="name" placeholder="Alex Jones" required maxLength={120} />

          <label htmlFor="free-trial-email">Work email</label>
          <input id="free-trial-email" name="workEmail" type="email" autoComplete="email" placeholder="alex@acme.com" required maxLength={254} />

          <label htmlFor="free-trial-message">What would you like to try? <span>Optional</span></label>
          <textarea id="free-trial-message" name="message" rows={3} maxLength={600} placeholder="For example, catch regressions in our checkout flow." />

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

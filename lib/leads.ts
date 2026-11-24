import { createHash } from "node:crypto";
import type { DemoFormData, TrialRequestData } from "./schema";

type LeadMetadata = { id: string; timestamp: string };
type TrialLead = TrialRequestData & LeadMetadata;
export type Lead = (DemoFormData & LeadMetadata) | TrialLead;

async function sendTrialEmails(lead: TrialLead, apiKey: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  const teamEmail = process.env.TRIAL_REQUEST_TO;
  if (!from || !teamEmail) throw new Error("Trial email addresses are not configured");

  const body = JSON.stringify([
    {
      from,
      to: [teamEmail],
      reply_to: lead.workEmail,
      subject: "New Myco free trial request",
      text: [
        "A new free trial request is ready for review.",
        "",
        `Name: ${lead.fullName}`,
        `Work email: ${lead.workEmail}`,
        `GitHub username: ${lead.githubUsername}`,
      ].join("\n"),
    },
    {
      from,
      to: [lead.workEmail],
      reply_to: teamEmail,
      subject: "We received your Myco trial request",
      text: "Thanks for requesting a Myco trial. We’ll review your details and email you an onboarding guide to get started.\n\nThe Myco team",
    },
  ]);
  // Keep retries of the same email pair from sending duplicate messages.
  const key = createHash("sha256").update(body).digest("hex");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `myco-trial/${key}`,
    },
    body,
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Trial email delivery failed");
}

/** Deliver trial requests through Resend when configured, or use the existing lead webhook. */
export async function deliverLead(payload: Lead): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if ("kind" in payload && payload.kind === "trial" && resendKey) {
    return sendTrialEmails(payload, resendKey);
  }

  const endpoint = process.env.LEAD_WEBHOOK_URL;
  if (!endpoint) throw new Error("Lead delivery is not configured");

  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("Lead webhook must use HTTPS");

  const { website: _honeypot, ...lead } = payload;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LEAD_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Lead delivery failed");
}

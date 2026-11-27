import { createHash } from "node:crypto";
import type { BetaRequestData, DemoFormData, TrialRequestData } from "./schema";

type LeadMetadata = { id: string; timestamp: string };
type TrialLead = (TrialRequestData | BetaRequestData) & LeadMetadata;
export type Lead = (DemoFormData & LeadMetadata) | TrialLead;

async function sendTrialEmails(lead: TrialLead, apiKey: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  const teamEmail = process.env.TRIAL_REQUEST_TO;
  if (!from || !teamEmail) throw new Error("Trial email addresses are not configured");

  const upgrade = lead.kind === "upgrade";
  const beta = lead.kind === "beta";
  const body = JSON.stringify([
    {
      from,
      to: [teamEmail],
      reply_to: lead.workEmail,
      subject: beta ? `New private beta request: ${lead.feature}` : upgrade ? "New Myco Pro upgrade request" : "New Myco free trial request",
      text: [
        beta ? "A private beta request is ready for review." : upgrade ? "A new Pro upgrade request is ready for review." : "A new free trial request is ready for review.",
        "",
        `Name: ${lead.fullName}`,
        `Work email: ${lead.workEmail}`,
        ...(beta ? [`Feature: ${lead.feature}`, `What they’d like to try: ${lead.message}`] : [`GitHub username: ${lead.githubUsername}`]),
        ...(lead.kind === "upgrade" && lead.developerCount ? [`Developers: ${lead.developerCount}`] : []),
      ].join("\n"),
    },
    {
      from,
      to: [lead.workEmail],
      reply_to: teamEmail,
      subject: beta ? "We received your Myco private beta request" : upgrade ? "We received your Myco Pro upgrade request" : "We received your Myco trial request",
      text: beta ? "Thanks for reaching out. We’ll follow up at your work email about private beta access." : upgrade ? "We’ve received your upgrade request. We’ll follow up at your work email." : "Thanks for requesting a Myco trial. We’ll review your details and email you an onboarding guide to get started.\n\nThe Myco team",
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
  if ("kind" in payload && (payload.kind === "trial" || payload.kind === "upgrade" || payload.kind === "beta") && resendKey) {
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

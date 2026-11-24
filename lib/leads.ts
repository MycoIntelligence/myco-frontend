import type { DemoFormData, TrialRequestData } from "./schema";

export type Lead = (DemoFormData | TrialRequestData) & {
  id: string;
  timestamp: string;
};

/** Deliver a request only to an explicitly configured, server-side endpoint. */
export async function deliverLead(payload: Lead): Promise<void> {
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

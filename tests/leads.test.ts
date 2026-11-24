import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverLead, type Lead } from "@/lib/leads";

const trial: Lead = {
  kind: "trial",
  id: "trial-1",
  timestamp: "2026-11-25T00:00:00Z",
  fullName: "Alex Jones",
  firstName: "Alex",
  lastName: "Jones",
  workEmail: "alex@example.com",
  githubUsername: "alex-jones",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Trial request email delivery", () => {
  it("sends a team notification and a separate receipt, with a stable retry key", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "Myco <trials@mail.example.com>");
    vi.stubEnv("TRIAL_REQUEST_TO", "office@example.com");
    const send = vi.fn<typeof fetch>().mockImplementation(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", send);

    await deliverLead(trial);
    await deliverLead({ ...trial, id: "trial-retry" });

    expect(send).toHaveBeenCalledTimes(2);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails/batch");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Idempotency-Key": expect.stringMatching(/^myco-trial\/[a-f0-9]{64}$/),
    });
    expect(send.mock.calls[1][1]?.headers).toEqual(options?.headers);
    expect(JSON.parse(String(options?.body))).toEqual([
      expect.objectContaining({ to: ["office@example.com"], reply_to: "alex@example.com", text: expect.stringContaining("alex-jones") }),
      expect.objectContaining({ to: ["alex@example.com"], reply_to: "office@example.com", subject: "We received your Myco trial request" }),
    ]);
  });

  it("continues using the webhook when Resend is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("LEAD_WEBHOOK_URL", "https://leads.example.com");
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", send);

    await deliverLead(trial);

    expect(send).toHaveBeenCalledWith(new URL("https://leads.example.com"), expect.objectContaining({
      body: JSON.stringify(trial),
    }));
  });
});

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/route";
import { deliverLead } from "@/lib/leads";

vi.mock("@/lib/leads", () => ({ deliverLead: vi.fn() }));

const trial = {
  kind: "trial",
  firstName: "Alex",
  lastName: "Jones",
  workEmail: "alex@acme.com",
  githubUsername: "alex-jones",
};

function request(body: object) {
  return new NextRequest("http://localhost/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Free trial requests", () => {
  const lookup = vi.fn();

  beforeEach(() => {
    vi.mocked(deliverLead).mockReset();
    lookup.mockReset().mockImplementation(async () => Response.json({ login: "alex-jones", type: "User" }));
    vi.stubGlobal("fetch", lookup);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("sends a trial lead without requiring the legacy form fields", async () => {
    const response = await POST(request(trial));
    expect(response.status).toBe(200);
    expect(lookup).toHaveBeenCalledWith("https://api.github.com/users/alex-jones", expect.any(Object));
    expect(deliverLead).toHaveBeenCalledWith({
      ...trial,
      fullName: "Alex Jones",
      id: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it("requires both names, work email, and GitHub username", async () => {
    const response = await POST(request({ kind: "trial", workEmail: "invalid" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      errors: {
        firstName: expect.any(String),
        lastName: expect.any(String),
        workEmail: expect.any(String),
        githubUsername: expect.any(String),
      },
    });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("drops company and notes submitted by older versions of the form", async () => {
    const response = await POST(request({ ...trial, company: "Acme", message: "Old trial notes" }));
    expect(response.status).toBe(200);
    const [payload] = vi.mocked(deliverLead).mock.calls[0];
    expect(payload).not.toHaveProperty("company");
    expect(payload).not.toHaveProperty("message");
  });

  it("rejects a URL in the GitHub username field", async () => {
    const response = await POST(request({ ...trial, githubUsername: "https://github.com/alex-jones" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: { githubUsername: expect.any(String) } });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it.each([
    ["test", "Please enter a valid email address."],
    ["alex@GMAIL.com", "Please enter your company email address."],
  ])("shows an inline email error for %s", async (workEmail, message) => {
    const response = await POST(request({ ...trial, workEmail }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: { workEmail: message } });
    expect(lookup).not.toHaveBeenCalled();
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("rejects a GitHub username that does not exist", async () => {
    lookup.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const response = await POST(request(trial));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      errors: { githubUsername: "Please enter the correct GitHub username." },
    });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("rejects a GitHub organization when a personal account is needed", async () => {
    lookup.mockResolvedValueOnce(Response.json({ login: "alex-jones", type: "Organization" }));
    const response = await POST(request(trial));
    expect(response.status).toBe(400);
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("reports GitHub rate limiting as a retryable failure", async () => {
    lookup.mockResolvedValueOnce(new Response(null, { status: 429 }));
    const response = await POST(request(trial));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      ok: false,
      message: expect.stringContaining("Please try again."),
    });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("reports delivery failures without confirming receipt", async () => {
    vi.mocked(deliverLead).mockRejectedValueOnce(new TypeError("Network failure"));
    const response = await POST(request(trial));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});

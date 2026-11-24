import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/route";
import { deliverLead } from "@/lib/leads";

vi.mock("@/lib/leads", () => ({ deliverLead: vi.fn() }));

const trial = {
  kind: "trial",
  firstName: "Alex",
  lastName: "Jones",
  workEmail: "alex@acme.com",
  company: "Acme",
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
  beforeEach(() => vi.mocked(deliverLead).mockReset());

  it("sends a trial lead without requiring the legacy form fields", async () => {
    const response = await POST(request(trial));
    expect(response.status).toBe(200);
    expect(deliverLead).toHaveBeenCalledWith({
      ...trial,
      fullName: "Alex Jones",
      id: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it("requires both names, business email, company, and GitHub username", async () => {
    const response = await POST(request({ kind: "trial", workEmail: "invalid" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      errors: {
        firstName: expect.any(String),
        lastName: expect.any(String),
        workEmail: expect.any(String),
        company: expect.any(String),
        githubUsername: expect.any(String),
      },
    });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("rejects a URL in the GitHub username field", async () => {
    const response = await POST(request({ ...trial, githubUsername: "https://github.com/alex-jones" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: { githubUsername: expect.any(String) } });
    expect(deliverLead).not.toHaveBeenCalled();
  });

  it("reports delivery failures without confirming receipt", async () => {
    vi.mocked(deliverLead).mockRejectedValueOnce(new TypeError("Network failure"));
    const response = await POST(request(trial));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});

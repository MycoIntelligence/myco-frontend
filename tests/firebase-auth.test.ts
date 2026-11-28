import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyFirebaseIdToken } from "@/lib/firebase/server";
import { POST } from "@/app/api/auth/firebase/route";
import { GET as handoffGet } from "@/app/api/dashboard-handoff/route";
import { createSupabaseServerClient, createWebsiteSignupAdmin, getWebsiteCustomerSession } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createWebsiteSignupAdmin: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getWebsiteCustomerSession: vi.fn(),
}));

function base64Url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(payload: Record<string, unknown>, privateKey: string, kid = "kid-test-1") {
  const { createSign } = await import("node:crypto");
  const header = base64Url(JSON.stringify({ alg: "RS256", kid }));
  const body = base64Url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${body}`);
  signer.end();
  return `${header}.${body}.${base64Url(signer.sign(privateKey))}`;
}

describe("Website Firebase Authentication", () => {
  const originalEnv = { ...process.env };
  const keys = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  beforeEach(() => {
    process.env.FIREBASE_PROJECT_ID = "myco-test-proj";
    process.env.WEBSITE_LOGIN_NAMESPACE_KEY = "test-namespace-secret";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ "kid-test-1": keys.publicKey }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "max-age=3600" },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  it("verifies valid Google Firebase ID tokens and rejects tampered ones", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt(
      {
        iss: "https://securetoken.google.com/myco-test-proj",
        aud: "myco-test-proj",
        sub: "fb_uid_1",
        iat: now - 5,
        auth_time: now - 5,
        exp: now + 3600,
        email: "Jane.Doe@acme.com",
        email_verified: true,
        name: "Jane Doe",
        picture: "https://lh3.googleusercontent.com/avatar.png",
        firebase: { sign_in_provider: "google.com" },
      },
      keys.privateKey
    );

    const verified = await verifyFirebaseIdToken(token);
    expect(verified.valid).toBe(true);
    if (verified.valid) {
      expect(verified.user.email).toBe("jane.doe@acme.com");
      expect(verified.user.fullName).toBe("Jane Doe");
      expect(verified.user.provider).toBe("google.com");
    }

    const tampered = await verifyFirebaseIdToken(`${token.slice(0, -4)}zzzz`);
    expect(tampered.valid).toBe(false);
  });

  it("stores new GitHub/Google signups into existing website_customer_data and redirects to dashboard-handoff for trials", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signJwt(
      {
        iss: "https://securetoken.google.com/myco-test-proj",
        aud: "myco-test-proj",
        sub: "fb_uid_github",
        iat: now - 5,
        auth_time: now - 5,
        exp: now + 3600,
        email: "dev@acme.com",
        email_verified: true,
        name: "Dev User",
        firebase: { sign_in_provider: "github.com" },
      },
      keys.privateKey
    );

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const ilike = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ ilike }));
    const from = vi.fn(() => ({ select }));
    const createUser = vi.fn().mockResolvedValue({ error: null });
    const generateLink = vi.fn().mockResolvedValue({
      data: { properties: { hashed_token: "hash_otp_123" } },
      error: null,
    });
    const verifyOtp = vi.fn().mockResolvedValue({
      data: { session: { access_token: "sb_access_123" } },
      error: null,
    });

    vi.mocked(createWebsiteSignupAdmin).mockReturnValue({
      from,
      auth: { admin: { createUser, generateLink } },
    } as never);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { verifyOtp },
    } as never);

    const req = new Request("http://localhost:3000/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token, intent: "trial" }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      ok: true,
      redirectTo: "/api/dashboard-handoff",
      profile: { name: "Dev User", email: "dev@acme.com" },
    });
    expect(from).toHaveBeenCalledWith("website_customer_data");
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash_otp_123", type: "email" });
  });

  it("includes #sso_token in /api/dashboard-handoff redirect when accessToken is present", async () => {
    process.env.MYCO_DASHBOARD_URL = "http://localhost:3456";
    vi.mocked(getWebsiteCustomerSession).mockResolvedValue({
      user: { id: "u_1", email: "dev@acme.com" },
      supabase: { auth: {} },
      accessToken: "jwt_website_token_abc",
    } as never);

    const res = await handoffGet(new Request("http://localhost:3000/api/dashboard-handoff"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3456/?source=website#sso_token=jwt_website_token_abc"
    );
  });
});

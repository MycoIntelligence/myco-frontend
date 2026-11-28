import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookiesMock = vi.fn();
const createServerClientMock = vi.fn();
const createContextClientMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@supabase/server/core", () => ({
  createAdminClient: vi.fn(),
  createContextClient: createContextClientMock,
}));

describe("website session fast paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  });

  it("short-circuits getWebsiteCustomerSession when no sb- auth cookie exists", async () => {
    cookiesMock.mockResolvedValue({ getAll: () => [{ name: "theme", value: "dark" }] });

    const { getWebsiteCustomerSession } = await import("@/lib/supabase/server");
    const result = await getWebsiteCustomerSession({ readOnly: true });

    expect(result).toBeNull();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("verifies JWT via getClaims without calling getUser and serves /api/website-session without DB query when name is in metadata", async () => {
    cookiesMock.mockResolvedValue({ getAll: () => [{ name: "sb-proj-auth-token", value: "tok" }] });
    const getUserMock = vi.fn();
    createServerClientMock.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "jwt-123" } } }),
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: {
              sub: "user-123",
              email: "ada@example.com",
              user_metadata: { full_name: "Ada Lovelace" },
              app_metadata: {},
            },
          },
          error: null,
        }),
        getUser: getUserMock,
      },
    });
    const fromMock = vi.fn();
    createContextClientMock.mockReturnValue({ from: fromMock });

    const { GET } = await import("@/app/api/website-session/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ profile: { name: "Ada Lovelace" } });
    expect(getUserMock).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated /account requests in middleware without calling Supabase", async () => {
    const { middleware } = await import("@/middleware");
    const request = new NextRequest("https://example.com/account");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
    expect(createServerClientMock).not.toHaveBeenCalled();
  });
});

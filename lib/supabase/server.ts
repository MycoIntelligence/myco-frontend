import { createServerClient } from "@supabase/ssr";
import { createAdminClient, createContextClient } from "@supabase/server/core";
import { cookies } from "next/headers";
import { authCookieOptions, getSupabaseConfig } from "./config";

type WebsiteCustomerRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  trial_requested_at: string | null;
};

type WebsiteCustomerDatabase = {
  public: {
    Tables: {
      website_customer_data: {
        Row: WebsiteCustomerRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      request_website_customer_trial: { Args: Record<never, never>; Returns: undefined };
      website_direct_signup_status: { Args: { contact_email: string }; Returns: "ready" | "exists" };
    };
  };
};

export function hasSupabaseAuthCookie(cookieStore: Pick<Awaited<ReturnType<typeof cookies>>, "getAll">) {
  return cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

export async function createSupabaseServerClient({ readOnly = false } = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Middleware updates session cookies before Server Components render.
        if (readOnly) return;
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

export function createWebsiteSignupAdmin() {
  const config = getSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!config || !secretKey) return null;

  return createAdminClient<WebsiteCustomerDatabase>({
    env: { url: config.url, secretKeys: { default: secretKey } },
  });
}

export async function getWebsiteCustomerSession({ readOnly = false } = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  if (!hasSupabaseAuthCookie(cookieStore)) return null;

  const authClient = createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        if (readOnly) return;
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const { data: { session } } = await authClient.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  let user = null;
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  const claims = claimsData?.claims as {
    sub?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } | undefined;

  if (!claimsError && claims?.sub) {
    user = {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : session.user?.email,
      user_metadata: claims.user_metadata ?? session.user?.user_metadata ?? {},
      app_metadata: claims.app_metadata ?? session.user?.app_metadata ?? {},
    };
  } else {
    const { data: userData, error } = await authClient.auth.getUser(token);
    if (error || !userData.user) return null;
    user = userData.user;
  }

  const supabase = createContextClient<WebsiteCustomerDatabase>({
    auth: { token },
    env: { url: config.url, publishableKeys: { default: config.key } },
  });
  return { user, supabase };
}

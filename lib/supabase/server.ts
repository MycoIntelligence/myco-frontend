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
  const authClient = await createSupabaseServerClient({ readOnly });
  if (!config || !authClient) return null;

  const { data: { session } } = await authClient.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createContextClient<WebsiteCustomerDatabase>({
    auth: { token },
    env: { url: config.url, publishableKeys: { default: config.key } },
  });
  return { user, supabase };
}

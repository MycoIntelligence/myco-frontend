import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { afterWebsiteAuth, getAccountIntent } from "@/lib/account-paths";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient, hasSupabaseAuthCookie } from "@/lib/supabase/server";
import { AccountPage } from "./account-page";
import { AuthForm } from "./auth-form";
import { CredentialsFrame } from "./credentials-frame";

export type AccountPageProps = { searchParams: Promise<{ intent?: string | string[] }> };

export async function CredentialsPage({ mode, searchParams }: AccountPageProps & { mode: "login" | "signup" }) {
  const intent = getAccountIntent((await searchParams).intent);
  if (!getSupabaseConfig()) return <AccountPage mode={mode} />;

  const cookieStore = await cookies();
  if (hasSupabaseAuthCookie(cookieStore)) {
    const supabase = await createSupabaseServerClient({ readOnly: true });
    if (supabase) {
      const { data, error } = await supabase.auth.getClaims();
      if (!error && data?.claims?.sub) redirect(afterWebsiteAuth(intent));
    }
  }

  return (
    <CredentialsFrame>
      <AuthForm mode={mode} intent={intent} configured />
    </CredentialsFrame>
  );
}

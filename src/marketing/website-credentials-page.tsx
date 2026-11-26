import { redirect } from "next/navigation";
import { afterWebsiteAuth, getAccountIntent } from "@/lib/account-paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountPage } from "./account-page";
import { AuthForm } from "./auth-form";
import { CredentialsFrame } from "./credentials-frame";

export type AccountPageProps = { searchParams: Promise<{ intent?: string | string[] }> };

export async function CredentialsPage({ mode, searchParams }: AccountPageProps & { mode: "login" | "signup" }) {
  const intent = getAccountIntent((await searchParams).intent);
  const supabase = await createSupabaseServerClient({ readOnly: true });
  if (!supabase) return <AccountPage mode={mode} />;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(afterWebsiteAuth(intent));

  return (
    <CredentialsFrame>
      <AuthForm mode={mode} intent={intent} configured />
    </CredentialsFrame>
  );
}

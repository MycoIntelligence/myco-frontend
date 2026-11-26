import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { AccountFrame } from "@/src/marketing/account-frame";
import { ConfirmEmailForm } from "@/src/marketing/auth-form";
import styles from "@/src/marketing/account.module.css";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ConfirmPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; code?: string | string[] }>;
}) {
  const { token_hash: token, code } = await searchParams;
  const validToken = typeof token === "string" && token.length > 0 && token.length <= 512;
  const validCode = typeof code === "string" && code.length > 0 && code.length <= 512;
  const credential = validToken && !validCode ? { token } : validCode && !validToken ? { code } : null;

  return (
    <AccountFrame>
      <h1 id="account-heading">Confirm your email</h1>
      <p className={styles.intro}>
        {credential ? "Confirm this email address to finish setting up your Myco account."
          : "This confirmation link is incomplete. Open the link from your email to continue."}
      </p>
      {credential && <ConfirmEmailForm {...credential} configured={Boolean(getSupabaseConfig())} />}
      <p className={styles.switch}><Link href="/login">Back to sign in</Link></p>
    </AccountFrame>
  );
}

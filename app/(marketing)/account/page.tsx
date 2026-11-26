import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";
import { AccountFrame } from "@/src/marketing/account-frame";
import { TrialRequestButton } from "@/src/marketing/trial-request";
import styles from "@/src/marketing/account.module.css";
import { signOut } from "../auth/actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const session = await getWebsiteCustomerSession({ readOnly: true });
  if (!session) redirect("/login");
  const { user, supabase } = session;

  const { data: profile, error } = await supabase.from("website_customer_data")
    .select("full_name, email").eq("user_id", user.id).maybeSingle();

  const fullName = profile?.full_name ?? user.user_metadata.full_name;
  const metadataEmail = user.user_metadata.myco_contact_email;
  const contactEmail = user.app_metadata.myco_website_password_account === true
    ? (profile?.email && !profile.email.endsWith("@myco-website.invalid") ? profile.email
      : typeof metadataEmail === "string" ? metadataEmail : null)
    : profile?.email ?? user.email;

  return (
    <AccountFrame>
      <h1 id="account-heading">Your account</h1>
      <p className={styles.intro}>You’re signed in to Myco.</p>
      {(contactEmail || (typeof fullName === "string" && fullName.trim())) && (
        <dl className={styles.details}>
          {typeof fullName === "string" && fullName.trim() && <><dt>Full name</dt><dd>{fullName}</dd></>}
          {contactEmail && <><dt>Email address</dt><dd>{contactEmail}</dd></>}
        </dl>
      )}
      {error && <p className={styles.error} role="alert">We couldn’t load your profile. Refresh the page to try again.</p>}
      <TrialRequestButton className={styles.button} />
      <form action={signOut} className={styles.switch}>
        <button className={styles.textButton}>Sign out</button>
      </form>
    </AccountFrame>
  );
}

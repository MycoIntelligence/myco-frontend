import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";
import { AccountFrame } from "@/src/marketing/account-frame";
import { SignOutForm } from "@/src/marketing/auth-form";
import { TrialRequestButton } from "@/src/marketing/trial-request";
import styles from "@/src/marketing/account.module.css";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const session = await getWebsiteCustomerSession({ readOnly: true });
  if (!session) redirect("/login");
  const { user, supabase } = session;

  const claimsFullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const metadataEmail = typeof user.user_metadata?.myco_contact_email === "string"
    ? user.user_metadata.myco_contact_email.trim()
    : "";
  const claimsContactEmail = user.app_metadata?.myco_website_password_account === true
    ? metadataEmail || null
    : (typeof user.email === "string" && !user.email.endsWith("@myco-website.invalid") ? user.email : null);

  let fullName: string | null | undefined = claimsFullName || undefined;
  let contactEmail: string | null | undefined = claimsContactEmail;
  let profileError = false;

  if (!fullName || !contactEmail) {
    const { data: profile, error } = await supabase.from("website_customer_data")
      .select("full_name, email").eq("user_id", user.id).maybeSingle();
    if (error) profileError = true;
    fullName = profile?.full_name ?? fullName;
    contactEmail = user.app_metadata?.myco_website_password_account === true
      ? (profile?.email && !profile.email.endsWith("@myco-website.invalid") ? profile.email : contactEmail)
      : profile?.email ?? contactEmail ?? user.email;
  }

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
      {profileError && <p className={styles.error} role="alert">We couldn’t load your profile. Refresh the page to try again.</p>}
      <TrialRequestButton className={styles.button} />
      <SignOutForm />
    </AccountFrame>
  );
}

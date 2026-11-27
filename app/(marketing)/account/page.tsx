import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";
import { SignOutForm } from "@/src/marketing/auth-form";
import { CredentialsFrame } from "@/src/marketing/credentials-frame";
import { PilotLink } from "@/src/marketing/home-sections";
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

  const name = typeof fullName === "string" ? fullName.trim() : "";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => Array.from(part)[0]).join("").toUpperCase()
    || contactEmail?.charAt(0).toUpperCase();

  return (
    <CredentialsFrame>
      <h1 id="account-heading">Your account</h1>
      {(name || contactEmail) && (
        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <div className={styles.profileIdentity}>
            {name && <strong>{name}</strong>}
            {contactEmail && <span>{contactEmail}</span>}
          </div>
        </div>
      )}
      {profileError && <p className={styles.error} role="alert">We couldn’t load your profile. Refresh the page to try again.</p>}
      <PilotLink />
      <SignOutForm />
    </CredentialsFrame>
  );
}

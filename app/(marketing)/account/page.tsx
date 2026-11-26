import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebsiteCustomerSession } from "@/lib/supabase/server";
import { CredentialsFrame } from "@/src/marketing/credentials-frame";
import { PilotLink } from "@/src/marketing/home-sections";
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
      {error && <p className={styles.error} role="alert">We couldn’t load your profile. Refresh the page to try again.</p>}
      <PilotLink />
      <form action={signOut} className={styles.profileSignOut}>
        <button className={styles.textButton}>Sign out</button>
      </form>
    </CredentialsFrame>
  );
}

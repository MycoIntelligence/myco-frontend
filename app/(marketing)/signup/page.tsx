import type { Metadata } from "next";
import { CredentialsPage, type AccountPageProps } from "@/src/marketing/website-credentials-page";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default function SignupPage(props: AccountPageProps) {
  return <CredentialsPage mode="signup" {...props} />;
}

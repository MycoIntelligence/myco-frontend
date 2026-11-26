import type { Metadata } from "next";
import { CredentialsPage, type AccountPageProps } from "@/src/marketing/website-credentials-page";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage(props: AccountPageProps) {
  return <CredentialsPage mode="login" {...props} />;
}

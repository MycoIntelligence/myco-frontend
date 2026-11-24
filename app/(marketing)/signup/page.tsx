import { AccountPage } from "@/src/marketing/account-page";

export const metadata = { title: "Sign up", robots: { index: false } };

export default function SignupPage() {
  return <AccountPage mode="signup" />;
}

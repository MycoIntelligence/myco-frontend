import { AccountPage } from "@/src/marketing/account-page";

export const metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return <AccountPage mode="login" />;
}

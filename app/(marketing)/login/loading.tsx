import { CredentialsFrame } from "@/src/marketing/credentials-frame";
import styles from "@/src/marketing/account.module.css";

export default function LoginLoading() {
  return (
    <CredentialsFrame>
      <h1 id="account-heading">Sign in to Myco</h1>
      <p className={styles.intro}>Loading sign in…</p>
    </CredentialsFrame>
  );
}

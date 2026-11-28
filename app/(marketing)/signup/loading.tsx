import { CredentialsFrame } from "@/src/marketing/credentials-frame";
import styles from "@/src/marketing/account.module.css";

export default function SignupLoading() {
  return (
    <CredentialsFrame>
      <h1 id="account-heading">Create your account</h1>
      <p className={styles.intro}>Loading account setup…</p>
    </CredentialsFrame>
  );
}

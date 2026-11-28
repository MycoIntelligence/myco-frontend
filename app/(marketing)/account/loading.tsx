import { AccountFrame } from "@/src/marketing/account-frame";
import styles from "@/src/marketing/account.module.css";

export default function AccountLoading() {
  return (
    <AccountFrame>
      <h1 id="account-heading">Your account</h1>
      <p className={styles.intro}>Loading your profile…</p>
    </AccountFrame>
  );
}

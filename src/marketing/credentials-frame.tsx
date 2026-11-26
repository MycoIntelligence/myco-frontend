import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./account.module.css";
import { DitherFlow } from "./dither-flow";

export function CredentialsFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.signup}>
      <header className={styles.signupHeader}>
        <Link className="brand" href="/" aria-label="Myco home">
          <img src="/marketing/myco-mark.png" alt="" />myco
        </Link>
      </header>
      <DitherFlow className={styles.signupBackground}>
        <main className={styles.signupLayout}>
          <section className={`${styles.card} ${styles.signupCard}`} aria-labelledby="account-heading">
            {children}
          </section>
        </main>
      </DitherFlow>
    </div>
  );
}

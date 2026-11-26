import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./account.module.css";
import { SignupWave } from "./signup-wave";

export function CredentialsFrame({ children }: { children: ReactNode }) {
  return (
    <main className={styles.signup}>
      <SignupWave className={styles.signupWave} />
      <div className={styles.signupLayout}>
        <div className={styles.signupBrand}>
          <Link className={styles.signupLogo} href="/" aria-label="Myco home">
            <Image src="/marketing/myco-mark.png" alt="" width={29} height={30} unoptimized />
            MYCO
          </Link>
          <div className={styles.signupPitch}>
            <p className={styles.signupHeadline}>Review code<br /> with clarity<span>.</span></p>
            <p className={styles.signupDescription}>A smarter way to ship secure, reliable software.</p>
          </div>
        </div>
        <section className={`${styles.card} ${styles.signupCard}`} aria-labelledby="account-heading">
          {children}
        </section>
      </div>
    </main>
  );
}

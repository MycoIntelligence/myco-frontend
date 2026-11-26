import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { DitherFlow } from "./dither-flow";
import styles from "./account.module.css";

export function AccountFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className="brand" href="/" aria-label="Myco home">
            <img src="/marketing/myco-mark.png" alt="" />myco
          </Link>
          <Link className={styles.back} href="/">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Myco
          </Link>
        </div>
      </header>
      <DitherFlow className={styles.background}>
        <main className={styles.main}>
          <section className={styles.card} aria-labelledby="account-heading">{children}</section>
        </main>
      </DitherFlow>
    </>
  );
}

import Link from "next/link";
import { siteContent } from "@/lib/content";
import { PilotLink, SiteHeader } from "./home-sections";
import "./account-page.css";

export function AccountPage({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const appUrl = siteContent.brand.appUrl.replace(/\/+$/, "");

  return (
    <>
      <SiteHeader accountPage />
      <main className="account-page">
        <section className="account-card" aria-labelledby="account-title">
          <h1 id="account-title">{isLogin ? "Log in to Myco" : "Sign up for Myco"}</h1>
          <p>{isLogin ? "Use your GitHub account to access Myco." : "Request access to try Myco free for 14 days."}</p>
          {isLogin ? (
            <a className="nav-pilot account-continue" href={appUrl + "/login"}>
              <img src="/marketing/github.png" alt="" />
              Continue with GitHub
            </a>
          ) : (
            <PilotLink />
          )}
          <p className="account-switch">
            {isLogin ? <>New to Myco? <Link href="/signup/">Sign up</Link></> : <>Already have an account? <Link href="/login/">Log in</Link></>}
          </p>
        </section>
      </main>
    </>
  );
}

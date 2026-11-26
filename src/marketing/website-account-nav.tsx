"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useWebsiteSession } from "./website-session";

export function WebsiteAccountNav() {
  const profile = useWebsiteSession();

  if (profile === undefined) return <span className="nav-account-placeholder" aria-hidden="true" />;
  if (!profile) return <Link className="nav-sign-in" href="/login">Sign in</Link>;

  const firstName = profile.name.split(/\s+/)[0];
  return (
    <Link className="nav-sign-in nav-profile" href="/account" aria-label={profile.name ? `${profile.name} profile` : "Your profile"}>
      <span className="nav-profile-avatar" aria-hidden="true">
        {firstName ? Array.from(firstName)[0].toLocaleUpperCase() : <UserRound size={16} />}
      </span>
      <span className="nav-profile-name">{firstName || "Profile"}</span>
    </Link>
  );
}

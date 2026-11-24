"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Profile = { name: string };

const WebsiteSessionContext = createContext<Profile | null | undefined>(undefined);

export function WebsiteSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>();
  const pathname = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/website-session", { cache: "no-store", signal: controller.signal });
        const result = response.ok ? await response.json() : { profile: null };
        if (!controller.signal.aborted) setProfile(result.profile);
      } catch {
        if (!controller.signal.aborted) setProfile(null);
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  return (
    <WebsiteSessionContext.Provider value={profile}>
      {children}
    </WebsiteSessionContext.Provider>
  );
}

export function useWebsiteSession() {
  return useContext(WebsiteSessionContext);
}

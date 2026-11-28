"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type WebsiteProfile = { name: string };

const SESSION_CACHE_KEY = "myco.websiteSession.v1";
const SESSION_CACHE_TTL_MS = 60_000;
const FOCUS_REFRESH_COOLDOWN_MS = 30_000;
const SESSION_EVENT = "myco:website-session";

const WebsiteSessionContext = createContext<WebsiteProfile | null | undefined>(undefined);

function readCachedProfile(): { profile: WebsiteProfile | null; fresh: boolean } | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { profile?: WebsiteProfile | null; ts?: number };
    if (typeof parsed.ts !== "number" || !("profile" in parsed)) return undefined;
    return {
      profile: parsed.profile ?? null,
      fresh: Date.now() - parsed.ts < SESSION_CACHE_TTL_MS,
    };
  } catch {
    return undefined;
  }
}

function writeCachedProfile(profile: WebsiteProfile | null) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ profile, ts: Date.now() }));
  } catch {}
}

export function clearWebsiteSessionCache() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { refresh: true } }));
}

export function setWebsiteSessionProfile(profile: WebsiteProfile | null) {
  writeCachedProfile(profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { profile } }));
  }
}

function isAuthRoute(pathname: string | null) {
  return pathname === "/login" || pathname === "/signup" || pathname === "/account" || pathname?.startsWith("/auth/");
}

export function WebsiteSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<WebsiteProfile | null | undefined>(undefined);
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(pathname);
  const lastFetchedRef = useRef<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readCachedProfile();
    if (cached) {
      setProfile(cached.profile);
    }

    async function refresh(force = false) {
      const now = Date.now();
      if (!force && lastFetchedRef.current && now - lastFetchedRef.current < FOCUS_REFRESH_COOLDOWN_MS) {
        return;
      }
      lastFetchedRef.current = now;
      try {
        const response = await fetch("/api/website-session", { cache: "no-store", signal: controller.signal });
        const result = response.ok ? await response.json() : { profile: null };
        const nextProfile = (result.profile ?? null) as WebsiteProfile | null;
        writeCachedProfile(nextProfile);
        if (!controller.signal.aborted) setProfile(nextProfile);
      } catch {
        if (!controller.signal.aborted) setProfile((prev) => prev ?? null);
      }
    }

    const comingFromAuth = isAuthRoute(prevPathRef.current) && prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    if (!cached?.fresh || comingFromAuth) {
      void refresh(comingFromAuth || !cached);
    }

    const onFocus = () => { void refresh(false); };
    const onSessionEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ profile?: WebsiteProfile | null; refresh?: boolean }>).detail;
      if (detail && "profile" in detail) {
        lastFetchedRef.current = Date.now();
        setProfile(detail.profile ?? null);
      } else {
        void refresh(true);
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener(SESSION_EVENT, onSessionEvent);
    return () => {
      controller.abort();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(SESSION_EVENT, onSessionEvent);
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

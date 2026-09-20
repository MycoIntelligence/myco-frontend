import React, { useEffect, useState } from "react";
import { nav } from "../mock";

import { useLeadModal } from "../context/LeadModalContext";


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#overview");
  const { open } = useLeadModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "rgba(239,238,234,0.86)" : "var(--bg)",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: "1px solid var(--border)",
        transition: "background .25s ease",
      }}
    >
      <div className="wrap" style={{ borderTop: "none", background: "transparent" }}>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 28px",
          }}
        >
          <a href="#overview" aria-label="Myco home" className="logo" style={{ textDecoration: "none" }} onClick={() => setActive("#overview")}>
            <img className="brand-icon" src="assets/myco-icon.svg" alt="" width="40" height="42" />
            <img className="brand-wordmark" src="assets/myco-wordmark.svg" alt="myco" width="90" height="30" />
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 30 }} className="nav-links">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setActive(l.href)}
                className="mono"
                style={{
                  fontSize: 13,
                  textDecoration: "none",
                  color: active === l.href ? "var(--accent)" : "var(--ink-soft)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "color .2s ease",
                }}
              >
                {active === l.href && (
                  <span style={{ width: 6, height: 6, borderRadius: 9, background: "var(--accent)" }} />
                )}
                {l.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={open} className="btn btn-primary">
              {nav.cta.label}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

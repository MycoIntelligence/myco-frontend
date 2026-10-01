import React, { useEffect, useState, useRef } from "react";
import { nav } from "../mock";

import { useLeadModal } from "../context/LeadModalContext";


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const { open } = useLeadModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    useEffect(() => {
    const closeOutside = event => { if (!navRef.current?.contains(event.target)) setMenuOpen(false); };
    const closeEscape = event => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); toggleRef.current?.focus(); } };
    const media = window.matchMedia("(max-width:900px)");
    const closeResize = () => setMenuOpen(false);
    document.addEventListener("click", closeOutside);
    document.addEventListener("keydown", closeEscape);
    media.addEventListener("change", closeResize);
    return () => { document.removeEventListener("click", closeOutside); document.removeEventListener("keydown", closeEscape); media.removeEventListener("change", closeResize); };
  }, [menuOpen]);
  useEffect(() => { if (menuOpen) navRef.current?.querySelector(".mobile-navigation a")?.focus(); }, [menuOpen]);

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
        <nav className="site-nav" ref={navRef}
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

          <div className="site-nav__actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button ref={toggleRef} className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><span aria-hidden="true"/><span aria-hidden="true"/></button>
            <button onClick={() => { setMenuOpen(false); open(); }} className="btn btn-primary">
              {nav.cta.label}
            </button>
          </div>
          <div id="mobile-navigation" className="mobile-navigation" hidden={!menuOpen}>
            {nav.links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href ? "location" : undefined} onClick={() => { setActive(link.href); setMenuOpen(false); }}>{link.label}</a>)}
          </div>
        </nav>
      </div>
    </div>
  );
}

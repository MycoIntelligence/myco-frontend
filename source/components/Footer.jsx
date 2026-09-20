import React from "react";
import Reveal from "./Reveal";
import { footer, nav } from "../mock";
import { useLeadModal } from "../context/LeadModalContext";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const { open } = useLeadModal();
  return (
    <div className="wrap" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "56px 34px", borderRight: "1px solid var(--border)" }}>
          <a href="#overview" aria-label="Myco home" className="logo" style={{ fontSize: 34 }}>
            <img className="brand-icon" src="assets/myco-icon.svg" alt="" width="40" height="42" />
            <img className="brand-wordmark" src="assets/myco-wordmark.svg" alt="myco" width="90" height="30" />
          </a>
          <p style={{ color: "var(--muted)", maxWidth: 320, marginTop: 16, fontSize: 15 }}>{footer.tagline}</p>
        </div>
        <div style={{ padding: "56px 34px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {nav.links.map((l) => (
              <a key={l.href} href={l.href} className="mono" style={{ fontSize: 13, textDecoration: "none", color: "var(--ink-soft)" }}>
                {l.label}
              </a>
            ))}
          </div>
          <button onClick={open} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            {footer.cta.label} <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
      <div style={{ padding: "20px 34px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{footer.copyright}</span>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>DEMO CLONE · MOCK DATA</span>
      </div>
    </div>
  );
}

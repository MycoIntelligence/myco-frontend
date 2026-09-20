import React from "react";
import Reveal from "./Reveal";
import { integration, workflow, LINKEDIN_URL } from "../mock";
import { Check, X, ArrowRight } from "lucide-react";

export default function Integration() {
  return (
    <div className="wrap" id="integrate">
      {/* Intro */}
      <div className="split-head" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "60px 34px", borderRight: "1px solid var(--border)" }}>
          <Reveal className="eyebrow">{integration.eyebrow}</Reveal>
          <Reveal delay={70}>
            <h2 className="display" style={{ fontSize: "clamp(32px, 3.6vw, 50px)", marginTop: 14 }}>
              {integration.titleLines.map((l, i) => (
                <span key={i} style={{ display: "block" }}>{l}</span>
              ))}
            </h2>
          </Reveal>
        </div>
        <div style={{ padding: "60px 34px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 30 }}>
          <Reveal style={{ color: "var(--ink-soft)", maxWidth: 420, fontSize: 16 }}>{integration.body}</Reveal>
          <Reveal className="mono" delay={90} style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12, color: "var(--muted)", letterSpacing: "0.06em" }}>
            {integration.path.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </Reveal>
        </div>
      </div>

      {/* Workflow + permissions */}
      <div className="wf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "52px 34px", borderRight: "1px solid var(--border)" }}>
          <Reveal className="eyebrow">{workflow.eyebrow}</Reveal>
          <Reveal delay={60}>
            <h3 className="display" style={{ fontSize: "clamp(26px, 2.6vw, 36px)", fontWeight: 700, marginTop: 14 }}>{workflow.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: 16, fontSize: 15, maxWidth: 420 }}>{workflow.body}</p>
          </Reveal>
          <div style={{ marginTop: 30 }}>
            {workflow.flow.map((f, i) => (
              <Reveal key={f.label} delay={80 + i * 70}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    border: `1px solid ${f.accent ? "var(--accent)" : "var(--border-strong)"}`,
                    background: f.accent ? "rgba(14,148,110,0.06)" : "var(--bg)",
                  }}
                >
                  <span className="mono" style={{ fontSize: 13, color: f.accent ? "var(--accent-dark)" : "var(--ink)" }}>{f.label}</span>
                  <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "var(--muted)" }}>{f.tag}</span>
                </div>
                {i < workflow.flow.length - 1 && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                    <ArrowRight size={14} style={{ transform: "rotate(90deg)", color: "var(--wire)" }} />
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>

        <div style={{ padding: "52px 34px", background: "var(--bg-soft)" }}>
          <Reveal className="mono" style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase" }}>
            {workflow.permissionTitle}
          </Reveal>
          <div style={{ marginTop: 22 }}>
            {workflow.permissions.map((p, i) => {
              const allow = p.state === "ALLOW";
              return (
                <Reveal
                  key={p.label}
                  delay={60 + i * 70}
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "18px 0", borderTop: "1px solid var(--border)" }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 3 }}>{p.note}</div>
                  </div>
                  <div
                    className="mono"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      padding: "5px 9px",
                      whiteSpace: "nowrap",
                      color: allow ? "var(--accent-dark)" : "#9A5B4A",
                      border: `1px solid ${allow ? "var(--accent)" : "#C99A8C"}`,
                      background: allow ? "rgba(14,148,110,0.07)" : "rgba(180,101,42,0.06)",
                    }}
                  >
                    {allow ? <Check size={12} /> : <X size={12} />}
                    {p.state}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

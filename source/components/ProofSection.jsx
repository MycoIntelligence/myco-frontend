import React from "react";
import Reveal from "./Reveal";
import { proof } from "../mock";

function CodeLine({ l }) {
  if (l.t === "blank") return <div style={{ height: 14 }} />;
  if (l.t === "comment")
    return <div style={{ color: "var(--muted)" }}>{l.text}</div>;
  if (l.t === "finding")
    return (
      <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 9, background: "var(--accent)" }} />
        {l.text}
      </div>
    );
  if (l.t === "result")
    return (
      <div style={{ color: "var(--ink)" }}>
        {l.text}
        <span style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }}>{l.link}</span>
      </div>
    );
  return (
    <div style={{ color: "var(--ink-soft)" }}>
      {l.pre}
      {l.code && <span style={{ color: "var(--accent-dark)" }}>{l.code}</span>}
      {l.req && <span style={{ color: "#B4652A" }}>{l.req}</span>}
      {l.post}
    </div>
  );
}

export default function ProofSection() {
  return (
    <div className="wrap">
      <div
        className="proof-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--panel-cool)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ padding: "64px 34px" }}>
          <Reveal className="eyebrow">{proof.eyebrow}</Reveal>
          <Reveal delay={80}>
            <h2 className="display" style={{ fontSize: "clamp(34px, 3.8vw, 54px)", marginTop: 26 }}>
              {proof.title}
            </h2>
          </Reveal>
        </div>
        <div style={{ padding: "40px 34px", display: "flex", alignItems: "center" }}>
          <Reveal
            delay={120}
            style={{
              width: "100%",
              background: "var(--bg)",
              border: "1px solid var(--border-strong)",
              padding: "22px 24px",
            }}
          >
            <div className="mono" style={{ fontSize: 13, lineHeight: 1.95 }}>
              {proof.code.map((l, i) => (
                <CodeLine key={i} l={l} />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

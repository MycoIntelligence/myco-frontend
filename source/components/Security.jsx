import React from "react";
import Reveal from "./Reveal";
import { security } from "../mock";
import { Shield } from "lucide-react";

export default function Security() {
  return (
    <div className="wrap" id="security">
      <div style={{ padding: "64px 34px 40px", borderTop: "1px solid var(--border)" }}>
        <Reveal className="eyebrow">{security.eyebrow}</Reveal>
        <div className="how-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 30, flexWrap: "wrap" }}>
          <Reveal>
            <h2 className="display" style={{ fontSize: "clamp(34px, 4vw, 56px)", marginTop: 14, maxWidth: 640 }}>{security.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <Shield size={40} strokeWidth={1.4} color="var(--accent)" />
          </Reveal>
        </div>
        <Reveal delay={120}>
          <p style={{ color: "var(--ink-soft)", maxWidth: 520, marginTop: 20, fontSize: 16 }}>{security.body}</p>
        </Reveal>
      </div>

      <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--border)" }}>
        {security.cards.map((c, i) => (
          <Reveal
            key={c.num}
            delay={i * 90}
            style={{
              padding: "30px 26px 56px",
              borderRight: i < security.cards.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div className="eyebrow">{c.num} · {c.tag}</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 40 }}>{c.title}</div>
            <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 14.5 }}>{c.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

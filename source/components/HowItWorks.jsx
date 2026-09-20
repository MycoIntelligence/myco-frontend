import React, { useState } from "react";
import Reveal from "./Reveal";
import { how } from "../mock";

export default function HowItWorks() {
  const [hover, setHover] = useState(null);
  return (
    <div className="wrap" id="how">
      {/* Header */}
      <div style={{ padding: "64px 34px 40px", borderTop: "1px solid var(--border)", position: "relative" }}>
        <Reveal className="eyebrow">{how.eyebrow}</Reveal>
        <div className="how-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 30, flexWrap: "wrap" }}>
          <Reveal>
            <h2 className="display" style={{ fontSize: "clamp(38px, 4.6vw, 66px)", marginTop: 12 }}>
              {how.titleLines.map((l, i) => (
                <span key={i} style={{ display: "block" }}>{l}</span>
              ))}
            </h2>
            <p style={{ color: "var(--ink-soft)", maxWidth: 360, marginTop: 18, fontSize: 15.5 }}>{how.body}</p>
          </Reveal>
        </div>
      </div>

      {/* Steps */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        {how.steps.map((s, i) => {
          const on = hover === i || (hover === null && s.accent);
          return (
            <Reveal
              key={s.num}
              delay={i * 60}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="how-row"
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 320px",
                alignItems: "center",
                gap: 20,
                padding: "30px 34px",
                borderBottom: "1px solid var(--border)",
                background: on ? "linear-gradient(90deg, rgba(14,148,110,0.06), rgba(14,148,110,0.02))" : "transparent",
                transition: "background .3s ease",
              }}
            >
              <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{s.num}</div>
              <div className="display" style={{ fontSize: "clamp(30px, 3.4vw, 46px)", fontWeight: 700, color: on ? "var(--accent-dark)" : "var(--ink)", transition: "color .3s ease" }}>
                {s.title}
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14.5 }}>{s.body}</p>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

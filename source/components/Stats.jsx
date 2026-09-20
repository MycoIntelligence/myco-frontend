import React from "react";
import Reveal from "./Reveal";
import { stats } from "../mock";

export default function Stats() {
  return (
    <div className="wrap">
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 90}
            style={{
              padding: "26px 34px",
              borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="display" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div className="eyebrow" style={{ marginTop: 8 }}>
              {s.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

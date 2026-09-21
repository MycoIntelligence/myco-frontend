import React from "react";
import Reveal from "./Reveal";
import { diff } from "../mock";

export default function DiffSection() {
  return (
    <div className="wrap">
      <div className="diff-centered-head" style={{ borderTop: "1px solid var(--border)" }}>
        <Reveal>
          <h2 className="display" style={{ fontSize: "clamp(34px, 3.6vw, 52px)" }}>
            {diff.title}
          </h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: 640, marginTop: 20, fontSize: 16 }}>{diff.body}</p>
        </Reveal>
      </div>

      {/* Cards */}
      <div className="four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)" }}>
        {diff.cards.map((c, i) => (
          <Reveal
            key={c.num}
            delay={i * 80}
            className="diff-card"
            style={{
              padding: "28px 24px 60px",
              borderRight: i < diff.cards.length - 1 ? "1px solid var(--border)" : "none",
              transition: "background .3s ease",
            }}
          >
            <div className="eyebrow">
              {c.num} · {c.tag}
            </div>
            <div className="display" style={{ fontSize: 21, fontWeight: 700, marginTop: 42, letterSpacing: "-0.01em" }}>
              {c.title}
            </div>
            <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 14.5 }}>{c.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

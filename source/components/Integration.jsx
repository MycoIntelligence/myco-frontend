import React from "react";
import Reveal from "./Reveal";
import { integration } from "../mock";
import IntegrationWorkflow from "./IntegrationWorkflow";

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

      <IntegrationWorkflow />
    </div>
  );
}

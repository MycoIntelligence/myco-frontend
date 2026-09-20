import React, { useState } from "react";
import { hero, graph } from "../mock";
import { useLeadModal } from "../context/LeadModalContext";
import { ArrowRight } from "lucide-react";

function pct(v, total) {
  return `${(v / total) * 100}%`;
}

function Node({ node, vb, onEnter, onLeave, dim }) {
  const isCore = node.kind === "core";
  const isSignal = node.kind === "signal";
  return (
    <div
      className="node-box"
      onMouseEnter={() => onEnter && onEnter(node.id)}
      onMouseLeave={() => onLeave && onLeave()}
      style={{
        position: "absolute",
        left: pct(node.x, vb.w),
        top: pct(node.y, vb.h),
        transform: "translate(-50%,-50%)",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: isCore ? "9px 14px" : "6px 11px",
        background: isSignal ? "var(--accent)" : "var(--bg)",
        border: `1px solid ${isCore || isSignal ? "var(--accent)" : "var(--border-strong)"}`,
        color: isSignal ? "#fff" : "var(--ink)",
        whiteSpace: "nowrap",
        animation: isCore ? "pulseBorder 3.2s ease-in-out infinite" : "none",
        opacity: dim ? 0.4 : 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9,
          background: isSignal ? "#fff" : "var(--accent)",
        }}
      />
      <span className="mono" style={{ fontSize: isCore ? 12 : 11, letterSpacing: "0.08em" }}>
        {node.label}
      </span>
    </div>
  );
}

export default function Hero() {
  const vb = graph.viewBox;
  const { open } = useLeadModal();
  const [hover, setHover] = useState(null);

  return (
    <section id="overview">
      <div className="wrap" style={{ borderTop: "none" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* Left */}
          <div
            style={{
              padding: "56px 34px 44px",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div className="eyebrow reveal in-view">{hero.eyebrow}</div>
            <h1 className="display" style={{ fontSize: "clamp(40px, 5vw, 66px)", margin: "20px 0 0" }}>
              {hero.titleLines.map((l, i) => (
                <span key={i} style={{ display: "block" }}>
                  {l}
                </span>
              ))}
            </h1>
            <p style={{ color: "var(--ink-soft)", maxWidth: 420, marginTop: 22, fontSize: 16 }}>
              {hero.body}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href={hero.primary.href} className="btn btn-primary">
                {hero.primary.label} <ArrowRight size={15} />
              </a>
              <button onClick={open} className="btn btn-outline">
                {hero.secondary.label}
              </button>
            </div>
          </div>

          {/* Right - interactive graph */}
          <div style={{ background: "var(--bg-soft)", padding: "22px 24px", position: "relative" }}>
            <div className="eyebrow" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>{hero.graphLabel}</span>
              <span style={{ color: "var(--accent-dark)" }}>{hover ? "HOVERING" : "HOVER A NODE"}</span>
            </div>
            <div style={{ position: "relative", width: "100%", aspectRatio: `${vb.w} / ${vb.h}` }}>
              <svg
                viewBox={`0 0 ${vb.w} ${vb.h}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                preserveAspectRatio="none"
              >
                {graph.edges.map((e, i) => {
                  const on = hover === e.to;
                  return (
                    <g key={e.to}>
                      <path
                        id={`edge-${e.to}`}
                        className={`edge edge-draw ${on ? "edge-hot" : ""}`}
                        d={e.d}
                        style={{ animationDelay: `${0.2 + i * 0.14}s` }}
                      />
                      <circle className="packet" r="3.2" style={{ opacity: hover && !on ? 0.25 : 1 }}>
                        <animateMotion dur={`${2.6 + i * 0.35}s`} begin={`${1.4 + i * 0.2}s`} repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                          <mpath href={`#edge-${e.to}`} />
                        </animateMotion>
                      </circle>
                      <text
                        className={`edge-label ${on ? "show" : ""}`}
                        x={e.mid.x}
                        y={e.mid.y}
                        textAnchor="middle"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {[graph.center, ...graph.nodes].map((n) => {
                const dim = hover && n.id !== "reasoning" && hover !== n.id;
                return (
                  <Node
                    key={n.id}
                    node={n}
                    vb={vb}
                    dim={dim}
                    onEnter={(id) => id !== "reasoning" && setHover(id)}
                    onLeave={() => setHover(null)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

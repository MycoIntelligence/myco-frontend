import React from "react";
import Reveal from "./Reveal";
import { contextEngine as ce } from "../mock";

// A schematic motion graphic: five context sources stream into the Myco
// reasoning engine, which emits a structured, evidence-backed report.
// Built as a single responsive SVG scene (viewBox 0 0 1160 620).

const INPUT_X = 60;
const INPUT_W = 236;
const INPUT_H = 66;
const ENGINE = { x: 580, y: 300, r: 62 };
const OUT_X = 820;
const OUT_W = 300;

function inputY(i) {
  const gap = 22;
  const total = ce.inputs.length * INPUT_H + (ce.inputs.length - 1) * gap;
  const startY = 310 - total / 2;
  return startY + i * (INPUT_H + gap);
}

export default function ContextEngine() {
  const bugsBaseY = 250;
  return (
    <div className="wrap">
      <div style={{ padding: "64px 34px 30px", borderTop: "1px solid var(--border)" }}>
        <Reveal className="eyebrow">{ce.eyebrow}</Reveal>
        <Reveal>
          <h2 className="display" style={{ fontSize: "clamp(32px, 3.8vw, 52px)", marginTop: 12, maxWidth: 760 }}>{ce.title}</h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: 620, marginTop: 18, fontSize: 16 }}>{ce.body}</p>
        </Reveal>
      </div>

      <Reveal style={{ padding: "12px 20px 56px" }}>
        <div style={{ width: "100%", aspectRatio: "1160 / 620" }}>
          <svg className="ce-svg" viewBox="0 0 1160 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {/* wires from inputs to engine */}
            {ce.inputs.map((inp, i) => {
              const y = inputY(i) + INPUT_H / 2;
              const sx = INPUT_X + INPUT_W;
              const d = `M${sx} ${y} C ${sx + 120} ${y}, ${ENGINE.x - 150} ${ENGINE.y}, ${ENGINE.x - ENGINE.r} ${ENGINE.y}`;
              return (
                <g key={inp.id}>
                  <path className="ce-wire" d={d} />
                  <path className="ce-wire-flow" d={d} style={{ animationDelay: `${i * 0.18}s` }} />
                  <circle className="ce-packet" r="3.4" id={`ce-p-${inp.id}`}>
                    <animateMotion dur={`${2.2 + i * 0.25}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {/* wire engine -> output */}
            {(() => {
              const d = `M${ENGINE.x + ENGINE.r} ${ENGINE.y} C ${ENGINE.x + 130} ${ENGINE.y}, ${OUT_X - 90} ${300}, ${OUT_X} ${300}`;
              return (
                <g>
                  <path className="ce-wire" d={d} />
                  <path className="ce-wire-flow" d={d} />
                  <circle className="ce-packet" r="4">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })()}

            {/* input boxes */}
            {ce.inputs.map((inp, i) => {
              const y = inputY(i);
              return (
                <g key={`b-${inp.id}`} className="ce-input-box" style={{ animationDelay: `${i * 0.5}s` }}>
                  <rect x={INPUT_X} y={y} width={INPUT_W} height={INPUT_H} fill="var(--panel)" stroke="var(--border-strong)" />
                  <rect x={INPUT_X} y={y} width="4" height={INPUT_H} fill="var(--accent)" />
                  <circle cx={INPUT_X + 24} cy={y + INPUT_H / 2} r="5" fill="var(--accent)" />
                  <text x={INPUT_X + 42} y={y + 27} fontSize="13" letterSpacing="0.08em" fill="var(--ink)">{inp.label}</text>
                  <text x={INPUT_X + 42} y={y + 46} fontSize="11" fill="var(--muted)">{inp.sub}</text>
                </g>
              );
            })}

            {/* engine */}
            <g>
              <circle className="ce-ring" cx={ENGINE.x} cy={ENGINE.y} fill="none" stroke="var(--accent)" strokeWidth="1" />
              <circle className="ce-core" cx={ENGINE.x} cy={ENGINE.y} r={ENGINE.r + 14} fill="var(--accent)" />
              <polygon
                points={hexPoints(ENGINE.x, ENGINE.y, ENGINE.r)}
                fill="var(--bg)"
                stroke="var(--accent)"
                strokeWidth="1.6"
              />
              <text x={ENGINE.x} y={ENGINE.y - 2} fontSize="13" textAnchor="middle" letterSpacing="0.06em" fill="var(--ink)">{ce.engine.title}</text>
              <text x={ENGINE.x} y={ENGINE.y + 18} fontSize="10.5" textAnchor="middle" letterSpacing="0.14em" fill="var(--accent-dark)">{ce.engine.sub}</text>
            </g>

            {/* output panel */}
            <g>
              <rect x={OUT_X} y="90" width={OUT_W} height="440" fill="var(--panel)" stroke="var(--border-strong)" />
              <text x={OUT_X + 22} y="126" fontSize="11" letterSpacing="0.14em" fill="var(--muted)">{ce.output.header}</text>

              <g className="ce-out-row" style={{ animationDelay: "0.2s" }}>
                <circle cx={OUT_X + 27} cy="168" r="5" fill="var(--accent)" />
                <text x={OUT_X + 42} y="172" fontSize="13" fill="var(--ink)">{ce.output.findingsLabel}</text>
              </g>

              <text x={OUT_X + 22} y="216" fontSize="10.5" letterSpacing="0.12em" fill="var(--muted)">{ce.output.bugsLabel}</text>
              {ce.output.bugs.map((b, i) => (
                <g key={b.sev} className="ce-out-row" style={{ animationDelay: `${0.6 + i * 0.4}s` }}>
                  <rect x={OUT_X + 22} y={bugsBaseY - 14 + i * 40} width="34" height="20" fill="none" stroke={sevColor(b.sev)} />
                  <text x={OUT_X + 39} y={bugsBaseY + i * 40} fontSize="11" textAnchor="middle" fill={sevColor(b.sev)}>{b.sev}</text>
                  <text x={OUT_X + 66} y={bugsBaseY + i * 40} fontSize="11.5" fill="var(--ink)">{clip(b.text, 30)}</text>
                </g>
              ))}

              <text x={OUT_X + 22} y="400" fontSize="10.5" letterSpacing="0.12em" fill="var(--muted)">{ce.output.suggestionsLabel}</text>
              {ce.output.suggestions.map((s, i) => (
                <g key={i} className="ce-out-row" style={{ animationDelay: `${2.0 + i * 0.4}s` }}>
                  <text x={OUT_X + 22} y={430 + i * 34} fontSize="11" fill="var(--verify)">+</text>
                  <text x={OUT_X + 36} y={430 + i * 34} fontSize="11.5" fill="var(--ink-soft)">{clip(s, 32)}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </Reveal>
    </div>
  );
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}
function sevColor(s) {
  if (s === "P0") return "#C0553C";
  if (s === "P1") return "#B4832A";
  return "var(--accent-dark)";
}
function clip(t, n) {
  return t.length > n ? t.slice(0, n - 1) + "\u2026" : t;
}

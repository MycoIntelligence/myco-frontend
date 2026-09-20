import React, { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { feed } from "../mock";
import { FileCode2 } from "lucide-react";

export default function FindingsFeed() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % feed.items.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="wrap">
      <div className="feed-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", borderTop: "1px solid var(--border)" }}>
        <div style={{ padding: "48px 34px", borderRight: "1px solid var(--border)" }}>
          <Reveal className="eyebrow">{feed.eyebrow}</Reveal>
          <Reveal>
            <h3 className="display" style={{ fontSize: "clamp(26px, 2.6vw, 36px)", fontWeight: 700, marginTop: 12 }}>{feed.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: 14, fontSize: 14.5, maxWidth: 260 }}>{feed.sub}</p>
          </Reveal>
          <div style={{ marginTop: 26, display: "flex", gap: 6 }}>
            {feed.items.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, background: i === active ? "var(--accent)" : "var(--border-strong)", transition: "background .3s ease" }} />
            ))}
          </div>
        </div>

        <div style={{ padding: "28px 22px" }}>
          {feed.items.map((it, i) => (
            <Reveal
              key={it.file}
              delay={i * 60}
              className={`feed-row ${i === active ? "active" : ""}`}
              style={{
                display: "grid",
                gridTemplateColumns: "48px 1fr auto",
                alignItems: "center",
                gap: 16,
                padding: "16px 18px",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${i === active ? "var(--accent)" : "var(--border)"}`,
                marginBottom: 10,
              }}
            >
              <span className={`sev-chip sev-${it.sev}`}>{it.sev}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--muted)" }}>
                  <FileCode2 size={13} />
                  <span className="mono" style={{ fontSize: 12 }}>{it.file}</span>
                </div>
                <div style={{ fontSize: 14.5, color: "var(--ink)", marginTop: 4 }}>{it.msg}</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--accent-dark)", whiteSpace: "nowrap" }}>{it.req}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

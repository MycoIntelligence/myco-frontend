import React, { useEffect, useRef, useState } from "react";

const metrics = typeof window === "undefined" ? [] : window.MYCO_PROOF_METRICS || [];

function Count({ metric, active }) {
  const [value, setValue] = useState(metric.value);

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const started = performance.now();
    let frame;
    const animate = (now) => {
      const progress = Math.min((now - started) / 720, 1);
      setValue(Math.round(metric.value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active, metric.value]);

  return <div className="proof-metric__number" aria-hidden="true">{`${value.toLocaleString("en-US")}${metric.suffix}`}</div>;
}

export default function Stats() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.24 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="wrap">
      <section ref={ref} className={`proof-metrics ${visible ? "is-visible" : ""}`} aria-label="Myco proof points">
        <div className="proof-metrics__grid">
          {metrics.map((metric, index) => (
            <article className="proof-metric" style={{ "--metric-delay": `${index * 95}ms` }} key={metric.label}>
              <span className="proof-metric__marker" aria-hidden="true" />
              <Count metric={metric} active={visible} />
              <span className="sr-only">{`${metric.value.toLocaleString("en-US")}${metric.suffix} ${metric.label}. ${metric.detail}.`}</span>
              <p className="proof-metric__label">{metric.label}</p>
              <p className="proof-metric__detail">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

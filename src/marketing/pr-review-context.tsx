"use client";

import Image from "next/image";
import { FileCode, GitPullRequest, ListChecks, NotebookPen, Workflow } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import "./pr-review-context.css";

const sources = [
  {
    label: "Pull request",
    summary: "Apply discount at checkout",
    evidence: "The PR adds a discount before the customer is charged.",
    icon: GitPullRequest,
    path: "M0 33 C67 33 75 185 156 185",
  },
  {
    label: "Codebase",
    summary: "Receipt and payment logic",
    evidence: "The payment uses the discounted amount. Line 40 still returns the subtotal.",
    icon: FileCode,
    path: "M0 109 C67 109 85 185 156 185",
  },
  {
    label: "Meeting notes",
    summary: "Checkout decisions",
    evidence: "The team agreed that the receipt should show what the customer paid.",
    icon: NotebookPen,
    path: "M0 185 H156",
  },
  {
    label: "Requirements",
    summary: "CHECKOUT-17 · Receipt total",
    evidence: "The receipt total must match the amount charged.",
    icon: ListChecks,
    path: "M0 261 C67 261 85 185 156 185",
  },
  {
    label: "Dependencies",
    summary: "Payment service",
    evidence: "The checkout passes $85 to the payment service. The mismatch is in the receipt.",
    icon: Workflow,
    path: "M0 337 C67 337 75 185 156 185",
  },
];

export function PRReviewContext() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const active = sources[activeIndex];

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => {
      setActiveIndex((index) => (index + 1) % sources.length);
    }, 2300);
    return () => clearTimeout(timer);
  }, [activeIndex, reducedMotion]);

  return (
    <section className="pr-context" aria-labelledby="pr-context-title">
      <h2 id="pr-context-title">From context to a PR finding</h2>
      <p className="mc-intro">See what Myco checks before it leaves a comment.</p>
      <div className="mc-workflow">
        <div className="mc-inputs" role="group" aria-label="Context sources">
          {sources.map(({ label, summary, icon: Icon }, index) => (
            <button
              key={label}
              className="mc-input"
              type="button"
              aria-pressed={index === activeIndex}
              aria-controls="pr-context-evidence"
              onClick={() => setActiveIndex(index)}
            >
              <span className="mc-source-icon"><Icon aria-hidden="true" /></span>
              <span><strong>{label}</strong><small>{summary}</small></span>
            </button>
          ))}
        </div>

        <div className="mc-flow" aria-hidden="true">
          <svg viewBox="0 0 240 370" preserveAspectRatio="none">
            {sources.map(({ label, path }, index) => (
              <path key={label} className="mc-connection" data-active={index === activeIndex} d={path} />
            ))}
            <path className="mc-result-line" d="M156 185 H240" />
            <path key={active.label} className="mc-pulse" pathLength="100" d={active.path} />
          </svg>
          <div className="mc-logo">
            <Image src="/marketing/myco-mark.png" alt="" width={35} height={37} />
          </div>
        </div>

        <article className="mc-review" aria-labelledby="pr-context-finding">
          <div className="mc-pr">
            <div><span className="mc-open">Open</span><strong>Apply discount at checkout</strong><small>#214</small></div>
            <p>Checkout API <span>·</span> Illustrative review</p>
          </div>
          <div className="mc-finding">
            <span className="mc-finding-label">Confirmed finding</span>
            <h3 id="pr-context-finding">Receipt shows the pre-discount total</h3>
            <p>The payment is $85 after discount, but the receipt shows $100.</p>
          </div>
          <div className="mc-diff">
            <div><code>src/checkout/receipt.ts</code></div>
            <pre>
              <span>39</span> <code>await charge(paid);</code>{"\n"}
              <mark><span>40</span> <code>{"return { total: subtotal };"}</code></mark>
            </pre>
          </div>
          <p className="mc-evidence" id="pr-context-evidence">
            <strong>{active.label}</strong>{active.evidence}
          </p>
        </article>
      </div>
    </section>
  );
}

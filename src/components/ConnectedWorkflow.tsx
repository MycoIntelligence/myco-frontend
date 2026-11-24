"use client";

import React, { useState, useRef, useEffect, useId, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { FileText, ArrowRight, ArrowUpRight } from "lucide-react";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  repeat?: number;
  repeatDelay?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 6,
  delay = 0,
  pathColor = "#92a99d",
  pathWidth = 2,
  pathOpacity = 0.25,
  gradientStartColor = "#7ab49d",
  gradientStopColor = "#39756d",
  repeat = Infinity,
  repeatDelay = 0,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      };

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const fromRect = fromRef.current.getBoundingClientRect();
        const toRect = toRef.current.getBoundingClientRect();

        setSvgDimensions({
          width: containerRect.width,
          height: containerRect.height,
        });

        const startX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
        const endX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
        const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

        const controlY = (startY + endY) / 2 - curvature;
        const controlX = (startX + endX) / 2;

        setPathD(`M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (fromRef.current) resizeObserver.observe(fromRef.current);
    if (toRef.current) resizeObserver.observe(toRef.current);

    window.addEventListener("resize", updatePath);
    updatePath();
    const t1 = setTimeout(updatePath, 50);
    const t2 = setTimeout(updatePath, 250);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePath);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute top-0 left-0 transform-gpu stroke-2 ${className || ""}`}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat,
            repeatDelay,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

interface LifecycleStage {
  num: string;
  title: string;
  status: string;
  tag: string;
  body: string;
  preview: string;
}

const lifecycleStages: LifecycleStage[] = [
  {
    num: "01",
    title: "Requirements review",
    status: "Roadmap",
    tag: "REQUIREMENTS",
    body: "Help teams clarify intent, acceptance criteria and risks before implementation begins.",
    preview: "Clarify acceptance criteria & edge cases before code is written",
  },
  {
    num: "02",
    title: "Local development",
    status: "Roadmap",
    tag: "LOCAL FEEDBACK",
    body: "Bring feedback on requirements and local code into the development workflow.",
    preview: "Review proposed fix in local editor while change is fresh",
  },
  {
    num: "03",
    title: "Pull request review",
    status: "Live foundation",
    tag: "LIVE FOUNDATION",
    body: "Review changes against available requirements and authorized surrounding code in GitHub.",
    preview: "PR #4827 · Contextual review against AGENT-12 requirements",
  },
  {
    num: "04",
    title: "Testing and PR sign-off",
    status: "Confirm availability",
    tag: "VALIDATION",
    body: "Support coverage analysis, relevant checks and failure investigation as capabilities become available.",
    preview: "Behavioral test scenarios & failure investigation evidence",
  },
  {
    num: "05",
    title: "Pre-production validation",
    status: "Roadmap",
    tag: "RELEASE CANDIDATE",
    body: "Validate a release candidate in an isolated, production-like environment when available.",
    preview: "Cross-service interface checks in staging environment",
  },
  {
    num: "06",
    title: "Deployment diagnosis",
    status: "Roadmap",
    tag: "DEPLOYMENT",
    body: "Use release context to help investigate likely causes of failed deployments.",
    preview: "Connect failed release signals to relevant code diffs",
  },
  {
    num: "07",
    title: "Production monitoring",
    status: "Roadmap",
    tag: "OBSERVABILITY",
    body: "Use confirmed production failures to inform future quality checks.",
    preview: "Feed production incident findings back into review models",
  },
];

const cardDirections = [
  { x: 0.75, y: 0.72, r: 5 },
  { x: -0.77, y: 0.62, r: -5 },
  { x: 0.7, y: -0.66, r: -4.5 },
  { x: -0.72, y: 0.68, r: 5 },
  { x: 0.8, y: 0.54, r: 4 },
  { x: -0.7, y: -0.68, r: -4 },
];

const clampProgress = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

export function ConnectedWorkflow() {
  const [activeStage, setActiveStage] = useState(0);
  const activeStageRef = useRef(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const navButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  const scrollToStage = (index: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const sceneTop = window.scrollY + rect.top;
    const distance = Math.max(1, scene.offsetHeight - window.innerHeight);
    const targetProgress = index / (lifecycleStages.length - 1);
    const targetY = sceneTop + targetProgress * distance;
    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const count = counterRef.current;
    if (!scene || !stage) return;

    const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReduced = reduceMedia.matches;
    const onMediaChange = (e: MediaQueryListEvent) => {
      isReduced = e.matches;
      schedule();
    };
    reduceMedia.addEventListener("change", onMediaChange);

    let pending = false;

    const update = () => {
      pending = false;
      if (!scene || !stage) return;

      const cards = cardRefs.current;
      if (!cards.length) return;

      const rect = scene.getBoundingClientRect();
      const distance = Math.max(1, scene.offsetHeight - window.innerHeight);
      const progress = clampProgress(-rect.top / distance, 0, 1);
      const totalTransitions = lifecycleStages.length - 1;
      const position = progress * totalTransitions;
      const base = Math.min(totalTransitions - 1, Math.floor(position));
      const t = position - base;
      const w = stage.clientWidth;
      const h = stage.clientHeight;

      const HOLD_RATIO = 0.35;
      const d = cardDirections[base] || { x: 0.75, y: 0.72, r: 5 };
      const offsetDistanceX = Math.max(w * 1.5, typeof window !== "undefined" ? Math.min(window.innerWidth * 0.9, 1100) : 800);
      const offsetDistanceY = Math.max(h * 0.35, 200);

      cards.forEach((card, i) => {
        if (!card) return;
        if (progress === 1) {
          card.style.visibility = i === totalTransitions ? "visible" : "hidden";
          card.style.transform = "translate3d(0, 0, 0)";
          card.style.zIndex = i === totalTransitions ? "2" : "1";
          return;
        }

        if (i !== base && i !== base + 1) {
          card.style.visibility = "hidden";
          return;
        }

        if (t <= HOLD_RATIO) {
          if (i === base) {
            card.style.visibility = "visible";
            card.style.transform = "translate3d(0, 0, 0) rotate(0deg) scale(1)";
            card.style.zIndex = "2";
          } else {
            card.style.visibility = "hidden";
            card.style.transform = `translate3d(${d.x * offsetDistanceX}px, ${d.y * offsetDistanceY}px, 0)`;
            card.style.zIndex = "1";
          }
          return;
        }

        const u = (t - HOLD_RATIO) / (1 - HOLD_RATIO);
        const ease = u * u * (3 - 2 * u);

        let x = 0;
        let y = 0;
        let r = 0;
        let scale = 1;

        if (i === base) {
          card.style.visibility = "visible";
          x = -d.x * w * 0.24 * ease;
          y = -d.y * h * 0.12 * ease;
          r = -d.r * 0.5 * ease;
          scale = 1 - 0.045 * ease;
          card.style.zIndex = "1";
        } else {
          card.style.visibility = "visible";
          x = d.x * offsetDistanceX * (1 - ease);
          y = d.y * offsetDistanceY * (1 - ease);
          r = d.r * (1 - ease);
          scale = 1;
          card.style.zIndex = "2";
        }

        if (isReduced) {
          x = 0;
          y = 0;
          r = 0;
          scale = 1;
          card.style.visibility =
            (i === base && u < 0.5) || (i === base + 1 && u >= 0.5)
              ? "visible"
              : "hidden";
        }

        card.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      });

      const visible = t < 0.65 ? base : Math.min(totalTransitions, base + 1);
      if (count) {
        count.textContent = `${String(visible + 1).padStart(2, "0")} / 07`;
      }

      navButtonRefs.current.forEach((btn, idx) => {
        if (!btn) return;
        const isSelected = idx === visible;
        btn.classList.toggle("is-selected", isSelected);
        btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      });

      if (activeStageRef.current !== visible) {
        activeStageRef.current = visible;
        setActiveStage(visible);
      }
    };

    const schedule = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);

    update();

    return () => {
      reduceMedia.removeEventListener("change", onMediaChange);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftStackRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HTMLDivElement>(null);
  const rightStackRef = useRef<HTMLDivElement>(null);

  return (
    <section id="workflow" className="connected-workflow" aria-labelledby="connected-title">
      <div className="connected-inner">
        {/* Main Section Header */}
        <div className="connected-heading">
          <div>
            <p className="connected-eyebrow">IN YOUR WORKFLOW</p>
            <h2 id="connected-title">
              Keep your tools.<br />
              <span>Connect the context.</span>
            </h2>
          </div>
          <p>
            Requirements live in one place. Code in another. Bring the relevant context together where engineering work happens.
          </p>
        </div>

        {/* Integration Canvas - Exact Match to Live Reference Site */}
        <div className="integration-canvas" ref={containerRef} role="region" aria-label="Context integration canvas">
          {/* Left Tool Stack: Ingest Tools */}
          <div className="tool-stack" ref={leftStackRef}>
            {/* Jira */}
            <div className="tool">
              <Image unoptimized src="/brands/jira.svg" width={24} height={24} alt="Jira" className="brand-icon" />
              <span>
                Jira
                <small>Requirements &amp; tickets</small>
              </span>
              <span className="tag">
                <span />Confirm availability
              </span>
            </div>

            {/* PRDs & documentation */}
            <div className="tool">
              <FileText size={22} strokeWidth={1.75} aria-hidden="true" />
              <span>
                PRDs &amp; documentation
                <small>Intent &amp; acceptance criteria</small>
              </span>
            </div>
          </div>

          {/* Mobile Vertical Flow Stem 1 (Jira/PRDs -> Myco) */}
          <div className="mobile-canvas-stem" aria-hidden="true">
            <span className="mobile-stem-dot" />
          </div>

          {/* Center Engine Node */}
          <div className="integration-engine" ref={engineRef}>
            <div className="brand-icon">
              <Image unoptimized src="/favicon.svg" width={40} height={40} alt="" />
            </div>
            <strong>Myco</strong>
          </div>

          {/* Mobile Vertical Flow Stem 2 (Myco -> GitHub/VS Code) */}
          <div className="mobile-canvas-stem" aria-hidden="true">
            <span className="mobile-stem-dot" />
          </div>

          {/* Right Tool Stack: Workflow Tools */}
          <div className="tool-stack" ref={rightStackRef}>
            {/* GitHub */}
            <div className="tool">
              <Image unoptimized src="/brands/github.svg" width={24} height={24} alt="GitHub" className="brand-icon" />
              <span>
                GitHub
                <small>Pull request review</small>
              </span>
              <span className="tag live">
                <span />Live
              </span>
            </div>

            {/* VS Code */}
            <div className="tool">
              <Image unoptimized src="/brands/vscode.svg" width={24} height={24} alt="VS Code" className="brand-icon" />
              <span>
                VS Code
                <small>Local development</small>
              </span>
              <span className="tag">
                <span />Roadmap
              </span>
            </div>
          </div>

          {/* Dynamic Animated Connecting Beams - Matching Live Reference Site */}
          <AnimatedBeam
            className="flow-beam"
            containerRef={containerRef}
            fromRef={leftStackRef}
            toRef={engineRef}
            gradientStartColor="#7ab49d"
            gradientStopColor="#39756d"
            pathColor="#92a99d"
            duration={6}
          />
          <AnimatedBeam
            className="flow-beam"
            containerRef={containerRef}
            fromRef={engineRef}
            toRef={rightStackRef}
            gradientStartColor="#7ab49d"
            gradientStopColor="#39756d"
            pathColor="#92a99d"
            duration={6}
          />
        </div>

        <p className="integration-caption">
          Connect only the sources and repositories you authorize. Integration availability depends on your configuration.
        </p>

        <div className="workflow-security">
          <div className="workflow-security-head">
            <div>
              <span className="connected-eyebrow">SCOPED TO YOUR TEAM</span>
              <h3>Context with clear boundaries.</h3>
            </div>
          </div>
          <p>Repository access, connected sources and available actions are agreed for your configuration. Engineers retain control of fixes, sign-off and releases.</p>
        </div>

        {/* Section: The Connected Lifecycle (#lifecycle) */}
        <div id="lifecycle" className="lifecycle-section">
          <div className="lifecycle-header">
            <div>
              <p className="connected-eyebrow">THE CONNECTED LIFECYCLE</p>
              <h3>One understanding. Every stage of delivery.</h3>
            </div>
            <p>
              Start with contextual PR review today. Explore how that context could extend across delivery over time.
            </p>
          </div>

          {/* Fluid Roadmap Cards Section */}
          <div className="lifecycle-journey-scene" ref={sceneRef}>
            <div className="lifecycle-journey-pin">
              <div className="lifecycle-pin-top">
                <div className="lifecycle-pin-bar">
                  <span className="lifecycle-pin-label">DEVELOPMENT ROADMAP</span>
                  <span ref={counterRef} className="lifecycle-counter">01 / 07</span>
                </div>
                <div className="lifecycle-journey-nav" aria-label="Explore delivery stages">
                  {lifecycleStages.map((stage, idx) => (
                    <button
                      key={stage.num}
                      ref={el => { navButtonRefs.current[idx] = el; }}
                      type="button"
                      className={`lifecycle-nav-btn ${activeStage === idx ? "is-selected" : ""}`}
                      aria-pressed={activeStage === idx}
                      aria-label={`Jump to stage ${stage.num}: ${stage.title}`}
                      onClick={() => scrollToStage(idx)}
                    >
                      <span className="lifecycle-journey-dot">{stage.num}</span>
                      <span className="lifecycle-nav-label">{stage.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lifecycle-card-stage" ref={stageRef}>
                {lifecycleStages.map((stage, i) => (
                  <article
                    key={stage.num}
                    ref={el => { cardRefs.current[i] = el; }}
                    className={`lifecycle-fluid-card ${i === 0 ? "is-initial" : ""}`}
                    aria-hidden={activeStage !== i}
                  >
                    <div className="lifecycle-art-orbit" aria-hidden="true" />
                    <div className="lifecycle-card-content">
                      <div className="lifecycle-card-meta">
                        <span className="lifecycle-card-stage-num">STAGE {stage.num} / 07</span>
                        <span className={`lifecycle-card-tag ${stage.status === "Live foundation" ? "is-live" : ""}`}>
                          {stage.status}
                        </span>
                      </div>
                      <h4 className="lifecycle-card-title">{stage.title}</h4>
                      <p className="lifecycle-card-body">{stage.body}</p>
                      <div className="lifecycle-card-bottom">
                        <div className="lifecycle-card-bottom-meta">
                          <span className="lifecycle-card-bottom-label">ILLUSTRATIVE CONTEXT</span>
                          <span className="lifecycle-card-bottom-sub">Available context depends on configuration</span>
                        </div>
                        <div className="lifecycle-card-bottom-row">
                          <ArrowUpRight size={14} className="lifecycle-card-arrow" aria-hidden="true" />
                          <span className="lifecycle-card-bottom-text">{stage.preview}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="connected-footer-links">
            <Link href="/workflow" className="connected-link-btn">
              Explore the full workflow <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/book-demo" className="connected-link-ghost">
              Discuss a pilot evaluation <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

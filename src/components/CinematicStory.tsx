"use client";

import { useEffect, useRef, useState } from "react";
import "@/src/styles/cinematic-story.css";

const chapters = [
  { eyebrow: "01 / THE INTENT", title: "Every change starts with a reason.", body: "Requirements describe what the feature should do. That intent is essential context for understanding the code.", node: "Available requirements", detail: "What should happen?" },
  { eyebrow: "02 / THE CHANGE", title: "One edit can reach further than it looks.", body: "A pull request sits inside a larger system. Myco considers the change alongside surrounding authorized code and available context.", node: "GitHub pull request", detail: "What else could it affect?" },
  { eyebrow: "03 / THE EVIDENCE", title: "Give the next decision a clearer starting point.", body: "A contextual finding can show what may need attention and why. Engineers investigate the evidence and remain in control of the outcome.", node: "Review finding", detail: "What needs a closer look?" },
];

export function CinematicStory() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const nodes = section.current?.querySelectorAll<HTMLElement>("[data-story-chapter]");
    if (!nodes || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.storyChapter));
      });
    }, { rootMargin: "-30% 0px -45% 0px", threshold: 0 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return <section className="cinematic-story" ref={section} aria-labelledby="cinematic-story-title">
    <div className="cinematic-story-intro"><span>THE CONTEXT BEHIND THE CHANGE</span><h2 id="cinematic-story-title">Good review sees<br /><em>the bigger picture.</em></h2><p>From intent to implementation to evidence, every piece helps your team understand the change.</p></div>
    <div className="cinematic-story-layout" data-active={active}>
      <div className="cinematic-story-chapters">{chapters.map((chapter, index) => <article key={chapter.eyebrow} data-story-chapter={index} className="cinematic-story-chapter"><span>{chapter.eyebrow}</span><h3>{chapter.title}</h3><p>{chapter.body}</p><div className="cinematic-story-index" aria-hidden="true"><i /><i /><i /></div></article>)}</div>
      <div className="cinematic-story-visual" aria-hidden="true"><div className="cinematic-story-canvas">
        <div className="cinematic-story-canvas-label">CONTEXT / CONNECTED</div>
        <svg className="cinematic-story-network" viewBox="0 0 560 460" fill="none"><path d="M74 95 L207 154 L330 98 L472 170 L390 291 L253 367 L112 302 Z M207 154 L253 367 M207 154 L390 291 M330 98 L390 291 M112 302 L207 154 M390 291 L472 170"/><circle cx="74" cy="95" r="4"/><circle cx="207" cy="154" r="6"/><circle cx="330" cy="98" r="4"/><circle cx="472" cy="170" r="5"/><circle cx="390" cy="291" r="6"/><circle cx="253" cy="367" r="4"/><circle cx="112" cy="302" r="4"/></svg>
        <div className="cinematic-story-rings" /><div className="cinematic-story-focus" key={active}><span>0{active + 1} / 03</span><strong>{chapters[active].node}</strong><small>{chapters[active].detail}</small><div className="cinematic-story-focus-line" /></div>
        <div className="cinematic-story-canvas-footer"><span>INTENT</span><span>CODE</span><span>EVIDENCE</span></div>
      </div></div>
    </div>
    <p className="cinematic-story-footnote">Illustrative workflow · Available context and review actions depend on your configuration.</p>
  </section>;
}

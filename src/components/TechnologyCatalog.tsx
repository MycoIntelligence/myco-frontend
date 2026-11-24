"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

interface TechItem {
  title: string;
  category: string;
  src: string;
}

// Row 1: Languages supported by Myco
const supportedLanguages: TechItem[] = [
  { title: "Python", category: "Supported Language", src: "/brands/languages/python.svg" },
  { title: "TypeScript", category: "Supported Language", src: "/brands/languages/typescript.svg" },
  { title: "JavaScript", category: "Supported Language", src: "/brands/languages/javascript.svg" },
  { title: "Go", category: "Supported Language", src: "/brands/languages/go.svg" },
  { title: "Java", category: "Supported Language", src: "/brands/languages/java.svg" },
  { title: "C++", category: "Supported Language", src: "/brands/languages/cplusplus.svg" },
  { title: "C#", category: "Supported Language", src: "/brands/languages/csharp.svg" },
];

// Row 2: Supported workflow integrations and context sources
const supportedTools: TechItem[] = [
  { title: "GitHub", category: "Live Integration", src: "/brands/github.svg" },
  { title: "Jira", category: "Pilot Integration", src: "/brands/jira.svg" },
  { title: "VS Code", category: "Local Feedback", src: "/brands/vscode.svg" },
];

export function TechnologyCatalog() {
  return (
    <section id="technologies" className="eco-marquee-section select-none" aria-labelledby="tech-title">
      {/* Header section matching reference design */}
      <div className="eco-header">
        <div className="eco-kicker">YOUR CODE · YOUR STACK · CONNECTED CONTEXT</div>
        <h2 id="tech-title" className="eco-title">
          The languages and tools<br />
          <span>your team already uses</span>
        </h2>
        <p className="eco-subtitle">
          Myco supports all programming languages. Bring your pull requests, requirements and repository context into one evidence-based review.
        </p>

        {/* Center icon connector with vertical stem */}
        <div className="eco-globe-anchor">
          <div className="eco-globe-badge">
            <Code2 size={20} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Marquee Container with vertical connecting line */}
      <div className="eco-marquee-container">
        {/* Subtle center line connecting down from the badge */}
        <div className="eco-stem-line" aria-hidden="true" />

        {/* Row 1: Languages infinite marquee moving left */}
        <div className="eco-marquee-mask">
          <div className="eco-marquee-track eco-track-left">
            {Array.from({ length: 4 }, () => supportedLanguages).flat().map((item, idx) => (
              <div
                key={`lang-${item.title}-${idx}`}
                aria-hidden={idx >= supportedLanguages.length}
                title={`${item.title} — ${item.category}`}
                className="eco-tile"
              >
                <Image
                  unoptimized
                  src={item.src}
                  alt={item.title}
                  width={42}
                  height={42}
                  className="eco-tile-img"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Tools & context infinite marquee moving right */}
        <div className="eco-marquee-mask">
          <div className="eco-marquee-track eco-track-right">
            {Array.from({ length: 12 }, () => supportedTools).flat().map((item, idx) => (
              <div
                key={`tool-${item.title}-${idx}`}
                aria-hidden={idx >= supportedTools.length}
                title={`${item.title} — ${item.category}`}
                className="eco-tile"
              >
                <Image
                  unoptimized
                  src={item.src}
                  alt={item.title}
                  width={42}
                  height={42}
                  className="eco-tile-img"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GitHub Live Integration Banner - NO Myco logo at bottom */}
      <div className="eco-integration-wrap">
        <div className="tech-integration">
          <div className="tech-platform">
            <div className="tech-github-mark">
              <Image unoptimized src="/brands/github.svg" width={56} height={56} alt="" />
            </div>
            <div>
              <span className="tech-status">LIVE INTEGRATION</span>
              <h3>GitHub</h3>
              <p>Contextual pull request review</p>
            </div>
          </div>
          <div className="tech-platform-copy">
            <p>
              Review changes where your team already works. Connect authorized repositories and assess findings alongside your pull request.
            </p>
            <Link href="/workflow">
              Explore the GitHub workflow <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className="tech-scope">
          Language support and integration availability are different. Connected sources, repository scope and review actions are confirmed for your configuration.
        </p>
      </div>
    </section>
  );
}

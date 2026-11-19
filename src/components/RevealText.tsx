"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface RevealTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div";
  className?: string;
  isTwoTone?: boolean;
  mutedText?: string;
  paragraphText?: string;
  paragraphClassName?: string;
}

export function RevealText({
  children,
  as: Component = "h2",
  className = "",
  isTwoTone = false,
  mutedText = "",
  paragraphText,
  paragraphClassName = "",
}: RevealTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const words = containerRef.current.querySelectorAll<HTMLElement>(".reveal-word");
    if (!words.length) return;

    // Word scrub animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
        end: "top 40%",
        scrub: 0.6,
      },
    });

    tl.fromTo(
      words,
      {
        opacity: 0.2,
        y: 8,
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        ease: "power2.out",
      }
    );

    // Paragraph block reveal with delay
    if (paragraphRef.current) {
      gsap.fromTo(
        paragraphRef.current,
        {
          opacity: 0.25,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.08,
          scrollTrigger: {
            trigger: paragraphRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    const containerEl = containerRef.current;
    const paragraphEl = paragraphRef.current;

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === containerEl || st.trigger === paragraphEl) {
          st.kill();
        }
      });
    };
  }, []);

  const renderWords = (text: string, isMuted = false) => {
    const wordList = text.trim().split(/\s+/);
    return wordList.map((word, i) => (
      <span
        key={i}
        className={`reveal-word inline-block mr-[0.28em] will-change-transform ${
          isMuted ? "opacity-55" : ""
        }`}
      >
        {word}
      </span>
    ));
  };

  const textContent = typeof children === "string" ? children : "";

  return (
    <div className="flex flex-col">
      <Component
        ref={containerRef as any}
        className={`two-tone-title ${className}`}
      >
        {textContent ? renderWords(textContent) : children}
        {isTwoTone && mutedText && (
          <span className="muted block sm:inline">
            {renderWords(mutedText, true)}
          </span>
        )}
      </Component>

      {paragraphText && (
        <p
          ref={paragraphRef}
          className={`mt-4 leading-[1.6] ${paragraphClassName}`}
        >
          {paragraphText}
        </p>
      )}
    </div>
  );
}

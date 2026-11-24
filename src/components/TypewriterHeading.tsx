"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface TypewriterHeadingProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  decodeMode?: boolean;
  delayMs?: number;
  triggerOnScroll?: boolean;
  onComplete?: () => void;
}

const DECODE_GLYPHS = "01_/#<>*+=";

export function TypewriterHeading({
  text,
  as: Tag = "h2",
  className = "",
  decodeMode = true,
  delayMs = 150,
  triggerOnScroll = true,
  onComplete,
}: TypewriterHeadingProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsDone(true);
      onComplete?.();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const startTyping = () => {
      setIsTyping(true);
      let charIndex = 0;
      let scrambleFrames = 0;
      const targetLength = text.length;

      intervalId = setInterval(() => {
        if (charIndex >= targetLength) {
          if (intervalId) clearInterval(intervalId);
          setDisplayedText(text);
          setIsTyping(false);
          setIsDone(true);
          onComplete?.();
          return;
        }

        // If decodeMode is on, briefly show a random tech glyph before resolving character
        if (decodeMode && scrambleFrames < 2 && text[charIndex] !== " ") {
          scrambleFrames++;
          const randomGlyph = DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];
          const partial = text.slice(0, charIndex) + randomGlyph;
          setDisplayedText(partial);
        } else {
          scrambleFrames = 0;
          charIndex++;
          setDisplayedText(text.slice(0, charIndex));
        }
      }, 34); // ~30 chars/sec speed
    };

    let trigger: ScrollTrigger | null = null;
    const el = containerRef.current;

    if (triggerOnScroll && el) {
      trigger = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          timeoutId = setTimeout(startTyping, delayMs);
        },
      });
    } else {
      timeoutId = setTimeout(startTyping, delayMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (trigger) trigger.kill();
    };
  }, [text, decodeMode, delayMs, triggerOnScroll, onComplete]);

  return (
    <Tag ref={containerRef as any} className={`relative inline-block ${className}`}>
      <span>{displayedText}</span>
      {!isDone && <span className="typewriter-cursor" aria-hidden="true" />}
    </Tag>
  );
}


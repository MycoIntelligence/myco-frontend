"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; phase: number };

/** Decorative, pointer-responsive particles, confined to the visible hero. */
export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>(".md-hero");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !hero || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, visible = true;
    let particles: Particle[] = [];
    const pointer = { x: -1000, y: -1000 };
    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width; height = Math.min(rect.height, Math.max(window.innerHeight * 1.25, 760));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(130, Math.max(45, Math.round(width * height / 10000)));
      particles = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .32, vy: -.15 - Math.random() * .28, size: .7 + Math.random() * 1.9, alpha: .35 + Math.random() * .55, phase: Math.random() * 6.28 }));
    };
    const draw = (time: number) => {
      frame = 0;
      if (!visible || reduced.matches) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 135 && dist > 0) { const force = (1 - dist / 135) * .24; p.vx += dx / dist * force; p.vy += dy / dist * force; }
        p.vx *= .985; p.vy = p.vy * .985 - .004;
        p.vx = Math.max(-2, Math.min(2, p.vx)); p.vy = Math.max(-2, Math.min(1, p.vy));
        p.x += p.vx + Math.sin(time * .0006 + p.phase) * .11; p.y += p.vy;
        if (p.x < -5) p.x = width + 5; if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5; if (p.y > height + 5) p.y = -5;
        ctx.beginPath(); ctx.fillStyle = `rgba(214, 240, 197, ${p.alpha})`; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    const start = () => { cancelAnimationFrame(frame); frame = 0; ctx.clearRect(0, 0, width, height); if (!reduced.matches && visible) frame = requestAnimationFrame(draw); };
    const move = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; };
    const leave = () => { pointer.x = -1000; pointer.y = -1000; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    resize(); observer.observe(hero); start();
    window.addEventListener("resize", resize); hero.addEventListener("pointermove", move); hero.addEventListener("pointerleave", leave); reduced.addEventListener("change", start);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", resize); hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave); reduced.removeEventListener("change", start); };
  }, []);
  return <canvas ref={canvasRef} className="hero-particles" aria-hidden="true" />;
}

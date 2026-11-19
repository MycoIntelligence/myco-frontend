"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  angle: number;
  baseAngle: number;
  color: string;
  alpha: number;
  phase: number;
}

const PALETTE = [
  "#2dd4bf", // Bright Mint Teal
  "#34d399", // Emerald Green
  "#38bdf8", // Sky Cyan
  "#60a5fa", // Electric Blue
  "#818cf8", // Indigo
  "#a78bfa", // Electric Violet
  "#c084fc", // Radiant Violet
  "#e0f2fe", // Ice Slate
  "#ffffff", // Crisp White
];

export function InteractiveGravityField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mouse state
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 190,
      active: false,
    };

    // Helper to generate dense, delicate small gravity particles
    const createParticles = (w: number, h: number): Particle[] => {
      // Density scaled to viewport area: high count of fine, small particles
      const count = Math.min(320, Math.max(160, Math.floor((w * h) / 3200)));
      const list: Particle[] = [];
      const centerX = w / 2;
      const centerY = h * 0.44;

      for (let i = 0; i < count; i++) {
        // Power distribution leaves a clear halo for the headline and radiates outwards
        const rFactor = Math.pow(Math.random(), 0.68);
        const radiusX = (0.24 + rFactor * 0.76) * (w * 0.54);
        const radiusY = (0.22 + rFactor * 0.78) * (h * 0.50);
        const theta = Math.random() * Math.PI * 2;

        const baseX = centerX + Math.cos(theta) * radiusX;
        const baseY = centerY + Math.sin(theta) * radiusY;

        // Mix of orbital tangent flow, outward liftoff, and field inclination angles
        const flowRoll = Math.random();
        let baseAngle: number;
        if (flowRoll < 0.45) {
          // Orbital swirl
          baseAngle = theta + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        } else if (flowRoll < 0.80) {
          // Outward radial liftoff
          baseAngle = theta + (Math.random() - 0.5) * 0.35;
        } else {
          // Dynamic 45-degree field trajectory
          baseAngle = theta + Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        }

        // Small, delicate particle sizing: flecks, slender dashes, and refined accent ticks
        const sizeRoll = Math.random();
        let length: number;
        let pWidth: number;
        let alpha: number;

        if (sizeRoll < 0.40) {
          // Delicate micro-flecks and dots
          length = 3.5 + Math.random() * 3.5;
          pWidth = 1.4 + Math.random() * 0.6;
          alpha = 0.42 + Math.random() * 0.45;
        } else if (sizeRoll < 0.85) {
          // Slender fine dashes
          length = 7.0 + Math.random() * 5.0;
          pWidth = 1.6 + Math.random() * 0.6;
          alpha = 0.50 + Math.random() * 0.45;
        } else {
          // Subtle accent ticks
          length = 12.0 + Math.random() * 5.0;
          pWidth = 1.8 + Math.random() * 0.6;
          alpha = 0.60 + Math.random() * 0.35;
        }

        list.push({
          baseX,
          baseY,
          x: baseX + (Math.random() - 0.5) * 16,
          y: baseY + (Math.random() - 0.5) * 16,
          vx: 0,
          vy: 0,
          length,
          width: pWidth,
          angle: baseAngle,
          baseAngle,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          alpha,
          phase: Math.random() * Math.PI * 2,
        });
      }
      return list;
    };

    let particles = createParticles(width, height);

    // Handle resize
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
    };

    const handleTouchEnd = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const parent = canvas.parentElement || window;
    parent.addEventListener("mousemove", handleMouseMove as any, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave as any, { passive: true });
    parent.addEventListener("touchmove", handleTouchMove as any, { passive: true });
    parent.addEventListener("touchend", handleTouchEnd as any, { passive: true });

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Ambient gentle floating pulse
          const ambientX = Math.cos(time + p.phase) * 1.2;
          const ambientY = Math.sin(time + p.phase) * 1.2;

          // Interactive cursor gravity & repulsion
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (mouse.active && dist < mouse.radius && dist > 0) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);

            // Repel with elastic impulse
            const push = force * 5.5;
            p.vx -= Math.cos(angle) * push;
            p.vy -= Math.sin(angle) * push;

            // Swirl orientation toward mouse vector
            p.angle = angle + Math.PI / 2;
          } else {
            // Smoothly align back to base angle
            p.angle += (p.baseAngle - p.angle) * 0.05;
          }

          // Spring force towards anchor position
          const targetX = p.baseX + ambientX;
          const targetY = p.baseY + ambientY;

          p.vx += (targetX - p.x) * 0.04;
          p.vy += (targetY - p.y) * 0.04;

          // Friction damping
          p.vx *= 0.89;
          p.vy *= 0.89;

          p.x += p.vx;
          p.y += p.vy;
        }

        // Draw particle as rounded pill dash
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Rounded dash pill
        const halfL = p.length / 2;
        const halfW = p.width / 2;

        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(-halfL, -halfW, p.length, p.width, halfW);
        } else {
          ctx.rect(-halfL, -halfW, p.length, p.width);
        }
        ctx.fill();

        ctx.restore();
      }

        if (isVisible) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      let isVisible = true;
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(render);
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        }
      });
      observer.observe(canvas);

      animationFrameId = requestAnimationFrame(render);

      return () => {
        observer.disconnect();
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        parent.removeEventListener("mousemove", handleMouseMove as any);
        parent.removeEventListener("mouseleave", handleMouseLeave as any);
        parent.removeEventListener("touchmove", handleTouchMove as any);
        parent.removeEventListener("touchend", handleTouchEnd as any);
      };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-[4] w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}


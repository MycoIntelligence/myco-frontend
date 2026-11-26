"use client";

import { useEffect, useRef } from "react";

const FRAME_INTERVAL = 1000 / 20;
const PARTICLE_COLORS = [
  "#0964ad38", "#087ac66c", "#008ce598", "#05a3f2c5",
  "#20b8fff0", "#52ceff", "#a2e6ff",
];

function waveEdge(x: number, phase: number) {
  const swell = Math.exp(-Math.pow((x - .055) / .105, 2));
  const trough = Math.exp(-Math.pow((x - .405) / .15, 2));
  return .60 - swell * .128 + trough * .105 + Math.sin(x * 12 + phase) * .012;
}

export function SignupWave({ className }: { className: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let phase = 0;

    function draw() {
      if (!context || !width || !height) return;
      const compact = width < 760;
      const rows = compact ? 24 : 42;
      const columns = compact ? 44 : 82;
      const paths = PARTICLE_COLORS.map(() => new Path2D());
      context.clearRect(0, 0, width, height);

      for (let row = 0; row < rows; row++) {
        const depth = row / (rows - 1);
        const perspective = .71 + depth * .62;
        const slope = depth * (.24 + depth * .37);

        for (let column = 0; column < columns; column++) {
          const across = column / (columns - 1) * (compact ? 1.19 : .89) - .18;
          const x = .31 + (across - .31) * perspective;
          const falloff = Math.min(1, Math.max(0, ((compact ? 1.02 : .69) - x) * 4.5));
          if (x < -.02 || !falloff) continue;

          const edge = waveEdge(x, phase);
          const ripple = Math.sin(x * 16 - depth * 6 + phase) * Math.sin(depth * Math.PI) * .068;
          const y = edge + slope + ripple;
          if (y > 1.02) continue;

          const crest = Math.exp(-depth * 28) * .74;
          const crossCurrent = .91 - x * .57 + Math.sin(x * 12 + phase) * .018;
          const intersection = Math.exp(-Math.abs(y - crossCurrent) * 66) * .68;
          const rim = Math.max(crest, intersection);
          const light = (.32 + rim) * falloff * (1 - depth * .43);
          const tone = Math.min(paths.length - 1, Math.floor(light * 7.8));
          const radius = (.77 + rim * .94) * perspective * (compact ? .93 : 1.54);
          const px = x * width;
          const py = y * height;
          paths[tone].moveTo(px + radius, py);
          paths[tone].arc(px, py, radius, 0, Math.PI * 2);
        }
      }

      // A low, distant ridge gives the brighter foreground wave depth.
      for (let row = 0; row < 19; row++) {
        for (let column = 0; column < 54; column++) {
          const x = .16 + column * .008;
          const y = .595 - Math.exp(-Math.pow((x - .34) / .089, 2)) * .093
            + row * .005 + Math.sin(x * 24 + phase) * .009;
          if (y >= waveEdge(x, phase)) continue;
          const distance = Math.abs(x - .37);
          const path = paths[distance < .12 && row < 8 ? 2 : 0];
          const radius = compact ? .53 : 1.05;
          const px = x * width;
          const py = y * height;
          path.moveTo(px + radius, py);
          path.arc(px, py, radius, 0, Math.PI * 2);
        }
      }

      paths.forEach((path, index) => {
        context.fillStyle = PARTICLE_COLORS[index];
        context.fill(path);
      });
    }

    function animate(now: number) {
      if (now - lastFrame >= FRAME_INTERVAL) {
        if (lastFrame) phase += Math.min(now - lastFrame, 65) * .00036;
        lastFrame = now;
        draw();
      }
      frame = requestAnimationFrame(animate);
    }

    function syncMotion() {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    }

    const observer = new ResizeObserver(([entry]) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    });
    observer.observe(canvas);
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncMotion);
    syncMotion();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncMotion);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

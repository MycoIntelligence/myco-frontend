"use client";
import { useEffect } from "react";

export function ScrollExperience() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (preference.matches) return;
      const targets = Array.from(document.querySelectorAll<HTMLElement>(".md-section, .md-trust, .md-review-shell"));
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      }), { threshold: 0 });
      targets.forEach(target => { target.classList.add("scroll-reveal"); observer.observe(target); });
      let frame = 0;
      const update = () => {
        frame = 0;
        const hero = document.querySelector<HTMLElement>(".md-hero");
        if (hero) hero.style.setProperty("--scene-shift", `${Math.min(window.scrollY * .07, 60)}px`);
        const range = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty("--reading-progress", String(range > 0 ? Math.min(1, window.scrollY / range) : 0));
      };
      const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
      window.addEventListener("scroll", scroll, { passive: true }); update();
      cleanup = () => { observer.disconnect(); window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); targets.forEach(target => target.classList.remove("scroll-reveal", "is-visible")); document.querySelector<HTMLElement>(".md-hero")?.style.removeProperty("--scene-shift"); };
    };
    setup(); preference.addEventListener("change", setup);
    return () => { cleanup(); preference.removeEventListener("change", setup); };
  }, []);
  return <div className="myco-reading-progress" aria-hidden="true" />;
}

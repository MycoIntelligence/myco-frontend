"use client";

import React, { useEffect } from "react";

export function Playground() {
  useEffect(() => {
    let isMounted = true;

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve) => {
        const existing = document.querySelector(`script[data-script-id="${src}"]`) as HTMLScriptElement | null;
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => resolve(), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.dataset.scriptId = src;
        script.src = src;
        script.async = false;
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => {
          resolve();
        };
        document.body.appendChild(script);
      });
    }

    async function init() {
      try {
        if (!(window as any).THREE) {
          await loadScript("/static/js/three.min.js");
        }
        if (!isMounted) return;
        if (!(window as any).MycoIntelligenceCore) {
          await loadScript("/static/js/intelligence-core.js");
        }
        if (!isMounted) return;
        await loadScript("/static/js/playground.js");
      } catch (err) {
        console.warn("Playground initialization notice:", err);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return <div id="playground-mount-target" style={{ display: "contents" }} />;
}

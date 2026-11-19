"use client";

export type SectionTheme = "dark" | "pale" | "paper";

export function setupNavThemeObserver(onThemeChange: (theme: "dark" | "light") => void): () => void {
  if (typeof window === "undefined") return () => {};

  let currentTheme: "dark" | "light" = "dark";

  // Use high-performance IntersectionObserver instead of forced scroll reflows
  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const themeAttr = entry.target.getAttribute("data-theme") as SectionTheme;
            const newTheme: "dark" | "light" =
              themeAttr === "pale" || themeAttr === "paper" ? "light" : "dark";

            if (newTheme !== currentTheme) {
              currentTheme = newTheme;
              onThemeChange(newTheme);
            }
          }
        }
      },
      {
        root: null,
        // Trigger right at the 66px navbar height
        rootMargin: "-66px 0px -75% 0px",
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll<HTMLElement>("section[data-theme], footer[data-theme]");
    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }

  // Fallback with throttle
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const sections = document.querySelectorAll<HTMLElement>("section[data-theme], footer[data-theme]");
        const navMidY = 36;
        let activeTheme: "dark" | "light" = "dark";

        for (let i = 0; i < sections.length; i++) {
          const rect = sections[i].getBoundingClientRect();
          if (rect.top <= navMidY && rect.bottom > navMidY) {
            const themeAttr = sections[i].getAttribute("data-theme") as SectionTheme;
            activeTheme = themeAttr === "pale" || themeAttr === "paper" ? "light" : "dark";
            break;
          }
        }

        if (activeTheme !== currentTheme) {
          currentTheme = activeTheme;
          onThemeChange(activeTheme);
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}

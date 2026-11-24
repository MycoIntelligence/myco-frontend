import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Playground UX & Design System Alignment", () => {
  const cssPath = path.resolve(process.cwd(), "src/styles/playground.css");
  const jsPath = path.resolve(process.cwd(), "public/static/js/playground.js");

  it("verifies frosted macOS window-bar shell styling in playground.css", () => {
    const css = fs.readFileSync(cssPath, "utf-8");

    // Shell framing
    expect(css).toContain(".playground-window-shell");
    expect(css).toContain(".playground-window-bar");
    expect(css).toContain(".playground-window-dots");
    expect(css).toContain("backdrop-filter: blur(14px)");
    expect(css).toContain("#edf2e4");
  });

  it("verifies design system color palette: sage, forest green, clean cards, borders", () => {
    const css = fs.readFileSync(cssPath, "utf-8");

    // Backgrounds: #f4f6f0 (light sage), #edf2e4 (soft sage)
    expect(css).toContain("#f4f6f0");
    expect(css).toContain("#edf2e4");

    // Accents: #173e2b, #16201a
    expect(css).toContain("#173e2b");
    expect(css).toContain("#16201a");

    // Clean cards: #ffffff, border: #dbe4d5
    expect(css).toContain("#ffffff");
    expect(css).toContain("#dbe4d5");
  });

  it("uses Geist for headings, body copy, and code", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    const globals = fs.readFileSync(path.resolve(process.cwd(), "app/(legacy)/globals.css"), "utf-8");

    expect(css).toContain("font-family: var(--site-sans)");
    expect(css).toContain("font-family: var(--site-mono)");
    expect(globals).toContain('--site-sans: Geist, system-ui, sans-serif;');
    expect(globals).toContain("--site-mono: var(--site-sans);");
  });

  it("verifies frosted window bar shell is mounted in playground.js DOM", () => {
    const js = fs.readFileSync(jsPath, "utf-8");

    expect(js).toContain("playground-window-shell");
    expect(js).toContain("playground-window-bar");
    expect(js).toContain("playground-window-dots");
    expect(js).toContain("playground-window-title");
  });

  it("verifies VS Code styling and 3 theme options (VS Code Dark, VS Code Light, Myco Forest)", () => {
    const css = fs.readFileSync(cssPath, "utf-8");
    const js = fs.readFileSync(jsPath, "utf-8");

    // All 3 theme variants defined in CSS
    expect(css).toContain('data-ide-theme="vscode-dark"');
    expect(css).toContain('data-ide-theme="vscode-light"');
    expect(css).toContain('data-ide-theme="myco-forest"');

    // VS Code Dark tokens
    expect(css).toContain("--ide-bg: #1e1e1e");
    expect(css).toContain("--ide-panel-bg: #252526");
    expect(css).toContain("--ide-statusbar-bg: #007acc");

    // VS Code Light tokens
    expect(css).toContain("--ide-bg: #ffffff");
    expect(css).toContain("--ide-panel-bg: #f3f3f3");

    // Myco Forest tokens
    expect(css).toContain("--ide-bg: #0b1a14");
    expect(css).toContain("--ide-statusbar-bg: #173e2b");

    // VS Code titlebar, tabs, breadcrumbs, statusbar
    expect(css).toContain(".playground-ide-window");
    expect(css).toContain(".playground-ide-titlebar");
    expect(css).toContain(".ide-traffic-lights");
    expect(css).toContain(".ide-tab-bar");
    expect(css).toContain(".ide-breadcrumbs-bar");
    expect(css).toContain(".ide-statusbar");
    expect(css).toContain(".theme-option-btn");

    // JS exposes theme switcher and binds buttons
    expect(js).toContain("setPlaygroundTheme");
    expect(js).toContain("theme-option-btn");
    expect(js).toContain("vscode-dark");
    expect(js).toContain("vscode-light");
    expect(js).toContain("myco-forest");

    // Results panel has generous bottom clearance to avoid cut-off and Ask Myco overlap
    expect(css).toContain("padding: 16px 20px 96px");
  });
});

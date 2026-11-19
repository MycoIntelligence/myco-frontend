import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Playground Responsive Layout Audit", () => {
  const cssPath = path.resolve(process.cwd(), "src/styles/playground.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  it("verifies Desktop (>= 1200px) two-column split layout", () => {
    // 2-column grid definition
    expect(css).toMatch(/\.playground-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.15fr\)\s*minmax\(0,\s*1fr\)/);
    // Editor on left, Agent col on right with appropriate heights
    expect(css).toContain(".playground-editor-col");
    expect(css).toContain(".playground-agent-col");
  });

  it("verifies Split-screen / Laptop (768px - 1024px) specifically around 800px", () => {
    // Media query covering 768px - 1024px
    expect(css).toContain("@media (max-width: 1024px) and (min-width: 768px)");

    // Both columns kept side-by-side with balanced 1fr 1fr columns
    const splitMatch = css.match(/@media \(max-width: 1024px\) and \(min-width: 768px\)\s*\{([\s\S]*?)\n\}/);
    expect(splitMatch).toBeDefined();
    const splitRules = splitMatch![1];

    expect(splitRules).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
    expect(splitRules).toContain("height: 680px");
    expect(splitRules).toContain("agent-stage-3d-wrap");
    expect(splitRules).toContain("report-panel");

    // Ensure selector bar does not force min-width: 280px causing right column cutoff
    expect(css).not.toMatch(/\.custom-select-wrap\s*\{[^}]*min-width:\s*280px/);
    expect(css).not.toMatch(/\.report-finding-select\s*\{[^}]*min-width:\s*280px/);
    expect(css).toMatch(/\.custom-select-wrap\s*\{[^}]*min-width:\s*0/);
    expect(css).toMatch(/\.report-finding-select\s*\{[^}]*min-width:\s*0/);

    // Report panel has overflow-x: hidden to prevent horizontal cutoff
    expect(css).toMatch(/\.report-panel\s*\{[^}]*overflow-x:\s*hidden/);

    // Toolbar sample display wrap does not force min-width: 380px at 800px
    expect(css).not.toMatch(/\.toolbar-sample-display-wrap\s*\{[^}]*min-width:\s*380px/);
    expect(css).toMatch(/\.toolbar-sample-display-wrap\s*\{[^}]*min-width:\s*0/);
  });

  it("verifies Toolbar buttons wrap cleanly and do not clip", () => {
    // Toolbar flex wrap
    expect(css).toMatch(/\.playground-toolbar\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.playground-toolbar__left\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.playground-toolbar__right\s*\{[^}]*flex-wrap:\s*wrap/);

    // Sample title truncates cleanly with ellipsis and min-width: 0
    expect(css).toMatch(/\.toolbar-sample-title\s*\{[^}]*text-overflow:\s*ellipsis/);
    expect(css).toMatch(/\.toolbar-sample-title\s*\{[^}]*min-width:\s*0/);

    // Toolbar buttons (+ Add Custom Code, Reset Limit) have clean styling
    expect(css).toContain(".toolbar-custom-btn");
    expect(css).toContain(".toolbar-dev-reset-btn");
  });

  it("verifies Editor Header responsiveness on narrow and split screens", () => {
    // Editor header wrapping under 1024px to prevent horizontal scrollbars on split-screen
    const headerQuery = css.match(/@media \(max-width: 1024px\)\s*\{([\s\S]*?)\n\}/);
    expect(headerQuery).toBeDefined();
    expect(headerQuery![1]).toContain(".editor-header");
    expect(headerQuery![1]).toContain("flex-wrap: wrap");
    expect(headerQuery![1]).toContain(".editor-tabs");
    expect(headerQuery![1]).toContain(".editor-meta");
  });

  it("verifies Tablet & Mobile (< 768px) stacked layout and non-excessive editor height", () => {
    // Single column stacked layout
    expect(css).toContain("@media (max-width: 767px)");
    const mobileGridMatch = css.match(/@media \(max-width: 767px\)\s*\{([\s\S]*?)\n\}/);
    expect(mobileGridMatch).toBeDefined();
    const mobileRules = mobileGridMatch![1];

    expect(mobileRules).toContain("grid-template-columns: 1fr");
    expect(mobileRules).toContain("height: auto");

    // Editor surface is NOT excessively tall (250px)
    expect(mobileRules).toContain("editor-surface-wrap");
    expect(mobileRules).toMatch(/height:\s*250px/);

    // 3D robot stage is compact (220px) so it's not pushed offscreen
    expect(mobileRules).toContain("agent-stage-3d-wrap");
    expect(mobileRules).toMatch(/height:\s*220px/);
  });

  it("verifies Report Panel elements do not cause horizontal overflow", () => {
    // Severity badges wrap cleanly
    expect(css).toMatch(/\.report-summary__sevs\s*\{[^}]*flex-wrap:\s*wrap/);

    // Progress steps wrap cleanly
    expect(css).toMatch(/\.progress-steps\s*\{[^}]*flex-wrap:\s*wrap/);

    // Code snippets in report have pre-wrap and break-all
    expect(css).toMatch(/\.report-evidence-code\s*\{[^}]*white-space:\s*pre-wrap/);
    expect(css).toMatch(/\.report-fix-code\s*\{[^}]*white-space:\s*pre-wrap/);

    // Report panel has 96px bottom padding to clear floating elements
    expect(css).toContain("padding: 16px 20px 96px;");
  });

  it("verifies VS Code titlebar and statusbar responsiveness", () => {
    // VS Code Titlebar media queries
    expect(css).toContain(".playground-ide-titlebar");
    expect(css).toMatch(/@media \(max-width: 900px\)\s*\{[\s\S]*?\.playground-ide-titlebar/);

    // Pinned action buttons in status bar
    expect(css).toMatch(/\.statusbar__right\s*\{[^}]*flex-shrink:\s*0/);
    expect(css).toMatch(/\.statusbar__right\s*\{[^}]*margin-left:\s*auto/);
    expect(css).toContain(".hide-mobile");
  });
});

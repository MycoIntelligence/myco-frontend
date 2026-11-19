import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Playground Functionality & Asset Verification", () => {
  const publicJsDir = path.resolve(process.cwd(), "public/static/js");

  it("ensures three.min.js exists and is complete", () => {
    const threePath = path.join(publicJsDir, "three.min.js");
    expect(fs.existsSync(threePath)).toBe(true);
    const stats = fs.statSync(threePath);
    expect(stats.size).toBeGreaterThan(500000); // ~600KB
  });

  it("ensures intelligence-core.js AST analysis engine loads and evaluates code", () => {
    const corePath = path.join(publicJsDir, "intelligence-core.js");
    expect(fs.existsSync(corePath)).toBe(true);

    // Require intelligence-core
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require(corePath);
    expect(typeof core.analyze).toBe("function");

    // Test 1: Clean code
    const cleanCode = `import { db } from "../database";
export async function getInvoice(id: string) {
  return await db.query("SELECT * FROM invoices WHERE id = $1", [id]);
}`;
    const cleanRes = core.analyze({
      primaryFile: { path: "src/billing.ts", content: cleanCode },
    });
    expect(cleanRes).toBeDefined();
    expect(cleanRes.isClean).toBe(true);

    // Test 2: Hardcoded Secret detection
    const secretCode = `const API_SECRET_TOKEN = "myco_test_fixture_dummy_token_99812";`;
    const secretRes = core.analyze({
      primaryFile: { path: "src/api.ts", content: secretCode },
    });
    expect(secretRes).toBeDefined();
    expect(secretRes.isClean).toBe(false);
    expect(secretRes.findings.length).toBeGreaterThan(0);
    expect(secretRes.isMergeBlocking).toBe(true);
  });

  it("ensures playground.js contains all required interactive features", () => {
    const playgroundPath = path.join(publicJsDir, "playground.js");
    expect(fs.existsSync(playgroundPath)).toBe(true);
    const code = fs.readFileSync(playgroundPath, "utf-8");

    // 1. CutePet3D robot engine & canvas
    expect(code).toContain("class CutePet3D");
    expect(code).toContain("playground-pet-canvas");
    expect(code).toContain("coffeeMug");
    expect(code).toContain("sipCooldown");
    expect(code).toContain("scanCone");
    expect(code).toContain("editor-scan-beam");
    expect(code).toContain("pet-bubble-text");

    // 2. Automated sample bicycle cycle
    expect(code).toContain("DEMO_EXAMPLES");
    expect(code).toContain("onAnalysisCycleComplete");
    expect(code).toContain("LOOP_SAMPLE_GAP_MS");

    // 3. Custom code input mode
    expect(code).toContain("enterCustomCodeMode");
    expect(code).toContain("Add Custom Code");
    expect(code).toContain("playground-code-input");
    expect(code).toContain("editor-clear-btn");
    expect(code).toContain("playground-run-btn");

    // 4. Analysis engine: 5 stages, findings, apply fix
    expect(code).toContain("1. Ingest");
    expect(code).toContain("2. Build Context");
    expect(code).toContain("3. Reason");
    expect(code).toContain("4. Validate");
    expect(code).toContain("5. Score &amp; Surface");
    expect(code).toContain("merge-rec-banner");
    expect(code).toContain("findings-cards-container");
    expect(code).toContain("Apply fix to editor");

    // 5. Context tabs (Code, PRD, Policy)
    expect(code).toContain("tab-btn-code");
    expect(code).toContain("tab-btn-prd");
    expect(code).toContain("tab-btn-policy");
    expect(code).toContain("switchContextTab");

    // 6. Word counter & line numbers
    expect(code).toContain("500");
    expect(code).toContain("countWords");
    expect(code).toContain("editor-word-count-badge");
    expect(code).toContain("editor-gutter");
    expect(code).toContain("renderGutter");

    // 7. Modals
    expect(code).toContain("demo-policy-modal-backdrop");
    expect(code).toContain("showWordLimitModal");
    expect(code).toContain("showDemoPolicyModal");

    // 8. VS Code Theme Switcher & IDE Elements
    expect(code).toContain("setPlaygroundTheme");
    expect(code).toContain("vscode-dark");
    expect(code).toContain("vscode-light");
    expect(code).toContain("myco-forest");
    expect(code).toContain("myco-ide-theme");
    expect(code).toContain("ide-breadcrumbs-bar");
    expect(code).toContain("ide-statusbar");

    // 9. Keyboard shortcut
    expect(code).toContain("runAnalysis()");
  });

  it("ensures VS Code style rules and clear-view padding are in playground.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles/playground.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, "utf-8");

    // Theme rules
    expect(css).toContain('[data-ide-theme="vscode-dark"]');
    expect(css).toContain('[data-ide-theme="vscode-light"]');
    expect(css).toContain('[data-ide-theme="myco-forest"]');

    // Report padding clearance
    expect(css).toContain("padding: 16px 20px 96px;");
  });

  it("ensures Playground.tsx mounts properly", () => {
    const componentPath = path.resolve(process.cwd(), "src/components/Playground.tsx");
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, "utf-8");
    expect(content).toContain("three.min.js");
    expect(content).toContain("intelligence-core.js");
    expect(content).toContain("playground.js");
    expect(content).toContain("playground-mount-target");
  });
});

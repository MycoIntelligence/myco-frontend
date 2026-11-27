import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { prdCopy } from "../src/marketing/prd-verification-copy";

describe("Playground PRD Example Synchronization", () => {
  const playgroundJsPath = path.resolve(
    process.cwd(),
    "public/static/js/playground.js"
  );
  const playgroundJs = fs.readFileSync(playgroundJsPath, "utf-8");

  const cssPath = path.resolve(process.cwd(), "src/styles/playground.css");
  const playgroundCss = fs.readFileSync(cssPath, "utf-8");

  // Extract the spec_mismatch example block
  const specMismatchBlockMatch = playgroundJs.match(
    /\{\s*id:\s*"spec_mismatch"[\s\S]*?id:\s*"div_zero"/
  );

  it("finds the spec_mismatch example in playground.js", () => {
    expect(specMismatchBlockMatch).not.toBeNull();
  });

  const block = specMismatchBlockMatch ? specMismatchBlockMatch[0] : "";
  const ex = prdCopy.playgroundExample;

  it("matches prdCopy finding id", () => {
    expect(block).toContain(`id: "${ex.id}"`);
  });

  it("matches prdCopy requirement and document reference", () => {
    expect(block).toContain(ex.requirement);
    expect(block).toContain(ex.documentReferenceLabel);
  });

  it("matches prdCopy expected and actual behaviour", () => {
    expect(block).toContain(ex.expected);
    expect(block).toContain(ex.actual);
  });

  it("matches prdCopy mismatch title and result label", () => {
    expect(block).toContain(ex.mismatch);
    expect(block).toContain(`resultLabel: "${ex.resultLabel}"`);
  });

  it("matches prdCopy severity and qualitative confidence", () => {
    expect(block).toContain(`severity: "${ex.severity}"`);
    expect(block).toContain(`confidence: "${ex.confidence}"`);
    // Ensure numerical confidence percentage is absent
    expect(block).not.toMatch(/confidence:\s*"\d+%"/);
  });

  it("matches prdCopy evidence file, lines, and code excerpt", () => {
    expect(block).toContain(ex.evidenceFile);
    expect(block).toContain(ex.evidenceLines);
    expect(block).toContain(ex.codeExcerpt);
  });

  it("matches prdCopy impact and recommended action", () => {
    expect(block).toContain(ex.impact);
    expect(block).toContain(ex.recommendedAction);
  });

  it("ensures the PRD finding is not merge blocking", () => {
    expect(block).toContain("mergeBlocking: false");
    expect(block).not.toContain("mergeBlocking: true");
  });

  it("ensures the Jira ticket shows as not created yet (waiting for confirmation)", () => {
    expect(block).toMatch(/status:\s*"Not created yet \(waiting for confirmation\)"/);
    expect(block).not.toMatch(/status:\s*"Created · Assigned"/);
  });

  it("labels suggested patch as an illustrative suggestion and never as applied", () => {
    expect(block).toContain("// Illustrative suggestion:");
  });

  describe("PRD Decision Step Implementation (Requirements 4 & 5)", () => {
    it("contains the engineer decision panel in playground.js with illustrative label", () => {
      expect(playgroundJs).toContain('class="prd-decision-panel"');
      expect(playgroundJs).toContain("Engineer decision");
      expect(playgroundJs).toContain("ILLUSTRATIVE EXAMPLE");
      expect(playgroundJs).toContain("Illustrative example · Demonstrates human engineering review on pull requests");
    });

    it("renders all three decision choice buttons matching prdCopy.decisionOptions", () => {
      for (const opt of prdCopy.decisionOptions) {
        expect(playgroundJs).toContain(`data-choice="${opt.id}"`);
        expect(playgroundJs).toContain(opt.label);
      }
    });

    it("uses real semantic button elements and accessible attributes", () => {
      expect(playgroundJs).toContain('type="button" class="prd-decision-btn');
      expect(playgroundJs).toContain('role="region" aria-label="Engineer decision on requirement mismatch"');
      expect(playgroundJs).toContain('role="group" aria-label="Decision choices"');
      expect(playgroundJs).toContain('id="prd-decision-result" aria-live="polite"');
    });

    // Extract getPrdDecisionResultHtml function from playground.js to test the three flows
    const fnMatch = playgroundJs.match(
      /const getPrdDecisionResultHtml = \(([\s\S]*?)\n    \};/
    );

    it("extracts getPrdDecisionResultHtml for flow verification", () => {
      expect(fnMatch).not.toBeNull();
    });

    const getPrdDecisionResultHtml: (choice: string, ticketDone: boolean) => string = (() => {
      if (!fnMatch) return () => "";
      const script = new vm.Script(`${fnMatch[0]}; getPrdDecisionResultHtml;`);
      const context = vm.createContext({});
      return script.runInContext(context);
    })();

    it("verifies Flow 1 (PRD outdated): requires confirmation click before showing Jira ticket", () => {
      // Step 1: choosing 'prd_outdated' shows recorded decision and explanation
      const beforeConfirm = getPrdDecisionResultHtml("prd_outdated", false);
      expect(beforeConfirm).toContain("The PRD is outdated or incorrect");
      expect(beforeConfirm).toContain("Product Spec §4.2 being updated to 10 attempts");
      expect(beforeConfirm).toContain("Create Jira ticket");
      // Ticket card must NOT appear before confirm click
      expect(beforeConfirm).not.toContain("prd-ticket-card");
      expect(beforeConfirm).not.toContain("PRD-1-UPDATE");

      // Step 2: after confirmation click, ticket card appears
      const afterConfirm = getPrdDecisionResultHtml("prd_outdated", true);
      expect(afterConfirm).toContain("prd-ticket-card");
      expect(afterConfirm).toContain("PRD-1-UPDATE");
      expect(afterConfirm).toContain("PRD UPDATE TICKET");
      expect(afterConfirm).toContain("Update Product Spec §4.2 · Account Lockout");
      expect(afterConfirm).toContain("CREATED · ASSIGNED");
    });

    it("verifies Flow 2 (PR implementation incorrect): requires confirmation click before showing Jira ticket", () => {
      // Step 1: choosing 'pr_incorrect' shows recorded decision and explanation
      const beforeConfirm = getPrdDecisionResultHtml("pr_incorrect", false);
      expect(beforeConfirm).toContain("The PR implementation is incorrect");
      expect(beforeConfirm).toContain("Missing account lockout handler in src/auth/loginService.ts");
      expect(beforeConfirm).toContain("Create Jira ticket");
      // Ticket card must NOT appear before confirm click
      expect(beforeConfirm).not.toContain("prd-ticket-card");
      expect(beforeConfirm).not.toContain("PRD-1-FIX");

      // Step 2: after confirmation click, fix ticket card appears
      const afterConfirm = getPrdDecisionResultHtml("pr_incorrect", true);
      expect(afterConfirm).toContain("prd-ticket-card");
      expect(afterConfirm).toContain("PRD-1-FIX");
      expect(afterConfirm).toContain("FIX IMPLEMENTATION TICKET");
      expect(afterConfirm).toContain("Implement account lockout after 5 consecutive failed login attempts");
      expect(afterConfirm).toContain("CREATED · ASSIGNED");
    });

    it("verifies Flow 3 (Needs clarification): keeps finding open and offers NO Jira ticket", () => {
      const clarification = getPrdDecisionResultHtml("needs_clarification", false);
      expect(clarification).toContain("Needs clarification");
      expect(clarification).toContain("Inquire with security team regarding whether rate-limiting or lockout takes precedence");
      expect(clarification).toContain("STATUS: FINDING KEPT OPEN");
      expect(clarification).toContain("Finding kept open for clarification");
      // Must NOT contain confirm button or ticket card
      expect(clarification).not.toContain("prd-confirm-ticket-btn");
      expect(clarification).not.toContain("Create Jira ticket");
      expect(clarification).not.toContain("prd-ticket-card");
    });

    it("verifies CSS styling rules for decision panel, focus states, reduced motion, and responsiveness", () => {
      expect(playgroundCss).toContain(".prd-decision-panel");
      expect(playgroundCss).toContain(".prd-decision-btn");
      expect(playgroundCss).toContain(".prd-decision-btn:focus-visible");
      expect(playgroundCss).toContain(".prd-ticket-confirm-btn:focus-visible");
      expect(playgroundCss).toContain(".prd-ticket-card");
      expect(playgroundCss).toContain(".prd-clarification-banner");

      // Reduced motion media query
      expect(playgroundCss).toContain("@media (prefers-reduced-motion: reduce)");

      // Mobile responsiveness down to 390px width
      expect(playgroundCss).toContain("@media (max-width: 600px)");
    });
  });
});

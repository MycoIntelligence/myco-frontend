import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { prdCopy } from "../src/marketing/prd-verification-copy";

// Synchronized with scripts/check-no-reference-copy.mjs to keep forbidden phrases in sync
const FORBIDDEN_PHRASES = [
  "veldt",
  "kairo",
  "oligo",
  "oligo.security",
  "kangaroo",
  "own your security",
  "secure every change",
  "behavioral security",
  "ransomware",
  "software never stands still",
  "snapshots",
];

// Emoji pattern synchronized with scripts/check-no-emoji.mjs
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{FE0F}\u{20E3}]/gu;
const ALLOWED_SIGNS = new Set(["\u00A9", "\u00AE", "\u2122"]);

function collectAllStrings(obj: unknown): string[] {
  const strings: string[] = [];
  function recurse(val: unknown) {
    if (typeof val === "string") {
      strings.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(recurse);
    } else if (val && typeof val === "object") {
      Object.values(val).forEach(recurse);
    }
  }
  recurse(obj);
  return strings;
}

describe("PRD Copy Module Contract Tests", () => {
  const allCopyStrings = collectAllStrings(prdCopy);

  it("exports a populated, typed prdCopy object with all expected root sections", () => {
    expect(prdCopy).toBeDefined();
    expect(prdCopy.availability).toBe("live");
    expect(prdCopy.featureSection.heading).toBeTruthy();
    expect(prdCopy.featureSection.paragraph1).toBeTruthy();
    expect(prdCopy.featureSection.paragraph2).toBeTruthy();
    expect(prdCopy.highlights.length).toBeGreaterThan(0);
    expect(prdCopy.documentSources.sources.length).toBe(6);
    expect(prdCopy.documentSources.accessNote).toBeTruthy();
    expect(prdCopy.requirementResults).toEqual([
      "Implemented",
      "Partially implemented",
      "Not implemented",
      "Contradicted",
      "Unverifiable",
    ]);
    expect(prdCopy.decisionOptions.length).toBe(3);
    expect(prdCopy.ticketRules.condition).toBeTruthy();
    expect(prdCopy.ticketRules.confirmation).toBeTruthy();
    expect(prdCopy.ticketRules.explicitRequirement).toBeTruthy();
    expect(prdCopy.ticketRules.neverAutonomous).toBeTruthy();
    expect(prdCopy.assistantAnswers.overview).toBeTruthy();
    expect(prdCopy.assistantAnswers.sources).toBeTruthy();
    expect(prdCopy.assistantAnswers.tickets).toBeTruthy();
    expect(prdCopy.assistantAnswers.unreadableDocument).toBeTruthy();
    expect(prdCopy.faqItems.length).toBe(3);
    expect(prdCopy.securitySentence).toBeTruthy();
    expect(prdCopy.playgroundExample.id).toBe("PRD-1");
  });

  it("contains zero emoji across all strings", () => {
    for (const str of allCopyStrings) {
      for (const m of str.matchAll(EMOJI)) {
        if (!ALLOWED_SIGNS.has(m[0])) {
          throw new Error(`Disallowed emoji character found in prdCopy: "${m[0]}" in "${str}"`);
        }
      }
    }
  });

  it("contains none of the forbidden phrases from scripts/check-no-reference-copy.mjs", () => {
    for (const str of allCopyStrings) {
      const lower = str.toLowerCase();
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(lower).not.toContain(phrase);
      }
    }
  });

  it("contains none of the banned claims from rule 08", () => {
    for (const str of allCopyStrings) {
      const lower = str.toLowerCase();
      // No numerical percentage / accuracy claims
      expect(str).not.toContain("%");
      // No guarantee claims
      expect(lower).not.toMatch(/\bguarantee(s|d)?\b/);
      // No claims of automatically creating tickets
      expect(lower).not.toMatch(/automatically creates? tickets?/);
      expect(lower).not.toMatch(/creates? tickets? automatically/);
      // No claim that Myco blocks merges (only negative/non-blocking statements or clarifying FAQ questions allowed)
      if (lower.includes("block") && lower.includes("merge")) {
        if (!str.endsWith("?")) {
          expect(lower).toMatch(/(never.*blocks? a merge|without .*blocking merges)/);
        }
      }
      // No claim that Myco fixes code on its own
      if (lower.includes("changes code")) {
        expect(lower).toMatch(/never changes code/);
      }
    }
  });

  it("ensures beta wording is present when availability is beta", () => {
    if (prdCopy.availability === "beta") {
      const combined = (
        prdCopy.featureSection.betaBadge +
        " " +
        prdCopy.featureSection.paragraph1 +
        " " +
        allCopyStrings.join(" ")
      ).toLowerCase();
      expect(combined.includes("beta") || combined.includes("we’re building") || combined.includes("we're building")).toBe(true);
    }
  });

  it("conforms to FACTS.md sample requirement, finding, and summary values", () => {
    const ex = prdCopy.playgroundExample;
    expect(ex.requirement).toBe("Users should be locked out after five consecutive failed login attempts.");
    expect(ex.expected).toBe("Users should be locked out after five consecutive failed login attempts.");
    expect(ex.actual).toBe(
      "The implementation tracks failed login attempts but does not prevent further login attempts after five consecutive failures."
    );
    expect(ex.mismatch).toBe("Account lockout requirement is not implemented.");
    expect(ex.resultLabel).toBe("Not implemented");
    expect(ex.impact).toBe("The implementation does not satisfy the documented authentication requirement.");
    expect(ex.recommendedAction).toBe("Review and implement the missing account lockout behavior.");
    expect(ex.summaryLines.documentsAnalyzed).toBe(1);
    expect(ex.summaryLines.requirementsIdentified).toBe(10);
    expect(ex.summaryLines.correctlyImplemented).toBe(7);
    expect(ex.summaryLines.potentialMismatches).toBe(2);
    expect(ex.summaryLines.unverifiable).toBe(1);
    expect(ex.summaryLines.findingsRequiringHumanReview).toEqual([
      "Account lockout mechanism is missing",
      "Token expiry duration contradicts the PRD",
    ]);
  });

  it("verifies that only expected marketing files import prd-verification-copy.ts", () => {
    const rootDir = process.cwd();
    const searchDirs = ["app", "components", "lib", "src", "public"];
    const importingFiles: string[] = [];

    function scan(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(full);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !full.endsWith("prd-verification-copy.ts")) {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes("prd-verification-copy")) {
            importingFiles.push(path.relative(rootDir, full).replace(/\\/g, "/"));
          }
        }
      }
    }

    for (const d of searchDirs) {
      scan(path.join(rootDir, d));
    }

    expect(importingFiles).toEqual(["src/marketing/feature-data.ts"]);
  });

  it("verifies that security page includes prdCopy.securitySentence", () => {
    const rootDir = process.cwd();
    const securityContent = fs.readFileSync(path.join(rootDir, "src/marketing/security.tsx"), "utf-8");
    expect(securityContent).toContain(prdCopy.securitySentence);
  });
});

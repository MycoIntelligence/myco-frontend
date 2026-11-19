import { describe, it, expect } from "vitest";
import { siteContent } from "@/lib/content";

describe("Content shape", () => {
  it("contains all required top-level sections", () => {
    expect(siteContent.brand.name).toBe("Myco");
    expect(siteContent.hero.headlineLine1).toBe("AI WRITES THE CODE.");
    expect(siteContent.hero.headlineLine2).toBe("MYCO UNDERSTANDS IT.");
    expect(siteContent.problemTimeline.statements.length).toBe(3);
    expect(siteContent.howItWorks.cards.length).toBe(4);
    expect(siteContent.caseSteps.steps.length).toBe(4);
    expect(siteContent.proof.cards.length).toBe(5);
    expect(siteContent.whyList.items.length).toBe(5);
    expect(siteContent.industries.items.length).toBe(6);
    expect(siteContent.latest.posts.length).toBe(3);
    expect(siteContent.footer.columns.length).toBe(3);
  });
});


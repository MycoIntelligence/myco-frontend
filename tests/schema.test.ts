import { describe, it, expect } from "vitest";
import { demoFormSchema } from "@/lib/schema";

describe("Demo Form Schema", () => {
  it("accepts valid corporate email and complete fields", () => {
    const validData = {
      fullName: "Alex Vance",
      workEmail: "alex@enterprise-cloud.io",
      company: "Enterprise Cloud",
      industry: "Payments",
      teamSize: "51 to 200",
      message: "Looking for behavioral testing on payment services.",
      website: "",
    };

    const result = demoFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects free email domains", () => {
    const freeData = {
      fullName: "Alex Vance",
      workEmail: "alex@gmail.com",
      company: "Independent",
      industry: "Payments",
      teamSize: "1 to 10",
      message: "",
      website: "",
    };

    const result = demoFormSchema.safeParse(freeData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("corporate work email");
    }
  });

  it("validates empty or honeypot website field", () => {
    const dataWithHoneypot = {
      fullName: "Alex Vance",
      workEmail: "alex@acme.corp",
      company: "Acme Corp",
      industry: "Telecom",
      teamSize: "11 to 50",
      website: "http://spam-bot.site",
    };

    const result = demoFormSchema.safeParse(dataWithHoneypot);
    expect(result.success).toBe(true);
  });
});


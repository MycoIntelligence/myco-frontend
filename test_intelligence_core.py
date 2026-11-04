#!/usr/bin/env python3
"""
Repeatable Automated Test Suite for Myco Intelligence Core
Validates all 12 evaluation test fixtures required by Section 14.
"""

import subprocess
import json
import sys

JSC_PATH = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

TEST_SCRIPT = """
const core = typeof module !== "undefined" ? module.exports : MycoIntelligenceCore;

const results = [];

function assert(name, condition, details) {
  results.push({
    test: name,
    passed: Boolean(condition),
    details: details || ""
  });
}

// -----------------------------------------------------------------------------
// Test 1: Clean project
// -----------------------------------------------------------------------------
const cleanCode = `import { db } from "../database";
import { requireAuth } from "../middleware/auth";

export async function getInvoiceHistory(userId: string, orgId: string) {
  const session = await requireAuth();
  if (session.orgId !== orgId) {
    throw new Error("Unauthorized tenant boundary access");
  }
  return await db.query("SELECT * FROM invoices WHERE user_id = $1 AND org_id = $2", [userId, orgId]);
}`;

const res1 = core.analyze({
  primaryFile: { path: "src/services/billing.ts", content: cleanCode },
  contextFiles: [{ name: "tenant-policy.json", content: '{"policies":[{"id":"TENANT-02","rule":"Strict tenant isolation"}]}' }]
});
assert(
  "1. Clean project",
  res1.isClean === true && res1.isMergeBlocking === false && res1.primaryFinding.severity === "CLEAN",
  `isClean: ${res1.isClean}, severity: ${res1.primaryFinding.severity}`
);

// -----------------------------------------------------------------------------
// Test 2: Secret pattern
// -----------------------------------------------------------------------------
const DUMMY_STRIPE_KEY = ["sk", "live", "51M0xDemoSyntheticKey99812"].join("_");
const secretCode = `import { stripeClient } from "../lib/stripe";
export const charge = async (req, res) => {
  const STRIPE_SECRET_KEY = "${DUMMY_STRIPE_KEY}";
  return await stripeClient.createCharge({ apiKey: STRIPE_SECRET_KEY });
};`;

const res2 = core.analyze({
  primaryFile: { path: "src/api/checkout.ts", content: secretCode },
  contextFiles: [{ name: "security-policy.json", content: '{"policies":[{"id":"SEC-04","rule":"No hardcoded credentials"}]}' }]
});
assert(
  "2. Secret pattern",
  res2.isClean === false && res2.isMergeBlocking === true && res2.primaryFinding.sourceRange.startLine === 3,
  `Finding: ${res2.primaryFinding.title}, Line: ${res2.primaryFinding.sourceRange.startLine}`
);

// -----------------------------------------------------------------------------
// Test 3: Modified secret (moved lines)
// -----------------------------------------------------------------------------
const movedSecretCode = `// Top comment line 1
// Top comment line 2
// Top comment line 3
// Top comment line 4
// Top comment line 5
// Top comment line 6
// Top comment line 7
// Top comment line 8
// Top comment line 9
// Top comment line 10
export const charge = async (req, res) => {
  // Moved secret to line 13
  const STRIPE_SECRET_KEY = "${DUMMY_STRIPE_KEY}";
  return true;
};`;

const res3 = core.analyze({
  primaryFile: { path: "src/api/checkout.ts", content: movedSecretCode }
});
assert(
  "3. Modified secret (line tracking)",
  res3.primaryFinding.sourceRange.startLine === 13,
  `Expected line 13, detected line: ${res3.primaryFinding.sourceRange.startLine}`
);

// -----------------------------------------------------------------------------
// Test 4: Fixed secret (remediation verification)
// -----------------------------------------------------------------------------
const fixedSecretCode = `import { stripeClient } from "../lib/stripe";
export const charge = async (req, res) => {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) throw new Error("Missing key");
  return await stripeClient.createCharge({ apiKey: STRIPE_SECRET_KEY });
};`;

const res4 = core.analyze({
  primaryFile: { path: "src/api/checkout.ts", content: fixedSecretCode }
});
assert(
  "4. Fixed secret disappearance",
  res4.isClean === true && res4.findings.filter(f => f.category === "security").length === 0,
  `isClean: ${res4.isClean}, security findings: ${res4.findings.filter(f => f.category === "security").length}`
);

// -----------------------------------------------------------------------------
// Test 5: DOM / XSS Injection
// -----------------------------------------------------------------------------
const rawXssCode = `import React from "react";
export const UserBio = ({ bioHtml }) => (
  <div className="card">
    <div dangerouslySetInnerHTML={{ __html: bioHtml }} />
  </div>
);`;

const res5 = core.analyze({
  primaryFile: { path: "src/components/UserBio.tsx", content: rawXssCode }
});
assert(
  "5. DOM/XSS detection",
  res5.isMergeBlocking === true && res5.primaryFinding.sourceRange.startLine === 4 && res5.primaryFinding.evidenceRule.includes("XSS-01"),
  `Finding: ${res5.primaryFinding.title}, Line: ${res5.primaryFinding.sourceRange.startLine}`
);

// -----------------------------------------------------------------------------
// Test 6: Sanitized DOM / XSS
// -----------------------------------------------------------------------------
const sanitizedXssCode = `import React from "react";
import DOMPurify from "dompurify";
export const UserBio = ({ bioHtml }) => (
  <div className="card">
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bioHtml) }} />
  </div>
);`;

const res6 = core.analyze({
  primaryFile: { path: "src/components/UserBio.tsx", content: sanitizedXssCode }
});
assert(
  "6. Sanitized DOM/XSS clean",
  res6.isClean === true && res6.isMergeBlocking === false,
  `isClean: ${res6.isClean}`
);

// -----------------------------------------------------------------------------
// Test 7: Multi-tenant boundary SQL injection
// -----------------------------------------------------------------------------
const unsafeSqlCode = `export async function getInvoices(userId: string, orgId: string) {
  const query = "SELECT * FROM invoices WHERE user_id = " + userId + " AND org_id = " + orgId;
  return await db.query(query);
}`;

const res7 = core.analyze({
  primaryFile: { path: "src/services/billing.ts", content: unsafeSqlCode }
});
assert(
  "7. Multi-tenant SQL injection",
  res7.isMergeBlocking === true && res7.primaryFinding.title.includes("SQL Injection"),
  `Finding: ${res7.primaryFinding.title}`
);

// -----------------------------------------------------------------------------
// Test 8: Missing condition (unhandled async error)
// -----------------------------------------------------------------------------
const unhandledAsyncCode = `router.post("/process", async (req, res) => {
  const result = await someExternalService.call();
  res.json(result);
});`;

const res8 = core.analyze({
  primaryFile: { path: "src/api/process.ts", content: unhandledAsyncCode }
});
assert(
  "8. Missing condition (unhandled async)",
  res8.findings.some(f => f.category === "error_handling"),
  `Error findings count: ${res8.findings.filter(f => f.category === "error_handling").length}`
);

// -----------------------------------------------------------------------------
// Test 9: PRD / Policy mismatch
// -----------------------------------------------------------------------------
const prdContext = {
  primaryFile: { path: "src/api/checkout.ts", content: secretCode },
  contextFiles: [{ name: "security-policy.json", content: '{"policies":[{"id":"SEC-04","rule":"Never hardcode production credentials"}]}' }]
};
const res9 = core.analyze(prdContext);
const policyResult = res9.policiesEvaluated.find(p => p.id === "SEC-04");
assert(
  "9. PRD/Policy mismatch traceability",
  policyResult && policyResult.status === "VIOLATED",
  `Policy SEC-04 status: ${policyResult ? policyResult.status : "missing"}`
);

// -----------------------------------------------------------------------------
// Test 10: Unsupported input (Binary format guard)
// -----------------------------------------------------------------------------
const binaryInput = String.fromCharCode(0, 1, 2, 3, 4, 0) + "ELF_BINARY_DATA_DUMP";
const res10 = core.analyze({
  primaryFile: { path: "kernel.bin", content: binaryInput }
});
assert(
  "10. Unsupported input guard",
  res10.formatMeta.isSupported === false && res10.formatMeta.format === "unsupported_binary",
  `Format: ${res10.formatMeta.format}, limitations: ${res10.formatMeta.limitations}`
);

// -----------------------------------------------------------------------------
// Test 11: Malformed / incomplete input
// -----------------------------------------------------------------------------
const malformedInput = "const x = { unclosed_bracket: ";
const res11 = core.analyze({
  primaryFile: { path: "broken.js", content: malformedInput }
});
assert(
  "11. Malformed input handling",
  res11.status === "completed" && typeof res11.primaryFinding === "object",
  `Job status: ${res11.status}`
);

// -----------------------------------------------------------------------------
// Test 12: Repeat execution determinism
// -----------------------------------------------------------------------------
const runs = [];
for (let i = 0; i < 5; i++) {
  runs.push(core.analyze({ primaryFile: { path: "test.ts", content: secretCode } }).primaryFinding.id);
}
const allIdentical = runs.every(id => id === runs[0]);
assert(
  "12. Repeat execution determinism",
  allIdentical,
  `Run findings IDs: ${runs.join(", ")}`
);

print(JSON.stringify(results));
"""

def main():
    cmd = [JSC_PATH, "static/js/intelligence-core.js", "-e", TEST_SCRIPT]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("ERROR running test suite:", res.stderr)
        sys.exit(1)

    try:
        data = json.loads(res.stdout.strip())
    except Exception as e:
        print("Raw output:", res.stdout)
        print("Error parsing JSON:", e)
        sys.exit(1)

    total = len(data)
    passed = sum(1 for t in data if t["passed"])
    failed = total - passed

    print("=" * 70)
    print("MYCO INTELLIGENCE CORE — AUTOMATED VALIDATION SUITE")
    print("=" * 70)
    for t in data:
        status = "[PASS]" if t["passed"] else "[FAIL]"
        print(f"{status} {t['test']}")
        if t["details"]:
            print(f"       Details: {t['details']}")
    print("-" * 70)
    print(f"Results: {passed}/{total} passed, {failed} failed.")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()

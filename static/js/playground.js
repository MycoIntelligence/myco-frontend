/* Myco — AI-Powered Code Analysis & Risk Intelligence Interface */
(() => {
  /* Word limit boundaries for custom PR code submissions (0 to 1,200 words) */
  const WORD_LIMITS = {
    MIN: 0,
    MAX: 1200
  };

  /* Official contact destination for enterprise pilot evaluations */
  const PILOT_CONTACT_URL = (typeof window !== "undefined" && window.MYCO_PILOT_CONTACT_URL)
    ? window.MYCO_PILOT_CONTACT_URL
    : "#contact";

  /* Word counting algorithm matching backend CustomCodeWordValidator:
   * Tokens matching [A-Za-z0-9_]+ are counted as words.
   * Whitespace and punctuation act as word boundaries.
   */
  const countWords = (text) => {
    if (!text || typeof text !== "string") return 0;
    const matches = text.match(/[A-Za-z0-9_]+/g);
    return matches ? matches.length : 0;
  };

  /*
   * Preset Demo Examples (Section 7):
   * 7 distinct, realistic engineering code review inputs.
   */
  const DEMO_EXAMPLES = [
    {
      id: "pr_4827",
      title: "PR #4827: Tool Approval Bypass",
      shortTitle: "1. PR #4827 (AGENT-12)",
      category: "Policy / Tool Approval Bypass",
      repo: "agent-runner",
      branch: "fix/tool-retry",
      author: "sarah-c",
      prNumber: 4827,
      fileName: "src/runner/agent-runner.ts",
      lang: "TypeScript",
      badge: "P0 BLOCKER",
      badgeClass: "is-p0",
      description: "Homepage Proof: Exponential backoff retry loop skips toolPolicy.requiresApproval gate defined in AGENT-12.",
      prd: {
        id: "AGENT-12",
        title: "Requirement AGENT-12: Tool Execution Approval",
        text: `REQUIREMENT (AGENT-12):
"All tool invocations with external side effects require explicit approval before execution. Approval checks must not be bypassed across automated retry loops or backoff mechanisms."`
      },
      policy: {
        id: "AGENT-GOVERNANCE",
        rule: "Deny unapproved side effects. All agent tool executions with mutating side effects must evaluate requiresApproval gate."
      },
      code: `import { toolPolicy } from "../security/policy";
import { backoff } from "../utils/timer";

export class AgentRunner {
  /**
   * REQUIREMENT (AGENT-12):
   * "All tool invocations with external side effects require explicit approval before execution."
   */
  async executeWithRetry(tool: any, params: any, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // BYPASS: Direct tool execution skips toolPolicy.requiresApproval check on retry
        return await tool.execute(params);
      } catch (e) {
        await backoff(i);
      }
    }
    throw new Error("Tool execution failed after " + maxRetries + " attempts");
  }
}`,
      targetLine: 14,
      targetRange: "L12-L16",
      finding: {
        id: "AGENT-12-APPROVAL-BYPASS",
        title: "Requirement Violation: Tool Approval Policy Bypassed on Retry Path",
        category: "Specification Compliance / Tool Approval",
        severity: "CRITICAL",
        confidence: "98%",
        filePath: "src/runner/agent-runner.ts",
        lineStart: 14,
        lineEnd: 16,
        evidence: "return await tool.execute(params); // Bypasses toolPolicy.requiresApproval at AgentRunner:87",
        evidenceRule: "AGENT-12 · MANDATORY TOOL APPROVAL",
        explanation: "PR #4827 wraps flaky tool calls in an exponential backoff loop. The retry path executes tool.execute(params) directly without re-verifying toolPolicy.requiresApproval, violating safety requirement AGENT-12.",
        impact: "Tools with external side effects (database writes, notifications, billing API calls) execute unapproved on retry attempts, violating enterprise safety invariants.",
        suggestedFix: "Route retried tool executions through the approval gate: verify toolPolicy.requiresApproval(tool) before invoking tool.execute(params).",
        suggestedPatch: `        // FIX: Re-verify tool approval invariant before dispatching retry
        if (toolPolicy.requiresApproval(tool)) {
          const approved = await toolPolicy.requestApproval(tool, params);
          if (!approved) throw new Error("Tool execution denied by policy AGENT-12");
        }
        return await tool.execute(params);`,
        fixedCode: `import { toolPolicy } from "../security/policy";
import { backoff } from "../utils/timer";

export class AgentRunner {
  /**
   * REQUIREMENT (AGENT-12):
   * "All tool invocations with external side effects require explicit approval before execution."
   */
  async executeWithRetry(tool: any, params: any, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // FIX: Re-verify tool approval invariant before dispatching retry
        if (toolPolicy.requiresApproval(tool)) {
          const approved = await toolPolicy.requestApproval(tool, params);
          if (!approved) throw new Error("Tool execution denied by policy AGENT-12");
        }
        return await tool.execute(params);
      } catch (e) {
        await backoff(i);
      }
    }
    throw new Error("Tool execution failed after " + maxRetries + " attempts");
  }
}`,
        mergeBlocking: true,
        mergeReason: "Merge Blocker: Critical bypass of AI safety constraint AGENT-12 (Tool Execution Approval)."
      },
      jiraTicket: {
        id: "AGENT-12",
        summary: "Tool Approval Bypass in AgentRunner Retry Loop",
        priority: "Highest",
        type: "Safety Policy Violation",
        status: "Created · Assigned",
        assignee: "AI Platform Security",
        description: "PR #4827 skips toolPolicy.requiresApproval on retry path. Violates AGENT-12."
      },
      slackAlert: {
        channel: "#agent-security",
        thread: "Incident-4827-AGENT-12",
        preview: "BLOCKER: PR #4827 bypasses AGENT-12 tool approval gate",
        severity: "P0 CRITICAL",
        detail: "src/runner/agent-runner.ts flagged by Myco. Tool execution policy bypassed on retry path."
      },
      customApp: {
        endpoint: "https://api.internal/v1/agent-governance",
        event: "POLICY_BYPASS_DETECTED",
        payloadSummary: '{"pr":4827,"rule":"AGENT-12","file":"agent-runner.ts","severity":"CRITICAL"}',
        latency: "29ms"
      }
    },

    {
      id: "secret",
      title: "Potentially Exposed API Secret",
      shortTitle: "2. API Secret",
      category: "Security / Credential Exposure",
      repo: "myco-org/payments-service",
      branch: "feat/retry-checkout",
      fileName: "src/services/stripeBilling.ts",
      lang: "TypeScript",
      badge: "P0 CRITICAL",
      badgeClass: "is-p0",
      description: "Code containing credential-like string assigned to an API key variable.",
      prd: {
        id: "SEC-04",
        title: "Requirement SEC-04: Credential Safety Invariant",
        text: `REQUIREMENT (SEC-04):
"Production API credentials, secret tokens, and private keys MUST NOT be hardcoded in version control. All secrets must be dynamically injected via environment variables or HashiCorp Vault."`
      },
      policy: {
        id: "CREDENTIAL-SAFETY",
        rule: "DENY any hardcoded secret strings, tokens, or credentials in any committed source file."
      },
      code: `import { Stripe } from "stripe";

// Retry customer checkout session with exponential backoff
export async function retryCheckoutSession(sessionId: string, attemptCount: number) {
  // Potentially exposed active secret key in source
  const STRIPE_SECRET_KEY = "sk_live_51M0xDemoSyntheticKey99812_REVOKED";

  const client = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    maxNetworkRetries: 3,
  });

  try {
    const session = await client.checkout.sessions.retrieve(sessionId);
    return { success: true, status: session.status };
  } catch (error) {
    if (attemptCount < 3) {
      return retryCheckoutSession(sessionId, attemptCount + 1);
    }
    throw new Error("Checkout retry failed after " + attemptCount + " attempts");
  }
}`,
      targetLine: 6,
      targetRange: "L6",
      finding: {
        id: "SEC-STRIPE-KEY",
        title: "Potentially Hardcoded Production API Secret",
        category: "Security / Credential Safety",
        severity: "CRITICAL",
        confidence: "99%",
        filePath: "src/services/stripeBilling.ts",
        lineStart: 6,
        lineEnd: 6,
        evidence: 'const STRIPE_SECRET_KEY = "sk_live_51M0xDemoSyntheticKey99812_REVOKED";',
        evidenceRule: "SEC-04 · CREDENTIAL SAFETY",
        explanation: "A synthetic credential string matching the Stripe production key pattern is assigned directly in the billing service source code.",
        impact: "Exposing active credentials in version control permits anyone with repository, build artifact, or image access to initiate unauthorized payment operations. Bypasses enterprise secret vaults and prevents safe key rotation.",
        suggestedFix: "Verify whether this is an active credential. If valid, rotate it immediately in the Stripe Dashboard. Move credentials into secure environment configuration (process.env.STRIPE_SECRET_KEY) or an enterprise secrets manager (HashiCorp Vault, AWS Secrets Manager).",
        suggestedPatch: `  // FIX: Load key securely from verified environment configuration
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing required environment secret: STRIPE_SECRET_KEY");
  }`,
        fixedCode: `import { Stripe } from "stripe";

// Retry customer checkout session with exponential backoff
export async function retryCheckoutSession(sessionId: string, attemptCount: number) {
  // FIX: Load key securely from verified environment configuration
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing required environment secret: STRIPE_SECRET_KEY");
  }

  const client = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    maxNetworkRetries: 3,
  });

  try {
    const session = await client.checkout.sessions.retrieve(sessionId);
    return { success: true, status: session.status };
  } catch (error) {
    if (attemptCount < 3) {
      return retryCheckoutSession(sessionId, attemptCount + 1);
    }
    throw new Error("Checkout retry failed after " + attemptCount + " attempts");
  }
}`,
        mergeBlocking: true,
        mergeReason: "Merge Blocker: Hardcoded credentials committed to source repository present immediate risk of unauthorized API usage and security compromise."
      },
      jiraTicket: {
        id: "SEC-4827",
        summary: "Hardcoded Stripe Key in stripeBilling.ts",
        priority: "Highest",
        type: "Security Vulnerability",
        status: "Created · Assigned",
        assignee: "SecOps Engineering Team",
        description: "Rule SEC-04 violation: Hardcoded API secret detected in billing service. Requires key rotation and env injection."
      },
      slackAlert: {
        channel: "#sec-eng",
        thread: "Incident-4827",
        preview: "CRITICAL: sk_live_... key committed to stripeBilling.ts",
        severity: "P0 CRITICAL",
        detail: "Exposed API key in src/services/stripeBilling.ts flagged by Myco. PR blocked."
      },
      customApp: {
        endpoint: "https://api.internal/v1/sec-events",
        event: "CREDENTIAL_EXPOSURE",
        payloadSummary: '{"rule":"SEC-04","file":"stripeBilling.ts","severity":"CRITICAL"}',
        latency: "34ms"
      }
    },

    {
      id: "xss",
      title: "Unsafe HTML Rendering",
      shortTitle: "2. Unsafe HTML",
      category: "Security / Cross-Site Scripting",
      repo: "myco-org/frontend-portal",
      branch: "feat/user-bio",
      fileName: "src/components/UserProfileBio.tsx",
      lang: "TSX",
      badge: "P1 HIGH",
      badgeClass: "is-p1",
      description: "JavaScript inserting untrusted user-controlled content into dangerouslySetInnerHTML without sanitization.",
      code: `import React from "react";

interface UserBioProps {
  username: string;
  bioMarkup: string; // Untrusted user-provided string
}

export const UserProfileBio: React.FC<UserBioProps> = ({ username, bioMarkup }) => {
  return (
    <div className="user-profile-bio">
      <h3>{username}'s Biography</h3>
      {/* Risk: Untrusted user-controlled HTML injected directly */}
      <div 
        className="bio-content" 
        dangerouslySetInnerHTML={{ __html: bioMarkup }} 
      />
    </div>
  );
};`,
      targetLine: 13,
      targetRange: "L13-L15",
      finding: {
        id: "XSS-BIO-MARKUP",
        title: "Unsafe DOM Injection via dangerouslySetInnerHTML (XSS Risk)",
        category: "Security / Cross-Site Scripting",
        severity: "HIGH",
        confidence: "96%",
        filePath: "src/components/UserProfileBio.tsx",
        lineStart: 13,
        lineEnd: 15,
        evidence: '<div className="bio-content" dangerouslySetInnerHTML={{ __html: bioMarkup }} />',
        evidenceRule: "XSS-01 · DOM SANITIZATION",
        explanation: "User-controlled input is rendered directly into the DOM using dangerouslySetInnerHTML without HTML escaping or sanitization.",
        impact: "Enables stored or reflected Cross-Site Scripting (XSS). Untrusted HTML may introduce executable <script> tags or inline event handlers (<img onerror=...>) that execute arbitrary JavaScript in the victim's session, hijacking cookies and tokens.",
        suggestedFix: "Sanitize untrusted HTML with an established sanitizer like DOMPurify prior to rendering (DOMPurify.sanitize(bioMarkup)), or render through standard text nodes.",
        suggestedPatch: `      {/* FIX: Sanitize HTML with DOMPurify prior to injection */}
      <div 
        className="bio-content" 
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bioMarkup) }} 
      />`,
        fixedCode: `import React from "react";
import DOMPurify from "dompurify";

interface UserBioProps {
  username: string;
  bioMarkup: string;
}

export const UserProfileBio: React.FC<UserBioProps> = ({ username, bioMarkup }) => {
  return (
    <div className="user-profile-bio">
      <h3>{username}'s Biography</h3>
      {/* FIX: Sanitize HTML with DOMPurify prior to injection */}
      <div 
        className="bio-content" 
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bioMarkup) }} 
      />
    </div>
  );
};`,
        mergeBlocking: true,
        mergeReason: "Merge Blocker: High-severity XSS vulnerability permits unauthorized client-side script execution in authenticated sessions."
      },
      prd: {
        id: "XSS-01",
        title: "Requirement XSS-01: DOM Sanitization Standard",
        text: `REQUIREMENT (XSS-01):
"All user-supplied content, HTML bio fields, and rich text markup MUST be sanitized with DOMPurify prior to DOM injection. Direct unsanitized binding to dangerouslySetInnerHTML is forbidden."`
      },
      policy: {
        id: "FRONTEND-SECURITY",
        rule: "DENY raw unsanitized user markup from reaching innerHTML or dangerouslySetInnerHTML sinks."
      },
      jiraTicket: {
        id: "SEC-4910",
        summary: "Direct dangerouslySetInnerHTML in UserProfileBio.tsx",
        priority: "High",
        type: "Security Vulnerability",
        status: "Created · Assigned",
        assignee: "Frontend Sec Team",
        description: "Rule XSS-01 violation: Raw user markup passed to dangerouslySetInnerHTML. Requires DOMPurify sanitization."
      },
      slackAlert: {
        channel: "#sec-frontend",
        thread: "Incident-4910",
        preview: "HIGH: UserBio bypasses DOMPurify sanitization",
        severity: "P1 HIGH",
        detail: "Unsanitized HTML rendered in src/components/UserProfileBio.tsx. Stored XSS sink detected."
      },
      customApp: {
        endpoint: "https://api.internal/v1/sec-events",
        event: "DOM_VULNERABILITY",
        payloadSummary: '{"rule":"XSS-01","file":"UserProfileBio.tsx","severity":"HIGH"}',
        latency: "42ms"
      }
    },

    {
      id: "dependency",
      title: "Dependency Compatibility Risk",
      shortTitle: "4. Wildcard Dep",
      category: "Dependency / Breaking Changes",
      repo: "myco-org/auth-gateway",
      branch: "chore/deps-wildcard",
      fileName: "package.json",
      lang: "JSON",
      badge: "P1 HIGH",
      badgeClass: "is-p1",
      description: "Package manifest using an unrestricted wildcard version ('*') for a shared internal dependency.",
      prd: {
        id: "DEP-01",
        title: "Requirement DEP-01: Deterministic Dependency Locking",
        text: `REQUIREMENT (DEP-01):
"All internal shared dependencies must be pinned to explicit semantic version constraints (^2.x or exact). Wildcard '*' versions are forbidden in production services."`
      },
      policy: {
        id: "SUPPLY-CHAIN-POLICY",
        rule: "DENY unpinned wildcard dependency ranges in production service manifests."
      },
      code: `{
  "name": "@myco/auth-gateway",
  "version": "3.4.0",
  "dependencies": {
    "@myco/shared-auth-client": "*",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}`,
      targetLine: 5,
      targetRange: "L5",
      finding: {
        id: "DEP-WILDCARD-AUTH",
        title: "Unrestricted Wildcard Dependency Version for Shared Library",
        category: "Dependency / Breaking Changes",
        severity: "HIGH",
        confidence: "92%",
        filePath: "package.json",
        lineStart: 5,
        lineEnd: 5,
        evidence: '"@myco/shared-auth-client": "*"',
        evidenceRule: "DEP-01 · DETERMINISTIC DEPENDENCY LOCKING",
        explanation: "The internal dependency @myco/shared-auth-client is specified using a wildcard '*' version specifier.",
        impact: "Wildcard version specifiers allow package managers to install breaking major updates during container builds or CI without human review. If downstream shared libraries publish breaking API changes, builds and runtime authentication will fail unexpectedly.",
        suggestedFix: "Pin @myco/shared-auth-client to a constrained semver range (e.g., ^2.1.0 or exact version), commit lockfiles, and run automated contract tests before promoting dependency bumps.",
        suggestedPatch: '    "@myco/shared-auth-client": "^2.1.0",',
        fixedCode: `{
  "name": "@myco/auth-gateway",
  "version": "3.4.0",
  "dependencies": {
    "@myco/shared-auth-client": "^2.1.0",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}`,
        mergeBlocking: false,
        mergeReason: "Non-blocking risk: Unpinned dependencies create severe build drift, but do not prove an active syntax failure today."
      },
      jiraTicket: {
        id: "DEP-5120",
        summary: "Wildcard dependency @myco/shared-auth-client in package.json",
        priority: "Medium",
        type: "Architecture Task",
        status: "Created · Assigned",
        assignee: "Platform Infrastructure Team",
        description: "Rule DEP-01: Wildcard dependency version creates non-deterministic production builds. Constrain to ^2.1.0."
      },
      slackAlert: {
        channel: "#platform-eng",
        thread: "Deps-5120",
        preview: "WARNING: Wildcard dependency in auth-gateway package.json",
        severity: "P1 HIGH",
        detail: "Package manifest specifies '*' for shared-auth-client. Contract tests recommended."
      },
      customApp: {
        endpoint: "https://api.internal/v1/build-events",
        event: "DEPENDENCY_DRIFT",
        payloadSummary: '{"rule":"DEP-01","pkg":"@myco/shared-auth-client","spec":"*"}',
        latency: "29ms"
      }
    },

    {
      id: "spec_mismatch",
      title: "PRD and Implementation Mismatch",
      shortTitle: "5. Spec Mismatch",
      category: "Specification / Contract Mismatch",
      repo: "myco-org/billing-engine",
      branch: "feat/tax-retry-compliance",
      fileName: "src/services/taxService.ts",
      lang: "TypeScript",
      badge: "P1 HIGH",
      badgeClass: "is-p1",
      description: "Requirement states customer taxExempt status must be re-verified on retry, alongside implementation that omits check.",
      prd: {
        id: "PRD-402",
        title: "Requirement PRD-402 §3.2: International Tax Compliance",
        text: `REQUIREMENT (PRD-402 §3.2):
"Every invoice generation retry MUST re-verify customer taxExempt status against the EU VIES registry before calculating total due, and write an audit event."`
      },
      policy: {
        id: "TAX-COMPLIANCE",
        rule: "DENY unverified invoice totals for international cross-border transactions."
      },
      code: `/**
 * REQUIREMENT (PRD-402: International Tax Compliance §3.2):
 * "Every invoice generation retry MUST re-verify customer taxExempt status
 * against the EU VIES registry before calculating total due, and write an audit event."
 */

export async function processInvoiceRetry(invoiceId: string, customerId: string, subtotal: number) {
  // MISMATCH: Implementation calculates standard VAT directly without re-verifying taxExempt status
  const standardVatRate = 0.20;
  const taxAmount = subtotal * standardVatRate;
  const total = subtotal + taxAmount;

  await db.invoices.update({
    where: { id: invoiceId },
    data: { total, taxAmount, status: "CALCULATED" }
  });

  return { invoiceId, total, taxAmount };
}`,
      targetLine: 10,
      targetRange: "L9-L15",
      finding: {
        id: "SPEC-MISMATCH-TAX-EXEMPT",
        title: "Specification Mismatch: Missing Tax Exemption Verification on Retry",
        category: "Specification Compliance / Contract Mismatch",
        severity: "HIGH",
        confidence: "94%",
        filePath: "src/services/taxService.ts",
        lineStart: 10,
        lineEnd: 15,
        evidence: "const taxAmount = subtotal * standardVatRate; // Skips PRD §3.2 check",
        evidenceRule: "PRD-402 · INTERNATIONAL TAX COMPLIANCE",
        explanation: "PRD-402 §3.2 requires all invoice generation retries to re-verify customer taxExempt status against the EU VIES registry. The implementation calculates standard 20% VAT directly without performing the verification.",
        impact: "Tax-exempt European enterprise customers (reverse charge) will be incorrectly billed 20% VAT on retried invoice runs, causing legal non-compliance, financial discrepancies, and customer chargebacks.",
        suggestedFix: "Implement the required check: query customer tax-exemption status via viesService.checkTaxExemption(customerId), set taxAmount to 0 if exempt, and emit audit event.",
        suggestedPatch: `  // FIX: Verify customer taxExempt status per PRD-402 §3.2 before calculating tax
  const isExempt = await viesService.checkTaxExemption(customerId);
  const taxAmount = isExempt ? 0 : subtotal * standardVatRate;
  const total = subtotal + taxAmount;
  await auditLog.emit("TAX_EXEMPT_VERIFIED", { customerId, invoiceId, isExempt });`,
        fixedCode: `/**
 * REQUIREMENT (PRD-402: International Tax Compliance §3.2):
 * "Every invoice generation retry MUST re-verify customer taxExempt status
 * against the EU VIES registry before calculating total due, and write an audit event."
 */

export async function processInvoiceRetry(invoiceId: string, customerId: string, subtotal: number) {
  // FIX: Verify customer taxExempt status per PRD-402 §3.2 before calculating tax
  const isExempt = await viesService.checkTaxExemption(customerId);
  const standardVatRate = 0.20;
  const taxAmount = isExempt ? 0 : subtotal * standardVatRate;
  const total = subtotal + taxAmount;

  await auditLog.emit("TAX_EXEMPT_VERIFIED", { customerId, invoiceId, isExempt });

  await db.invoices.update({
    where: { id: invoiceId },
    data: { total, taxAmount, status: "CALCULATED" }
  });

  return { invoiceId, total, taxAmount };
}`,
        mergeBlocking: true,
        mergeReason: "Merge Blocker: Direct violation of EU international tax compliance specification PRD-402 §3.2."
      },
      jiraTicket: {
        id: "TAX-402",
        summary: "PRD-402 §3.2 Tax Exemption Verification Omitted in Retry Handler",
        priority: "High",
        type: "Compliance Defect",
        status: "Created · Assigned",
        assignee: "Billing Compliance Team",
        description: "PRD-402 §3.2: Missing VIES tax exemption verification in invoice retry handler. Causes tax overbilling."
      },
      slackAlert: {
        channel: "#billing-alerts",
        thread: "Compliance-402",
        preview: "HIGH: Tax exemption check missing in retry handler",
        severity: "P1 HIGH",
        detail: "src/services/taxService.ts violates PRD-402 §3.2 specification. Pull request blocked."
      },
      customApp: {
        endpoint: "https://api.internal/v1/compliance-events",
        event: "SPEC_MISMATCH",
        payloadSummary: '{"rule":"PRD-402","file":"taxService.ts","severity":"HIGH"}',
        latency: "37ms"
      }
    },

    {
      id: "div_zero",
      title: "Regression or Edge-Case Bug",
      shortTitle: "6. Div by Zero",
      category: "Logic Bug / Boundary Condition",
      repo: "myco-org/analytics-worker",
      branch: "fix/cohort-metrics",
      fileName: "src/utils/metricsCalculator.ts",
      lang: "TypeScript",
      badge: "P2 MEDIUM",
      badgeClass: "is-p2",
      description: "Function dividing numbers without handling a zero denominator, causing NaN propagation.",
      prd: {
        id: "RESILIENCY-08",
        title: "Requirement RESILIENCY-08: Arithmetic Boundary Integrity",
        text: `REQUIREMENT (RESILIENCY-08):
"All mathematical calculations dividing metrics must validate that denominator inputs are non-zero before calculation and provide safe zero-value fallbacks."`
      },
      policy: {
        id: "NUMERIC-INTEGRITY",
        rule: "DENY unvalidated division operations that can evaluate to NaN or Infinity in user-facing metrics."
      },
      code: `/**
 * Calculates conversion rate and average duration between user onboarding stages.
 */
export function calculateConversionMetrics(stageCompleters: number, totalEntrants: number, totalDurationSec: number) {
  // BUG: No guard for totalEntrants === 0 or stageCompleters === 0
  const conversionRatio = stageCompleters / totalEntrants;
  const avgDurationPerCompleter = totalDurationSec / stageCompleters;

  return {
    conversionPercent: (conversionRatio * 100).toFixed(2) + "%",
    avgDurationSec: Math.round(avgDurationPerCompleter),
    isPerformant: conversionRatio > 0.15
  };
}`,
      targetLine: 6,
      targetRange: "L6-L7",
      finding: {
        id: "BUG-DIV-ZERO-CONV",
        title: "Unhandled Zero Denominator (Division by Zero / NaN Propagation)",
        category: "Logic Bug / Boundary Condition",
        severity: "MEDIUM",
        confidence: "98%",
        filePath: "src/utils/metricsCalculator.ts",
        lineStart: 6,
        lineEnd: 7,
        evidence: "const conversionRatio = stageCompleters / totalEntrants;",
        evidenceRule: "BUG-01 · ARITHMETIC BOUNDARY INTEGRITY",
        explanation: "Arithmetic division operations divide by totalEntrants and stageCompleters without validating that denominators are greater than 0.",
        impact: "When totalEntrants is 0 (new onboarding funnels, zero-traffic periods, or empty cohort filters), JavaScript evaluates to NaN or Infinity. conversionPercent evaluates to 'NaN%', corrupting customer analytics dashboards and throwing unhandled exceptions in downstream aggregations.",
        suggestedFix: "Add boundary guard: if (totalEntrants <= 0 || stageCompleters <= 0), return safe fallback metrics { conversionPercent: '0.00%', avgDurationSec: 0, isPerformant: false }. Add unit tests for empty cohorts.",
        suggestedPatch: `  // FIX: Guard against zero denominator to prevent NaN / Infinity
  if (totalEntrants <= 0 || stageCompleters <= 0) {
    return {
      conversionPercent: "0.00%",
      avgDurationSec: 0,
      isPerformant: false
    };
  }`,
        fixedCode: `/**
 * Calculates conversion rate and average duration between user onboarding stages.
 */
export function calculateConversionMetrics(stageCompleters: number, totalEntrants: number, totalDurationSec: number) {
  // FIX: Guard against zero denominator to prevent NaN / Infinity
  if (totalEntrants <= 0 || stageCompleters <= 0) {
    return {
      conversionPercent: "0.00%",
      avgDurationSec: 0,
      isPerformant: false
    };
  }

  const conversionRatio = stageCompleters / totalEntrants;
  const avgDurationPerCompleter = totalDurationSec / stageCompleters;

  return {
    conversionPercent: (conversionRatio * 100).toFixed(2) + "%",
    avgDurationSec: Math.round(avgDurationPerCompleter),
    isPerformant: conversionRatio > 0.15
  };
}`,
        mergeBlocking: false,
        mergeReason: "Non-blocking warning: Edge case arithmetic error causes dashboard NaN output, but does not represent a critical vulnerability or data leak."
      },
      jiraTicket: {
        id: "BUG-3841",
        summary: "Division by zero in metricsCalculator.ts produces NaN",
        priority: "Medium",
        type: "Bug",
        status: "Created · Assigned",
        assignee: "Data Engineering Team",
        description: "Zero entrants cohort triggers division by zero. Requires input validation guard."
      },
      slackAlert: {
        channel: "#analytics-eng",
        thread: "Bug-3841",
        preview: "MEDIUM: Unhandled division by zero in conversion metrics",
        severity: "P2 MEDIUM",
        detail: "src/utils/metricsCalculator.ts produces NaN on zero-entrant cohorts."
      },
      customApp: {
        endpoint: "https://api.internal/v1/quality-events",
        event: "BOUNDARY_DEFECT",
        payloadSummary: '{"rule":"BUG-01","file":"metricsCalculator.ts","severity":"MEDIUM"}',
        latency: "25ms"
      }
    },

    {
      id: "breaking_diff",
      title: "Potential Merge-Blocking Regression",
      shortTitle: "7. Breaking Diff",
      category: "API Contract / Backward Compatibility",
      repo: "myco-org/core-api",
      branch: "pr/612-clean-user-schema",
      fileName: "Pull Request #612 Diff",
      lang: "Git Diff",
      badge: "P0 CRITICAL",
      badgeClass: "is-p0",
      description: "Pull request removing required 'organizationId' response field, breaking API backward compatibility.",
      prd: {
        id: "API-GOVERNANCE",
        title: "Requirement API-01: Public API Compatibility Protocol",
        text: `REQUIREMENT (API-01):
"Breaking removals of existing request/response properties (organizationId) on public endpoints (/v1/users/:id) must undergo a 90-day deprecation notice before removal."`
      },
      policy: {
        id: "API-STABILITY",
        rule: "DENY unannounced breaking removals from stable public API routes."
      },
      code: `diff --git a/src/api/v1/userRoutes.ts b/src/api/v1/userRoutes.ts
--- a/src/api/v1/userRoutes.ts
+++ b/src/api/v1/userRoutes.ts
@@ -24,8 +24,6 @@ router.get("/users/:id", async (req, res) => {
   return res.json({
     id: user.id,
     name: user.name,
     email: user.email,
-    organizationId: user.organizationId, // BREAKING: Removed required field
-    tenantRole: user.role,
+    accountStatus: user.status
   });
 });`,
       targetLine: 7,
       targetRange: "L7-L8",
       finding: {
         id: "DIFF-BREAKING-REMOVAL",
         title: "Breaking API Regression: Removed Required Response Field 'organizationId'",
         category: "API Contract / Backward Compatibility",
         severity: "CRITICAL",
         confidence: "97%",
         filePath: "src/api/v1/userRoutes.ts",
         lineStart: 27,
         lineEnd: 28,
         evidence: "-    organizationId: user.organizationId, // BREAKING: Removed required field",
         evidenceRule: "API-01 · BACKWARD COMPATIBILITY CONTRACT",
         explanation: "Pull Request #612 removes the 'organizationId' field from the /v1/users/:id response payload without introducing an API version increment.",
         impact: "Severe backward-compatibility regression. Mobile clients, admin portals, and third-party partner integrations depend on organizationId for tenant context routing. Merging this PR will cause immediate runtime null pointer exceptions across production client applications.",
         suggestedFix: "Preserve organizationId in /v1/users/:id. If deprecating, mark it @deprecated in the OpenAPI contract, maintain backward compatibility for at least 90 days, and introduce /v2/users/:id.",
         suggestedPatch: "    organizationId: user.organizationId, // Preserved for v1 backward compatibility",
         fixedCode: `diff --git a/src/api/v1/userRoutes.ts b/src/api/v1/userRoutes.ts
--- a/src/api/v1/userRoutes.ts
+++ b/src/api/v1/userRoutes.ts
@@ -24,8 +24,7 @@ router.get("/users/:id", async (req, res) => {
   return res.json({
     id: user.id,
     name: user.name,
     email: user.email,
     organizationId: user.organizationId, // Preserved for v1 backward compatibility
+    accountStatus: user.status
   });
 });`,
         mergeBlocking: true,
         mergeReason: "Merge Blocker: Breaking contract regression on public API /v1/users/:id will trigger immediate production client outages."
       },
       jiraTicket: {
         id: "API-612",
         summary: "Breaking API Change: organizationId removed from /v1/users/:id",
         priority: "Highest",
         type: "Breaking Regression",
         status: "Created · Assigned",
         assignee: "API Governance Team",
         description: "Rule API-01: Removed required response field from public API. PR #612 blocked from merging."
       },
       slackAlert: {
         channel: "#api-governance",
         thread: "PR-612-Blocker",
         preview: "CRITICAL: PR #612 contains breaking schema removal",
         severity: "P0 CRITICAL",
         detail: "Removed organizationId from /v1/users/:id. Merge blocked pending API review."
       },
       customApp: {
         endpoint: "https://api.internal/v1/pr-checks",
         event: "BREAKING_API_CHANGE",
         payloadSummary: '{"pr":612,"endpoint":"/v1/users/:id","removed":"organizationId"}',
         latency: "31ms"
       }
     }
   ];

  /* Backward compatibility map for 3D bot queries */
  const SCENARIOS = {};
  DEMO_EXAMPLES.forEach(ex => {
    SCENARIOS[ex.id] = ex;
  });
  SCENARIOS.pr_4827 = DEMO_EXAMPLES[0];
  SCENARIOS.agent = DEMO_EXAMPLES[0];
  SCENARIOS.agent_runner = DEMO_EXAMPLES[0];
  SCENARIOS.secret = DEMO_EXAMPLES[1];
  SCENARIOS.payments = DEMO_EXAMPLES[1];
  SCENARIOS.auth = DEMO_EXAMPLES[2];
  SCENARIOS.xss = DEMO_EXAMPLES[2];
  SCENARIOS.dependency = DEMO_EXAMPLES[3];
  SCENARIOS.spec_mismatch = DEMO_EXAMPLES[4];
  SCENARIOS.div_zero = DEMO_EXAMPLES[5];
  SCENARIOS.breaking_diff = DEMO_EXAMPLES[6];

  /* State variables */
  let isDemoMode = false;
  let currentDemoIndex = -1; // -1 indicates clean custom input state
  let isAnalyzing = false;
  let activeTimers = [];
  let highlightLine = null;
  let highlightType = null;
  let petEngine = null;
  let currentAnalysisResult = null;
  let currentScenarioKey = "pr_4827";

  const integrationsState = {
    jira: true,
    slack: true,
    custom: true
  };

  const clearAllTimers = () => {
    activeTimers.forEach(id => clearTimeout(id));
    activeTimers = [];
  };

  const addTimer = (callback, delay) => {
    const id = setTimeout(callback, delay);
    activeTimers.push(id);
    return id;
  };

  const escapeHtml = (str) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  /* Regex syntax colorizer */
  const colorizeCode = (code, activeLine, type) => {
    const lines = (code || "").split("\n");
    return lines.map((line, idx) => {
      const lineNum = idx + 1;
      let safeLine = escapeHtml(line);

      if (/^\s*\/\//.test(line) || /^\s*\{\/\*/.test(line)) {
        safeLine = `<span class="tok-com">${safeLine}</span>`;
      } else {
        const stringTokens = [];
        safeLine = safeLine.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, (match) => {
          const id = `___STR_${stringTokens.length}___`;
          stringTokens.push(match);
          return id;
        });

        safeLine = safeLine.replace(/\b(import|export|from|const|let|var|async|await|return|if|try|catch|throw|new|interface|type)\b/g, '<span class="tok-kw">$1</span>');
        safeLine = safeLine.replace(/\b(string|number|boolean|any|void|React|FC)\b/g, '<span class="tok-type">$1</span>');
        safeLine = safeLine.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span class="tok-fn">$1</span>');
        safeLine = safeLine.replace(/dangerouslySetInnerHTML/g, '<span class="tok-xss">dangerouslySetInnerHTML</span>');

        safeLine = safeLine.replace(/___STR_(\d+)___/g, (_, sIdx) => {
          const str = stringTokens[parseInt(sIdx, 10)] || "";
          return str.includes("sk_live_") ? `<span class="tok-sec">${str}</span>` : `<span class="tok-str">${str}</span>`;
        });
      }

      if (lineNum === activeLine) {
        const cls = type === "clean" ? "editor-line-highlight-clean" : "editor-line-highlight";
        return `<span class="${cls}">${safeLine}</span>`;
      }
      return safeLine;
    }).join("\n");
  };

  const renderGutter = (totalLines, activeLine, type) => {
    const gutter = document.getElementById("editor-gutter");
    if (!gutter) return;
    let html = "";
    const count = Math.max(totalLines, 1);
    for (let i = 1; i <= count; i++) {
      let cls = "gutter-line";
      if (i === activeLine) {
        cls += type === "clean" ? " is-clean-highlight" : " is-highlighted";
      }
      html += `<div class="${cls}">${i}</div>`;
    }
    gutter.innerHTML = html;
  };

  const updateWordLimitUI = (currentText, isCustom) => {
    const wordBadge = document.getElementById("editor-word-count-badge");
    const footerCounter = document.getElementById("editor-gt-footer-counter");
    const gtFooterWords = document.getElementById("gt-footer-words");
    const runBtn = document.getElementById("playground-run-btn");

    const words = countWords(currentText || "");
    const formattedWords = words.toLocaleString();
    const formattedMax = WORD_LIMITS.MAX.toLocaleString();
    const gtCountString = `${formattedWords} / ${formattedMax}`;

    if (gtFooterWords) gtFooterWords.textContent = formattedWords;
    if (wordBadge) wordBadge.textContent = gtCountString;

    if (footerCounter) {
      if (isCustom && words > WORD_LIMITS.MAX) {
        footerCounter.className = "editor-word-counter mono is-over";
      } else {
        footerCounter.className = "editor-word-counter mono";
      }
    }

    if (runBtn && !isAnalyzing) {
      runBtn.disabled = false;
      runBtn.removeAttribute("title");
    }

    const isValid = words <= WORD_LIMITS.MAX;

    return { valid: isValid, words, isCustom };
  };

  const syncEditorView = () => {
    const syntaxView = document.getElementById("editor-syntax-view");
    const textarea = document.getElementById("playground-code-input");
    const linesCount = document.getElementById("editor-lines-count");
    const langLabel = document.getElementById("editor-lang-badge");

    if (!syntaxView || !textarea) return;

    const contentToDisplay = textarea.value || "";

    if (isDemoMode && currentDemoIndex >= 0) {
      const example = DEMO_EXAMPLES[currentDemoIndex];
      if (langLabel && example) langLabel.textContent = example.lang || "TypeScript";
    } else {
      if (langLabel) {
        if (contentToDisplay.startsWith("diff --git") || contentToDisplay.includes("@@ -")) {
          langLabel.textContent = "Git Diff";
        } else if (/^\s*[{[]/.test(contentToDisplay)) {
          langLabel.textContent = "JSON";
        } else if (contentToDisplay.includes("import ") || contentToDisplay.includes("const ") || contentToDisplay.includes("function ")) {
          langLabel.textContent = "TypeScript / JS";
        } else {
          langLabel.textContent = "Code";
        }
      }
    }

    const lines = contentToDisplay ? contentToDisplay.split("\n") : [""];
    if (linesCount) linesCount.textContent = `${lines.length} lines`;

    renderGutter(lines.length, highlightLine, highlightType);
    syntaxView.innerHTML = colorizeCode(contentToDisplay, highlightLine, highlightType);

    updateWordLimitUI(contentToDisplay, !isDemoMode);
  };

  const animateScanBeam = (targetLine, onComplete) => {
    const beam = document.getElementById("editor-scan-beam");
    if (!beam) {
      if (onComplete) onComplete();
      return;
    }

    const line = targetLine || 4;
    const targetOffset = 14 + (line - 1) * 22;
    beam.style.transform = `translateY(${Math.max(0, targetOffset - 66)}px)`;
    beam.classList.add("is-active");

    addTimer(() => {
      beam.style.transform = `translateY(${targetOffset}px)`;
    }, 100);

    addTimer(() => {
      highlightLine = line;
      highlightType = "error";
      syncEditorView();
    }, 450);

    addTimer(() => {
      beam.classList.remove("is-active");
      if (onComplete) onComplete();
    }, 850);
  };

  class CutePet3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.state = "SITTING_COFFEE";
      this.emotion = "normal";
      this.time = 0;
      this.isSipping = false;
      this.sipCooldown = 0;
      this.blinkTimer = 0;
      this.blinkProgress = 1.0;
      this.isBlinking = false;
      this.mouseGaze = { x: 0, y: 0 };
      this.currentGaze = { x: 0, y: 0 };
      this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
      this.currentPos = { x: 0.72, y: 0.0, z: 0.0 };
      this.lookAtEditor = false;
      this.steamPuffs = [];

      // Interactive drag-and-drop & angry emotion state
      this.isDragging = false;
      this.dragOffset = new window.THREE.Vector3();
      this.raycaster = new window.THREE.Raycaster();
      this.mouseVec = new window.THREE.Vector2();
      this.dragPlane = new window.THREE.Plane(new window.THREE.Vector3(0, 0, 1), 0);
      this.angryCooldownTimer = null;
      this.angryQuotes = [
        "Hey! Put Myco Bot down! I was observing code.",
        "Unhand me! Shifting Myco Bot makes me grumpy.",
        "Who authorized this relocation? Put Myco Bot back on the ledge!",
        "Hands off! Myco Bot has strict architectural responsibilities."
      ];
      this.angryQuoteIndex = 0;

      this.initThree();
      this.initFaceCanvas();
      this.initChestLogoCanvas();
      this.buildModel();
      this.bindEvents();
      this.drawFace();
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    initThree() {
      const THREE = window.THREE;
      const width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : (window.innerWidth || 500);
      const height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 280;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(32, width / Math.max(height, 1), 0.1, 100);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.updateResponsiveCamera(width, height);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 0.95);
      mainLight.position.set(2.8, 4.8, 3.8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 15;
      this.scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xd4e5e0, 0.45);
      fillLight.position.set(-3.5, 2.2, 2.2);
      this.scene.add(fillLight);

      this.rimLight = new THREE.PointLight(0x2ee59d, 0.70, 14);
      this.rimLight.position.set(0.8, 2.4, -1.8);
      this.scene.add(this.rimLight);
    }

    updateResponsiveCamera(width, height) {
      if (!this.camera || !this.renderer) return;
      const aspect = width / Math.max(height, 1);
      this.camera.aspect = aspect;

      // Closer camera framing with generous margins so cards, telephone desk, and agent never clip
      const baseAspect = 1.70;
      if (aspect < baseAspect) {
        // Zoom back smoothly on narrow viewports so cards, desk, and agent are completely in-bounds
        const factor = Math.min(1.42, baseAspect / Math.max(0.75, aspect));
        this.camera.position.z = 3.25 * factor;
        this.camera.position.x = 0.06;
        this.camera.position.y = 0.20 + (factor - 1.0) * 0.12;
      } else {
        this.camera.position.z = 3.25;
        this.camera.position.x = 0.06;
        this.camera.position.y = 0.20;
      }
      this.camera.lookAt(0.06, 0.08, 0);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    initFaceCanvas() {
      this.faceCanvas = document.createElement("canvas");
      this.faceCanvas.width = 512;
      this.faceCanvas.height = 320;
      this.faceCtx = this.faceCanvas.getContext("2d");

      this.faceTexture = new THREE.CanvasTexture(this.faceCanvas);
      this.faceTexture.minFilter = THREE.LinearFilter;
      this.faceTexture.magFilter = THREE.LinearFilter;
    }

    initChestLogoCanvas() {
      const THREE = window.THREE;
      this.chestLogoCanvas = document.createElement("canvas");
      this.chestLogoCanvas.width = 256;
      this.chestLogoCanvas.height = 256;
      this.chestLogoCtx = this.chestLogoCanvas.getContext("2d");

      this.chestLogoTexture = new THREE.CanvasTexture(this.chestLogoCanvas);
      this.chestLogoTexture.minFilter = THREE.LinearFilter;
      this.chestLogoTexture.magFilter = THREE.LinearFilter;

      this.renderChestLogo();
    }

    renderChestLogo() {
      const ctx = this.chestLogoCtx;
      if (!ctx) return;
      ctx.clearRect(0, 0, 256, 256);

      // Outer circular badge background: rich dark spruce
      ctx.beginPath();
      ctx.arc(128, 128, 122, 0, Math.PI * 2);
      ctx.fillStyle = "#0e1e1b";
      ctx.fill();

      // Subtle metallic inner ring
      ctx.beginPath();
      ctx.arc(128, 128, 114, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#2ee59d";
      ctx.stroke();

      // Draw immediate vector Myco brand mark
      ctx.save();
      ctx.strokeStyle = "#2ee59d";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Connecting filaments in 'M' formation
      ctx.beginPath();
      ctx.moveTo(70, 168);
      ctx.lineTo(88, 98);
      ctx.lineTo(128, 134);
      ctx.lineTo(168, 98);
      ctx.lineTo(186, 168);
      ctx.stroke();

      // Organic network nodes
      const nodes = [
        { x: 88, y: 98, r: 16, fill: "#ffffff" },
        { x: 168, y: 98, r: 16, fill: "#ffffff" },
        { x: 128, y: 134, r: 18, fill: "#2ee59d" },
        { x: 70, y: 168, r: 14, fill: "#2ee59d" },
        { x: 186, y: 168, r: 14, fill: "#2ee59d" }
      ];

      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.fill;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#0e1e1b";
        ctx.stroke();
      });

      // Central glowing core
      ctx.beginPath();
      ctx.arc(128, 134, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();

      // Asynchronously load official SVG image to composite perfectly
      if (!this._mycoIconLoaded) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "assets/myco-icon.svg";
        img.onload = () => {
          this._mycoIconLoaded = true;
          ctx.clearRect(0, 0, 256, 256);
          ctx.beginPath();
          ctx.arc(128, 128, 122, 0, Math.PI * 2);
          ctx.fillStyle = "#0e1e1b";
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = "#2ee59d";
          ctx.stroke();
          ctx.drawImage(img, 30, 30, 196, 196);
          if (this.chestLogoTexture) this.chestLogoTexture.needsUpdate = true;
        };
      }

      if (this.chestLogoTexture) this.chestLogoTexture.needsUpdate = true;
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    drawFace() {
      const ctx = this.faceCtx;
      const w = 512;
      const h = 320;

      ctx.clearRect(0, 0, w, h);

      // Curved OLED display background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#081114");
      bgGrad.addColorStop(0.5, "#0b161a");
      bgGrad.addColorStop(1, "#070e11");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle diagonal glass reflection
      ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(190, 0);
      ctx.lineTo(110, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Screen bezel border
      ctx.strokeStyle = "#16282e";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      const gx = this.currentGaze.x * 34;
      const gy = this.currentGaze.y * 22;
      const leftEyeX = 175 + gx;
      const rightEyeX = 337 + gx;
      const eyeY = 155 + gy;

      if (this.state === "CALL_TELEPHONE") {
        // Active telephone conversation: expressive eyes + live talking voice waveform
        ctx.save();
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#00f0ff";

        const ew = 66;
        const eh = Math.max(12, 100 * this.blinkProgress);
        this.drawRoundedRect(ctx, leftEyeX - ew / 2, eyeY - eh / 2, ew, eh, 28);
        ctx.fill();
        this.drawRoundedRect(ctx, rightEyeX - ew / 2, eyeY - eh / 2, ew, eh, 28);
        ctx.fill();

        // High-tech digital voice waveform at bottom of visor
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let x = 70; x <= w - 70; x += 6) {
          const env = Math.sin(((x - 70) / (w - 140)) * Math.PI);
          const wave = Math.sin((x * 0.065) + (this.time * 9)) * 16 * env;
          const wy = h - 48 + wave;
          if (x === 70) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
        ctx.restore();

        // Rosy cheeks
        ctx.fillStyle = "rgba(255, 115, 140, 0.55)";
        ctx.beginPath();
        ctx.ellipse(leftEyeX - 10, eyeY + 62, 26, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX + 10, eyeY + 62, 26, 13, 0, 0, Math.PI * 2);
        ctx.fill();

      } else if (this.emotion === "angry") {
        // Angry grabbed state: slanted inward fierce eyes (\  /), furrowed brows, grumpy frown
        ctx.save();
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "#f97316";

        const drawAngryEye = (x, y, isLeft) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(isLeft ? -0.28 : 0.28);
          const ew = 66;
          const eh = 94;
          this.drawRoundedRect(ctx, -ew / 2, -eh / 2, ew, eh, 22);
          ctx.fill();

          // Angry white spark
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(isLeft ? 9 : -9, -12, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        drawAngryEye(leftEyeX, eyeY, true);
        drawAngryEye(rightEyeX, eyeY, false);

        // Angry furrowed brows
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(leftEyeX - 44, eyeY - 64);
        ctx.lineTo(leftEyeX + 38, eyeY - 44);
        ctx.moveTo(rightEyeX + 44, eyeY - 64);
        ctx.lineTo(rightEyeX - 38, eyeY - 44);
        ctx.stroke();

        // Grumpy zigzag pout mouth
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(232, eyeY + 68);
        ctx.lineTo(248, eyeY + 60);
        ctx.lineTo(264, eyeY + 68);
        ctx.lineTo(280, eyeY + 60);
        ctx.stroke();

        // Flushed cheeks
        ctx.fillStyle = "rgba(239, 68, 68, 0.48)";
        ctx.beginPath();
        ctx.ellipse(leftEyeX - 10, eyeY + 54, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX + 10, eyeY + 54, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Comic anger cross mark on upper temple
        const markX = 396;
        const markY = 82;
        const s = 14 + Math.sin(this.time * 10) * 2;
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(markX - s, markY - s * 0.4);
        ctx.quadraticCurveTo(markX, markY, markX - s * 0.4, markY - s);
        ctx.moveTo(markX + s, markY - s * 0.4);
        ctx.quadraticCurveTo(markX, markY, markX + s * 0.4, markY - s);
        ctx.moveTo(markX - s, markY + s * 0.4);
        ctx.quadraticCurveTo(markX, markY, markX - s * 0.4, markY + s);
        ctx.moveTo(markX + s, markY + s * 0.4);
        ctx.quadraticCurveTo(markX, markY, markX + s * 0.4, markY + s);
        ctx.stroke();

        ctx.restore();

      } else if (this.emotion === "happy") {
        // Delighted coffee sip pose: cute curved smiling eye arches
        ctx.save();
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 26;
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY + 12, 44, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rightEyeX, eyeY + 12, 44, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(255, 110, 145, 0.70)";
        ctx.beginPath();
        ctx.ellipse(leftEyeX - 10, eyeY + 68, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX + 10, eyeY + 68, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();

      } else if (this.emotion === "error") {
        // Alert state: angled red pill eyes
        ctx.save();
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#f43f5e";

        const drawAlertEye = (x, y, isLeft) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(isLeft ? 0.16 : -0.16);
          const ew = 66;
          const eh = 96;
          this.drawRoundedRect(ctx, -ew / 2, -eh / 2, ew, eh, 24);
          ctx.fill();
          ctx.restore();
        };

        drawAlertEye(leftEyeX, eyeY, true);
        drawAlertEye(rightEyeX, eyeY, false);
        ctx.restore();

      } else if (this.emotion === "clean") {
        // Clean verified state: confident emerald eyes
        ctx.save();
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#10b981";

        const drawCleanEye = (x, y) => {
          const ew = 68;
          const eh = Math.max(8, 108 * this.blinkProgress);
          this.drawRoundedRect(ctx, x - ew / 2, y - eh / 2, ew, eh, Math.min(32, eh / 2));
          ctx.fill();

          if (this.blinkProgress > 0.45) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(x - ew * 0.22, y - eh * 0.24, 12, 17 * this.blinkProgress, -0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        drawCleanEye(leftEyeX, eyeY);
        drawCleanEye(rightEyeX, eyeY);
        ctx.restore();

      } else {
        // Default observing state: big glowing cyan pill eyes with specular sparkles
        const ew = 68;
        const eh = Math.max(8, 108 * this.blinkProgress);
        const radius = Math.min(32, eh / 2);

        const drawNormalEye = (x, y) => {
          ctx.save();
          ctx.shadowColor = "#00f5ff";
          ctx.shadowBlur = 24;
          ctx.fillStyle = "#00f0ff";

          this.drawRoundedRect(ctx, x - ew / 2, y - eh / 2, ew, eh, radius);
          ctx.fill();

          if (this.blinkProgress > 0.45) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(x - ew * 0.22, y - eh * 0.24, 12, 17 * this.blinkProgress, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x + ew * 0.22, y + eh * 0.24, 6 * this.blinkProgress, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        };

        drawNormalEye(leftEyeX, eyeY);
        drawNormalEye(rightEyeX, eyeY);

        ctx.fillStyle = "rgba(255, 115, 140, 0.45)";
        ctx.beginPath();
        ctx.ellipse(leftEyeX - 10, eyeY + 68, 26, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightEyeX + 10, eyeY + 68, 26, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      this.faceTexture.needsUpdate = true;
    }

    buildModel() {
      const THREE = window.THREE;

      /* Grounded architectural desk platform (ledge) */
      this.deskPlatform = new THREE.Group();
      this.deskPlatform.position.set(0.72, 0, 0);
      this.scene.add(this.deskPlatform);

      const deskSlab = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.28, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x182c31, roughness: 0.50 })
      );
      deskSlab.position.set(0, -0.42, -0.40);
      deskSlab.receiveShadow = true;
      this.deskPlatform.add(deskSlab);

      const deskTrim = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.016, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x39756d })
      );
      deskTrim.position.set(0, -0.278, -0.92);
      this.deskPlatform.add(deskTrim);

      const coaster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.016, 24),
        new THREE.MeshStandardMaterial({ color: 0x223d43, roughness: 0.4 })
      );
      coaster.position.set(0.40, -0.272, -0.05);
      coaster.receiveShadow = true;
      this.deskPlatform.add(coaster);

      /* High-grade smooth robot materials (refined satin ceramic, brushed titanium joints, dark metal accents) */
      const porcelainMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.20,
        metalness: 0.04
      });

      const metallicJointMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Brushed titanium/silver mechanical joint caps, axles, and trim
        metalness: 0.76,
        roughness: 0.24
      });

      const darkMetalMat = new THREE.MeshStandardMaterial({
        color: 0x243238, // Precision dark gunmetal chassis accents, rubberized sole, bezel sockets
        metalness: 0.65,
        roughness: 0.38
      });

      const softSlateMat = new THREE.MeshStandardMaterial({
        color: 0x5a6d77,
        roughness: 0.38,
        metalness: 0.20
      });

      const bezelMat = new THREE.MeshStandardMaterial({
        color: 0x142024,
        roughness: 0.20,
        metalness: 0.25
      });

      const screenMat = new THREE.MeshBasicMaterial({
        map: this.faceTexture
      });

      this.glowMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.8,
        roughness: 0.15
      });

      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.85,
        roughness: 0.18
      });

      const phoneMat = new THREE.MeshStandardMaterial({
        color: 0x1b2e2a, // Rich slate-spruce executive IP telephone
        roughness: 0.28,
        metalness: 0.18
      });

      const phoneFaceMat = new THREE.MeshStandardMaterial({
        color: 0x243e38, // Matte angled console face
        roughness: 0.32,
        metalness: 0.12
      });

      const phoneKeyMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f3,
        roughness: 0.25
      });

      const mugMat = new THREE.MeshStandardMaterial({
        color: 0x243a37,
        roughness: 0.28,
        metalness: 0.1
      });

      const mugTrimMat = new THREE.MeshStandardMaterial({
        color: 0x39756d,
        roughness: 0.25
      });

      const coffeeLiquidMat = new THREE.MeshStandardMaterial({
        color: 0x2b1810,
        roughness: 0.2
      });

      /* 3D Executive Desk Telephone Console (Prominent desktop unit shifted cleanly to side) */
      this.phoneBase = new THREE.Group();
      this.phoneBase.position.set(-0.64, -0.20, 0.04);
      this.deskPlatform.add(this.phoneBase);

      const baseChassis = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.16, 0.52), phoneMat);
      baseChassis.castShadow = true;
      baseChassis.receiveShadow = true;
      this.phoneBase.add(baseChassis);

      const consoleWedge = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.09, 0.46), phoneFaceMat);
      consoleWedge.position.set(0, 0.09, 0);
      consoleWedge.rotation.x = 0.22;
      consoleWedge.castShadow = true;
      consoleWedge.receiveShadow = true;
      this.phoneBase.add(consoleWedge);

      const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.14, 0.48), chromeMat);
      trimL.position.set(-0.34, 0.06, 0);
      this.phoneBase.add(trimL);

      const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.14, 0.48), chromeMat);
      trimR.position.set(0.34, 0.06, 0);
      this.phoneBase.add(trimR);

      // Screen bezel plate
      const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.012), bezelMat);
      screenBezel.position.set(0.12, 0.14, -0.08);
      screenBezel.rotation.x = 0.22 - Math.PI / 2;
      this.phoneBase.add(screenBezel);

      // Dynamic backlit LCD Screen on console (high-DPI 384x192)
      this.phoneScreenCanvas = document.createElement("canvas");
      this.phoneScreenCanvas.width = 384;
      this.phoneScreenCanvas.height = 192;
      this.phoneScreenCtx = this.phoneScreenCanvas.getContext("2d");
      this.phoneScreenTexture = new THREE.CanvasTexture(this.phoneScreenCanvas);

      const phoneScreenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.16),
        new THREE.MeshBasicMaterial({ map: this.phoneScreenTexture })
      );
      phoneScreenMesh.position.set(0.12, 0.146, -0.08);
      phoneScreenMesh.rotation.x = 0.22 - Math.PI / 2;
      this.phoneBase.add(phoneScreenMesh);

      // Directional navigation disc between screen and keypad
      const navDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.014, 24), chromeMat);
      navDisc.position.set(0.12, 0.138, 0.02);
      navDisc.rotation.x = 0.22;
      this.phoneBase.add(navDisc);

      // Tactile Keypad (4 rows x 3 columns)
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          const key = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.018, 0.040), phoneKeyMat);
          key.position.set(0.04 + c * 0.080, 0.132, 0.07 + r * 0.060);
          key.rotation.x = 0.22;
          this.phoneBase.add(key);
        }
      }

      // Speed-dial buttons with active glow indicators
      this.quickJira = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.016, 0.034), new THREE.MeshStandardMaterial({ color: 0x2684ff }));
      this.quickJira.position.set(0.04, 0.138, 0.005);
      this.quickJira.rotation.x = 0.22;
      this.phoneBase.add(this.quickJira);

      this.quickSlack = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.016, 0.034), new THREE.MeshStandardMaterial({ color: 0xe01e5a }));
      this.quickSlack.position.set(0.12, 0.138, 0.005);
      this.quickSlack.rotation.x = 0.22;
      this.phoneBase.add(this.quickSlack);

      this.quickHook = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.016, 0.034), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
      this.quickHook.position.set(0.20, 0.138, 0.005);
      this.quickHook.rotation.x = 0.22;
      this.phoneBase.add(this.quickHook);

      // Handset Cradle with chrome plungers
      const cradleRecess = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.030, 0.44), softSlateMat);
      cradleRecess.position.set(-0.19, 0.11, 0);
      cradleRecess.rotation.x = 0.22;
      this.phoneBase.add(cradleRecess);

      const hookL = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.038, 16), chromeMat);
      hookL.position.set(-0.19, 0.13, -0.11);
      hookL.rotation.x = 0.22;
      this.phoneBase.add(hookL);

      const hookR = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.038, 16), chromeMat);
      hookR.position.set(-0.19, 0.13, 0.11);
      hookR.rotation.x = 0.22;
      this.phoneBase.add(hookR);

      // Status indicator LED dome
      this.phoneLed = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 14), this.glowMat);
      this.phoneLed.position.set(0.25, 0.15, -0.14);
      this.phoneBase.add(this.phoneLed);

      // Base cord jack port
      this.phoneJack = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 12), chromeMat);
      this.phoneJack.position.set(-0.25, 0.05, 0.22);
      this.phoneJack.rotation.x = Math.PI / 2;
      this.phoneBase.add(this.phoneJack);

      /* 3D Realistic Executive Telephone Handset */
      this.phoneHandset = new THREE.Group();

      // Ergonomic handle bar
      const handleGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.28, 20), phoneMat);
      handleGrip.castShadow = true;
      this.phoneHandset.add(handleGrip);

      const handleSpine = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.28, 0.040), phoneMat);
      handleSpine.position.z = -0.015;
      this.phoneHandset.add(handleSpine);

      const bandTop = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.015, 20), chromeMat);
      bandTop.position.y = 0.12;
      this.phoneHandset.add(bandTop);

      const bandBtm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.015, 20), chromeMat);
      bandBtm.position.y = -0.12;
      this.phoneHandset.add(bandBtm);

      // Earpiece (Top cup - cylindrical with acoustic cushion)
      const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.055, 24), phoneMat);
      earCup.position.set(0, 0.18, 0.015);
      earCup.castShadow = true;
      this.phoneHandset.add(earCup);

      const earPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.015, 24), softSlateMat);
      earPlate.position.set(0, 0.21, 0.015);
      this.phoneHandset.add(earPlate);

      const earRing = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.007, 10, 24), chromeMat);
      earRing.position.set(0, 0.21, 0.015);
      earRing.rotation.x = Math.PI / 2;
      this.phoneHandset.add(earRing);

      // Mouthpiece (Bottom cup - angled slightly inward towards speech)
      const mouthCup = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.050, 24), phoneMat);
      mouthCup.position.set(0, -0.18, 0.015);
      mouthCup.castShadow = true;
      this.phoneHandset.add(mouthCup);

      const mouthPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.015, 24), softSlateMat);
      mouthPlate.position.set(0, -0.205, 0.018);
      mouthPlate.rotation.x = -0.22;
      this.phoneHandset.add(mouthPlate);

      const mouthRing = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.006, 10, 24), chromeMat);
      mouthRing.position.set(0, -0.205, 0.018);
      mouthRing.rotation.x = Math.PI / 2 - 0.22;
      this.phoneHandset.add(mouthRing);

      // Handset cord tail port
      this.handsetTail = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.026, 12), chromeMat);
      this.handsetTail.position.set(0, -0.23, -0.01);
      this.phoneHandset.add(this.handsetTail);

      // Rest position on desk cradle
      this.cradleRestPos = new THREE.Vector3(-0.83, -0.08, 0.04);
      this.cradleRestRot = new THREE.Euler(0.22, 0, 0);
      this.phoneHandset.position.copy(this.cradleRestPos);
      this.phoneHandset.rotation.copy(this.cradleRestRot);
      this.deskPlatform.add(this.phoneHandset);

      // Coiled telephone wire mesh
      const cordInitCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.05));
      this.phoneCordMesh = new THREE.Mesh(
        new THREE.TubeGeometry(cordInitCurve, 20, 0.010, 6, false),
        new THREE.MeshStandardMaterial({ color: 0x162924, roughness: 0.5, metalness: 0.1 })
      );
      this.scene.add(this.phoneCordMesh);

      /* Character master container (scaled to 0.65 to fit comfortably in view) */
      this.character = new THREE.Group();
      this.character.scale.set(0.65, 0.65, 0.65);
      this.character.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);
      this.scene.add(this.character);

      /* Chubby pear-shaped torso */
      this.torsoGroup = new THREE.Group();
      this.character.add(this.torsoGroup);

      const bottomDome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 28, 16), porcelainMat);
      bottomDome.position.y = 0.06;
      bottomDome.castShadow = true;
      this.torsoGroup.add(bottomDome);

      const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.34, 28), porcelainMat);
      belly.position.y = 0.22;
      belly.castShadow = true;
      belly.receiveShadow = true;
      this.torsoGroup.add(belly);

      const chestDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 28, 16), porcelainMat);
      chestDome.position.y = 0.38;
      chestDome.castShadow = true;
      this.torsoGroup.add(chestDome);

      /* Myco Bot Official Chest Logo & Emblem */
      this.chestEmblem = new THREE.Group();
      this.chestEmblem.position.set(0, 0.32, 0.34);
      this.torsoGroup.add(this.chestEmblem);

      // Backing slate-spruce metallic bezel disc
      const chestBadgeDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.088, 0.016, 32),
        new THREE.MeshStandardMaterial({
          color: 0x142521,
          metalness: 0.8,
          roughness: 0.25
        })
      );
      chestBadgeDisc.rotation.x = Math.PI / 2;
      this.chestEmblem.add(chestBadgeDisc);

      // Outer vibrant teal glow ring
      const chestBadgeRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.086, 0.006, 12, 36),
        new THREE.MeshStandardMaterial({
          color: 0x2ee59d,
          emissive: 0x2ee59d,
          emissiveIntensity: 1.6,
          roughness: 0.15
        })
      );
      chestBadgeRing.position.z = 0.009;
      this.chestEmblem.add(chestBadgeRing);

      // Front Myco Logo emblem face
      const chestLogoFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.155, 0.155),
        new THREE.MeshBasicMaterial({
          map: this.chestLogoTexture,
          transparent: true
        })
      );
      chestLogoFace.position.z = 0.012;
      this.chestEmblem.add(chestLogoFace);

      const neckJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.08, 20), softSlateMat);
      neckJoint.position.set(0, 0.46, 0);
      this.torsoGroup.add(neckJoint);

      /* Head assembly with smooth rounded casing and curved OLED screen */
      this.head = new THREE.Group();
      this.head.position.set(0, 0.54, 0);
      this.character.add(this.head);

      const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.48, 0.50), porcelainMat);
      headBox.position.y = 0.24;
      headBox.castShadow = true;
      this.head.add(headBox);

      // Smooth top dome cap
      const headCap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), porcelainMat);
      headCap.position.y = 0.48;
      headCap.scale.set(1.0, 0.32, 0.80);
      headCap.castShadow = true;
      this.head.add(headCap);

      // Rounded side cheek contours softening box corners
      const cheekL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 18), porcelainMat);
      cheekL.position.set(-0.31, 0.24, 0);
      this.head.add(cheekL);

      const cheekR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 18), porcelainMat);
      cheekR.position.set(0.31, 0.24, 0);
      this.head.add(cheekR);

      // Visor bezel frame
      const visorBezel = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.40, 0.04), bezelMat);
      visorBezel.position.set(0, 0.24, 0.25);
      this.head.add(visorBezel);

      // Inset dynamic OLED screen
      const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), screenMat);
      screenPlane.position.set(0, 0.24, 0.272);
      this.head.add(screenPlane);

      // Cute rounded ear pods
      const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24);
      const earL = new THREE.Mesh(earGeo, porcelainMat);
      earL.rotation.z = Math.PI / 2;
      earL.position.set(-0.35, 0.24, 0);
      this.head.add(earL);

      const earRingL = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 20), this.glowMat);
      earRingL.rotation.y = Math.PI / 2;
      earRingL.position.set(-0.385, 0.24, 0);
      this.head.add(earRingL);

      const earR = new THREE.Mesh(earGeo, porcelainMat);
      earR.rotation.z = -Math.PI / 2;
      earR.position.set(0.35, 0.24, 0);
      this.head.add(earR);

      const earRingR = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 20), this.glowMat);
      earRingR.rotation.y = Math.PI / 2;
      earRingR.position.set(0.385, 0.24, 0);
      this.head.add(earRingR);

      // Antenna
      this.antenna = new THREE.Group();
      this.antenna.position.set(0, 0.56, 0);
      this.head.add(this.antenna);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 0.18, 12), softSlateMat);
      stem.position.y = 0.09;
      this.antenna.add(stem);

      this.crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), this.glowMat);
      this.crystal.position.y = 0.20;
      this.antenna.add(this.crystal);

      /* Left Arm Assembly (Articulated continuous mechanical limb with relaxed natural resting posture) */
      const shoulderSocketL = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.010, 12, 24), darkMetalMat);
      shoulderSocketL.position.set(-0.33, 0.31, 0.02);
      shoulderSocketL.rotation.y = Math.PI / 2;
      this.torsoGroup.add(shoulderSocketL);

      this.leftShoulder = new THREE.Group();
      this.leftShoulder.position.set(-0.35, 0.31, 0.02);
      this.torsoGroup.add(this.leftShoulder);

      const shoulderBallL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 22), metallicJointMat);
      shoulderBallL.castShadow = true;
      this.leftShoulder.add(shoulderBallL);

      const shoulderCapL = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.65), porcelainMat);
      shoulderCapL.rotation.x = Math.PI / 2;
      shoulderCapL.castShadow = true;
      this.leftShoulder.add(shoulderCapL);

      const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.16, 24), porcelainMat);
      upperArmL.position.y = -0.09;
      upperArmL.castShadow = true;
      upperArmL.receiveShadow = true;
      this.leftShoulder.add(upperArmL);

      const armTrimL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 24), metallicJointMat);
      armTrimL.position.y = -0.09;
      this.leftShoulder.add(armTrimL);

      this.leftElbow = new THREE.Group();
      this.leftElbow.position.set(0, -0.17, 0);
      this.leftShoulder.add(this.leftElbow);

      const elbowHingeL = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.068, 22), metallicJointMat);
      elbowHingeL.rotation.z = Math.PI / 2;
      elbowHingeL.castShadow = true;
      this.leftElbow.add(elbowHingeL);

      const elbowDiscL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.008, 18), darkMetalMat);
      elbowDiscL1.rotation.z = Math.PI / 2;
      elbowDiscL1.position.x = -0.035;
      this.leftElbow.add(elbowDiscL1);

      const elbowDiscL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.008, 18), darkMetalMat);
      elbowDiscL2.rotation.z = Math.PI / 2;
      elbowDiscL2.position.x = 0.035;
      this.leftElbow.add(elbowDiscL2);

      const elbowCapL = new THREE.Mesh(new THREE.SphereGeometry(0.044, 20, 20, 0, Math.PI, 0, Math.PI * 0.7), porcelainMat);
      elbowCapL.rotation.x = Math.PI;
      elbowCapL.position.z = -0.010;
      elbowCapL.castShadow = true;
      this.leftElbow.add(elbowCapL);

      const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.036, 0.15, 24), porcelainMat);
      forearmL.position.y = -0.085;
      forearmL.castShadow = true;
      forearmL.receiveShadow = true;
      this.leftElbow.add(forearmL);

      const forearmTrimL = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.010, 24), metallicJointMat);
      forearmTrimL.position.y = -0.085;
      this.leftElbow.add(forearmTrimL);

      this.leftHand = new THREE.Group();
      this.leftHand.position.set(0, -0.16, 0);
      this.leftElbow.add(this.leftHand);

      const wristCollarL = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.014, 22), metallicJointMat);
      wristCollarL.position.y = 0.007;
      this.leftHand.add(wristCollarL);

      const wristBallL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), darkMetalMat);
      this.leftHand.add(wristBallL);

      const palmL = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.038, 0.046), porcelainMat);
      palmL.position.set(0, -0.024, 0.005);
      palmL.castShadow = true;
      this.leftHand.add(palmL);

      const palmPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.038), metallicJointMat);
      palmPlateL.position.set(0, -0.024, -0.019);
      this.leftHand.add(palmPlateL);

      /* Left Hand Articulated Fingers (Relaxed natural resting posture) */
      const thumbKnuckleL = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 12), metallicJointMat);
      thumbKnuckleL.position.set(-0.025, -0.014, 0.012);
      this.leftHand.add(thumbKnuckleL);

      const thumbProxL = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.024, 12), porcelainMat);
      thumbProxL.position.set(-0.031, -0.024, 0.016);
      thumbProxL.rotation.z = 0.35;
      thumbProxL.rotation.x = 0.20;
      this.leftHand.add(thumbProxL);

      const thumbDistL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), porcelainMat);
      thumbDistL.position.set(-0.035, -0.034, 0.020);
      this.leftHand.add(thumbDistL);

      const fingerConfigsL = [
        { x: -0.016, len1: 0.026, len2: 0.020, rotX: 0.25 },
        { x: 0.001,  len1: 0.028, len2: 0.022, rotX: 0.25 },
        { x: 0.018,  len1: 0.025, len2: 0.020, rotX: 0.25 }
      ];

      fingerConfigsL.forEach(cfg => {
        const baseKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 10), metallicJointMat);
        baseKnuckle.position.set(cfg.x, -0.043, 0.005);
        this.leftHand.add(baseKnuckle);

        const phalanx1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0075, cfg.len1, 12), porcelainMat);
        phalanx1.position.set(cfg.x, -0.043 - cfg.len1 * 0.45, 0.005 + cfg.len1 * 0.12);
        phalanx1.rotation.x = cfg.rotX;
        this.leftHand.add(phalanx1);

        const midKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), metallicJointMat);
        midKnuckle.position.set(cfg.x, -0.043 - cfg.len1 * 0.90, 0.005 + cfg.len1 * 0.24);
        this.leftHand.add(midKnuckle);

        const phalanx2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0065, cfg.len2, 12), porcelainMat);
        phalanx2.position.set(cfg.x, -0.043 - cfg.len1 * 0.90 - cfg.len2 * 0.45, 0.005 + cfg.len1 * 0.24 + cfg.len2 * 0.16);
        phalanx2.rotation.x = cfg.rotX + 0.10;
        this.leftHand.add(phalanx2);

        const fingerTip = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 10), porcelainMat);
        fingerTip.position.set(cfg.x, -0.043 - cfg.len1 * 0.90 - cfg.len2 * 0.90, 0.005 + cfg.len1 * 0.24 + cfg.len2 * 0.30);
        this.leftHand.add(fingerTip);
      });

      // Default grounded resting pose for left arm
      this.leftShoulder.rotation.set(-0.08, 0.04, -0.10);
      this.leftElbow.rotation.set(0.18, 0.05, 0);
      this.leftHand.rotation.set(0.04, 0, 0.06);

      /* Right Arm Assembly (Articulated continuous mechanical limb naturally gripping coffee mug) */
      const shoulderSocketR = new THREE.Mesh(new THREE.TorusGeometry(0.060, 0.010, 12, 24), darkMetalMat);
      shoulderSocketR.position.set(0.33, 0.31, 0.02);
      shoulderSocketR.rotation.y = -Math.PI / 2;
      this.torsoGroup.add(shoulderSocketR);

      this.rightShoulder = new THREE.Group();
      this.rightShoulder.position.set(0.35, 0.31, 0.02);
      this.torsoGroup.add(this.rightShoulder);

      const shoulderBallR = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 22), metallicJointMat);
      shoulderBallR.castShadow = true;
      this.rightShoulder.add(shoulderBallR);

      const shoulderCapR = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.65), porcelainMat);
      shoulderCapR.rotation.x = Math.PI / 2;
      shoulderCapR.castShadow = true;
      this.rightShoulder.add(shoulderCapR);

      const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.16, 24), porcelainMat);
      upperArmR.position.y = -0.09;
      upperArmR.castShadow = true;
      upperArmR.receiveShadow = true;
      this.rightShoulder.add(upperArmR);

      const armTrimR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 24), metallicJointMat);
      armTrimR.position.y = -0.09;
      this.rightShoulder.add(armTrimR);

      this.rightElbow = new THREE.Group();
      this.rightElbow.position.set(0, -0.17, 0);
      this.rightShoulder.add(this.rightElbow);

      const elbowHingeR = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.068, 22), metallicJointMat);
      elbowHingeR.rotation.z = Math.PI / 2;
      elbowHingeR.castShadow = true;
      this.rightElbow.add(elbowHingeR);

      const elbowDiscR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.008, 18), darkMetalMat);
      elbowDiscR1.rotation.z = Math.PI / 2;
      elbowDiscR1.position.x = -0.035;
      this.rightElbow.add(elbowDiscR1);

      const elbowDiscR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.008, 18), darkMetalMat);
      elbowDiscR2.rotation.z = Math.PI / 2;
      elbowDiscR2.position.x = 0.035;
      this.rightElbow.add(elbowDiscR2);

      const elbowCapR = new THREE.Mesh(new THREE.SphereGeometry(0.044, 20, 20, 0, Math.PI, 0, Math.PI * 0.7), porcelainMat);
      elbowCapR.rotation.x = Math.PI;
      elbowCapR.position.z = -0.010;
      elbowCapR.castShadow = true;
      this.rightElbow.add(elbowCapR);

      const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.036, 0.15, 24), porcelainMat);
      forearmR.position.y = -0.085;
      forearmR.castShadow = true;
      forearmR.receiveShadow = true;
      this.rightElbow.add(forearmR);

      const forearmTrimR = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.010, 24), metallicJointMat);
      forearmTrimR.position.y = -0.085;
      this.rightElbow.add(forearmTrimR);

      this.rightHand = new THREE.Group();
      this.rightHand.position.set(0, -0.16, 0);
      this.rightElbow.add(this.rightHand);

      const wristCollarR = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.014, 22), metallicJointMat);
      wristCollarR.position.y = 0.007;
      this.rightHand.add(wristCollarR);

      const wristBallR = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), darkMetalMat);
      this.rightHand.add(wristBallR);

      const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.038, 0.046), porcelainMat);
      palmR.position.set(0, -0.024, 0.005);
      palmR.castShadow = true;
      this.rightHand.add(palmR);

      const palmPlateR = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.038), metallicJointMat);
      palmPlateR.position.set(0, -0.024, -0.019);
      this.rightHand.add(palmPlateR);

      /* Ceramic coffee mug naturally held by the right hand */
      this.coffeeMug = new THREE.Group();
      // Position mug handle directly inside the grasp of the right hand's palm and fingers
      this.coffeeMug.position.set(0.012, -0.035, 0.022);
      // Counter-rotate mug pitch so that in resting arm pose, the mug stands perfectly level and upright
      this.coffeeMug.rotation.set(-0.65, 0.10, -0.05);
      this.rightHand.add(this.coffeeMug);

      const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.064, 0.145, 24), mugMat);
      mugBody.position.set(0.068, 0, 0);
      mugBody.castShadow = true;
      mugBody.receiveShadow = true;
      this.coffeeMug.add(mugBody);

      const mugBand = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.020, 24), mugTrimMat);
      mugBand.position.set(0.068, 0.030, 0);
      this.coffeeMug.add(mugBand);

      const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.011, 12, 24, Math.PI * 1.15), mugMat);
      mugHandle.position.set(0, 0, 0);
      mugHandle.rotation.z = -Math.PI / 2;
      mugHandle.castShadow = true;
      this.coffeeMug.add(mugHandle);

      const coffeeLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.014, 20), coffeeLiquidMat);
      coffeeLiquid.position.set(0.068, 0.065, 0);
      this.coffeeMug.add(coffeeLiquid);

      /* Steam particles */
      this.steamGroup = new THREE.Group();
      this.steamGroup.position.set(0.068, 0.10, 0);
      this.coffeeMug.add(this.steamGroup);

      const steamMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.28 });
      for (let i = 0; i < 8; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), steamMat.clone());
        puff.position.set((Math.random() - 0.5) * 0.04, Math.random() * 0.14, (Math.random() - 0.5) * 0.04);
        this.steamGroup.add(puff);
        this.steamPuffs.push({
          mesh: puff,
          vy: 0.003 + Math.random() * 0.003,
          life: Math.random() * 1.5,
          maxLife: 1.5
        });
      }

      /* Right Hand Articulated Fingers (Grasping coffee mug handle securely) */
      // Opposable thumb resting over the top rim of the handle
      const thumbKnuckleR = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 12), metallicJointMat);
      thumbKnuckleR.position.set(0.026, -0.012, 0.015);
      this.rightHand.add(thumbKnuckleR);

      const thumbProxR = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.024, 12), porcelainMat);
      thumbProxR.position.set(0.020, -0.018, 0.026);
      thumbProxR.rotation.z = -0.40;
      thumbProxR.rotation.x = 0.55;
      this.rightHand.add(thumbProxR);

      const thumbDistR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), porcelainMat);
      thumbDistR.position.set(0.015, -0.026, 0.034);
      this.rightHand.add(thumbDistR);

      // Index finger hooking cleanly through the upper handle aperture
      const indexKnuckleR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 10), metallicJointMat);
      indexKnuckleR.position.set(0.016, -0.044, 0.012);
      this.rightHand.add(indexKnuckleR);

      const indexProxR = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0075, 0.024, 12), porcelainMat);
      indexProxR.position.set(0.014, -0.042, 0.024);
      indexProxR.rotation.x = 0.80;
      this.rightHand.add(indexProxR);

      const indexDistR = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), porcelainMat);
      indexDistR.position.set(0.010, -0.034, 0.036);
      this.rightHand.add(indexDistR);

      // Middle finger wrapping firmly around the handle
      const midKnuckleR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 10), metallicJointMat);
      midKnuckleR.position.set(0.002, -0.044, 0.012);
      this.rightHand.add(midKnuckleR);

      const midProxR = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0075, 0.025, 12), porcelainMat);
      midProxR.position.set(0.000, -0.044, 0.024);
      midProxR.rotation.x = 0.85;
      this.rightHand.add(midProxR);

      const midDistR = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), porcelainMat);
      midDistR.position.set(-0.002, -0.038, 0.036);
      this.rightHand.add(midDistR);

      // Ring finger supporting the bottom curve of the handle
      const ringKnuckleR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 10), metallicJointMat);
      ringKnuckleR.position.set(-0.016, -0.044, 0.010);
      this.rightHand.add(ringKnuckleR);

      const ringProxR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.022, 12), porcelainMat);
      ringProxR.position.set(-0.016, -0.046, 0.020);
      ringProxR.rotation.x = 0.70;
      this.rightHand.add(ringProxR);

      const ringDistR = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 10), porcelainMat);
      ringDistR.position.set(-0.016, -0.042, 0.030);
      this.rightHand.add(ringDistR);

      // Default comfortable coffee-holding pose for right arm
      this.rightShoulder.rotation.set(-0.32, -0.10, 0.12);
      this.rightElbow.rotation.set(0.85, -0.15, 0);
      this.rightHand.rotation.set(0.12, 0.0, -0.10);

      /* Legs Assembly: symmetrical, high-precision robotic limbs with stable grounded boots */
      this.leftLeg = new THREE.Group();
      this.leftLeg.position.set(-0.16, -0.08, 0.02);
      this.torsoGroup.add(this.leftLeg);

      this.rightLeg = new THREE.Group();
      this.rightLeg.position.set(0.16, -0.08, 0.02);
      this.torsoGroup.add(this.rightLeg);

      const buildLeg = (legGroup, isLeft) => {
        // 1. Torso mounting socket bezel
        const hipSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.018, 24), darkMetalMat);
        hipSocket.position.y = 0.009;
        legGroup.add(hipSocket);

        // 2. Hip mechanical ball joint
        const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.054, 22, 22), metallicJointMat);
        hipBall.position.y = -0.008;
        hipBall.castShadow = true;
        legGroup.add(hipBall);

        // 3. Thigh (Upper Leg)
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.11, 24), porcelainMat);
        thigh.position.y = -0.065;
        thigh.castShadow = true;
        thigh.receiveShadow = true;
        legGroup.add(thigh);

        const thighTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.010, 24), metallicJointMat);
        thighTrim.position.y = -0.065;
        legGroup.add(thighTrim);

        // 4. Knee Joint (Transverse mechanical axle hinge)
        const kneeAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.074, 24), metallicJointMat);
        kneeAxle.position.y = -0.130;
        kneeAxle.rotation.z = Math.PI / 2;
        kneeAxle.castShadow = true;
        legGroup.add(kneeAxle);

        const kneeCapL = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20), darkMetalMat);
        kneeCapL.position.set(-0.038, -0.130, 0);
        kneeCapL.rotation.z = Math.PI / 2;
        legGroup.add(kneeCapL);

        const kneeCapR = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20), darkMetalMat);
        kneeCapR.position.set(0.038, -0.130, 0);
        kneeCapR.rotation.z = Math.PI / 2;
        legGroup.add(kneeCapR);

        // Protective front porcelain patella guard
        const patella = new THREE.Mesh(new THREE.SphereGeometry(0.044, 20, 16, 0, Math.PI, 0, Math.PI * 0.7), porcelainMat);
        patella.position.set(0, -0.130, 0.012);
        patella.rotation.x = -Math.PI / 2;
        patella.castShadow = true;
        legGroup.add(patella);

        // 5. Shin (Lower Leg)
        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.040, 0.12, 24), porcelainMat);
        shin.position.y = -0.195;
        shin.castShadow = true;
        shin.receiveShadow = true;
        legGroup.add(shin);

        const shinTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.010, 24), metallicJointMat);
        shinTrim.position.y = -0.195;
        legGroup.add(shinTrim);

        // 6. Ankle Joint
        const ankleCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.016, 24), darkMetalMat);
        ankleCollar.position.y = -0.265;
        legGroup.add(ankleCollar);

        const ankleBall = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 20), metallicJointMat);
        ankleBall.position.y = -0.278;
        ankleBall.castShadow = true;
        legGroup.add(ankleBall);

        // 7. Stable grounded robotic foot (rests flat on desk surface at local y = -0.351)
        const foot = new THREE.Group();
        foot.position.set(0, -0.280, 0);
        foot.rotation.y = isLeft ? -0.05 : 0.05; // Slight natural toe-out angle
        legGroup.add(foot);

        // Ankle vertical tendon strut
        const tendonStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.024, 12), metallicJointMat);
        tendonStrut.position.set(0, -0.012, 0);
        foot.add(tendonStrut);

        // Main shoe instep shell
        const shoeBody = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.046, 0.13), porcelainMat);
        shoeBody.position.set(0, -0.035, 0.010);
        shoeBody.castShadow = true;
        shoeBody.receiveShadow = true;
        foot.add(shoeBody);

        // Aerodynamic rounded toe contour (smooth cylinder cap, NOT an oversized sphere)
        const shoeToe = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.046, 24, 1, false, 0, Math.PI), porcelainMat);
        shoeToe.position.set(0, -0.035, 0.075);
        shoeToe.rotation.x = -Math.PI / 2;
        shoeToe.rotation.z = Math.PI / 2;
        shoeToe.castShadow = true;
        shoeToe.receiveShadow = true;
        foot.add(shoeToe);

        // Smooth rounded heel contour
        const shoeHeel = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.046, 24, 1, false, 0, Math.PI), porcelainMat);
        shoeHeel.position.set(0, -0.035, -0.055);
        shoeHeel.rotation.x = -Math.PI / 2;
        shoeHeel.rotation.z = -Math.PI / 2;
        shoeHeel.castShadow = true;
        foot.add(shoeHeel);

        // Midsole metallic accent trim
        const midsoleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.005, 0.16), metallicJointMat);
        midsoleTrim.position.set(0, -0.057, 0.010);
        foot.add(midsoleTrim);

        // Flat rubberized ground sole base plate (rests flat on desk surface)
        const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.116, 0.014, 0.20), darkMetalMat);
        shoeSole.position.set(0, -0.064, 0.010);
        shoeSole.castShadow = true;
        shoeSole.receiveShadow = true;
        foot.add(shoeSole);

        const soleToe = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.014, 24, 1, false, 0, Math.PI), darkMetalMat);
        soleToe.position.set(0, -0.064, 0.110);
        soleToe.rotation.x = -Math.PI / 2;
        soleToe.rotation.z = Math.PI / 2;
        soleToe.receiveShadow = true;
        foot.add(soleToe);

        const soleHeel = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.014, 24, 1, false, 0, Math.PI), darkMetalMat);
        soleHeel.position.set(0, -0.064, -0.090);
        soleHeel.rotation.x = -Math.PI / 2;
        soleHeel.rotation.z = -Math.PI / 2;
        soleHeel.receiveShadow = true;
        foot.add(soleHeel);
      };

      buildLeg(this.leftLeg, true);
      buildLeg(this.rightLeg, false);

      /* Inspection tablet prop */
      this.tabletProp = new THREE.Group();
      this.tabletProp.position.set(0, 0.18, 0.60);
      this.tabletProp.visible = false;
      this.character.add(this.tabletProp);

      const tabletFrame = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.56, 0.028), softSlateMat);
      this.tabletProp.add(tabletFrame);

      const tabletScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tabletScreen.position.z = 0.016;
      this.tabletProp.add(tabletScreen);

      for (let i = 0; i < 5; i++) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(0.38 + (i % 2) * 0.12, 0.022),
          new THREE.MeshBasicMaterial({ color: i === 2 ? 0xa12d35 : 0x39756d, transparent: true, opacity: 0.85 })
        );
        line.position.set(-0.11 + (i % 2) * 0.04, 0.13 - i * 0.065, 0.020);
        this.tabletProp.add(line);
      }

      /* Scanning beam cone */
      const coneGeo = new THREE.ConeGeometry(0.55, 0.95, 24, 1, true);
      coneGeo.translate(0, -0.47, 0);
      coneGeo.rotateX(Math.PI / 2);
      this.scanCone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({
        color: 0x39756d,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      }));
      this.scanCone.position.set(0, 0.72, 0.32);
      this.character.add(this.scanCone);
    }

    resetDispatchPopups() {
      const container = document.getElementById("stage-dispatch-popups-layer");
      if (container) container.innerHTML = "";
      this.dispatchPopups = [];

      // Strictly position in the left-hand clear zone of the stage,
      // completely clear of the 3D robot standing on the right.
      this.dispatchLayout = {
        Jira: { topPx: 14 },
        Slack: { topPx: 76 },
        Custom: { topPx: 138 },
      };
    }

    showDispatchPopup(appName, details) {
      const container = document.getElementById("stage-dispatch-popups-layer");
      if (!container) return;

      if (!this.dispatchLayout) {
        this.resetDispatchPopups();
      }

      const pos = this.dispatchLayout[appName] || { topPx: 14 };
      const activeSample = (isDemoMode && currentDemoIndex >= 0 && DEMO_EXAMPLES[currentDemoIndex]) ? DEMO_EXAMPLES[currentDemoIndex] : null;

      let iconSvg = "";
      let title = "";
      let statusTag = "SYNCED";
      let detailText = "";
      let themeClass = "";

      if (appName === "Jira") {
        const jira = (details && details.jira) || (activeSample && activeSample.jiraTicket) || { id: "SEC-4827", summary: "High Priority Finding" };
        title = "Jira Software";
        detailText = `${jira.id} · ${jira.summary || jira.priority || "Ticket Logged"}`;
        themeClass = "stage-floating-dispatch--jira";
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11.57 2.05C11.57 7.28 15.82 11.53 21.05 11.53V2.05h-9.48z" fill="#0052CC"/><path d="M2 11.53c5.23 0 9.48 4.25 9.48 9.48H2v-9.48z" fill="#2684FF"/><path d="M11.57 11.53A9.48 9.48 0 0 1 2.09 2.05H2v18.96h9.57v-9.48z" fill="#0052CC" fill-opacity="0.85"/></svg>`;
      } else if (appName === "Slack") {
        const slack = (details && details.slack) || (activeSample && activeSample.slackAlert) || { channel: "#sec-eng", preview: "Dispatched Alert" };
        title = "Slack Alert";
        detailText = `${slack.channel} · ${slack.preview || slack.detail || "Alert Broadcast"}`;
        themeClass = "stage-floating-dispatch--slack";
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5.5 10a2.5 2.5 0 0 1 2.5-2.5h2.5V10a2.5 2.5 0 0 1-5 0z" fill="#E01E5A"/><path d="M2 12.5a2.5 2.5 0 0 1 2.5-2.5H10v2.5a2.5 2.5 0 0 1-5 0H2z" fill="#E01E5A"/><path d="M14 5.5A2.5 2.5 0 0 1 16.5 3H19v2.5a2.5 2.5 0 0 1-5 0z" fill="#36C5F0"/><path d="M16.5 2A2.5 2.5 0 0 1 19 4.5V10h-2.5A2.5 2.5 0 0 1 16.5 2z" fill="#36C5F0"/><path d="M18.5 14a2.5 2.5 0 0 1-2.5 2.5H13.5V14a2.5 2.5 0 0 1 5 0z" fill="#2EB67D"/><path d="M22 11.5a2.5 2.5 0 0 1-2.5 2.5H14v-2.5a2.5 2.5 0 0 1 5 0h3z" fill="#2EB67D"/><path d="M10 18.5A2.5 2.5 0 0 1 7.5 21H5v-2.5a2.5 2.5 0 0 1 5 0z" fill="#ECB22E"/><path d="M7.5 22A2.5 2.5 0 0 1 5 19.5V14h2.5a2.5 2.5 0 0 1 0 5v3z" fill="#ECB22E"/></svg>`;
      } else if (appName === "Custom") {
        const custom = (details && details.webhook) || (activeSample && activeSample.customApp) || { event: "POST /v1/events", latency: "34ms" };
        title = "Custom Webhook";
        detailText = `${custom.event || "POST /v1/events"} · ${custom.latency || "34ms"}`;
        themeClass = "stage-floating-dispatch--custom";
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#39756d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M6 8H5a4 4 0 0 0 0 8h1"/><line x1="8" y1="12" x2="16" y2="12"/><circle cx="12" cy="12" r="2" fill="#39756d"/></svg>`;
      }

      const existing = document.getElementById(`floating-dispatch-${appName.toLowerCase()}`);
      if (existing) existing.remove();

      const el = document.createElement("div");
      el.id = `floating-dispatch-${appName.toLowerCase()}`;
      el.className = `stage-floating-dispatch ${themeClass}`;
      el.style.top = `${pos.topPx}px`;
      el.style.left = "14px";
      el.style.right = "auto";

      el.innerHTML = `
        <div class="stage-floating-dispatch__header">
          <div class="stage-floating-dispatch__brand">
            <span class="stage-floating-dispatch__icon">${iconSvg}</span>
            <span class="stage-floating-dispatch__name">${title}</span>
          </div>
          <span class="stage-floating-dispatch__tag mono">${statusTag}</span>
          <button type="button" class="stage-floating-dispatch__close" title="Dismiss" aria-label="Dismiss">×</button>
        </div>
        <div class="stage-floating-dispatch__detail mono">
          <span class="stage-floating-dispatch__dot"></span>
          <span class="stage-floating-dispatch__text">${escapeHtml(detailText)}</span>
        </div>
      `;

      const closeBtn = el.querySelector(".stage-floating-dispatch__close");
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          el.classList.add("is-dismissing");
          setTimeout(() => el.remove(), 250);
        });
      }

      container.appendChild(el);
      this.dispatchPopups.push(el);
    }

    dismissAllDispatchPopups() {
      const container = document.getElementById("stage-dispatch-popups-layer");
      if (!container) return;
      const popups = container.querySelectorAll(".stage-floating-dispatch");
      popups.forEach(p => p.classList.add("is-dismissing"));
      setTimeout(() => {
        if (container) container.innerHTML = "";
      }, 300);
    }

    highlightBadge(appName) {
      // Speed-dial illumination feedback on desk phone console
      if (this.quickJira && this.quickJira.material) {
        this.quickJira.material.emissive = this.quickJira.material.emissive || new window.THREE.Color();
        this.quickJira.material.emissive.setHex(appName === "Jira" ? 0x2684ff : 0x000000);
      }
      if (this.quickSlack && this.quickSlack.material) {
        this.quickSlack.material.emissive = this.quickSlack.material.emissive || new window.THREE.Color();
        this.quickSlack.material.emissive.setHex(appName === "Slack" ? 0xe01e5a : 0x000000);
      }
      if (this.quickHook && this.quickHook.material) {
        this.quickHook.material.emissive = this.quickHook.material.emissive || new window.THREE.Color();
        this.quickHook.material.emissive.setHex(appName === "Custom" ? 0x10b981 : 0x000000);
      }
    }

    updateDispatchTray(details) {
      // Kept for backward compatibility
    }

    setDispatchTrayOpen(isOpen) {
      // Kept for backward compatibility
    }

    updateBadges() {
      this.updateDispatchTray();
      this.drawPhoneScreen();
    }

    setPhoneScreenState(mode, detail) {
      this.phoneScreenMode = mode;
      this.phoneScreenDetail = detail || "";
      this.drawPhoneScreen();
    }

    drawPhoneScreen() {
      if (!this.phoneScreenCtx) return;
      const ctx = this.phoneScreenCtx;
      const w = 384;
      const h = 192;

      ctx.fillStyle = "#081b17";
      ctx.fillRect(0, 0, w, h);

      // Micro scanline grid
      ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const scenario = SCENARIOS[currentScenarioKey] || SCENARIOS.pr_4827 || SCENARIOS.secret;
      const finding = (currentAnalysisResult && currentAnalysisResult.primaryFinding) ? currentAnalysisResult.primaryFinding : null;
      const dispatch = (finding && finding.dispatchDetails) ? finding.dispatchDetails : scenario;
      const jira = dispatch.jira || scenario.jiraTicket;
      const slack = dispatch.slack || scenario.slackAlert || { channel: "#sec-eng" };
      const custom = dispatch.webhook || scenario.customApp;

      const isCalling = this.state === "CALL_TELEPHONE";
      const mode = this.phoneScreenMode || (isCalling ? "CALL" : "IDLE");

      let header = "LINE 1: READY";
      let mainText = "OFFICE CONSOLE";
      let subText = "AUTOPILOT ARMED";
      let headerColor = "#52796f";
      let mainColor = "#e2e8f0";
      let subColor = "#94a3b8";

      if (mode === "DIALING") {
        header = "DIALING DISPATCH...";
        mainText = "SWITCHBOARD CONNECT";
        subText = "ROUTING INTEGRATIONS";
        headerColor = "#00f0ff";
        mainColor = "#38bdf8";
        subColor = "#7dd3fc";
      } else if (mode === "JIRA") {
        header = "LIVE CALL [1/3]";
        mainText = `JIRA: ${jira.id}`;
        subText = `ASSIGNED ${jira.priority || "P0"} · REST v3`;
        headerColor = "#38bdf8";
        mainColor = "#60a5fa";
        subColor = "#93c5fd";
      } else if (mode === "SLACK") {
        header = "LIVE CALL [2/3]";
        mainText = `SLACK: ${slack.channel}`;
        subText = "ALERT DISPATCHED OK";
        headerColor = "#ec4899";
        mainColor = "#f472b6";
        subColor = "#fbcfe8";
      } else if (mode === "WEBHOOK") {
        header = "LIVE CALL [3/3]";
        mainText = "API: HTTP 200 OK";
        subText = `LATENCY ${custom.latency || "34ms"} · SYNCED`;
        headerColor = "#10b981";
        mainColor = "#34d399";
        subColor = "#6ee7b7";
      } else if (mode === "VERIFIED") {
        header = "DISPATCH VERIFIED";
        mainText = "ALL 3 CHANNELS LIVE";
        subText = "SIP SESSION CONCLUDED";
        headerColor = "#10b981";
        mainColor = "#34d399";
        subColor = "#6ee7b7";
      } else if (isCalling) {
        header = "LIVE DISPATCH";
        mainText = `${jira.id} CONNECT`;
        subText = "JIRA · SLACK · API OK";
        headerColor = "#00f0ff";
        mainColor = "#10b981";
        subColor = "#34d399";
      }

      if (this.phoneScreenDetail) {
        subText = this.phoneScreenDetail;
      }

      // Top line
      ctx.fillStyle = headerColor;
      ctx.font = "bold 19px -apple-system, BlinkMacSystemFont, monospace";
      ctx.fillText(header, 20, 36);

      // Center line
      ctx.fillStyle = mainColor;
      ctx.font = "bold 25px -apple-system, BlinkMacSystemFont, monospace";
      ctx.fillText(mainText, 20, 94);

      // Bottom line: live status
      ctx.fillStyle = subColor;
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, monospace";
      ctx.fillText(subText, 20, 148);

      // Border glow
      ctx.strokeStyle = isCalling ? "#10b981" : "#1f3a33";
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      this.phoneScreenTexture.needsUpdate = true;
    }

    updatePhoneCord() {
      if (!this.phoneCordMesh || !this.phoneJack || !this.handsetTail) return;
      const start = new window.THREE.Vector3();
      const end = new window.THREE.Vector3();
      this.phoneJack.getWorldPosition(start);
      this.handsetTail.getWorldPosition(end);

      const dist = start.distanceTo(end);
      const points = [];
      const numSegments = 32;
      const mid = new window.THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      // Gravity droop
      mid.y -= Math.min(0.24, dist * 0.40 + 0.04);
      mid.z += 0.06;

      const curve = new window.THREE.QuadraticBezierCurve3(start, mid, end);
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const pt = curve.getPoint(t);
        // Coiled telephone spiral loops
        const angle = t * Math.PI * 22;
        const coilRadius = 0.014 * Math.sin(t * Math.PI);
        pt.x += Math.cos(angle) * coilRadius;
        pt.z += Math.sin(angle) * coilRadius;
        points.push(pt);
      }

      const path = new window.THREE.CatmullRomCurve3(points);
      this.phoneCordMesh.geometry.dispose();
      this.phoneCordMesh.geometry = new window.THREE.TubeGeometry(path, 32, 0.010, 6, false);
    }

    bindEvents() {
      let dragStartX = 0;
      let dragStartY = 0;
      let hasDragged = false;

      const getNormalizedPointer = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          nx: Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1)),
          ny: Math.max(-1, Math.min(1, -(((clientY - rect.top) / rect.height) * 2 - 1))),
          rect
        };
      };

      this.canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        const { nx, ny } = getNormalizedPointer(e.clientX, e.clientY);
        this.mouseVec.set(nx, ny);
        this.raycaster.setFromCamera(this.mouseVec, this.camera);

        const hits = this.raycaster.intersectObjects(this.character.children, true);
        if (hits.length > 0) {
          this.isDragging = true;
          hasDragged = false;
          dragStartX = e.clientX;
          dragStartY = e.clientY;

          try {
            this.canvas.setPointerCapture(e.pointerId);
          } catch (_) {}

          this.dragPlane.set(new window.THREE.Vector3(0, 0, 1), -this.character.position.z);
          const intersectPoint = new window.THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
            this.dragOffset.copy(intersectPoint).sub(this.character.position);
          } else {
            this.dragOffset.set(0, 0, 0);
          }

          this.canvas.style.cursor = "grabbing";
          if (this.angryCooldownTimer) {
            clearTimeout(this.angryCooldownTimer);
            this.angryCooldownTimer = null;
          }

          this.emotion = "angry";
          this.glowMat.color.setHex(0xf97316);
          this.glowMat.emissive.setHex(0xf97316);
          this.coffeeMug.visible = false;

          const quote = this.angryQuotes[this.angryQuoteIndex % this.angryQuotes.length];
          this.angryQuoteIndex++;
          setAgentBubble(quote);

          e.preventDefault();
        }
      });

      window.addEventListener("pointermove", (e) => {
        const { nx, ny, rect } = getNormalizedPointer(e.clientX, e.clientY);
        this.mouseGaze.x = nx;
        this.mouseGaze.y = ny;

        if (this.isDragging) {
          if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 4) {
            hasDragged = true;
          }
          this.mouseVec.set(nx, ny);
          this.raycaster.setFromCamera(this.mouseVec, this.camera);
          const intersectPoint = new window.THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
            const desiredX = intersectPoint.x - this.dragOffset.x;
            const desiredY = intersectPoint.y - this.dragOffset.y;
            this.targetPos.x = Math.max(-1.30, Math.min(1.30, desiredX));
            this.targetPos.y = Math.max(-0.45, Math.min(1.10, desiredY));
          }
          return;
        }

        // Hover cursor check
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          this.mouseVec.set(nx, ny);
          this.raycaster.setFromCamera(this.mouseVec, this.camera);
          const hits = this.raycaster.intersectObjects(this.character.children, true);
          if (hits.length > 0) {
            this.canvas.style.cursor = "grab";
          } else {
            this.canvas.style.cursor = "default";
          }
        }
      });

      const handlePointerRelease = (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.canvas.style.cursor = "grab";
        if (e && e.pointerId) {
          try {
            this.canvas.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }

        if (hasDragged) {
          setAgentBubble("Repositioning agent. Ready to evaluate code changes.");
        }

        if (this.state === "SITTING_COFFEE") {
          this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
        } else if (this.state === "EXAMINE_FILE" || this.state === "PICKUP_FILE") {
          this.targetPos = { x: 0.0, y: -0.25, z: 0.55 };
        } else {
          this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
        }

        if (this.angryCooldownTimer) clearTimeout(this.angryCooldownTimer);
        this.angryCooldownTimer = setTimeout(() => {
          if (!this.isDragging && this.state === "SITTING_COFFEE") {
            this.emotion = "normal";
            this.glowMat.color.setHex(0x00f0ff);
            this.glowMat.emissive.setHex(0x00f0ff);
            this.coffeeMug.visible = true;
            setAgentBubble("Agent standing by. Observing active code buffer.");
          }
        }, 3000);
      };

      window.addEventListener("pointerup", handlePointerRelease);
      window.addEventListener("pointercancel", handlePointerRelease);

      this.canvas.addEventListener("click", () => {
        if (hasDragged) return;
        if (this.state === "SITTING_COFFEE") {
          if (this.emotion === "angry") {
            setAgentBubble("Recalibrating sensors. Ready to resume inspection.");
          } else {
            this.triggerCoffeeSip();
            setAgentBubble("Agent standing by. Observing active code buffer.");
          }
        }
      });

      const handleResize = () => {
        const width = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : (window.innerWidth || 500);
        const height = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 280;
        this.updateResponsiveCamera(width, height);
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      if (window.ResizeObserver && this.canvas.parentElement) {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            if (cr.width > 0 && cr.height > 0) {
              this.updateResponsiveCamera(cr.width, cr.height);
            }
          }
        });
        this.resizeObserver.observe(this.canvas.parentElement);
      }
    }

    triggerCoffeeSip() {
      if (this.isSipping) return;
      this.isSipping = true;
      this.sipCooldown = 0;
    }

    setPetState(newState) {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.angryCooldownTimer) {
          clearTimeout(this.angryCooldownTimer);
          this.angryCooldownTimer = null;
        }
      }
      this.state = newState;

      switch (newState) {
        case "SITTING_COFFEE":
          this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
          this.tabletProp.visible = false;
          this.coffeeMug.visible = true;
          this.scanCone.material.opacity = 0;
          this.targetBadgeScale = 0;
          this.emotion = "normal";
          this.glowMat.color.setHex(0x00f0ff);
          this.glowMat.emissive.setHex(0x00f0ff);

          // Balanced, natural arm rest poses and stable grounded stance
          this.leftShoulder.rotation.set(-0.08, 0.04, -0.10);
          this.leftElbow.rotation.set(0.18, 0.05, 0);
          this.leftHand.rotation.set(0.04, 0, 0.06);
          this.rightShoulder.rotation.set(-0.32, -0.10, 0.12);
          this.rightElbow.rotation.set(0.85, -0.15, 0);
          this.rightHand.rotation.set(0.12, 0.0, -0.10);
          this.leftLeg.rotation.set(0, 0, 0);
          this.rightLeg.rotation.set(0, 0, 0);

          // Return handset to executive phone base cradle
          if (this.phoneHandset && this.cradleRestPos) {
            this.phoneHandset.scale.set(1.0, 1.0, 1.0);
            this.phoneHandset.position.copy(this.cradleRestPos);
            this.phoneHandset.rotation.copy(this.cradleRestRot);
            this.deskPlatform.add(this.phoneHandset);
          }
          this.drawPhoneScreen();
          break;

        case "GET_UP":
          this.targetPos = { x: 0.72, y: 0.18, z: -0.05 };
          this.coffeeMug.visible = false;
          this.tabletProp.visible = false;
          this.scanCone.material.opacity = 0;
          this.targetBadgeScale = 0;
          this.emotion = "normal";
          this.leftShoulder.rotation.set(0, 0, -0.22);
          this.leftElbow.rotation.set(0.2, 0, 0);
          this.rightShoulder.rotation.set(0, 0, 0.22);
          this.rightElbow.rotation.set(0.2, 0, 0);
          break;

        case "JUMP_DOWN":
          this.targetPos = { x: 0.0, y: -0.25, z: 0.55 };
          break;

        case "PICKUP_FILE":
          this.targetPos = { x: 0.0, y: -0.25, z: 0.55 };
          this.tabletProp.visible = true;
          this.coffeeMug.visible = false;
          this.leftShoulder.rotation.set(-0.85, 0, 0.32);
          this.leftElbow.rotation.set(1.15, 0, 0);
          this.rightShoulder.rotation.set(-0.85, 0, -0.32);
          this.rightElbow.rotation.set(1.15, 0, 0);
          break;

        case "EXAMINE_FILE":
          this.targetPos = { x: 0.0, y: -0.25, z: 0.55 };
          this.tabletProp.visible = true;
          this.scanCone.material.opacity = 0.28;
          const isError = currentScenarioKey !== "clean";
          this.emotion = isError ? "error" : "clean";
          const colorHex = isError ? 0xf43f5e : 0x10b981;
          this.glowMat.color.setHex(colorHex);
          this.glowMat.emissive.setHex(colorHex);
          this.scanCone.material.color.setHex(colorHex);
          break;

        case "CALL_TELEPHONE":
          // Bot physically picks up executive desk phone handset to speak
          this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
          this.tabletProp.visible = false;
          this.scanCone.material.opacity = 0;
          this.coffeeMug.visible = false;
          this.updateBadges();
          this.emotion = "normal";

          // Left arm articulates up to hold handset cleanly to ear
          this.leftShoulder.rotation.set(-2.30, 0.25, -0.40);
          this.leftElbow.rotation.set(-1.10, -0.15, 0.25);
          this.leftHand.rotation.set(0.20, 0.30, -0.20);

          // Attach handset directly to character for rock-solid diagonal alignment
          this.character.add(this.phoneHandset);
          this.phoneHandset.scale.set(1.18, 1.18, 1.18);
          this.phoneHandset.position.set(-0.22, 0.58, 0.12);
          this.phoneHandset.rotation.set(-0.62, 0.40, -0.72);
          this.drawPhoneScreen();
          break;

        case "HANG_UP_PHONE":
          // Bot lowers handset back into executive phone base cradle
          this.coffeeMug.visible = true;
          this.leftShoulder.rotation.set(-0.08, 0.04, -0.10);
          this.leftElbow.rotation.set(0.18, 0.05, 0);
          this.leftHand.rotation.set(0.04, 0, 0.06);

          if (this.phoneHandset && this.cradleRestPos) {
            this.deskPlatform.add(this.phoneHandset);
            this.phoneHandset.scale.set(1.0, 1.0, 1.0);
            this.phoneHandset.position.copy(this.cradleRestPos);
            this.phoneHandset.rotation.copy(this.cradleRestRot);
          }
          this.drawPhoneScreen();
          break;

        case "CELEBRATE":
          this.targetPos = { x: 0.72, y: 0.04, z: 0.0 };
          this.tabletProp.visible = false;
          this.emotion = "happy";
          this.glowMat.color.setHex(0x10b981);
          this.glowMat.emissive.setHex(0x10b981);
          break;

        case "RETURN_TO_PERCH":
          this.targetPos = { x: 0.72, y: 0.0, z: 0.0 };
          break;
      }
    }

    animate() {
      requestAnimationFrame(this.animate);
      this.time += 0.025;

      // Smooth position interpolation (weighted follow when dragging)
      const lerpSpeed = this.isDragging ? 0.30 : 0.08;
      this.currentPos.x += (this.targetPos.x - this.currentPos.x) * lerpSpeed;
      this.currentPos.y += (this.targetPos.y - this.currentPos.y) * lerpSpeed;
      this.currentPos.z += (this.targetPos.z - this.currentPos.z) * lerpSpeed;
      this.character.position.set(this.currentPos.x, this.currentPos.y, this.currentPos.z);

      // Inertial tilt when moving or swung
      if (this.isDragging) {
        const vx = this.targetPos.x - this.currentPos.x;
        this.character.rotation.z += (-vx * 0.45 - this.character.rotation.z) * 0.15;
      } else {
        this.character.rotation.z += (0 - this.character.rotation.z) * 0.10;
      }

      // Gaze tracking
      let targetGazeX = this.mouseGaze.x * 0.28;
      let targetGazeY = this.mouseGaze.y * 0.18;

      if (this.lookAtEditor && this.state === "SITTING_COFFEE") {
        targetGazeX = -0.42;
        targetGazeY = 0.08;
      }

      this.currentGaze.x += (targetGazeX - this.currentGaze.x) * 0.08;
      this.currentGaze.y += (targetGazeY - this.currentGaze.y) * 0.08;

      // Head & Antenna motion based on state & emotion
      if (this.isDragging) {
        // Frantic indignant head shaking and quivering
        this.head.rotation.z = Math.sin(this.time * 16) * 0.12;
        this.head.rotation.y = this.currentGaze.x + Math.sin(this.time * 18) * 0.10;
        this.head.rotation.x = -this.currentGaze.y + Math.sin(this.time * 12) * 0.08;
        this.antenna.rotation.z = Math.sin(this.time * 26) * 0.20;
        this.antenna.rotation.x = Math.cos(this.time * 26) * 0.20;
      } else if (this.emotion === "angry") {
        // Grumpy haughty head tilt while cooling down
        this.head.rotation.z += (-0.12 - this.head.rotation.z) * 0.10;
        this.head.rotation.y = this.currentGaze.x * 0.6;
        this.head.rotation.x = -this.currentGaze.y * 0.6 + 0.06;
        this.antenna.rotation.z += (0 - this.antenna.rotation.z) * 0.10;
        this.antenna.rotation.x += (0 - this.antenna.rotation.x) * 0.10;
      } else if (this.state === "CALL_TELEPHONE") {
        // Head tilts toward telephone handset with slight conversation nodding
        this.head.rotation.z = -0.15;
        this.head.rotation.x = -this.currentGaze.y + Math.sin(this.time * 5) * 0.035;
        this.antenna.rotation.z = 0;
        this.antenna.rotation.x = 0;
      } else {
        this.head.rotation.y = this.currentGaze.x;
        this.head.rotation.x = -this.currentGaze.y;
        this.head.rotation.z += (0 - this.head.rotation.z) * 0.1;
        this.antenna.rotation.z = 0;
        this.antenna.rotation.x = 0;
      }

      this.crystal.rotation.y += 0.03;

      // Eyelid blinking cycle
      this.blinkTimer += 0.016;
      if (this.blinkTimer > 3.6 && !this.isBlinking) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }

      if (this.isBlinking) {
        this.blinkProgress -= 0.18;
        if (this.blinkProgress <= 0.08) {
          this.blinkProgress = 0.08;
          this.isBlinking = false;
        }
      } else if (this.blinkProgress < 1.0) {
        this.blinkProgress += 0.18;
        if (this.blinkProgress >= 1.0) {
          this.blinkProgress = 1.0;
        }
      }

      // Kinematics and props
      if (this.isDragging) {
        // Natural suspended flailing while lifted in the air
        this.leftLeg.rotation.x = Math.sin(this.time * 11) * 0.30;
        this.rightLeg.rotation.x = Math.sin(this.time * 11 + Math.PI) * 0.30;
        this.leftLeg.rotation.z = Math.sin(this.time * 8) * 0.10 - 0.04;
        this.rightLeg.rotation.z = -Math.sin(this.time * 8) * 0.10 + 0.04;

        this.leftShoulder.rotation.x = -0.45 + Math.sin(this.time * 10) * 0.25;
        this.leftShoulder.rotation.y = 0.15;
        this.leftShoulder.rotation.z = -0.35 + Math.cos(this.time * 8) * 0.18;
        this.leftElbow.rotation.x = 0.65 + Math.sin(this.time * 12) * 0.20;

        this.rightShoulder.rotation.x = -0.45 + Math.cos(this.time * 10) * 0.25;
        this.rightShoulder.rotation.y = -0.15;
        this.rightShoulder.rotation.z = 0.35 - Math.sin(this.time * 8) * 0.18;
        this.rightElbow.rotation.x = 0.65 + Math.cos(this.time * 12) * 0.20;
      } else if (this.emotion === "angry") {
        // Firm impatient stance with grounded feet
        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);

        this.leftShoulder.rotation.x += (-0.52 - this.leftShoulder.rotation.x) * 0.12;
        this.leftShoulder.rotation.y += (0.22 - this.leftShoulder.rotation.y) * 0.12;
        this.leftShoulder.rotation.z += (-0.18 - this.leftShoulder.rotation.z) * 0.12;
        this.leftElbow.rotation.x += (1.05 - this.leftElbow.rotation.x) * 0.12;

        this.rightShoulder.rotation.x += (-0.52 - this.rightShoulder.rotation.x) * 0.12;
        this.rightShoulder.rotation.y += (-0.22 - this.rightShoulder.rotation.y) * 0.12;
        this.rightShoulder.rotation.z += (0.18 - this.rightShoulder.rotation.z) * 0.12;
        this.rightElbow.rotation.x += (1.05 - this.rightElbow.rotation.x) * 0.12;
      } else if (this.state === "SITTING_COFFEE") {
        // Stable, grounded standing posture on desk platform with subtle organic breathing sway
        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);
        this.torsoGroup.position.y = Math.sin(this.time * 1.8) * 0.003;

        this.sipCooldown += 0.016;
        if (this.sipCooldown > 4.6 && !this.isSipping) {
          this.triggerCoffeeSip();
        }

        if (this.isSipping) {
          // Kinematic coffee sipping: arm brings mug smoothly to mouth screen, head tilts affectionately
          this.rightShoulder.rotation.x += (-0.88 - this.rightShoulder.rotation.x) * 0.12;
          this.rightShoulder.rotation.y += (-0.18 - this.rightShoulder.rotation.y) * 0.12;
          this.rightShoulder.rotation.z += (0.18 - this.rightShoulder.rotation.z) * 0.12;
          this.rightElbow.rotation.x += (1.30 - this.rightElbow.rotation.x) * 0.12;
          this.rightElbow.rotation.y += (-0.26 - this.rightElbow.rotation.y) * 0.12;
          this.rightHand.rotation.x += (0.24 - this.rightHand.rotation.x) * 0.12;
          this.head.rotation.x += (0.12 - this.head.rotation.x) * 0.12;

          this.emotion = "happy";

          if (this.sipCooldown > 6.0) {
            this.isSipping = false;
            this.sipCooldown = 0;
            this.emotion = "normal";
          }
        } else {
          // Natural, comfortable coffee-holding posture with mug upright
          this.rightShoulder.rotation.x += (-0.32 - this.rightShoulder.rotation.x) * 0.10;
          this.rightShoulder.rotation.y += (-0.10 - this.rightShoulder.rotation.y) * 0.10;
          this.rightShoulder.rotation.z += (0.12 - this.rightShoulder.rotation.z) * 0.10;
          this.rightElbow.rotation.x += (0.85 - this.rightElbow.rotation.x) * 0.10;
          this.rightElbow.rotation.y += (-0.15 - this.rightElbow.rotation.y) * 0.10;
          this.rightHand.rotation.x += (0.12 - this.rightHand.rotation.x) * 0.10;

          // Natural relaxed resting posture for left arm
          this.leftShoulder.rotation.x += (-0.08 - this.leftShoulder.rotation.x) * 0.10;
          this.leftShoulder.rotation.y += (0.04 - this.leftShoulder.rotation.y) * 0.10;
          this.leftShoulder.rotation.z += (-0.10 - this.leftShoulder.rotation.z) * 0.10;
          this.leftElbow.rotation.x += (0.18 - this.leftElbow.rotation.x) * 0.10;
          this.leftElbow.rotation.y += (0.05 - this.leftElbow.rotation.y) * 0.10;
          this.leftHand.rotation.x += (0.04 - this.leftHand.rotation.x) * 0.10;

          if (this.emotion === "happy") {
            this.emotion = "normal";
          }
        }
      } else if (this.state === "CALL_TELEPHONE") {
        // Active telephone conversation kinematics:
        // Left arm raises up, holding handset firmly
        this.leftShoulder.rotation.x = -2.30;
        this.leftShoulder.rotation.y = 0.25;
        this.leftShoulder.rotation.z = -0.40;
        this.leftElbow.rotation.x = -1.10;
        this.leftElbow.rotation.y = -0.15;
        this.leftElbow.rotation.z = 0.25;
        this.leftHand.rotation.x = 0.20;
        this.leftHand.rotation.y = 0.30;
        this.leftHand.rotation.z = -0.20;

        // Head tilts affectionately to the left towards the handset, nodding while speaking
        this.head.rotation.z = 0.16 + Math.sin(this.time * 4.5) * 0.022;
        this.head.rotation.x = -this.currentGaze.y + Math.sin(this.time * 5.5) * 0.035;
        this.head.rotation.y = this.currentGaze.x * 0.35 - 0.08;

        // Right arm gestures expressively while talking into phone
        const gesture = Math.sin(this.time * 3.2) * 0.08;
        this.rightShoulder.rotation.x += (-0.42 + gesture - this.rightShoulder.rotation.x) * 0.10;
        this.rightShoulder.rotation.y += (-0.15 - this.rightShoulder.rotation.y) * 0.10;
        this.rightShoulder.rotation.z += (0.18 + gesture * 0.5 - this.rightShoulder.rotation.z) * 0.10;
        this.rightElbow.rotation.x += (0.95 - gesture * 0.8 - this.rightElbow.rotation.x) * 0.10;
      } else if (this.state === "EXAMINE_FILE") {
        this.tabletProp.rotation.y = Math.sin(this.time * 2) * 0.12;
        this.scanCone.rotation.z = Math.sin(this.time * 3.2) * 0.16;
      } else if (this.state === "CELEBRATE") {
        this.character.rotation.y += 0.10;
      } else {
        this.character.rotation.y += (0 - this.character.rotation.y) * 0.1;
      }

      this.drawFace();

      // Dynamic coiled telephone wire
      this.updatePhoneCord();

      // Steam particles rising from warm coffee
      this.steamPuffs.forEach(p => {
        p.mesh.position.y += p.vy;
        p.life += 0.016;
        const alpha = Math.max(0, 1 - (p.life / p.maxLife));
        p.mesh.material.opacity = alpha * 0.28;

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.mesh.position.set((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04);
        }
      });

      this.renderer.render(this.scene, this.camera);
    }
  }


  let typewriterInterval = null;
  const setAgentBubble = (message) => {
    if (typewriterInterval) {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
    }

    const bubbleText = document.getElementById("pet-bubble-text");
    if (!bubbleText) return;

    bubbleText.textContent = "";
    let charIdx = 0;
    typewriterInterval = setInterval(() => {
      if (charIdx < message.length) {
        bubbleText.textContent = message.slice(0, charIdx + 1);
        charIdx += 1;
      } else {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
      }
    }, 18);
  };

  const setProgress = (pct, stepIndex) => {
    const bar = document.getElementById("report-progress-bar");
    const pctText = document.getElementById("report-progress-pct");
    if (bar) bar.style.width = `${pct}%`;
    if (pctText) pctText.textContent = `${pct}%`;

    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`pstep-${i}`);
      if (!stepEl) continue;
      if (i < stepIndex) {
        stepEl.className = "pstep is-done";
      } else if (i === stepIndex) {
        stepEl.className = "pstep is-active";
      } else {
        stepEl.className = "pstep";
      }
    }
  };

  let activeContextTab = "code";
  const switchContextTab = (tabName) => {
    activeContextTab = tabName;
    const tabCode = document.getElementById("tab-btn-code");
    const tabPrd = document.getElementById("tab-btn-prd");
    const tabPolicy = document.getElementById("tab-btn-policy");

    if (tabCode) {
      tabCode.classList.toggle("is-active", tabName === "code");
      tabCode.setAttribute("aria-selected", String(tabName === "code"));
    }
    if (tabPrd) {
      tabPrd.classList.toggle("is-active", tabName === "prd");
      tabPrd.setAttribute("aria-selected", String(tabName === "prd"));
    }
    if (tabPolicy) {
      tabPolicy.classList.toggle("is-active", tabName === "policy");
      tabPolicy.setAttribute("aria-selected", String(tabName === "policy"));
    }

    const prdView = document.getElementById("editor-prd-view");
    const policyView = document.getElementById("editor-policy-view");
    const gutter = document.getElementById("editor-gutter");
    const codeInput = document.getElementById("playground-code-input");
    const syntaxView = document.getElementById("editor-syntax-view");

    if (tabName === "code") {
      if (prdView) prdView.hidden = true;
      if (policyView) policyView.hidden = true;
      if (gutter) gutter.hidden = false;
      if (codeInput) codeInput.hidden = false;
      if (syntaxView) syntaxView.hidden = false;
    } else if (tabName === "prd") {
      if (prdView) prdView.hidden = false;
      if (policyView) policyView.hidden = true;
      if (gutter) gutter.hidden = true;
      if (codeInput) codeInput.hidden = true;
      if (syntaxView) syntaxView.hidden = true;
    } else if (tabName === "policy") {
      if (prdView) prdView.hidden = true;
      if (policyView) policyView.hidden = false;
      if (gutter) gutter.hidden = true;
      if (codeInput) codeInput.hidden = true;
      if (syntaxView) syntaxView.hidden = true;
    }
  };

  /* Demo Mode Walkthrough Controls */
  const startDemoMode = (index = 0) => {
    if (isAnalyzing) return;
    clearAllTimers();

    isDemoMode = true;
    currentDemoIndex = ((index % DEMO_EXAMPLES.length) + DEMO_EXAMPLES.length) % DEMO_EXAMPLES.length;
    highlightLine = null;
    highlightType = null;

    const example = DEMO_EXAMPLES[currentDemoIndex];
    currentScenarioKey = example.id;

    const textarea = document.getElementById("playground-code-input");
    if (textarea) textarea.value = example.code;

    // Update context tabs content
    const prdTag = document.getElementById("tab-prd-tag");
    if (prdTag) prdTag.textContent = (example.prd && example.prd.id) ? example.prd.id : "PRD";

    const prdInput = document.getElementById("playground-prd-input");
    if (prdInput) prdInput.value = (example.prd && example.prd.text) ? example.prd.text : "";

    const policyInput = document.getElementById("playground-policy-input");
    if (policyInput) policyInput.value = (example.policy && example.policy.rule) ? example.policy.rule : "";

    // Update toolbar sample select & step indicator
    const selectEl = document.getElementById("toolbar-sample-select");
    if (selectEl) selectEl.value = String(currentDemoIndex);

    const stepEl = document.getElementById("demo-walkthrough-step");
    if (stepEl) stepEl.textContent = `${currentDemoIndex + 1} / ${DEMO_EXAMPLES.length}`;

    const modeLabel = document.getElementById("toolbar-mode-label");
    if (modeLabel) modeLabel.textContent = "SAMPLE REVIEW";

    // Reset bot
    if (petEngine) {
      petEngine.resetDispatchPopups();
      petEngine.setPetState("SITTING_COFFEE");
      petEngine.updateBadges();
      petEngine.setPhoneScreenState("IDLE");
      petEngine.highlightBadge(null);
    }

    setAgentBubble(`Sample Review: ${example.title}. Review findings on right or test your own changes.`);
    syncEditorView();

    // Reset right panel to waiting/pre-detection state: DO NOT show findings until detection is triggered!
    const emptyState = document.getElementById("report-empty-state");
    const progressState = document.getElementById("report-progress-state");
    const cardState = document.getElementById("report-card-state");
    const errorState = document.getElementById("report-error-state");

    if (emptyState) emptyState.hidden = false;
    if (progressState) progressState.hidden = true;
    if (cardState) cardState.hidden = true;
    if (errorState) errorState.hidden = true;

    setAgentBubble("Myco standing by. Click 'Run Myco' to inspect.");
  };

  const exitDemoMode = (clearEditor = false) => {
    if (isAnalyzing) return;
    clearAllTimers();

    isDemoMode = false;
    currentDemoIndex = -1;
    highlightLine = null;
    highlightType = null;

    const modeLabel = document.getElementById("toolbar-mode-label");
    if (modeLabel) modeLabel.textContent = "CUSTOM INPUT";

    const stepEl = document.getElementById("demo-walkthrough-step");
    if (stepEl) stepEl.textContent = "Custom";

    const prdTag = document.getElementById("tab-prd-tag");
    if (prdTag) prdTag.textContent = "CUSTOM";
    const prdInput = document.getElementById("playground-prd-input");
    if (prdInput && clearEditor) prdInput.value = "";
    const policyInput = document.getElementById("playground-policy-input");
    if (policyInput && clearEditor) policyInput.value = "";

    const textarea = document.getElementById("playground-code-input");
    if (textarea && clearEditor) {
      textarea.value = "";
    }

    const emptyState = document.getElementById("report-empty-state");
    const progressState = document.getElementById("report-progress-state");
    const cardState = document.getElementById("report-card-state");
    const errorState = document.getElementById("report-error-state");

    if (emptyState) emptyState.hidden = false;
    if (progressState) progressState.hidden = true;
    if (cardState) cardState.hidden = true;
    if (errorState) errorState.hidden = true;

    if (petEngine) {
      petEngine.resetDispatchPopups();
      petEngine.setPetState("SITTING_COFFEE");
      petEngine.highlightBadge(null);
      petEngine.setPhoneScreenState("IDLE");
    }

    setAgentBubble("Myco standing by. Paste your code or PR diff, then click 'Run Myco'.");
    syncEditorView();
  };

  const nextDemoExample = () => {
    startDemoMode(currentDemoIndex + 1);
  };

  const prevDemoExample = () => {
    startDemoMode(currentDemoIndex - 1);
  };

  const onUserEdit = () => {
    if (isAnalyzing) return;

    if (isDemoMode) {
      isDemoMode = false;
      const modeLabel = document.getElementById("toolbar-mode-label");
      if (modeLabel) modeLabel.textContent = "CUSTOM INPUT";
      const stepEl = document.getElementById("demo-walkthrough-step");
      if (stepEl) stepEl.textContent = "Custom";
    }

    // Reset report to empty state prompting to re-analyze
    const emptyState = document.getElementById("report-empty-state");
    const cardState = document.getElementById("report-card-state");
    if (cardState && !cardState.hidden) {
      cardState.hidden = true;
      if (emptyState) emptyState.hidden = false;
    }

    syncEditorView();

    if (petEngine) petEngine.lookAtEditor = true;
    setAgentBubble("Myco observing code edits. Click 'Run Myco' to inspect.");
  };

  const clearInput = () => {
    if (isAnalyzing) return;
    clearAllTimers();

    isDemoMode = false;
    currentDemoIndex = -1;
    highlightLine = null;
    highlightType = null;

    const demoBar = document.getElementById("demo-walkthrough-bar");
    if (demoBar) demoBar.hidden = true;

    const textarea = document.getElementById("playground-code-input");
    if (textarea) textarea.value = "";

    const emptyState = document.getElementById("report-empty-state");
    const progressState = document.getElementById("report-progress-state");
    const cardState = document.getElementById("report-card-state");
    const errorState = document.getElementById("report-error-state");

    if (emptyState) emptyState.hidden = false;
    if (progressState) progressState.hidden = true;
    if (cardState) cardState.hidden = true;
    if (errorState) errorState.hidden = true;

    setAgentBubble("Editor cleared. Paste your code or PR diff, then click 'Run Myco'.");
    syncEditorView();
  };

  /* Render Structured Findings Report */
  /* Render Structured Findings Report with Dropdown Issue Selection & Collapsible Sections */
  const renderFindings = (findings, isClean, isMergeBlocking, metadata = {}) => {
    const emptyState = document.getElementById("report-empty-state");
    const progressState = document.getElementById("report-progress-state");
    const cardState = document.getElementById("report-card-state");
    const errorState = document.getElementById("report-error-state");

    if (emptyState) emptyState.hidden = true;
    if (progressState) progressState.hidden = true;
    if (errorState) errorState.hidden = true;
    if (cardState) cardState.hidden = false;

    // Summary Header
    const summaryCount = document.getElementById("report-summary-count");
    const critCountEl = document.getElementById("summary-crit-count");
    const highCountEl = document.getElementById("summary-high-count");
    const medCountEl = document.getElementById("summary-med-count");

    const criticalCount = findings.filter(f => f.severity === "CRITICAL").length;
    const highCount = findings.filter(f => f.severity === "HIGH").length;
    const mediumCount = findings.filter(f => f.severity === "MEDIUM").length;

    if (summaryCount) {
      if (metadata.isBackendRouted) {
        summaryCount.textContent = "ROUTED TO MYCO BACKEND";
      } else if (metadata.isQuotaExhausted) {
        summaryCount.textContent = "DEMO RUNS EXHAUSTED";
      } else if (isClean) {
        summaryCount.textContent = "NO ISSUES DETECTED";
      } else {
        const count = findings.length;
        summaryCount.textContent = `${count} ${count === 1 ? "ISSUE" : "ISSUES"} IDENTIFIED`;
      }
    }

    if (critCountEl) critCountEl.textContent = `${criticalCount} CRITICAL`;
    if (highCountEl) highCountEl.textContent = `${highCount} HIGH`;
    if (medCountEl) medCountEl.textContent = `${mediumCount} MEDIUM`;

    // Merge recommendation banner
    const mergeBanner = document.getElementById("merge-rec-banner");
    const mergeVal = document.getElementById("merge-rec-value");
    const mergeDesc = document.getElementById("merge-rec-desc");

    if (mergeBanner && mergeVal && mergeDesc) {
      if (metadata.isBackendRouted) {
        mergeBanner.className = "merge-rec-banner is-caution";
        mergeVal.textContent = "PIPELINE ROUTE: EXTERNAL_MYCO";
        mergeDesc.textContent = "Workload requires whole-repo indexing or cross-repo graphs. Routed via API Gateway to future Myco Enterprise backend queue.";
      } else if (metadata.isQuotaExhausted) {
        mergeBanner.className = "merge-rec-banner is-blocking";
        mergeVal.textContent = "DEMO ALLOWANCE EXHAUSTED: 5/5 RUNS";
        mergeDesc.textContent = "Public demo runs allowance reached for this 24-hour window. Fair-usage protection active.";
      } else if (isMergeBlocking) {
        mergeBanner.className = "merge-rec-banner is-blocking";
        mergeVal.textContent = "MERGE BLOCKER: YES";
        mergeDesc.textContent = "Critical security violation or blocking policy failure detected. Pull request merge blocked until resolved.";
      } else if (isClean) {
        mergeBanner.className = "merge-rec-banner is-safe";
        mergeVal.textContent = "MERGE RECOMMENDATION: SAFE TO MERGE";
        mergeDesc.textContent = "Static AST verification and invariant checks found no violations. Monitored boundaries verified compliant.";
      } else {
        mergeBanner.className = "merge-rec-banner is-caution";
        mergeVal.textContent = "MERGE RECOMMENDATION: PROCEED WITH CAUTION";
        mergeDesc.textContent = "Non-blocking advisory warnings detected. Recommended to review remediation suggestions before merge.";
      }
    }

    const container = document.getElementById("findings-cards-container");
    if (!container) return;

    if (metadata.isBackendRouted) {
      container.innerHTML = `
        <div class="finding-card is-backend-card">
          <div class="finding-card__header">
            <div class="finding-card__badges">
              <span class="report-badge is-backend-badge">MYCO ENTERPRISE CANDIDATE</span>
              <span class="report-file mono">${escapeHtml(metadata.fileName || "External Workload")}</span>
            </div>
            <span class="report-verified mono">GATEWAY: EXTERNAL_MYCO</span>
          </div>
          <h3 class="finding-title display">Routed to Future Myco Backend Pipeline</h3>
          <p class="finding-clean-desc">
            ${escapeHtml(metadata.backendExplanation || "This code input requires cross-repository dependency graphs, full-repository indexing, and deep symbolic taint tracking that exceed lightweight in-browser / single-file AST capabilities.")}
          </p>
          <div class="backend-routing-box mono">
            <div><strong>Request Classification:</strong> Candidate for full-repo indexing and multi-repository reasoning</div>
            <div><strong>Adapter Status:</strong> Candidate notice 200 returned via FutureMycoAdapter</div>
            <div><strong>Architecture:</strong> Central API gateway verified request and prepared backend dispatch envelope</div>
          </div>
          <div class="backend-pilot-cta">
            <p>Looking to analyze full repositories, cross-repo dependency trees, and enterprise PRs with Myco?</p>
            <a href="#contact" class="backend-pilot-btn">Request Enterprise Pilot Access</a>
          </div>
        </div>
      `;
      return;
    }

    if (metadata.isQuotaExhausted) {
      container.innerHTML = `
        <div class="finding-card is-quota-card">
          <div class="finding-card__header">
            <div class="finding-card__badges">
              <span class="report-badge is-p0">ALLOWANCE EXHAUSTED</span>
              <span class="report-file mono">Public Demo Tier</span>
            </div>
            <span class="report-verified mono">0 / 5 RUNS REMAINING</span>
          </div>
          <h3 class="finding-title display">Public Demo Allowance Reached</h3>
          <p class="finding-clean-desc">
            You have used all 5 complimentary analysis runs in this rolling 24-hour window. This fair-usage policy ensures high availability and stable compute performance for all public visitors.
          </p>
          <div class="backend-routing-box mono">
            <div><strong>Allowance Limit:</strong> 5 runs per 24 hours per visitor session</div>
            <div><strong>Fair-Usage Protection:</strong> Prevents automated scraping and resource exhaustion</div>
          </div>
          <div class="backend-pilot-cta">
            <p>Interested in testing Myco across your full codebase without daily limits?</p>
            <a href="#contact" class="backend-pilot-btn">Request Enterprise Pilot Access</a>
          </div>
        </div>
      `;
      return;
    }

    if (isClean) {
      container.innerHTML = `
        <div class="finding-card is-clean-card">
          <div class="finding-card__header">
            <div class="finding-card__badges">
              <span class="report-badge is-clean">CLEAN · VERIFIED</span>
              <span class="report-file mono">${escapeHtml(metadata.fileName || "Input")}</span>
            </div>
            <span class="report-verified mono">ALL INVARIANTS SATISFIED</span>
          </div>
          <h3 class="finding-title display">No Issues Detected in Submitted Content</h3>
          <p class="finding-clean-desc">
            Myco evaluated AST invariants, boundary conditions, and security policies. No hardcoded credentials, unsanitized DOM sinks, wildcard dependencies, or breaking API contract regressions were identified.
          </p>
          <div class="finding-clean-note mono">
            Note: Automated static analysis significantly reduces risk and surfaces regressions, but cannot guarantee that code is 100% bug-free.
          </div>
        </div>
      `;
      return;
    }

    // Dynamic Findings with Dropdown Selection & Collapsible Accordion Sections
    const dispatchDetails = metadata.dispatchDetails || (findings[0] && findings[0].dispatchDetails) || {};
    const jira = dispatchDetails.jira || { id: "SEC-4827", status: "Created · Assigned" };
    const slack = dispatchDetails.slack || { channel: "#sec-eng" };
    const webhook = dispatchDetails.webhook || { latency: "34ms" };

    const renderActiveFinding = (idx) => {
      const f = findings[idx] || findings[0];
      const sevClass = f.severity === "CRITICAL" ? "is-p0" : f.severity === "HIGH" ? "is-p1" : "is-p2";
      const blockerTag = f.mergeBlocking ? '<span class="report-blocker-tag mono">MERGE BLOCKER</span>' : '';
      const loc = f.lineStart ? `${escapeHtml(f.filePath || "Input")}:${f.lineStart}` : escapeHtml(f.filePath || "Input");

      if (f.lineStart) {
        highlightLine = f.lineStart;
        highlightType = f.severity === "CRITICAL" ? "error" : "warning";
        syncEditorView();
      }

      container.innerHTML = `
        <div class="report-finding-selector-bar">
          <div class="selector-bar-left">
            <label for="report-finding-select" class="selector-label mono">INSPECT ISSUE (${findings.length}):</label>
            <div class="custom-select-wrap">
              <select id="report-finding-select" class="report-finding-select" aria-label="Select finding to inspect">
                ${findings.map((item, i) => `
                  <option value="${i}" ${i === idx ? "selected" : ""}>
                    [${escapeHtml(item.severity)}] Issue ${i + 1}: ${escapeHtml(item.title)}
                  </option>
                `).join("")}
              </select>
              <span class="custom-select-arrow" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
            </div>
          </div>
          <div class="selector-bar-right">
            <button type="button" class="report-toggle-all-btn" id="report-toggle-all-btn" title="Expand or collapse all report dropdowns">Expand All</button>
          </div>
        </div>

        <div class="finding-card active" id="finding-card-${idx}">
          <header class="finding-card__header">
            <div class="finding-card__badges">
              <span class="report-badge ${sevClass}">${escapeHtml(f.severity)}</span>
              <span class="report-file mono">${loc}</span>
              ${blockerTag}
            </div>
            ${f.confidence ? `<span class="report-confidence mono">Confidence: ${escapeHtml(f.confidence)}</span>` : ""}
          </header>

          <h3 class="finding-title display">${escapeHtml(f.title)}</h3>
          ${f.category ? `<div class="finding-category-tag mono">${escapeHtml(f.category)}</div>` : ""}

          <p class="finding-quick-explanation">${escapeHtml(f.explanation || f.description || "")}</p>

          <div class="report-dropdowns-group">
            ${f.suggestedPatch || f.suggestedFix ? `
              <details class="report-dropdown-item" id="dropdown-fix" open>
                <summary class="report-dropdown-summary">
                  <div class="report-dropdown-summary__left">
                    <span class="report-dropdown-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </span>
                    <span class="report-dropdown-title">Suggested Fix & Remediation</span>
                  </div>
                  <span class="report-dropdown-chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
                </summary>
                <div class="report-dropdown-content">
                  <div class="report-fix-actions-row">
                    <button type="button" class="btn-text report-copy-btn" data-idx="${idx}">Copy fix</button>
                    ${f.fixedCode ? `<button type="button" class="playground-btn-run btn-sm report-apply-btn" data-idx="${idx}">Apply fix to editor</button>` : ""}
                  </div>
                  <p class="report-fix-action-text">${escapeHtml(f.suggestedFix || "")}</p>
                  ${f.suggestedPatch ? `<pre class="report-fix-code"><code>${escapeHtml(f.suggestedPatch)}</code></pre>` : ""}
                </div>
              </details>
            ` : ""}

            ${f.evidence ? `
              <details class="report-dropdown-item" id="dropdown-evidence">
                <summary class="report-dropdown-summary">
                  <div class="report-dropdown-summary__left">
                    <span class="report-dropdown-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    <span class="report-dropdown-title">Evidence Trail (${escapeHtml(f.evidenceRule || "Rule Violation")})</span>
                  </div>
                  <span class="report-dropdown-chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
                </summary>
                <div class="report-dropdown-content">
                  <div class="report-evidence-box">
                    <pre class="report-evidence-code"><code>${escapeHtml(f.evidence)}</code></pre>
                  </div>
                </div>
              </details>
            ` : ""}

            ${f.impact ? `
              <details class="report-dropdown-item" id="dropdown-impact">
                <summary class="report-dropdown-summary">
                  <div class="report-dropdown-summary__left">
                    <span class="report-dropdown-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </span>
                    <span class="report-dropdown-title">Why It Matters & Blast Radius</span>
                  </div>
                  <span class="report-dropdown-chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
                </summary>
                <div class="report-dropdown-content">
                  <p class="report-impact-p">${escapeHtml(f.impact)}</p>
                </div>
              </details>
            ` : ""}

            <details class="report-dropdown-item" id="dropdown-integrations">
              <summary class="report-dropdown-summary">
                <div class="report-dropdown-summary__left">
                  <span class="report-dropdown-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </span>
                  <span class="report-dropdown-title">Connected Signal Routing</span>
                </div>
                <span class="report-dropdown-chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
              </summary>
              <div class="report-dropdown-content">
                <div class="report-integrations-grid">
                  <div class="int-card">
                    <div class="int-card__top">
                      <span class="int-card__title-wrap">
                        <img src="assets/integration-github.svg" width="14" height="14" alt="GitHub">
                        <span>GitHub</span>
                      </span>
                      <span class="int-card__badge">SYNCED</span>
                    </div>
                    <span class="int-card__desc">Inline review comment</span>
                  </div>
                  <div class="int-card">
                    <div class="int-card__top">
                      <span class="int-card__title-wrap">
                        <img src="assets/integration-jira.svg" width="14" height="14" alt="Jira">
                        <span>Jira Software</span>
                      </span>
                      <span class="int-card__badge">SYNCED</span>
                    </div>
                    <span class="int-card__desc">${escapeHtml(jira.id || "SEC-4827")}: Created</span>
                  </div>
                  <div class="int-card">
                    <div class="int-card__top">
                      <span class="int-card__title-wrap">
                        <img src="assets/integration-slack.svg" width="14" height="14" alt="Slack">
                        <span>Slack</span>
                      </span>
                      <span class="int-card__badge">SYNCED</span>
                    </div>
                    <span class="int-card__desc">${escapeHtml(slack.channel || "#sec-eng")}: Sent</span>
                  </div>
                  <div class="int-card">
                    <div class="int-card__top">
                      <span class="int-card__title-wrap">
                        <img src="assets/integration-custom.svg" width="14" height="14" alt="Custom">
                        <span>Custom API</span>
                      </span>
                      <span class="int-card__badge">SYNCED</span>
                    </div>
                    <span class="int-card__desc">200 OK (${escapeHtml(webhook.latency || "32ms")})</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      `;

      // Select dropdown change listener
      const selectEl = document.getElementById("report-finding-select");
      if (selectEl) {
        selectEl.addEventListener("change", (e) => {
          const newIdx = parseInt(e.target.value, 10);
          renderActiveFinding(newIdx);
        });
      }

      // Expand / Collapse all button listener
      const toggleAllBtn = document.getElementById("report-toggle-all-btn");
      if (toggleAllBtn) {
        let isExpanded = false;
        toggleAllBtn.addEventListener("click", () => {
          isExpanded = !isExpanded;
          container.querySelectorAll(".report-dropdown-item").forEach(d => {
            d.open = isExpanded;
          });
          toggleAllBtn.textContent = isExpanded ? "Collapse All" : "Expand All";
        });
      }

      // Copy Fix action
      const copyBtn = container.querySelector(".report-copy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const textToCopy = f.suggestedPatch || f.suggestedFix || "";
          navigator.clipboard.writeText(textToCopy).then(() => {
            const orig = copyBtn.textContent;
            copyBtn.textContent = "Copied";
            setTimeout(() => copyBtn.textContent = orig, 1600);
          });
        });
      }

      // Apply Fix action
      const applyBtn = container.querySelector(".report-apply-btn");
      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          if (!f.fixedCode) return;
          const textarea = document.getElementById("playground-code-input");
          if (textarea) {
            textarea.value = f.fixedCode;
            onUserEdit();
            setAgentBubble("Suggested remediation applied to editor. Ready to re-run analysis.");
          }
          applyBtn.textContent = "Applied";
          applyBtn.disabled = true;
          setTimeout(() => {
            applyBtn.textContent = "Apply fix to editor";
            applyBtn.disabled = false;
          }, 1800);
        });
      }
    };

    renderActiveFinding(0);
  };

  const getOrCreateDemoSessionId = () => {
    try {
      let id = localStorage.getItem("myco_demo_session_id");
      if (!id) {
        id = "demo_sess_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("myco_demo_session_id", id);
      }
      return id;
    } catch (_) {
      return "demo_sess_anon";
    }
  };

  const updateDemoAllowanceBadge = async () => {
    try {
      const sessionId = getOrCreateDemoSessionId();
      const res = await fetch("/api/v1/demo/allowance", {
        headers: { "X-Demo-Session-ID": sessionId }
      });
      if (res.ok) {
        const data = await res.json();
        const badgeText = document.getElementById("toolbar-allowance-text");
        const badgeEl = document.getElementById("toolbar-allowance-badge");
        if (badgeText && data) {
          badgeText.textContent = `Custom Demo: ${data.remainingRuns} / ${data.maxRuns} runs`;
          if (badgeEl) {
            badgeEl.classList.toggle("exhausted", Boolean(data.isExhausted));
          }
        }
      }
    } catch (_) {}
  };

  /* Run Analysis Workflow */
  const runAnalysis = () => {
    if (isAnalyzing) return;
    clearAllTimers();
    if (petEngine) petEngine.resetDispatchPopups();

    const textarea = document.getElementById("playground-code-input");
    const inputCode = textarea ? textarea.value : "";
    const trimmed = inputCode.trim();

    // 1. Validate non-empty
    if (!trimmed) {
      const errorState = document.getElementById("report-error-state");
      const emptyState = document.getElementById("report-empty-state");
      const progressState = document.getElementById("report-progress-state");
      const cardState = document.getElementById("report-card-state");

      if (errorState) {
        errorState.hidden = false;
        errorState.innerHTML = `
          <div class="report-error-card__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a12d35" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h4>Input Required</h4>
          <p>Please enter or paste code or a pull request diff to analyze.</p>
          <button type="button" class="playground-btn-run btn-sm" id="report-retry-btn">Retry Analysis</button>
        `;
        const retry = document.getElementById("report-retry-btn");
        if (retry) {
          retry.addEventListener("click", () => {
            if (textarea) textarea.focus();
          });
        }
      }
      if (emptyState) emptyState.hidden = true;
      if (progressState) progressState.hidden = true;
      if (cardState) cardState.hidden = true;

      setAgentBubble("Please paste code or a pull request diff to analyze.");
      return;
    }

    // 2. Strict Custom Code Word Limit Validation (not more than 1,200 words)
    if (!isDemoMode) {
      const wordCount = countWords(inputCode);
      if (wordCount > WORD_LIMITS.MAX) {
        showWordLimitModal({ words: wordCount });
        return;
      }
    }

    isAnalyzing = true;
    const runBtn = document.getElementById("playground-run-btn");
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span class="btn-spinner"></span><span>Running Myco...</span>';
    }

    const emptyState = document.getElementById("report-empty-state");
    const progressState = document.getElementById("report-progress-state");
    const cardState = document.getElementById("report-card-state");
    const errorState = document.getElementById("report-error-state");

    if (emptyState) emptyState.hidden = true;
    if (errorState) errorState.hidden = true;
    if (cardState) cardState.hidden = true;
    if (progressState) progressState.hidden = false;

    switchContextTab("code");

    let targetLine = 6;
    const activeSample = (isDemoMode && currentDemoIndex >= 0 && DEMO_EXAMPLES[currentDemoIndex]) ? DEMO_EXAMPLES[currentDemoIndex] : null;
    const activeFilename = activeSample ? activeSample.fileName : "user_code.ts";
    const activeContextFiles = activeSample ? (activeSample.contextFiles || []) : [];
    
    const prdInput = document.getElementById("playground-prd-input");
    const activePrd = (prdInput && prdInput.value.trim()) 
      ? { path: (activeSample && activeSample.prd ? `${activeSample.prd.id}.md` : "PRD.md"), content: prdInput.value.trim() } 
      : (activeSample ? (activeSample.prd || null) : null);

    if (window.MycoIntelligenceCore && window.MycoIntelligenceCore.analyze) {
      try {
        const preCheck = window.MycoIntelligenceCore.analyze({
          primaryFile: { path: activeFilename, content: inputCode },
          contextFiles: activeContextFiles,
          prd: activePrd
        });
        if (preCheck && preCheck.primaryFinding && preCheck.primaryFinding.sourceRange) {
          targetLine = preCheck.primaryFinding.sourceRange.startLine || 6;
        }
      } catch (_) {}
    }

    // Start backend pipeline fetch concurrently with step 1-4 UI animations
    const sessionId = getOrCreateDemoSessionId();
    let backendPromise = null;
    try {
      backendPromise = fetch("/api/v1/demo/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Session-ID": sessionId
        },
        body: JSON.stringify({
          code: inputCode,
          fileName: activeFilename,
          contextFiles: activeContextFiles,
          prdText: (activePrd && activePrd.content) ? activePrd.content : (typeof activePrd === "string" ? activePrd : ""),
          isDemo: isDemoMode,
          isCustomCode: !isDemoMode,
          enforceWordLimit: !isDemoMode
        })
      })
        .then(async res => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            return {
              statusCode: res.status,
              success: false,
              routeExecuted: (data && data.routeExecuted) || "REJECTED",
              message: (data && data.message) || ("Server validation failed: HTTP " + res.status),
              summary: data ? data.summary : {},
              errors: (data && data.errors) || [(data && data.message) || "Validation failed"]
            };
          }
          return data;
        })
        .catch(err => {
          console.warn("Backend pipeline unavailable, relying on in-browser engine:", err);
          return null;
        });
    } catch (_) {}

    // Step 1: Ingest (Take in change, codebase and relevant signals)
    setProgress(15, 1);
    if (petEngine) petEngine.setPetState("GET_UP");
    setAgentBubble("01 Ingest: Taking in change, codebase, and relevant signals...");

    // Step 2: Build Context (Assemble scoped view of code, systems, and intent)
    addTimer(() => {
      setProgress(35, 2);
      if (petEngine) petEngine.setPetState("JUMP_DOWN");
      setAgentBubble("02 Build context: Assembling scoped view of code, systems, and intent...");

      addTimer(() => {
        if (petEngine) petEngine.setPetState("PICKUP_FILE");
      }, 450);
    }, 600);

    // Step 3: Reason (Analyze change with full context to find real impact)
    addTimer(() => {
      setProgress(60, 3);
      if (petEngine) petEngine.setPetState("EXAMINE_FILE");
      setAgentBubble("03 Reason: Analyzing change with full context to trace real impact...");
      animateScanBeam(targetLine);
    }, 1400);

    // Step 4: Validate (Check findings across multiple signals and constraints)
    addTimer(() => {
      setProgress(82, 4);
      setAgentBubble("04 Validate: Checking findings across tests, standards, and constraints...");
    }, 2400);

    // Step 5: Score and Surface (Rank what matters and present actionable insights)
    addTimer(async () => {
      setProgress(100, 5);
      setAgentBubble("05 Score & surface: Ranking signals and presenting actionable insights...");

      let findingsToRender = [];
      let isClean = false;
      let isMergeBlocking = false;
      let isBackendRouted = false;
      let isQuotaExhausted = false;
      let backendMeta = null;
      let meta = {};

      let apiRes = null;
      if (backendPromise) {
        try {
          apiRes = await backendPromise;
        } catch (_) {}
      }

      // Check quota exhaustion
      if (apiRes && (apiRes.statusCode === 429 || (apiRes.quota && apiRes.quota.isExhausted && !apiRes.success))) {
        isQuotaExhausted = true;
      }

      // Check backend routing (requires future Myco backend)
      if (apiRes && apiRes.routeExecuted === "EXTERNAL_MYCO") {
        isBackendRouted = true;
        backendMeta = {
          message: apiRes.message,
          explanation: (apiRes.summary && apiRes.summary.explanation) || apiRes.message,
          nextAction: (apiRes.summary && apiRes.summary.nextAction) || "request_pilot"
        };
      }

      // Check server-side rejection (e.g. Word Limit violation)
      if (apiRes && (apiRes.statusCode === 400 || apiRes.routeExecuted === "REJECTED" || (!apiRes.success && apiRes.errors && apiRes.errors.length > 0 && !isQuotaExhausted && !isBackendRouted))) {
        clearAllTimers();
        isAnalyzing = false;
        if (runBtn) {
          runBtn.disabled = false;
          runBtn.innerHTML = '<span>Run Myco</span>';
        }
        if (petEngine) {
          petEngine.setPhoneScreenState("STANDBY", "MYCO ACTIVE");
          petEngine.setPetState("SITTING_COFFEE");
        }
        setAgentBubble("Myco standing by. Edit code or analyze new changes.");
        const emptyState = document.getElementById("report-empty-state");
        const progressState = document.getElementById("report-progress-state");
        if (progressState) progressState.hidden = true;
        if (emptyState) emptyState.hidden = false;

        const wordCount = countWords(inputCode);
        if (wordCount > WORD_LIMITS.MAX) {
          showWordLimitModal({
            words: wordCount
          });
        }
        return;
      }

      // Run live client-side analysis via MycoIntelligenceCore on actual editor buffer
      let coreRes = null;
      if (window.MycoIntelligenceCore && window.MycoIntelligenceCore.analyze) {
        try {
          coreRes = window.MycoIntelligenceCore.analyze({
            primaryFile: { path: activeFilename, content: inputCode },
            contextFiles: activeContextFiles,
            prd: activePrd
          });
        } catch (err) {
          console.error("MycoCore analysis error:", err);
        }
      }

      if (isQuotaExhausted) {
        isClean = false;
        findingsToRender = [];
      } else if (isBackendRouted) {
        isClean = false;
        findingsToRender = [];
      } else if (apiRes && apiRes.success && apiRes.findings && apiRes.findings.length > 0) {
        // Backend pipeline findings from InternalProcessingEngine
        isClean = false;
        isMergeBlocking = Boolean(apiRes.summary && apiRes.summary.isMergeBlocking);
        findingsToRender = apiRes.findings.map(f => ({
          id: f.id,
          title: f.title,
          description: f.explanation,
          severity: f.severity,
          category: f.category || "Logic",
          filePath: f.filePath || activeFilename,
          lineStart: f.sourceRange ? f.sourceRange.startLine : 1,
          lineEnd: f.sourceRange ? f.sourceRange.endLine : 1,
          evidence: f.evidenceSnippet || "",
          evidenceRule: f.evidenceRule || "POLICY INVARIANT",
          explanation: f.explanation,
          impact: f.impact || "Evaluated by internal Myco engine.",
          suggestedFix: f.suggestedAction || "Review the flagged code and apply remediation.",
          suggestedPatch: f.suggestedPatch || (coreRes && coreRes.findings && coreRes.findings[0] && coreRes.findings[0].suggestedPatch) || (activeSample && activeSample.finding ? activeSample.finding.suggestedPatch : null),
          fixedCode: (coreRes && coreRes.findings && coreRes.findings[0] && coreRes.findings[0].fixedCode) || (activeSample && activeSample.finding ? activeSample.finding.fixedCode : null),
          confidence: f.confidence || "98%",
          mergeBlocking: f.isMergeBlocking || false,
          mergeReason: f.isMergeBlocking ? "Merge Blocker: Critical security or policy issue." : "Non-blocking warning.",
          dispatchDetails: activeSample ? {
            jira: activeSample.jiraTicket,
            slack: activeSample.slackAlert,
            webhook: activeSample.customApp
          } : undefined
        }));
      } else if (coreRes && coreRes.findings && coreRes.findings.length > 0) {
        // In-browser engine findings
        isClean = false;
        isMergeBlocking = coreRes.isMergeBlocking;
        findingsToRender = coreRes.findings.map(f => ({
          id: f.id,
          title: f.title,
          description: f.explanation,
          severity: f.severity,
          category: f.category || "Security",
          filePath: f.filePath || activeFilename,
          lineStart: f.sourceRange ? f.sourceRange.startLine : 1,
          lineEnd: f.sourceRange ? f.sourceRange.endLine : 1,
          evidence: f.evidenceSnippet || "",
          evidenceRule: f.evidenceRule || "POLICY INVARIANT",
          explanation: f.explanation,
          impact: f.impact || "Evaluated dynamically by Myco Intelligence Core AST engine.",
          suggestedFix: f.suggestedAction || "Review the flagged code and apply remediation.",
          suggestedPatch: f.suggestedPatch || null,
          fixedCode: f.fixedCode || null,
          confidence: f.confidence || "95%",
          mergeBlocking: f.isMergeBlocking || false,
          mergeReason: f.isMergeBlocking ? "Merge Blocker: Critical security or compatibility issue must be resolved prior to merge." : "Non-blocking warning.",
          dispatchDetails: f.dispatchDetails || (activeSample ? {
            jira: activeSample.jiraTicket,
            slack: activeSample.slackAlert,
            webhook: activeSample.customApp
          } : undefined)
        }));
      } else if (isDemoMode && activeSample && activeSample.finding) {
        // Guaranteed fallback for sample scenarios
        isClean = false;
        isMergeBlocking = activeSample.finding.mergeBlocking || false;
        findingsToRender = [activeSample.finding];
      } else {
        // Clean verified
        isClean = true;
        findingsToRender = [];
      }

      meta = {
        isDemo: isDemoMode,
        fileName: activeFilename,
        isBackendRouted: isBackendRouted,
        backendExplanation: backendMeta ? backendMeta.explanation : null,
        isQuotaExhausted: isQuotaExhausted,
        dispatchDetails: activeSample ? {
          jira: activeSample.jiraTicket,
          slack: activeSample.slackAlert,
          webhook: activeSample.customApp
        } : {
          jira: { id: "SEC-AUDIT", status: "Verified" },
          slack: { channel: "#sec-eng" },
          webhook: { latency: "36ms" }
        }
      };

      renderFindings(findingsToRender, isClean, isMergeBlocking, meta);
      updateDemoAllowanceBadge();

      if (isBackendRouted) {
        if (petEngine) {
          petEngine.setPhoneScreenState("GATEWAY", "ROUTED TO BACKEND");
          petEngine.setPetState("EXAMINE_FILE");
        }
        setAgentBubble("Pipeline route executed: Workload routed to future Myco Enterprise backend queue.");
        addTimer(() => {
          isAnalyzing = false;
          if (petEngine) {
            petEngine.setPetState("RETURN_TO_PERCH");
            setTimeout(() => {
              petEngine.setPetState("SITTING_COFFEE");
              setAgentBubble("Myco standing by. Edit code or analyze new changes.");
            }, 850);
          }
          if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span>Run Myco</span>';
          }
        }, 1800);
      } else if (isQuotaExhausted) {
        if (petEngine) {
          petEngine.setPhoneScreenState("EXHAUSTED", "5/5 RUNS USED");
          petEngine.setPetState("SITTING_COFFEE");
        }
        setAgentBubble("Public demo quota reached: 5 free runs completed for this 24-hour window.");
        isAnalyzing = false;
        if (runBtn) {
          runBtn.disabled = false;
          runBtn.innerHTML = '<span>Run Myco</span>';
        }
        addTimer(() => {
          showDemoPolicyModal({ isExhausted: true, usedRuns: 5, maxRuns: 5 });
        }, 500);
      } else if (isClean) {
        if (petEngine) {
          petEngine.setPhoneScreenState("VERIFIED", "ALL POLICIES COMPLIANT");
          petEngine.setPetState("CELEBRATE");
        }
        setAgentBubble("Analysis complete: No issues detected. Code satisfies monitored invariants.");

        addTimer(() => {
          isAnalyzing = false;
          if (petEngine) {
            petEngine.setPetState("RETURN_TO_PERCH");
            setTimeout(() => {
              petEngine.setPetState("SITTING_COFFEE");
              setAgentBubble("Myco standing by. Edit code or analyze new changes.");
            }, 850);
          }
          if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span>Run Myco</span>';
          }
        }, 1800);

      } else {
        if (petEngine) {
          petEngine.resetDispatchPopups();
          petEngine.setPetState("CALL_TELEPHONE");
          petEngine.setPhoneScreenState("DIALING", "DISPATCHING FINDINGS");
        }
        setAgentBubble("Analysis complete: Findings identified. Coordinating alerts across integrations.");

        addTimer(() => {
          if (petEngine) {
            petEngine.setPhoneScreenState("JIRA", "TICKET LOGGED");
            petEngine.highlightBadge("Jira");
            petEngine.showDispatchPopup("Jira", meta.dispatchDetails);
          }
        }, 1400);

        addTimer(() => {
          if (petEngine) {
            petEngine.setPhoneScreenState("SLACK", "ALERT BROADCAST");
            petEngine.highlightBadge("Slack");
            petEngine.showDispatchPopup("Slack", meta.dispatchDetails);
          }
        }, 2800);

        addTimer(() => {
          if (petEngine) {
            petEngine.setPhoneScreenState("WEBHOOK", "HTTP 200 OK");
            petEngine.highlightBadge("Custom");
            petEngine.showDispatchPopup("Custom", meta.dispatchDetails);
          }
        }, 4200);

        addTimer(() => {
          if (petEngine) {
            petEngine.setPhoneScreenState("VERIFIED", "ALL CHANNELS SYNCED");
            petEngine.highlightBadge(null);
            petEngine.setPetState("HANG_UP_PHONE");
            const container = document.getElementById("stage-dispatch-popups-layer");
            if (container) {
              const tags = container.querySelectorAll(".stage-floating-dispatch__tag");
              tags.forEach(t => {
                t.textContent = "SYNCED";
              });
            }
          }
        }, 5400);

        addTimer(() => {
          if (petEngine) petEngine.setPetState("CELEBRATE");
        }, 6600);

        addTimer(() => {
          isAnalyzing = false;
          if (petEngine) {
            petEngine.setPetState("RETURN_TO_PERCH");
            setTimeout(() => {
              petEngine.setPetState("SITTING_COFFEE");
              setAgentBubble("Analysis cycle complete. Ready for new code or adjustments.");
            }, 850);
          }
          if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span>Run Myco</span>';
          }
        }, 7800);

        addTimer(() => {
          if (petEngine) petEngine.dismissAllDispatchPopups();
        }, 14000);
      }

    }, 3200);
  };

  /* Professional Word Limit Exceeded & Requirement Modal */
  const showWordLimitModal = (options = {}) => {
    const backdrop = document.getElementById("demo-policy-modal-backdrop");
    const badge = document.getElementById("demo-modal-badge");
    const title = document.getElementById("demo-modal-title");
    const body = document.getElementById("demo-modal-body");
    const footer = document.getElementById("demo-modal-footer");
    if (!backdrop) return;

    const words = options.words || 0;
    if (words <= WORD_LIMITS.MAX) {
      return;
    }
    const formattedWords = words.toLocaleString();
    const excess = (words - WORD_LIMITS.MAX).toLocaleString();
    if (badge) badge.textContent = "SUBMISSION LIMIT EXCEEDED";
    if (title) title.textContent = "Submission Exceeds Allowed Word Limit";
    if (body) {
      body.innerHTML = `
        <p class="demo-modal-p">
          Your custom code submission contains <strong>${formattedWords} words</strong>, which exceeds the maximum limit of <strong>${WORD_LIMITS.MAX.toLocaleString()} words</strong> (exceeds limit by <strong>${excess} words</strong>).
        </p>
        <p class="demo-modal-p demo-modal-p--sub">
          Submissions cannot exceed 1,200 words. Please reduce your code to 1,200 words or fewer before running analysis.
        </p>
      `;
    }

    if (footer) {
      footer.innerHTML = `
        <button type="button" class="demo-modal-action-btn" id="demo-modal-return-btn">Return to Editing</button>
      `;
      const returnBtn = document.getElementById("demo-modal-return-btn");
      if (returnBtn) {
        returnBtn.addEventListener("click", closeDemoPolicyModal);
      }
    }

    backdrop.hidden = false;
    document.body.classList.add("modal-open");
  };

  /* Professional Demo Policy Modal Controller */
  const openRequestPilotModal = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    closeDemoPolicyModal();

    // 1. Direct React pilot modal hook exposed on window
    if (typeof window.openPilotModal === "function") {
      window.openPilotModal();
      return;
    }
    if (typeof window.mycoOpenPilotModal === "function") {
      window.mycoOpenPilotModal();
      return;
    }

    // 2. Query any button or anchor on the page with "Request a pilot"
    const candidates = Array.from(document.querySelectorAll("button, a.btn, a"));
    const pilotBtn = candidates.find(el => {
      const text = (el.textContent || "").trim().toLowerCase();
      return text.includes("request a pilot");
    });
    if (pilotBtn && typeof pilotBtn.click === "function") {
      pilotBtn.click();
      return;
    }

    // 3. Fallback: scroll to page overview
    const overview = document.getElementById("overview") || document.querySelector(".wrap");
    if (overview) overview.scrollIntoView({ behavior: "smooth" });
  };

  const showDemoPolicyModal = (options = {}) => {
    const backdrop = document.getElementById("demo-policy-modal-backdrop");
    const badge = document.getElementById("demo-modal-badge");
    const title = document.getElementById("demo-modal-title");
    const body = document.getElementById("demo-modal-body");
    const footer = document.getElementById("demo-modal-footer");
    if (!backdrop) return;

    if (badge) badge.textContent = "DEMO 5/5 COMPLETED · EVALUATION WINDOW";
    if (title) title.textContent = "Demo 5/5 Completed — Not for Production Use";
    if (body) {
      body.innerHTML = `
        <p class="demo-modal-p">
          This custom code feature is provided for demonstration and evaluation purposes only. It is not intended for production use. Production deployment may require additional security reviews, testing, reliability checks, access controls, and operational safeguards.
        </p>
        <p class="demo-modal-p demo-modal-p--sub">
          If you want to use this capability in a pilot or production-related environment, please contact us to discuss access and requirements.
        </p>
      `;
    }
    if (footer) {
      footer.innerHTML = `
        <button type="button" class="demo-modal-dismiss-btn" id="demo-modal-dismiss-btn">Close</button>
        <button type="button" class="demo-modal-pilot-btn" id="demo-modal-pilot-btn">
          <span>Want to use this for a pilot? Contact us.</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      `;
      const dismissBtn = document.getElementById("demo-modal-dismiss-btn");
      if (dismissBtn) dismissBtn.addEventListener("click", closeDemoPolicyModal);
      const pilotModalBtn = document.getElementById("demo-modal-pilot-btn");
      if (pilotModalBtn) pilotModalBtn.addEventListener("click", openRequestPilotModal);
    }

    backdrop.hidden = false;
    document.body.classList.add("modal-open");
  };

  const closeDemoPolicyModal = () => {
    const backdrop = document.getElementById("demo-policy-modal-backdrop");
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("modal-open");
    const textarea = document.getElementById("playground-code-input");
    if (textarea) textarea.focus();
  };

  window.showWordLimitModal = showWordLimitModal;
  window.showDemoPolicyModal = showDemoPolicyModal;
  window.closeDemoPolicyModal = closeDemoPolicyModal;
  window.openRequestPilotModal = openRequestPilotModal;

  /* Mounting playground section */
  const mountPlayground = () => {
    if (document.getElementById("playground")) return true;

    const contextSection = document.querySelector(".context-section");
    const targetParent = contextSection?.parentElement || document.querySelector(".App");
    if (!targetParent) return false;

    const section = document.createElement("section");
    section.id = "playground";
    section.className = "playground-section wrap";
    section.setAttribute("aria-labelledby", "playground-title");

    section.innerHTML = `
      <header class="playground-header">
        <div class="playground-header__eyebrow">
          <span class="eyebrow">AGENTIC INTELLIGENCE FOR ENGINEERING</span>
          <span class="playground-demo-tag">Code Review & Risk Analysis</span>
        </div>
        <div class="playground-header__headline">
          <h2 id="playground-title" class="display">
            <span>Context first. </span><span>Then reasoning.</span>
          </h2>
          <p>
            Paste your code or pull request diff. Myco traces the surrounding code, intent, and dependencies to surface validated signals before merge.
          </p>
        </div>
      </header>

      <div class="playground-shell">
        <!-- Unified Workspace Toolbar -->
        <div class="playground-toolbar" id="playground-toolbar">
          <div class="playground-toolbar__left">
            <div class="toolbar-mode-badge mono">
              <span class="toolbar-pulse-dot"></span>
              <span id="toolbar-mode-label">SAMPLE REVIEW</span>
            </div>
            <div class="toolbar-allowance-badge mono" id="toolbar-allowance-badge" title="Public Demo: 5 free analyses per rolling 24-hour window">
              <span id="toolbar-allowance-text">Demo: 5 / 5 runs</span>
            </div>

            <!-- Integrated Sample Review Dropdown & Stepper -->
            <div class="toolbar-sample-controls" id="toolbar-sample-controls">
              <div class="toolbar-sample-select-wrap">
                <span class="toolbar-sample-prefix mono">SAMPLE:</span>
                <select id="toolbar-sample-select" class="toolbar-sample-select" aria-label="Select sample code review scenario">
                  <option value="0">1. PR #4827: Tool Approval Bypass (AGENT-12 · Homepage Proof)</option>
                  <option value="1">2. Exposed API Secret (Critical · P0)</option>
                  <option value="2">3. Unsafe DOM / XSS Injection (High · P1)</option>
                  <option value="3">4. Dependency Compatibility Risk (High · P1)</option>
                  <option value="4">5. Specification / PRD Mismatch (High · P1)</option>
                  <option value="5">6. Division by Zero / Arithmetic Boundary (Medium · P2)</option>
                  <option value="6">7. Merge-Blocking API Regression (Critical · P0)</option>
                </select>
                <span class="toolbar-select-arrow" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
              </div>

              <div class="toolbar-stepper">
                <button type="button" class="toolbar-step-btn" id="demo-prev-btn" title="Previous sample scenario">‹</button>
                <span class="toolbar-step-indicator mono" id="demo-walkthrough-step">1 / 7</span>
                <button type="button" class="toolbar-step-btn" id="demo-next-btn" title="Next sample scenario">›</button>
              </div>

              <button type="button" class="toolbar-custom-btn" id="demo-exit-btn" title="Switch to custom code input">
                <span>Enter Custom Code</span>
              </button>
            </div>
          </div>

          <div class="playground-toolbar__right">
            <div class="toolbar-engine-status mono" id="toolbar-engine-status">
              <span class="status-indicator-dot"></span>
              <span id="engine-status-text">READY FOR ANALYSIS</span>
            </div>
          </div>
        </div>

        <!-- Two-Panel Grid: Code Input (Left) and Analysis Output (Right) -->
        <div class="playground-grid">
          <!-- Left Panel: Code Input & Context -->
          <div class="playground-editor-col">
            <div class="editor-header">
              <div class="editor-tabs" id="editor-context-tabs" role="tablist">
                <button type="button" class="editor-tab is-active" id="tab-btn-code" role="tab" aria-selected="true" data-tab="code">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  <span>PR Diff / Code</span>
                </button>
                <button type="button" class="editor-tab" id="tab-btn-prd" role="tab" aria-selected="false" data-tab="prd">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>PRD / Intent</span>
                  <span class="context-tag" id="tab-prd-tag">AGENT-12</span>
                </button>
                <button type="button" class="editor-tab" id="tab-btn-policy" role="tab" aria-selected="false" data-tab="policy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Policies</span>
                  <span class="context-tag">INVARIANT</span>
                </button>
              </div>
              <div class="editor-meta">
                <span class="mono" id="editor-lines-count">0 lines</span>
                <span class="editor-lang mono" id="editor-lang-badge">Code</span>
                <span class="editor-word-count-badge mono" id="editor-word-count-badge">Words: 0 / 1,000–1,200</span>
              </div>
            </div>

            <div class="editor-surface-wrap">
              <div class="editor-gutter" id="editor-gutter" aria-hidden="true"></div>
              <div class="editor-scan-beam" id="editor-scan-beam"></div>
              <div class="editor-code-container">
                <pre class="editor-syntax-view" id="editor-syntax-view" aria-hidden="true"></pre>
                <textarea id="playground-code-input" class="editor-textarea" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Paste your code or PR diff here..." aria-label="Code Input Area"></textarea>
                
                <!-- Dedicated PRD Context View -->
                <div class="editor-context-view" id="editor-prd-view" hidden>
                  <div class="context-view-header">
                    <span class="mono context-view-badge">PRD INTENT</span>
                    <span class="context-view-note">Myco traces implementation against this intent boundary</span>
                  </div>
                  <textarea id="playground-prd-input" class="context-view-textarea" spellcheck="false" placeholder="Enter PRD requirement or intent..." aria-label="PRD Requirement Input"></textarea>
                </div>

                <!-- Dedicated Policy Context View -->
                <div class="editor-context-view" id="editor-policy-view" hidden>
                  <div class="context-view-header">
                    <span class="mono context-view-badge">POLICY CONSTRAINT</span>
                    <span class="context-view-note">Zero-trust safety invariants evaluated before merge</span>
                  </div>
                  <textarea id="playground-policy-input" class="context-view-textarea" spellcheck="false" placeholder="Enter policy rules..." aria-label="Policy Rules Input"></textarea>
                </div>
              </div>
            </div>

            <div class="editor-footer">
              <div class="editor-word-counter mono" id="editor-gt-footer-counter">
                <span id="gt-footer-words">0</span> / 1,200
              </div>
              <div class="editor-footer__actions">
                <button type="button" class="btn-text" id="editor-clear-btn">Clear</button>
                <button type="button" class="playground-btn-run" id="playground-run-btn">
                  <span>Run Myco</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Panel: Analysis Output -->
          <div class="playground-agent-col">
            <!-- 3D Myco Bot Stage (Expansive, clear visual companion) -->
            <div class="agent-stage-3d-wrap" id="agent-stage-3d-wrap">
              <div class="agent-stage__backdrop" aria-hidden="true">
                <div class="agent-stage__grid"></div>
              </div>

              <!-- Dynamic Floating Popups Layer (Alternating sides, randomized offsets, never in one line) -->
              <div class="stage-dispatch-popups-layer" id="stage-dispatch-popups-layer" aria-live="polite"></div>

              <div class="stage-corner-status" id="stage-corner-status" aria-live="polite">
                <span class="stage-corner-status__dot"></span>
                <span class="stage-corner-status__text mono" id="pet-bubble-text">Myco standing by. Click 'Run Myco' to inspect.</span>
                <span class="stage-corner-status__cursor"></span>
              </div>

              <canvas class="pet-3d-canvas" id="playground-pet-canvas"></canvas>
            </div>

            <!-- Report Output Panel -->
            <div class="report-panel" id="report-panel">
              <!-- Initial Empty State (Awaiting Detection) -->
              <div class="report-empty" id="report-empty-state">
                <div class="report-empty__badge mono">READY FOR INSPECTION</div>
                <div class="report-empty__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p>Click <strong>Run Myco</strong> to inspect code.</p>
              </div>

              <!-- Loading State -->
              <div class="report-progress" id="report-progress-state" hidden>
                <div class="report-progress__header">
                  <span class="mono">ANALYZING CODE</span>
                  <span class="mono" id="report-progress-pct">0%</span>
                </div>
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" id="report-progress-bar"></div>
                </div>
                <div class="progress-steps">
                  <div class="pstep" id="pstep-1">1. Ingest</div>
                  <div class="pstep" id="pstep-2">2. Build Context</div>
                  <div class="pstep" id="pstep-3">3. Reason</div>
                  <div class="pstep" id="pstep-4">4. Validate</div>
                  <div class="pstep" id="pstep-5">5. Score &amp; Surface</div>
                </div>
              </div>

              <!-- Error State -->
              <div class="report-error-card" id="report-error-state" hidden>
                <div class="report-error-card__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a12d35" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h4>Input Required</h4>
                <p>Please enter or paste code or a pull request diff to analyze.</p>
                <button type="button" class="playground-btn-run btn-sm" id="report-retry-btn">Retry Analysis</button>
              </div>

              <!-- Structured Findings Card State -->
              <div class="report-card" id="report-card-state" hidden>
                <!-- Summary Header -->
                <header class="report-summary-bar">
                  <div class="report-summary-bar__top">
                    <span class="report-summary__count mono" id="report-summary-count">ANALYSIS RESULTS</span>
                    <div class="report-summary__sevs">
                      <span class="summary-sev is-critical" id="summary-crit-count">0 CRITICAL</span>
                      <span class="summary-sev is-high" id="summary-high-count">0 HIGH</span>
                      <span class="summary-sev is-medium" id="summary-med-count">0 MEDIUM</span>
                    </div>
                  </div>

                  <!-- Merge Recommendation Banner -->
                  <div class="merge-rec-banner is-safe" id="merge-rec-banner">
                    <div class="merge-rec-header">
                      <span class="merge-rec-tag mono">RECOMMENDATION</span>
                      <span class="merge-rec-value mono" id="merge-rec-value">SAFE TO MERGE</span>
                    </div>
                    <p class="merge-rec-desc" id="merge-rec-desc">
                      Analysis complete.
                    </p>
                  </div>
                </header>

                <!-- Dynamic Findings Container -->
                <div class="findings-cards-container" id="findings-cards-container">
                  <!-- Rendered dynamically -->
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Professional Demo Policy & 5/5 Completion Modal -->
      <div class="demo-policy-modal-backdrop" id="demo-policy-modal-backdrop" hidden>
        <div class="demo-policy-modal" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
          <button type="button" class="demo-modal-close-icon" id="demo-modal-close-icon" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div class="demo-modal-header">
            <span class="demo-modal-badge mono" id="demo-modal-badge">SUBMISSION LIMIT EXCEEDED</span>
            <h3 class="demo-modal-title" id="demo-modal-title">Submission Exceeds Allowed Word Limit</h3>
          </div>

          <div class="demo-modal-body" id="demo-modal-body">
            <p class="demo-modal-p">
              Your submission exceeds the allowed word limit.
            </p>
          </div>

          <div class="demo-modal-footer" id="demo-modal-footer">
            <button type="button" class="demo-modal-action-btn" id="demo-modal-dismiss-btn">Return to Editing</button>
          </div>
        </div>
      </div>
    </section>
  `;

    if (contextSection) {
      contextSection.insertAdjacentElement("afterend", section);
    } else {
      targetParent.appendChild(section);
    }

    const syncNavLinks = () => {
      const navLinks = document.querySelector(".nav-links");
      if (navLinks && !navLinks.querySelector('a[href="#playground"]')) {
        const playLink = document.createElement("a");
        playLink.href = "#playground";
        playLink.className = "mono";
        playLink.style.cssText = "font-size:13px;text-decoration:none;color:var(--ink-soft);display:inline-flex;align-items:center;gap:7px;";
        playLink.textContent = "Playground";
        const overviewLink = navLinks.querySelector('a[href="#overview"]');
        if (overviewLink && overviewLink.nextSibling) {
          navLinks.insertBefore(playLink, overviewLink.nextSibling);
        } else {
          navLinks.appendChild(playLink);
        }
      }
    };
    syncNavLinks();

    const canvas = document.getElementById("playground-pet-canvas");
    if (canvas && window.THREE) {
      petEngine = new CutePet3D(canvas);
    } else {
      const checkThree = setInterval(() => {
        if (window.THREE && document.getElementById("playground-pet-canvas")) {
          clearInterval(checkThree);
          petEngine = new CutePet3D(document.getElementById("playground-pet-canvas"));
        }
      }, 100);
    }

    bindPlaygroundEvents();

    // Initialize with Example 1 code loaded in editor, awaiting detection (analysis hidden until requested)
    startDemoMode(0);
    return true;
  };

  const bindPlaygroundEvents = () => {
    // Toolbar sample selector dropdown
    const sampleSelect = document.getElementById("toolbar-sample-select");
    if (sampleSelect) {
      sampleSelect.addEventListener("change", (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx)) startDemoMode(idx);
      });
    }

    const emptyDemoBtn = document.getElementById("report-empty-demo-btn");
    if (emptyDemoBtn) emptyDemoBtn.addEventListener("click", () => startDemoMode(0));

    // Demo Walkthrough Navigation Controls
    const prevBtn = document.getElementById("demo-prev-btn");
    if (prevBtn) prevBtn.addEventListener("click", prevDemoExample);

    const nextBtn = document.getElementById("demo-next-btn");
    if (nextBtn) nextBtn.addEventListener("click", nextDemoExample);

    const exitBtn = document.getElementById("demo-exit-btn");
    if (exitBtn) exitBtn.addEventListener("click", () => exitDemoMode(true));

    // Context tab navigation
    const tabCode = document.getElementById("tab-btn-code");
    const tabPrd = document.getElementById("tab-btn-prd");
    const tabPolicy = document.getElementById("tab-btn-policy");
    if (tabCode) tabCode.addEventListener("click", () => switchContextTab("code"));
    if (tabPrd) tabPrd.addEventListener("click", () => switchContextTab("prd"));
    if (tabPolicy) tabPolicy.addEventListener("click", () => switchContextTab("policy"));

    // Clear Button
    const clearBtn = document.getElementById("editor-clear-btn");
    if (clearBtn) clearBtn.addEventListener("click", clearInput);

    // Primary Action Button: "Run Myco"
    const runBtn = document.getElementById("playground-run-btn");
    if (runBtn) runBtn.addEventListener("click", runAnalysis);

    const retryBtn = document.getElementById("report-retry-btn");
    if (retryBtn) retryBtn.addEventListener("click", runAnalysis);

    const dispatchTrayClose = document.getElementById("dispatch-tray-close");
    if (dispatchTrayClose) {
      dispatchTrayClose.addEventListener("click", () => {
        if (petEngine && petEngine.setDispatchTrayOpen) {
          petEngine.setDispatchTrayOpen(false);
        }
      });
    }

    // Code Editor Textarea Events
    const textarea = document.getElementById("playground-code-input");
    if (textarea) {
      let typingTimeout = null;
      let overflowCheckTimer = null;
      let lastExceededWords = 0;

      textarea.addEventListener("input", () => {
        onUserEdit();
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          if (!isAnalyzing && petEngine) {
            petEngine.lookAtEditor = false;
            setAgentBubble("Ready to inspect. Click 'Run Myco' to start.");
          }
        }, 2200);

        if (!isDemoMode) {
          clearTimeout(overflowCheckTimer);
          overflowCheckTimer = setTimeout(() => {
            const wordCount = countWords(textarea.value);
            if (wordCount > WORD_LIMITS.MAX && wordCount !== lastExceededWords) {
              lastExceededWords = wordCount;
              showWordLimitModal({ words: wordCount });
            } else if (wordCount <= WORD_LIMITS.MAX) {
              lastExceededWords = 0;
            }
          }, 1000);
        }
      });

      textarea.addEventListener("paste", () => {
        setTimeout(() => {
          onUserEdit();
          if (!isDemoMode) {
            const wordCount = countWords(textarea.value);
            if (wordCount > WORD_LIMITS.MAX) {
              lastExceededWords = wordCount;
              showWordLimitModal({ words: wordCount });
            }
          }
        }, 30);
      });

      textarea.addEventListener("keyup", () => {
        if (!isDemoMode) {
          updateWordLimitUI(textarea.value, true);
        }
      });

      textarea.addEventListener("scroll", () => {
        const syntaxView = document.getElementById("editor-syntax-view");
        if (syntaxView) {
          syntaxView.scrollTop = textarea.scrollTop;
          syntaxView.scrollLeft = textarea.scrollLeft;
        }
      });
    }

    // Demo Policy & Pilot Guidance Action Handlers
    const handlePilotClick = (e) => {
      openRequestPilotModal(e);
    };

    const pilotBtn = document.getElementById("pilot-contact-action-btn");
    if (pilotBtn) pilotBtn.addEventListener("click", handlePilotClick);

    const modalPilotBtn = document.getElementById("demo-modal-pilot-btn");
    if (modalPilotBtn) modalPilotBtn.addEventListener("click", handlePilotClick);

    // Global click delegation for all pilot buttons on page
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const btn = target.closest(".demo-modal-pilot-btn, .backend-pilot-btn, #pilot-contact-action-btn");
      if (btn) {
        openRequestPilotModal(e);
      }
    });

    const infoBtn = document.getElementById("demo-policy-info-btn");
    if (infoBtn) {
      infoBtn.addEventListener("click", (e) => {
        if (e) e.preventDefault();
        showDemoPolicyModal({ isExhausted: false });
      });
    }

    const modalCloseIcon = document.getElementById("demo-modal-close-icon");
    if (modalCloseIcon) modalCloseIcon.addEventListener("click", closeDemoPolicyModal);

    const modalDismissBtn = document.getElementById("demo-modal-dismiss-btn");
    if (modalDismissBtn) modalDismissBtn.addEventListener("click", closeDemoPolicyModal);

    const modalBackdrop = document.getElementById("demo-policy-modal-backdrop");
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeDemoPolicyModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDemoPolicyModal();
    });

    const allowanceBadge = document.getElementById("toolbar-allowance-badge");
    if (allowanceBadge) {
      allowanceBadge.style.cursor = "pointer";
      allowanceBadge.addEventListener("click", () => {
        showDemoPolicyModal({ isExhausted: allowanceBadge.classList.contains("exhausted") });
      });
    }

    updateDemoAllowanceBadge();
    return true;
  };

  let attempts = 0;
  let initTimer = null;
  initTimer = setInterval(() => {
    attempts += 1;
    if (mountPlayground() || attempts > 30) {
      if (initTimer) clearInterval(initTimer);
    }
  }, 100);
})();

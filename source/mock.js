// Mock content for the Myco (mycointelligence.com) clone.
// All data lives here so a real backend can replace it later.

export const LINKEDIN_URL = "https://www.linkedin.com/in/abhishika-agarwal/";

export const nav = {
  links: [
    { label: "Overview", href: "#overview" },
    { label: "How it works", href: "#how" },
    { label: "Integrate", href: "#integrate" },
    { label: "Security", href: "#security" },
  ],
  cta: { label: "Request a pilot", href: LINKEDIN_URL },
};

export const hero = {
  eyebrow: "AGENTIC INTELLIGENCE FOR ENGINEERING",
  titleLines: ["AI writes the code.", "Myco understands it."],
  body:
    "Myco builds context across your engineering system, reasons over every relevant change, and surfaces the signals that deserve attention.",
  primary: { label: "See how it works", href: "#how" },
  secondary: { label: "Request a pilot", href: LINKEDIN_URL },
  graphLabel: "LIVE CONTEXT GRAPH \u00B7 1,284 ARTIFACTS",
};

// Node graph coordinates use a 560 x 520 viewBox.
export const graph = {
  viewBox: { w: 560, h: 520 },
  center: { id: "reasoning", label: "MYCO REASONING", x: 280, y: 250, kind: "core" },
  nodes: [
    { id: "requirement", label: "REQUIREMENT", x: 120, y: 90, kind: "plain" },
    { id: "pull", label: "PULL REQUEST", x: 452, y: 150, kind: "plain" },
    { id: "dependency", label: "DEPENDENCY", x: 108, y: 360, kind: "plain" },
    { id: "signal", label: "VALIDATED SIGNAL", x: 322, y: 362, kind: "signal" },
    { id: "repository", label: "REPOSITORY", x: 452, y: 432, kind: "plain" },
  ],
  edges: [
    { to: "requirement", d: "M280 250 C 222 182, 182 132, 120 90", label: "INTENT", mid: { x: 188, y: 150 } },
    { to: "pull", d: "M280 250 C 360 214, 402 182, 452 150", label: "CHANGE", mid: { x: 372, y: 196 } },
    { to: "dependency", d: "M280 250 C 212 300, 160 332, 108 360", label: "IMPACT", mid: { x: 182, y: 306 } },
    { to: "signal", d: "M280 250 C 300 300, 312 332, 322 362", label: "SCOPE", mid: { x: 308, y: 306 } },
    { to: "repository", d: "M280 250 C 362 300, 412 384, 452 432", label: "SOURCE", mid: { x: 372, y: 342 } },
  ],
};

export const stats = [
  { value: "300+", label: "BUGS CAUGHT BEFORE SHIP" },
  { value: "50", label: "FINDINGS IN 20 TO 25 DAYS" },
  { value: "01", label: "SYSTEM, ONE USEFUL SIGNAL" },
];

export const diff = {
  eyebrow: "CONTEXT, REASONING, SIGNAL",
  title: "A diff is not the whole system.",
  body:
    "A pull request captures what changed. Myco traces the surrounding code, intent, dependencies and history that give a change meaning.",
  cards: [
    { num: "01", tag: "CONTEXT", title: "Build the relevant view.", body: "Connect the artifacts that matter to this change." },
    { num: "02", tag: "REASONING", title: "Trace the relationship.", body: "Move through context, not just lines in a diff." },
    { num: "03", tag: "VALIDATION", title: "Test against intent.", body: "Evaluate implementation in the system it belongs to." },
    { num: "04", tag: "SIGNAL", title: "Surface what matters.", body: "Give engineers an evidence-backed place to act." },
  ],
};

export const proof = {
  eyebrow: "PROOF IN WORKFLOW",
  title: "The bug isn\u2019t always in the changed line.",
  code: [
    { t: "comment", text: "PR #482 \u00B7 checkout: preserve tax mode in amendment flow" },
    { t: "blank" },
    { t: "line", pre: "traced ", code: "CheckoutMutation", post: " to existing tax calculation" },
    { t: "line", pre: "found ", code: "amendment.isTaxExempt", post: " resets on retry" },
    { t: "line", pre: "compared against ", req: "requirement: TAX-19" },
    { t: "blank" },
    { t: "finding", text: "VALIDATED FINDING" },
    { t: "result", text: "Retry path reintroduces tax on tax-exempt amendments. ", link: "Evidence attached." },
  ],
};

export const how = {
  eyebrow: "HOW MYCO WORKS",
  titleLines: ["Context first.", "Then reasoning."],
  body:
    "Myco is designed to make engineering context available before a change is evaluated. A finding can be inspected, not merely accepted.",
  path: ["01 INGEST", "02 BUILD CONTEXT", "03 REASON", "04 VALIDATE", "05 SCORE", "06 SURFACE"],
  steps: [
    { num: "01", title: "Ingest", body: "Connect the engineering artifacts Myco is authorized to observe: repository, PRs, issues and workflow context." },
    { num: "02", title: "Build context", body: "Identify the code, dependencies, requirements and historical signals relevant to the work." },
    { num: "03", title: "Reason", body: "Specialized agents trace relationships through this scoped context to form testable hypotheses.", accent: true },
    { num: "04", title: "Validate", body: "Check the implementation against system behavior and the evidence available around the change." },
    { num: "05 to 06", title: "Score and surface", body: "Prioritize findings by relevance, attach evidence, and return the result inside the engineering workflow." },
  ],
};

export const traced = {
  eyebrow: "One finding, traced",
  traceId: "TRACE ID 482-11",
  rows: [
    { k: "Requirement", v: "TAX-19. Exemption must persist on amendment" },
    { k: "Changed module", v: "checkout.amendment.ts" },
    { k: "Dependency", v: "tax calculator, retry state" },
    { k: "Prior behavior", v: "exemption held across retry path" },
  ],
  headline: "Tax exemption is lost when the amendment retries.",
  footer: "4 artifacts connected \u00B7 3 paths traced \u00B7 1 validated conflict",
};

export const integration = {
  eyebrow: "Integration",
  titleLines: ["Connect your repository.", "Keep your stack."],
  body:
    "Myco fits into the workflow already in place. It observes authorized engineering context, builds the model it needs, and surfaces evidence where the team works.",
  path: ["01 CONNECT", "02 AUTHORIZE", "03 BUILD CONTEXT", "04 REVIEW SIGNALS"],
};

export const workflow = {
  eyebrow: "CONNECT IN THE WORKFLOW",
  title: "Infrastructure, not interruption.",
  body:
    "The implementation is intentionally simple: authorize the context, let Myco build its working view, then receive actionable findings in the systems engineers already use.",
  flow: [
    { label: "Repository", tag: "READ ONLY" },
    { label: "Pull requests and artifacts", tag: "SCOPED" },
    { label: "Myco context engine", tag: "REASONING", accent: true },
    { label: "Existing engineering workflow", tag: "SIGNAL" },
  ],
  permissionTitle: "Permission model example",
  permissions: [
    { label: "Read repository contents", note: "Required to build relevant engineering context.", state: "ALLOW" },
    { label: "Read pull request metadata", note: "Required to trace change and review context.", state: "ALLOW" },
    { label: "Write to source code", note: "Myco does not modify your repository.", state: "DENY" },
    { label: "Push commits", note: "Myco does not push changes.", state: "DENY" },
  ],
};

export const security = {
  eyebrow: "SECURITY BY ARCHITECTURE",
  title: "Your code stays in your environment.",
  body:
    "Source code never leaves the environment you authorize. It is used only for active analysis and is never retained afterwards.",
  cards: [
    { num: "01", tag: "PROCESSING BOUNDARY", title: "Code does not leave.", body: "Myco performs analysis within your authorized environment. Source code is not sent outside that boundary." },
    { num: "02", tag: "DATA LIFECYCLE", title: "Nothing to retain.", body: "Source code is discarded after the analysis that needs it. Myco does not retain a copy of your code." },
    { num: "03", tag: "ACCESS MODEL", title: "Read only by design.", body: "Myco observes authorized repository context. It does not write to source code or push changes to your repository." },
  ],
};

export const footer = {
  tagline: "Agentic intelligence for engineering. Context first, then reasoning.",
  cta: { label: "Request a pilot", href: LINKEDIN_URL },
  copyright: "\u00A9 " + new Date().getFullYear() + " Myco. Engineering intelligence.",
};


export const contextEngine = {
  eyebrow: "ONE SYSTEM, EVERY SIGNAL",
  title: "Myco reads your whole system. Not just the diff.",
  body:
    "Pull request context, codebase, meeting notes, product requirements and dependency graphs all flow into one reasoning engine \u2014 which returns a structured, evidence-backed report.",
  inputs: [
    { id: "pr", label: "PR CONTEXT", sub: "diff \u00B7 comments \u00B7 history", icon: "GitPullRequest" },
    { id: "code", label: "CODEBASE", sub: "modules \u00B7 call graph", icon: "Code2" },
    { id: "meeting", label: "MEETING NOTES", sub: "decisions \u00B7 intent", icon: "MessagesSquare" },
    { id: "prd", label: "PRD", sub: "requirements \u00B7 specs", icon: "FileText" },
    { id: "deps", label: "DEPENDENCIES", sub: "packages \u00B7 services", icon: "Boxes" },
  ],
  engine: { title: "MYCO ENGINE", sub: "REASONING" },
  output: {
    header: "STRUCTURED OUTPUT",
    findingsLabel: "3 VALIDATED FINDINGS",
    bugsLabel: "BUGS REPORTED",
    bugs: [
      { sev: "P0", text: "Tax exemption dropped on amendment retry" },
      { sev: "P1", text: "Null customer breaks invoice export" },
      { sev: "P2", text: "Race condition in cache warm-up" },
    ],
    suggestionsLabel: "CLEAN CODE SUGGESTIONS",
    suggestions: [
      "Extract retry logic into a pure, testable helper",
      "Name the magic constant 0.2 as TAX_RATE_DEFAULT",
    ],
  },
};

export const feed = {
  eyebrow: "LIVE FINDINGS",
  title: "Signals as they surface.",
  sub: "A sample of validated findings, streaming from active analysis.",
  items: [
    { sev: "P0", file: "checkout/amendment.ts", msg: "Retry path reintroduces tax on exempt orders", req: "TAX-19" },
    { sev: "P1", file: "billing/invoice.ts", msg: "Removed currency field breaks export", req: "BILL-07" },
    { sev: "P2", file: "cache/warmup.ts", msg: "Warm-up races with first read", req: "PERF-22" },
    { sev: "P1", file: "auth/session.ts", msg: "Token refresh skips revoked check", req: "SEC-11" },
    { sev: "P2", file: "api/pagination.ts", msg: "Off-by-one on final page cursor", req: "API-33" },
  ],
};

export const lead = {
  title: "Request a pilot",
  body:
    "Tell us about your codebase and we\u2019ll show you what Myco can find. We usually reply within a day.",
  success: "Thanks for your interest. One of our founders will reach out to you shortly.",
  fields: [
    { name: "name", label: "Your name", type: "text", placeholder: "Ada Lovelace", required: true },
    { name: "email", label: "Work email", type: "email", placeholder: "ada@company.com", required: true },
    { name: "repo", label: "Repository or org", type: "text", placeholder: "github.com/acme/checkout", required: false },
    { name: "message", label: "What are you hoping Myco catches?", type: "textarea", placeholder: "Optional \u2014 a few words about your stack", required: false },
  ],
};

export interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: { label: string; href: string }[];
}

export interface HowCard {
  index: string;
  label: string;
  title: string;
  description: string;
  table: { col1: string; col2: string; col3: string }[];
}

export interface StepItem {
  icon: "eye" | "layers" | "shield-check" | "refresh-cw";
  title: string;
  description: string;
  chip: string;
}

export interface StatItem {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  caption: string;
}

export interface ProofCard {
  index: string;
  tag: string;
  name: string;
  caption: string;
  inverted?: boolean;
  span2?: boolean;
}

export interface IndustryCard {
  id: string;
  category: string;
  title: string;
  sub: string;
  image: string;
}

export interface PostItem {
  number: string;
  date: string;
  title: string;
  excerpt: string;
  href: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface WorkflowToolItem {
  id: string;
  name: string;
  detail: string;
  icon: string;
  tag?: string;
  isLive?: boolean;
}

export interface WorkflowPermissionItem {
  action: string;
  detail: string;
  status: "ALLOW" | "DENY";
}

export interface WorkflowContent {
  eyebrow: string;
  titlePrimary: string;
  titleMuted: string;
  body: string;
  caption: string;
  tools: {
    left: WorkflowToolItem[];
    engine: {
      name: string;
      sub: string;
    };
    right: WorkflowToolItem[];
  };
  permissions: WorkflowPermissionItem[];
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const siteContent = {
  brand: {
    name: "Myco",
    url: "https://myco.dev",
    siteUrl: "https://myco.dev",
    metaTitle: "Myco — Contextual GitHub PR Review",
    metaDescription:
      "Myco reviews GitHub pull requests against available requirements and surrounding code, explaining what could break and why.",
  },
  meta: {
    title: "Myco — Contextual GitHub PR Review",
    description:
      "Myco reviews GitHub pull requests against available requirements and surrounding code, explaining what could break and why.",
  },
  nav: {
    item1: { label: "Overview", href: "#overview" },
    item2: {
      label: "Capabilities",
      href: "#how",
      hasDropdown: true,
      dropdownItems: [
        { label: "Find Bugs", href: "#how" },
        { label: "Test Intelligence", href: "#how" },
        { label: "Test Execution", href: "#how" },
        { label: "Failure Diagnosis", href: "#how" },
      ],
    },
    item3: { label: "Workflow", href: "#workflow" },
    item4: { label: "Pricing", href: "/pricing" },
    cta: { label: "Request a pilot", href: "/book-demo" },
  },
  hero: {
    backedBy: {
      label: "INTEGRATION SUITE",
      brand: "GitHub & CI/CD",
    },
    announcement: "Introducing Myco V2: From PR Review to Full Software Validation",
    announcementHref: "#how",
    headline: "AI WRITES THE CODE. MYCO UNDERSTANDS IT.",
    sub: "Myco reviews GitHub pull requests against available requirements and surrounding code, explaining what could break and why.",
    cta: "Request a pilot",
    ctaHref: "/book-demo",
  },
  caseStudy: {
    title: "A DIFF IS NOT THE WHOLE SYSTEM. CONTEXT REVEALS INTENDED BEHAVIOR.",
    body: "A pull request captures what changed. Myco traces the surrounding code, intent, dependencies and history that give a change meaning before engineers merge.",
    cta: "Explore the platform",
    ctaHref: "/why",
  },
  timeline: {
    eyebrow: "THE CONTEXT GAP",
    titleA: "Passing tests do not prove the intended behavior was checked.",
    titleB: "Continuous intent validation across code, tests, and dependencies.",
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    todayLabel: "PR #4827",
    capsule: "1,284 artifacts connected",
    badge: "VALIDATED SIGNAL",
  },
  how: {
    eyebrow: "FOUR CAPABILITIES",
    title: "Four capabilities. One continuous validation loop.",
    body: "From contextual pull request review to automated behavioral test intelligence, execution, and failure diagnosis.",
    cards: [
      {
        index: "01",
        label: "FIND BUGS // AVAILABLE TODAY",
        title: "Intent-aware pull request review",
        description: "Review pull requests against stated requirements, codebase context, and dependencies directly in your GitHub workflow.",
        table: [
          { col1: "agent-runner.ts", col2: "AGENT-12", col3: "P0 Conflict" },
          { col1: "checkout.amendment.ts", col2: "TAX-19", col3: "P1 Mismatch" },
        ],
      },
      {
        index: "02",
        label: "TEST INTELLIGENCE // PLANNED V2",
        title: "Behavioral test coverage analysis",
        description: "Planned V2 capability: Derive expected test scenarios from change context and identify tests that pass without checking intended behavior.",
        table: [
          { col1: "test_retry_policy.ts", col2: "Gap Found", col3: "Missing Assertion" },
          { col1: "test_tax_amend.ts", col2: "Edge Case", col3: "Uncovered Path" },
        ],
      },
      {
        index: "03",
        label: "TEST EXECUTION // PLANNED V2",
        title: "Targeted workflow test runs",
        description: "Planned V2 capability: Connect validation scenarios directly with targeted test execution in your development workflow.",
        table: [
          { col1: "suite: runner-core", col2: "14 passed", col3: "1 bypassed" },
          { col1: "suite: policy-auth", col2: "28 passed", col3: "All verified" },
        ],
      },
      {
        index: "04",
        label: "FAILURE DIAGNOSIS // PLANNED V2",
        title: "Root-cause evidence synthesis",
        description: "Planned V2 capability: Connect test failures with expected behavior, pinpointing the likely contributing dependency and actionable next steps.",
        table: [
          { col1: "Trace 482-11", col2: "toolPolicy", col3: "Requires Approval" },
          { col1: "Fix Action", col2: "PR #4827", col3: "Evidence Linked" },
        ],
      },
    ] as HowCard[],
  },
  steps: {
    eyebrow: "HOW MYCO WORKS",
    titlePrimary: "Context first.",
    titleMuted: "Then reasoning.",
    body: "Myco builds a scoped engineering view of your codebase, systems and intent before evaluating a change.",
    items: [
      {
        icon: "eye",
        title: "Ingest repository context",
        description: "Inspect PR diffs, AST call graphs, meeting decisions, and requirement tickets.",
        chip: "PR #4827",
      },
      {
        icon: "layers",
        title: "Map dependency chain",
        description: "Trace shared interfaces, services, and historical changes around the pull request.",
        chip: "AGENT-12",
      },
      {
        icon: "shield-check",
        title: "Verify against constraints",
        description: "Assess the change against tests, operational standards, and security policies.",
        chip: "toolPolicy",
      },
      {
        icon: "refresh-cw",
        title: "Surface actionable signal",
        description: "Deliver clear explanations and attached evidence directly in your GitHub review workflow.",
        chip: "Validated",
      },
    ] as StepItem[],
  },
  stats: [
    {
      label: "Quick Onboarding",
      value: 15,
      suffix: " min",
      caption: "Connect your GitHub repository webhooks and start reviewing",
    },
    {
      label: "Collaborative Trial",
      value: 30,
      suffix: " days",
      caption: "Full evaluation on production PRs with no credit card required",
    },
    {
      label: "Annual Savings",
      value: 20,
      suffix: "%",
      caption: "Discount on Team tier billed annually ($16 per dev/month)",
    },
  ] as StatItem[],
  workflow: {
    eyebrow: "IN YOUR WORKFLOW",
    titlePrimary: "Keep your tools.",
    titleMuted: "Connect the context.",
    body: "Requirements live in one place. Code in another. Bring the relevant context together where engineering work happens.",
    caption: "Connect only the sources and repositories you authorize. Pilot integrations are shown as the intended workflow.",
    tools: {
      left: [
        {
          id: "jira",
          name: "Jira",
          detail: "Requirements & tickets",
          icon: "/brands/jira.svg",
          tag: "Pilot",
          isLive: false,
        },
        {
          id: "prds",
          name: "PRDs & documentation",
          detail: "Intent & acceptance criteria",
          icon: "file-text",
          isLive: false,
        },
      ],
      engine: {
        name: "Myco",
        sub: "Shared understanding",
      },
      right: [
        {
          id: "github",
          name: "GitHub",
          detail: "Pull request review",
          icon: "/brands/github.svg",
          tag: "Live",
          isLive: true,
        },
        {
          id: "vscode",
          name: "VS Code",
          detail: "Local development",
          icon: "/brands/vscode.svg",
          tag: "Pilot",
          isLive: false,
        },
      ],
    },
    permissions: [
      {
        action: "Read repository contents",
        detail: "Required to build relevant engineering context",
        status: "ALLOW",
      },
      {
        action: "Read pull request metadata",
        detail: "Required to trace change and review context",
        status: "ALLOW",
      },
      {
        action: "Write to source code",
        detail: "Zero code modification; Myco never writes to repositories",
        status: "DENY",
      },
      {
        action: "Push commits",
        detail: "Myco never pushes changes or alters branch history",
        status: "DENY",
      },
    ],
  } as WorkflowContent,
  proof: {
    eyebrow: "PROOF IN WORKFLOW",
    title: "The bug is not always in the changed line.",
    body: "Illustrative engineering scenarios where local diffs passed tests but broke system intent.",
    cards: [
      {
        index: "#01",
        tag: "AGENTIC WORKFLOW",
        name: "AgentRunner",
        caption: "Illustrative: Retry handler skips tool authorization check on secondary attempt.",
      },
      {
        index: "#02",
        tag: "FINANCIAL LEDGER",
        name: "Checkout Amendment",
        caption: "Illustrative: Tax exemption dropped during invoice amendment retry loop.",
      },
      {
        index: "#03",
        tag: "INTEGRATION",
        name: "GitHub Review",
        caption: "In-line GitHub comments with attached AST trace evidence.",
      },
      {
        index: "#04",
        tag: "ONBOARDING",
        name: "15 min Setup",
        caption: "Connect repository webhooks and start receiving intent-aware signals immediately.",
        inverted: true,
        span2: true,
      },
      {
        index: "#05",
        tag: "WORKFLOW GATE",
        name: "Pre-Merge Check",
        caption: "Configure as a status check in GitHub branch protection rules to prevent regressions.",
      },
    ] as ProofCard[],
  },
  industries: {
    title: "Engineering domains where context determines correctness.",
    categories: ["All", "AI & Agents", "Fintech", "Infra", "Monorepos", "Security"],
    items: [
      {
        id: "ai-systems",
        category: "AI & Agents",
        title: "Agent Systems",
        sub: "Tool approval and loop safety",
        image: "/assets/concept-agent-systems.jpg",
      },
      {
        id: "fintech",
        category: "Fintech",
        title: "Billing & Ledger",
        sub: "State persistence across retries",
        image: "/assets/concept-billing-ledger.jpg",
      },
      {
        id: "infra",
        category: "Infra",
        title: "Distributed Services",
        sub: "Interface contract and latency drift",
        image: "/assets/concept-distributed-services.jpg",
      },
      {
        id: "monorepos",
        category: "Monorepos",
        title: "Cross-Service Repos",
        sub: "Downstream interface compatibility",
        image: "/assets/concept-cross-service-repos.jpg",
      },
      {
        id: "security",
        category: "Security",
        title: "Access Control",
        sub: "Permission and policy verification",
        image: "/assets/concept-access-control.jpg",
      },
      {
        id: "compliance",
        category: "Security",
        title: "Audited Releases",
        sub: "Zero data retention pipelines",
        image: "/assets/concept-audited-releases.jpg",
      },
    ] as IndustryCard[],
  },
  posts: {
    eyebrow: "KNOWLEDGE",
    titlePrimary: "Engineering insights.",
    titleMuted: "From the Myco team.",
    all: "ALL INSIGHTS",
    items: [
      {
        number: "01",
        date: "OCT 28, 2026",
        title: "Why unit tests pass when system intent breaks",
        excerpt: "How local mocks conceal cross-boundary regressions and why intent-aware review is required.",
        href: "/blog",
      },
      {
        number: "02",
        date: "OCT 21, 2026",
        title: "Context first: Reconstructing engineering intent from tickets",
        excerpt: "Mapping Jira requirements and PR descriptions into a deterministic AST graph.",
        href: "/blog",
      },
      {
        number: "03",
        date: "OCT 14, 2026",
        title: "Designing zero-retention analysis for private repositories",
        excerpt: "Why ephemeral in-memory AST evaluation protects intellectual property.",
        href: "/blog",
      },
    ] as PostItem[],
  },
  faq: {
    title: "Frequently asked questions.",
    items: [
      {
        q: "Is Myco a code reviewer or a QA assistant?",
        a: "Myco is an AI QA assistant whose current foundation is pull request review. V2 expands that foundation across finding bugs, test intelligence, test execution, and failure diagnosis.",
      },
      {
        q: "Can Myco find bugs today?",
        a: "Yes. The current pull-request review product identifies potential bugs and assesses them against available requirements, code context, and dependencies.",
      },
      {
        q: "Can it run tests or diagnose failures today?",
        a: "Those are planned V2 capabilities. Finding bugs is available today; test intelligence, test execution, and failure diagnosis are on our active roadmap.",
      },
      {
        q: "Does it work with monorepos and multiple repositories?",
        a: "Yes. Requirements and dependency context can span services and modules. Myco traces relationships wherever authorized context is accessible.",
      },
      {
        q: "Will it fix and merge pull requests automatically?",
        a: "No. Myco delivers actionable findings with attached evidence. Engineers retain review responsibility, and your repository branch protection rules govern merge decisions.",
      },
      {
        q: "What does it cost, and how long does setup take?",
        a: "Team plan is $20 per developer per month ($16 billed annually) with a 30-day free trial. Setup takes under 15 minutes by connecting your GitHub repository webhooks.",
      },
    ] as FaqItem[],
  },
  cta: {
    title: "See Myco in your workflow.",
    button: "Request a pilot",
    href: "/book-demo",
  },
  footer: {
    tagline: "Agentic intelligence for engineering. Context first, then reasoning.",
    credit: "Built by Myco Engineering.",
    columns: [
      {
        title: "PLATFORM",
        links: [
          { label: "Overview", href: "/why" },
          { label: "Capabilities", href: "#how" },
          { label: "Integrate", href: "#integrate" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "SECURITY",
        links: [
          { label: "Architecture", href: "/privacy" },
          { label: "Zero Training", href: "/privacy" },
          { label: "Read-Only Access", href: "/terms" },
          { label: "Terms of Use", href: "/terms" },
        ],
      },
      {
        title: "RESOURCES",
        links: [
          { label: "Knowledge Base", href: "/blog" },
          { label: "FAQ", href: "/faq" },
          { label: "Pilot Request", href: "/book-demo" },
        ],
      },
    ] as FooterColumn[],
  },
};

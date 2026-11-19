// Myco — Engineering Intelligence Platform
// Context first, then reasoning. Verified product copy and capability definitions.

export const siteContent = {
  brand: {
    name: "Myco",
    tagline: "Agentic intelligence for engineering. Context first, then reasoning.",
    metaTitle: "Myco — Engineering Intelligence Platform",
    metaDescription:
      "Myco builds context across your engineering system, reasons over every relevant change, and surfaces the signals that deserve attention.",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.mycointelligence.com",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://mycointelligence.com",
  },
  nav: {
    why: { label: "Overview", href: "/why" },
    resources: { label: "Knowledge", href: "/blog" },
    pricing: { label: "Pricing", href: "/pricing" },
    signIn: { label: "Sign in" },
    book: { label: "Request a pilot", href: "/book-demo" },
    menu: "MENU",
    resourcesDropdown: [
      { label: "All Insights", href: "/blog" },
      { label: "PR Review", href: "/blog?category=review" },
      { label: "Test Intelligence", href: "/blog?category=testing" },
      { label: "Security & Privacy", href: "/blog?category=security" },
    ],
  },
  hero: {
    supportedPrefix: "INTEGRATION SUITE",
    supportedBrand: "GitHub & CI/CD",
    headlineLine1: "AI WRITES THE CODE.",
    headlineLine2: "MYCO UNDERSTANDS IT.",
    subCopy:
      "Myco builds context across your engineering system, reasons over every relevant change, and surfaces the signals that deserve attention.",
    cta: "Request a pilot",
    ctaHref: "/book-demo",
  },
  logoStrip: {
    group1: {
      eyebrow: "WORKFLOW INTEGRATIONS",
      logos: ["GitHub", "Slack", "Jira"],
    },
    group2: {
      eyebrow: "SECURITY POSTURE",
      logos: ["Read-Only Access", "Zero Training", "Tenant Isolation", "Ephemeral Analysis"],
    },
  },
  featuredCase: {
    eyebrow: "CONTEXT, REASONING, SIGNAL",
    headline:
      "A DIFF IS NOT THE WHOLE SYSTEM. CONTEXT REVEALS INTENDED BEHAVIOR.",
    body: "A pull request captures what changed. Myco traces the surrounding code, intent, dependencies and history that give a change meaning before engineers merge.",
    cta: "Explore the platform",
    ctaHref: "/why",
  },
  problemTimeline: {
    eyebrow: "THE CONTEXT GAP",
    statements: [
      {
        primary: "A single diff",
        muted: "hides systemic risk.",
        sub: "Changes look correct in isolation but conflict with requirements, break dependencies, or destabilize existing workflows.",
      },
      {
        primary: "Passing tests",
        muted: "miss behavioral intent.",
        sub: "Line coverage counts executed lines, not verified scenarios. Weak assertions let broken contracts pass silently.",
      },
      {
        primary: "Myco connects",
        muted: "context to reasoning.",
        sub: "It builds a scoped graph of code, requirements, and architecture before checking every pull request.",
      },
    ],
    pills: ["AST PARSE", "DEPENDENCY MAP", "ASSERTION CHECK"],
    mergedPill: "MYCO \u00B7 EVERY RELEVANT CHANGE, IN CONTEXT",
    counterStart: "3 OF 11 INVARIANTS CHECKED",
    counterSuffix: " \u00B7 BEFORE MERGE",
    caption: "EVERY COMMITTED DIFF EVALUATED AGAINST CODEBASE CONTEXT",
    months: ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV"],
  },
  howItWorks: {
    eyebrow: "HOW MYCO WORKS",
    headingLine1: "Context first.",
    headingLine2: "Then reasoning.",
    aside:
      "Myco builds a scoped engineering view of your codebase, systems and intent before evaluating a change. This gives the model the right context to reason, validate and surface what matters.",
    cards: [
      {
        index: "01",
        label: "INGEST & CONTEXT",
        title: "Ingest and context",
        description:
          "We assemble a scoped view of the code, ownership, dependencies and historical changes around the pull request.",
      },
      {
        index: "02",
        label: "REASONING",
        title: "Contextual reasoning",
        description:
          "We analyze intent, design trade-offs, and potential impact across the broader system before drawing conclusions.",
      },
      {
        index: "03",
        label: "VALIDATION",
        title: "Multi-signal validation",
        description:
          "We check findings across tests, standards, security policies, and operational constraints with evidence attached.",
      },
      {
        index: "04",
        label: "ACTIONABLE SIGNAL",
        title: "Actionable signal",
        description:
          "We produce a single, validated signal that captures what the change means in the full system without alert noise.",
      },
    ],
  },
  caseSteps: {
    eyebrow: "PROOF IN WORKFLOW",
    headingPrimary: "The bug is rarely",
    headingMuted: "in the changed line.",
    aside:
      "A PR can look correct in isolation while skipping a critical approval check across service dependencies.",
    steps: [
      {
        id: "map",
        icon: "Eye",
        title: "Trace the intent",
        description:
          "Compare the pull request diff directly against ticket specifications and stated requirement AGENT-12.",
      },
      {
        id: "chain",
        icon: "Layers",
        title: "Trace execution path",
        description:
          "Trace AgentRunner through the retry execution path across dependent microservices.",
      },
      {
        id: "reproduce",
        icon: "ShieldPlus",
        title: "Assess policy invariants",
        description:
          "Detect that toolPolicy.requiresApproval is unintentionally bypassed during subsequent retries.",
      },
      {
        id: "break",
        icon: "RefreshCw",
        title: "Deliver validated signal",
        description:
          "Deliver an actionable finding directly in the PR review with exact code context and remediation guidance.",
      },
    ],
  },
  outcome: {
    eyebrow: "OUTCOME",
    title: "What engineering teams observe after deploying Myco.",
    stat1: {
      value: "100%",
      label:
        "Deterministic context isolation with zero customer data used for model training.",
    },
    stat2: {
      value: "0",
      label: "Unchecked cross-service policy regressions merged into production.",
    },
  },
  proof: {
    eyebrow: "SECURITY & PRIVACY",
    headingPrimary: "Enterprise assurance",
    headingMuted: "with zero data leakage.",
    aside:
      "Myco operates with strict security boundaries, tenant isolation, and read-only AST ingestion.",
    cards: [
      {
        index: "01",
        category: "COMPLIANCE",
        brand: "SOC 2 Type II",
        description:
          "Audited controls across data processing, infrastructure isolation, and access integrity.",
      },
      {
        index: "02",
        category: "PRIVACY",
        brand: "Zero Model Training",
        description:
          "Customer code, diffs, and context graphs are never used to train public foundation models.",
      },
      {
        index: "03",
        category: "ISOLATION",
        brand: "Dedicated VPC",
        description:
          "Deployable within your private virtual cloud with self-hosted runner support.",
      },
      {
        index: "04",
        category: "VERIFIED / PR",
        value: "100%",
        description:
          "Pull requests analyzed against surrounding codebase context, tests, and requirements.",
      },
      {
        index: "05",
        category: "CONTEXT ARTIFACTS",
        value: "1,280+",
        description:
          "Engineering context nodes, dependency edges, and requirements traced across repositories.",
      },
    ],
  },
  whyList: {
    eyebrow: "WHY MYCO",
    headingPrimary: "Context first.",
    headingMuted: "Then reasoning.",
    aside:
      "Anyone can run a static linter. Myco builds true architectural context so engineers make high-confidence decisions.",
    cta: "Request a pilot",
    ctaHref: "/book-demo",
    items: [
      {
        id: "services-and-schedulers",
        index: "01",
        title: "Requirement-to-code tracing",
        body: "Assess whether pull requests match stated product intent, ticket criteria, and design trade-offs.",
      },
      {
        id: "failure-paths",
        index: "02",
        title: "Cross-repository dependencies",
        body: "Understand how changes in shared libraries impact dependent services and downstream consumers.",
      },
      {
        id: "predict-before-release",
        index: "03",
        title: "Test intelligence",
        body: "Identify missing behavioral scenarios, weak assertions, and tests that pass without verifying intent.",
      },
      {
        id: "verified-findings",
        index: "04",
        title: "Actionable PR explanations",
        body: "Deliver clear explanations, code context, and priority markers directly into existing review workflows.",
      },
      {
        id: "learning-loop",
        index: "05",
        title: "Continuous system learning",
        body: "Every review refines context mapping, repository ownership, and squad architecture boundaries.",
      },
    ],
  },
  industries: {
    eyebrow: "ENGINEERING ENVIRONMENTS",
    headingPrimary: "Built for teams maintaining",
    headingMuted: "complex software systems.",
    lead: "Where does lack of context create the greatest friction?",
    cta: "Request a pilot",
    ctaHref: "/book-demo",
    items: [
      {
        slug: "microservices",
        index: "01",
        title: "Microservices",
        descriptor: "Service contracts, API drift, and distributed boundaries.",
      },
      {
        slug: "compliance",
        index: "02",
        title: "Regulated Systems",
        descriptor: "Audit trails, policy enforcement, and security gates.",
      },
      {
        slug: "monorepos",
        index: "03",
        title: "Shared Monorepos",
        descriptor: "Multi-squad dependencies and shared component libraries.",
      },
      {
        slug: "infrastructure",
        index: "04",
        title: "Platform Engineering",
        descriptor: "Telemetry pipelines, queue consumers, and background workers.",
      },
      {
        slug: "critical-apis",
        index: "05",
        title: "Critical Core APIs",
        descriptor: "Payment settlement, auth boundaries, and transaction flows.",
      },
      {
        slug: "ai-generated-code",
        index: "06",
        title: "AI-Assisted Development",
        descriptor: "Rapid AI code generation requiring rigorous architectural review.",
      },
    ],
  },
  latest: {
    eyebrow: "KNOWLEDGE & RESEARCH",
    headingPrimary: "Notes from the",
    headingMuted: "Myco engineering team.",
    cta: "All insights",
    ctaHref: "/blog",
    posts: [
      {
        category: "Review",
        title:
          "AI writes the code: Why contextual engineering review is essential",
        excerpt:
          "When generative models write code at high velocity, the bottleneck shifts from writing syntax to verifying architectural alignment and dependency integrity.",
        readTime: "4 MIN READ",
        slug: "contextual-engineering-review",
        seed: 7,
      },
      {
        category: "Testing",
        title: "Test intelligence vs line coverage: Validating behavioral intent",
        excerpt:
          "High line coverage frequently conceals missing failure scenarios and weak assertions. Why understanding intent matters more than counting executed lines.",
        readTime: "6 MIN READ",
        slug: "test-intelligence-vs-line-coverage",
        seed: 8,
      },
      {
        category: "Security",
        title: "Zero-training architecture: Keeping enterprise codebases private",
        excerpt:
          "How Myco constructs deterministic semantic AST graphs at the edge, redacting sensitive tokens and ensuring zero data ingestion into public models.",
        readTime: "5 MIN READ",
        slug: "zero-training-architecture",
        seed: 9,
      },
    ],
  },
  closingCta: {
    heading: "Bring context-first engineering intelligence to your team.",
    cta: "Request a pilot",
    ctaHref: "/book-demo",
    caption: "ENGINEER-LED WALKTHROUGH. SEE MYCO ANALYZE YOUR CODEBASE CONTEXT.",
  },
  footer: {
    tagline: "Agentic intelligence for engineering. Context first, then reasoning.",
    copyright: "\u00A9 2026 Myco Intelligence. All rights reserved.",
    credit: "",
    columns: [
      {
        title: "PLATFORM",
        links: [
          { label: "Overview", href: "/why" },
          { label: "Capabilities", href: "/#how" },
          { label: "Pricing", href: "/pricing" },
          { label: "FAQ", href: "/faq" },
        ],
      },
      {
        title: "RESOURCES",
        links: [
          { label: "All Insights", href: "/blog" },
          { label: "PR Review", href: "/blog?category=review" },
          { label: "Testing", href: "/blog?category=testing" },
          { label: "Security", href: "/blog?category=security" },
        ],
      },
      {
        title: "CONNECT",
        links: [
          { label: "LinkedIn", href: "https://www.linkedin.com/in/abhishika-agarwal/" },
          { label: "Request a pilot", href: "/book-demo" },
        ],
      },
    ],
    legal: [
      { label: "TERMS OF USE", href: "/terms" },
      { label: "PRIVACY POLICY", href: "/privacy" },
    ],
  },
  faq: [
    {
      q: "What does Myco do?",
      a: "Myco is an AI quality-assurance assistant that helps engineering teams assess whether code changes do what they were intended to do, using available requirements, codebase context, and dependencies.",
    },
    {
      q: "What are the four core capabilities of Myco V2?",
      a: "Myco V2 brings together four capabilities: 1. Finding bugs during pull-request review, 2. Test intelligence (identifying missing scenarios and weak assertions), 3. Test execution within the CI workflow, and 4. Failure diagnosis.",
    },
    {
      q: "Does Myco train models on customer code?",
      a: "No. Myco operates under a strict zero model training guarantee. Your code, diffs, and context graphs are never used to train or fine-tune public or shared models.",
    },
    {
      q: "How does Myco integrate into our development workflow?",
      a: "Myco integrates natively with GitHub pull requests, Slack notifications, and Jira requirements, delivering actionable explanations directly where engineers already review code.",
    },
    {
      q: "How does Myco differ from traditional linters?",
      a: "Static linters examine code syntax in isolation. Myco builds a multi-repository context graph that connects change diffs to tickets, system architecture, and downstream dependencies.",
    },
    {
      q: "Can Myco be deployed in private VPC environments?",
      a: "Yes. Enterprise customers can deploy Myco inside dedicated VPCs or on-premises environments with air-gapped security configurations.",
    },
  ],
  pricing: [
    {
      name: "Team",
      description:
        "$20 / dev / mo ($16 / dev / mo billed annually at $192/yr, saving 20%). 30-day free trial with no credit card required.",
      features: [
        "Admin-approved seats: only PR authors require paid seats",
        "Full PR review and software validation pipeline",
        "Unlimited reviews and repositories",
        "Dashboard and review analytics",
        "Bring Your Own LLM API Key (BYOK)",
        "Under 15-minute repository webhook onboarding",
        "Community and email support",
      ],
      cta: "Start 30-day trial",
      ctaHref: "/book-demo",
    },
    {
      name: "Enterprise",
      description:
        "Custom pricing tailored to organizational scale, active developer seats, and repository volume.",
      features: [
        "Single-tenant managed SaaS or dedicated VPC deployment",
        "Enterprise identity controls (SSO / SAML)",
        "Comprehensive audit logs and compliance reporting",
        "Custom repository and workflow connectors",
        "Advanced organizational self-learning",
        "Priority Slack channel support",
        "Dedicated Customer Success Manager",
      ],
      cta: "Request a pilot",
      ctaHref: "/book-demo",
    },
  ],
};

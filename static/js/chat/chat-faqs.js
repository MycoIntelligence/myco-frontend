/**
 * Centralized FAQ Database for Myco Website Assistant.
 *
 * All questions, answers, alternate phrasings, and keywords are defined here.
 * Developers can add or update entries without modifying UI or matching code.
 */
(function (global) {
  'use strict';

  var ChatFaqs = [
    // ----------------------------------------------------
    // 1. Company Information
    // ----------------------------------------------------
    {
      id: 'faq_company_what_is_myco',
      category: 'Company Information',
      question: 'What is Myco?',
      answer: 'Myco provides agentic intelligence for engineering teams. Unlike tools that only inspect isolated pull request diffs, Myco analyzes your full system context—understanding architectural invariants, data models, and dependencies before reasoning about changes.',
      keywords: ['what', 'is', 'myco', 'about', 'overview', 'company', 'mission', 'who'],
      alternatePhrasings: [
        'Tell me about Myco',
        'What does Myco do?',
        'Who is Myco?',
        'What is Myco intelligence?',
        'Can you introduce Myco?'
      ],
      tags: ['overview', 'company', 'intro']
    },
    {
      id: 'faq_company_who_is_it_for',
      category: 'Company Information',
      question: 'Who is Myco built for?',
      answer: 'Myco is designed for engineering leaders, staff architects, and development teams building complex software with AI coding agents or high commit velocity. It helps prevent architectural regressions, tool approval bypasses, and cross-service contract breakage.',
      keywords: ['who', 'target', 'audience', 'teams', 'engineers', 'developers', 'built', 'for', 'customers'],
      alternatePhrasings: [
        'Who uses Myco?',
        'Is Myco for developers or managers?',
        'What teams benefit from Myco?',
        'Is Myco suitable for enterprise teams?'
      ],
      tags: ['audience', 'teams', 'enterprise']
    },

    // ----------------------------------------------------
    // 2. Products and Services
    // ----------------------------------------------------
    {
      id: 'faq_products_context_first',
      category: 'Products and Services',
      question: 'How does context-first analysis work?',
      answer: 'When AI or developers produce a code change, reviewing just the git diff is insufficient. Myco first maps system context: repository models, database schemas, API contracts, and security policies. It then reasons over the diff within that global context to detect subtle P0/P1 logical flaws.',
      keywords: ['how', 'context', 'first', 'analysis', 'works', 'system', 'reasoning', 'diff', 'approach'],
      alternatePhrasings: [
        'How does context first work?',
        'What does context-first mean?',
        'Why context before reasoning?',
        'How does Myco analyze code?'
      ],
      tags: ['context', 'architecture', 'technology']
    },
    {
      id: 'faq_products_diff_vs_competitors',
      category: 'Competitor Comparisons',
      question: 'How does Myco compare to CodeRabbit, Graptile, and CodeAnt?',
      answer: 'Myco focuses on **whole-system architectural verification and blocking P0/P1 invariants** before merge.\n\n- **CodeRabbit**: Acts as a PR walkthrough companion with narrative summaries, sequence diagrams, and line-by-line comments.\n- **Graptile (Greptile)**: Focuses on codebase graph indexing designed to feed context to autonomous coding agents (like Cursor/Devin).\n- **CodeAnt (CodeAnt AI)**: Focuses on agentic security posture, compliance frameworks (SOC 2, HIPAA), and pre-commit CLI linting (`codeant review`).\n\nWhile CodeRabbit summaries and CodeAnt security scans focus on the PR surface or compliance, Myco acts as the architectural intelligence gate that protects system invariants across schemas, contracts, and microservices.',
      keywords: ['compare', 'competitors', 'coderabbit', 'graptile', 'greptile', 'codeant', 'vs', 'difference', 'alternative'],
      alternatePhrasings: [
        'How is Myco different from CodeRabbit?',
        'Compare Myco with Graptile and CodeAnt',
        'How does Myco compare to CodeAnt AI?',
        'What are Myco competitors?',
        'Why choose Myco over CodeRabbit?'
      ],
      tags: ['comparison', 'coderabbit', 'graptile', 'codeant']
    },

    // ----------------------------------------------------
    // 3. Features and Capabilities
    // ----------------------------------------------------
    {
      id: 'faq_features_languages_supported',
      category: 'Features and Capabilities',
      question: 'What languages and frameworks are supported?',
      answer: 'Myco currently provides deep support for TypeScript, JavaScript, Python, Go, Java, and SQL migrations, with active expansion to Rust and C#. It handles polyglot repositories, mono-repos, and microservices.',
      keywords: ['languages', 'stacks', 'supported', 'typescript', 'python', 'golang', 'java', 'sql', 'frameworks', 'rust'],
      alternatePhrasings: [
        'Which programming languages does Myco support?',
        'Does Myco work with Python and TypeScript?',
        'Can Myco analyze SQL or Go code?',
        'What tech stack can I use with Myco?'
      ],
      tags: ['languages', 'polyglot', 'frameworks']
    },
    {
      id: 'faq_features_p0_blockers',
      category: 'Features and Capabilities',
      question: 'What kind of bugs or risks does Myco catch?',
      answer: 'Myco surfaces high-impact P0 and P1 issues such as tool approval bypasses in AI agent loops, unindexed high-volume database queries, breaking API schema alterations, authorization gaps, and silent concurrency race conditions.',
      keywords: ['bugs', 'risks', 'catch', 'detect', 'p0', 'p1', 'blocker', 'issues', 'examples', 'findings'],
      alternatePhrasings: [
        'What bugs does Myco find?',
        'Can Myco detect security vulnerabilities?',
        'What is a P0 blocker in Myco?',
        'Give examples of issues Myco catches'
      ],
      tags: ['bugs', 'p0', 'security', 'capabilities']
    },
    {
      id: 'faq_features_interactive_playground',
      category: 'Features and Capabilities',
      question: 'Can I try Myco in an interactive playground?',
      answer: 'You can request a collaborative 30-day pilot to test Myco directly on your team’s pull requests, or reach out to our team at pilot@mycointelligence.com for a guided walkthrough.',
      keywords: ['playground', 'try', 'demo', 'interactive', 'test', 'sample', 'preview'],
      alternatePhrasings: [
        'Is there an interactive demo?',
        'How can I test Myco on the website?',
        'Where is the code playground?',
        'Can I test custom code?'
      ],
      tags: ['demo', 'playground', 'interactive']
    },

    // ----------------------------------------------------
    // 4. Pricing and Pilot Plans
    // ----------------------------------------------------
    {
      id: 'faq_pricing_plans',
      category: 'Pricing and Plans',
      question: 'How much does Myco cost and what are the pricing plans?',
      answer: 'Myco offers two plans tailored for engineering teams:\n\n• Team: $20 per reviewed developer per month (or $16/month billed annually at $192/year, saving 20%). Includes the full review and validation pipeline, unlimited reviews and repositories, dashboard analytics, and community/email support. A 30-day free trial is available with no credit card required.\n• Enterprise: Custom pricing for organizations needing SSO/SAML, audit logs, custom connectors, advanced self-learning, single-tenant SaaS or on-prem/VPC deployment, priority Slack support, and a dedicated CSM.\n\nNote: Subscriptions cover Myco. LLM usage is paid separately through your own provider API key (BYO key), and paid seats are admin-approved only for developers whose pull requests Myco reviews.',
      keywords: ['pricing', 'cost', 'plans', 'price', 'tier', 'subscription', 'how', 'much', 'expensive', 'free', 'trial', 'team', 'enterprise'],
      alternatePhrasings: [
        'What are the pricing options?',
        'How much does a subscription cost?',
        'Is there a free trial?',
        'What does Myco cost per seat?',
        'How much is the Team plan?',
        'What does Enterprise cost?'
      ],
      tags: ['pricing', 'plans', 'cost', 'trial']
    },
    {
      id: 'faq_pricing_request_pilot',
      category: 'Pricing and Plans',
      question: 'How do I request an enterprise pilot?',
      answer: 'You can click the "Request a pilot" button in the navigation bar or footer, or simply leave your details right here with me. Our team will schedule an architecture onboarding session and configure a sandbox evaluation for your repositories.',
      keywords: ['pilot', 'request', 'evaluation', 'trial', 'poc', 'onboarding', 'enterprise', 'sign', 'up'],
      alternatePhrasings: [
        'How can we start a pilot?',
        'I want to try a pilot with my team',
        'How do I sign up for an evaluation?',
        'Can we get a proof of concept?'
      ],
      tags: ['pilot', 'sales', 'evaluation']
    },

    // ----------------------------------------------------
    // 5. Onboarding and Implementation
    // ----------------------------------------------------
    {
      id: 'faq_onboarding_integration',
      category: 'Onboarding and Implementation',
      question: 'How do we integrate Myco with GitHub or CI/CD?',
      answer: 'Myco integrates seamlessly as a GitHub App or through your existing CI/CD runners (GitHub Actions, GitLab CI, Buildkite). It runs alongside automated test suites and posts inline contextual findings directly onto pull requests.',
      keywords: ['integrate', 'github', 'gitlab', 'ci', 'cd', 'actions', 'pipeline', 'setup', 'install', 'pull', 'request', 'pr'],
      alternatePhrasings: [
        'Can Myco integrate with GitHub Actions?',
        'Does Myco support GitLab or Bitbucket?',
        'How do we install Myco in our repository?',
        'Does Myco review GitHub pull requests?'
      ],
      tags: ['integration', 'github', 'cicd']
    },
    {
      id: 'faq_onboarding_time_to_deploy',
      category: 'Onboarding and Implementation',
      question: 'How long does deployment and setup take?',
      answer: 'Initial repository connection typically takes under 15 minutes via the GitHub App. Myco indexes your repository graph asynchronously and begins surfacing review findings on the very next pull request.',
      keywords: ['time', 'deploy', 'setup', 'long', 'installation', 'how', 'fast', 'duration'],
      alternatePhrasings: [
        'How fast can we get Myco running?',
        'Is deployment complicated?',
        'How many days to set up Myco?'
      ],
      tags: ['setup', 'speed', 'deployment']
    },

    // ----------------------------------------------------
    // 6. Security and Privacy
    // ----------------------------------------------------
    {
      id: 'faq_security_data_privacy',
      category: 'Security and Privacy',
      question: 'Does Myco train AI models on customer code?',
      answer: 'No. Myco never trains public or foundational models on your proprietary source code. Your code and analysis artifacts remain strictly isolated to your organization’s dedicated tenant.',
      keywords: ['train', 'training', 'model', 'customer', 'code', 'privacy', 'ip', 'intellectual', 'property'],
      alternatePhrasings: [
        'Do you train models on our code?',
        'Will our code leak into public AI models?',
        'Is our code kept private?',
        'What is your model training policy?'
      ],
      tags: ['privacy', 'security', 'training']
    },
    {
      id: 'faq_security_compliance_hosting',
      category: 'Security and Privacy',
      question: 'Where is code processed and is Myco secure?',
      answer: 'Myco enforces strict SOC 2 Type II controls, AES-256 encryption at rest, TLS 1.3 in transit, and secret redaction. Enterprise customers can choose dedicated single-tenant cloud or self-hosted VPC deployment to ensure zero egress.',
      keywords: ['security', 'compliance', 'soc2', 'encryption', 'hosting', 'vpc', 'on-prem', 'cloud', 'isolated'],
      alternatePhrasings: [
        'Is Myco SOC2 compliant?',
        'Can Myco run inside our AWS VPC?',
        'How do you protect secrets and tokens?',
        'Where is our data stored?'
      ],
      tags: ['security', 'soc2', 'vpc', 'compliance']
    },

    // ----------------------------------------------------
    // 7. Support and Contact Information
    // ----------------------------------------------------
    {
      id: 'faq_support_contact_team',
      category: 'Support and Contact Information',
      question: 'How can I contact the Myco team or speak with someone?',
      answer: 'You can email our team directly at pilot@mycointelligence.com or submit your question right here in this assistant. We typically respond within 24 business hours.',
      keywords: ['contact', 'email', 'support', 'talk', 'human', 'speak', 'sales', 'reach', 'team'],
      alternatePhrasings: [
        'How do I talk to a human?',
        'Can I speak with a sales representative?',
        'What is your contact email?',
        'I need help from support'
      ],
      tags: ['contact', 'support', 'email']
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatFaqs;
  } else {
    global.MycoChatFaqs = ChatFaqs;
  }
})(typeof window !== 'undefined' ? window : this);

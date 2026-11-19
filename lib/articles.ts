export const articles = [
  {
    slug: "contextual-engineering-review", category: "Review", title: "Why context matters in pull request review", readTime: "3 min read",
    excerpt: "A change can look correct in isolation while affecting behaviour elsewhere. Review starts with understanding the intent and its dependencies.",
    paragraphs: [
      "A pull request shows what changed, but it may not show everything the change depends on. Requirements, neighbouring code and downstream consumers can help a reviewer understand the behaviour the change is meant to preserve.",
      "Consider a promotional credit that should reduce both a checkout charge and the amount on an invoice. A change to checkout alone may miss the invoice calculation. The useful review question is not only whether the changed lines look sound, but whether the intended behaviour remains consistent across the accessible code.",
      "Myco’s live foundation is contextual GitHub pull request review. It evaluates changes against available requirements and surrounding authorized code, and explains potential risks. Context availability and cross-repository scope depend on configuration; engineers decide what to investigate and ship. This example is illustrative."
    ]
  },
  {
    slug: "test-intelligence-vs-line-coverage", category: "Testing", title: "Beyond line coverage: checking intended behaviour", readTime: "3 min read",
    excerpt: "Executed lines are one signal; meaningful validation also asks which behaviours and edge cases were checked.",
    paragraphs: [
      "A passing test confirms the assertions it actually makes under the conditions in which it ran. Line coverage can show which code was exercised, but it does not by itself show that every important behaviour was checked.",
      "Teams can start with a concrete requirement, list the expected outcomes and discuss what should happen at boundaries or on failure. The goal is to make the relationship between intent and evidence clear enough for an engineer to make a decision.",
      "Myco’s live foundation is pull request review. Coverage analysis, test suggestions, test execution and failure investigation are part of the product direction; availability must be confirmed for each capability and configuration."
    ]
  },
  {
    slug: "zero-training-architecture", category: "Security", title: "Questions to ask before connecting engineering context", readTime: "3 min read",
    excerpt: "Repository scope, permissions and data handling deserve a clear discussion before an evaluation begins.",
    paragraphs: [
      "Engineering context may include source code, requirements and discussions. Before connecting a tool, teams should understand which sources and repositories are in scope and who authorizes access.",
      "Reading context is a different permission from commenting, creating tickets, changing code, running tests or affecting a merge. Review each action separately and agree who retains responsibility for decisions.",
      "Deployment, model routing, retention, data handling and security terms should be confirmed for the specific environment. Ask the Myco team for applicable documentation as part of the evaluation."
    ]
  },
] as const;

export const articleAliases: Record<string, string> = {
  "cascading-outage-averted": "contextual-engineering-review",
  "retry-storms-explained": "contextual-engineering-review",
  "twin-without-production": "zero-training-architecture",
  "five-release-risk-signals": "test-intelligence-vs-line-coverage",
};

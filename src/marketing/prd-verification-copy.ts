/**
 * PRD Verification Copy Module
 * Centralized, typed single source of truth for all public-facing copy
 * regarding the PRD-to-Implementation Mismatch feature.
 * Strictly traceable to docs/prd-verification/FACTS.md.
 */

export interface DecisionOption {
  id: "prd_outdated" | "pr_incorrect" | "needs_clarification";
  label: string;
  meaning: string;
  canTicketFollow: boolean;
  ticketAction: string | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PlaygroundSummaryLines {
  documentsAnalyzed: number;
  requirementsIdentified: number;
  correctlyImplemented: number;
  potentialMismatches: number;
  unverifiable: number;
  findingsRequiringHumanReview: string[];
}

export interface PlaygroundExampleCopy {
  id: string;
  requirement: string;
  documentReferenceLabel: string;
  expected: string;
  actual: string;
  mismatch: string;
  resultLabel: "Implemented" | "Partially implemented" | "Not implemented" | "Contradicted" | "Unverifiable";
  severity: "High" | "Medium" | "Low";
  confidence: "High" | "Medium" | "Low";
  impact: string;
  recommendedAction: string;
  evidenceFile: string;
  evidenceLines: string;
  codeExcerpt: string;
  summaryLines: PlaygroundSummaryLines;
}

export interface PrdCopy {
  availability: "beta" | "live";
  featureSection: {
    heading: string;
    paragraph1: string;
    paragraph2: string;
    betaBadge: string;
  };
  highlights: string[];
  documentSources: {
    sources: string[];
    accessNote: string;
  };
  requirementResults: [
    "Implemented",
    "Partially implemented",
    "Not implemented",
    "Contradicted",
    "Unverifiable"
  ];
  decisionOptions: [DecisionOption, DecisionOption, DecisionOption];
  ticketRules: {
    condition: string;
    confirmation: string;
    explicitRequirement: string;
    neverAutonomous: string;
  };
  assistantAnswers: {
    overview: string;
    sources: string;
    tickets: string;
    unreadableDocument: string;
  };
  faqItems: [FaqItem, FaqItem, FaqItem];
  securitySentence: string;
  playgroundExample: PlaygroundExampleCopy;
}

export const prdCopy: PrdCopy = {
  availability: "live",

  featureSection: {
    heading: "PRD verification",
    paragraph1:
      "PRD verification is built into pull request review. When a pull request description links a requirements document, Myco reads the document, extracts individual requirements, and checks the code changes and the wider repository against them.",
    paragraph2:
      "It reports requirements that are missing, partly done or contradicted, with code evidence. Engineers decide what each mismatch means.",
    betaBadge: "",
  },

  highlights: [
    "Checks pull requests against linked requirements documents from GitHub, Jira, Confluence, Google Docs, Notion, or readable web pages.",
    "Reports missing, partially implemented, or contradicted requirements with code evidence.",
    "Provides expected behavior, actual behavior, file and line references, severity, confidence, impact, and a recommended action for each finding.",
    "Supports human decisions and explicit confirmation without altering code or blocking merges.",
  ],

  documentSources: {
    sources: [
      "GitHub documents",
      "Jira tickets",
      "Confluence pages",
      "Google Docs",
      "Notion pages",
      "Readable web pages",
    ],
    accessNote:
      "Some need access to be set up by the customer. Access to documents is read-only. A document that cannot be read is reported and does not stop the review.",
  },

  requirementResults: [
    "Implemented",
    "Partially implemented",
    "Not implemented",
    "Contradicted",
    "Unverifiable",
  ],

  decisionOptions: [
    {
      id: "prd_outdated",
      label: "The PRD is outdated or incorrect",
      meaning:
        "The PRD is outdated or incorrect; Myco records the decision and the engineer’s explanation.",
      canTicketFollow: true,
      ticketAction: "Create a ticket to update the PRD",
    },
    {
      id: "pr_incorrect",
      label: "The PR implementation is incorrect",
      meaning:
        "The PR implementation is incorrect; Myco records the decision and the engineer’s explanation.",
      canTicketFollow: true,
      ticketAction: "Create a ticket to fix the implementation",
    },
    {
      id: "needs_clarification",
      label: "Needs clarification",
      meaning:
        "Ambiguous or conflicting requirements are flagged for clarification instead of guessed; needs clarification keeps the finding open.",
      canTicketFollow: false,
      ticketAction: null,
    },
  ],

  ticketRules: {
    condition: "Only when the customer has enabled Jira",
    confirmation:
      "After the engineer confirms, Myco can create a ticket to update the PRD or a ticket to fix the implementation.",
    explicitRequirement:
      "No ticket is created without explicit confirmation, and none for needs clarification.",
    neverAutonomous:
      "Never changes code or documents; creates tickets on its own; assumes the PRD or the code is right; blocks a merge because of this section (it is for human review).",
  },

  assistantAnswers: {
    overview:
      "When a pull request description links a requirements document, Myco reads the document, extracts individual requirements, checks the code changes and the wider repository against them, and reports requirements that are missing, partly done or contradicted, with code evidence. Engineers decide what each mismatch means.",
    sources:
      "Document sources include GitHub documents, Jira tickets, Confluence pages, Google Docs, Notion pages, and other readable web pages. Some need access to be set up by the customer. Access to documents is read-only.",
    tickets:
      "Jira ticket creation is available only when the customer has enabled Jira. After the engineer confirms, Myco can create a ticket to update the PRD or a ticket to fix the implementation. No ticket is created without explicit confirmation, and none for needs clarification.",
    unreadableDocument:
      "A document that cannot be read is reported and does not stop the review. If it fails, the rest of the pull request review is unaffected.",
  },

  faqItems: [
    {
      question: "How does PRD verification check pull requests against requirements?",
      answer:
        "When a pull request description links a requirements document, Myco reads the document, extracts individual requirements, checks the code changes and the wider repository against them, and reports requirements that are missing, partly done or contradicted, with code evidence. Engineers decide what each mismatch means.",
    },
    {
      question: "Which document sources can Myco read for requirements?",
      answer:
        "Myco supports GitHub documents, Jira tickets, Confluence pages, Google Docs, Notion pages, and other readable web pages. Access to documents is strictly read-only, and a document that cannot be read is reported without stopping the review.",
    },
    {
      question: "Does PRD verification create Jira tickets or block merges?",
      answer:
        "Myco never creates tickets on its own and never blocks a merge. When Jira is enabled, Myco can create a ticket to update the PRD or fix the implementation only after explicit engineer confirmation. Findings are presented for human review.",
    },
  ],

  securitySentence:
    "Access to documents is read-only, and Myco never changes code or documents.",

  playgroundExample: {
    id: "PRD-1",
    requirement:
      "Users should be locked out after five consecutive failed login attempts.",
    documentReferenceLabel: "Product Spec §4.2 · Account Lockout",
    expected:
      "Users should be locked out after five consecutive failed login attempts.",
    actual:
      "The implementation tracks failed login attempts but does not prevent further login attempts after five consecutive failures.",
    mismatch: "Account lockout requirement is not implemented.",
    resultLabel: "Not implemented",
    severity: "High",
    confidence: "High",
    impact:
      "The implementation does not satisfy the documented authentication requirement.",
    recommendedAction:
      "Review and implement the missing account lockout behavior.",
    evidenceFile: "src/auth/loginService.ts",
    evidenceLines: "lines 42–48",
    codeExcerpt: "if (failedAttempts >= 5) { recordLoginFailure(user); }",
    summaryLines: {
      documentsAnalyzed: 1,
      requirementsIdentified: 10,
      correctlyImplemented: 7,
      potentialMismatches: 2,
      unverifiable: 1,
      findingsRequiringHumanReview: [
        "Account lockout mechanism is missing",
        "Token expiry duration contradicts the PRD",
      ],
    },
  },
};

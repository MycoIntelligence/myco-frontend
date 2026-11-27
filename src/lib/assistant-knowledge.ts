/** Public, reviewed excerpts derived from the 10 Nov 2026 product draft and the supplied pricing page.
 * Pricing and trial terms are from the existing frontend and must be confirmed before publication. */
export type KnowledgeEntry = { id: string; title: string; href: string; questions: RegExp[]; answer: string; searchText: string };
export const knowledge: KnowledgeEntry[] = [
  {
    id: 'prd',
    title: 'PRD verification',
    href: '/features/pr-review/',
    questions: [
      /^(?:what is|what does|how does|explain|describe|tell me about|can you explain)\s+(?:the\s+)?prd(?:\s+verification)?(?:\s+(?:do|work|doing))?[?.!\s]*$/i,
      /\b(prd|prds)\b/i,
      /\brequirements?\s*(doc(ument)?s?|verification|check(ing)?|mismatch(es)?)\b/i,
      /\b(specifications?|acceptance criteria|spec mismatch)\b/i,
      /\b(specifications?|requirements?)\b.*\b(verify|verification|check(ing)?|mismatch(es)?)\b/i,
    ],
    answer:
      'PRD verification is built into pull request review. When a pull request description links a requirements document, Myco reads the document, extracts individual requirements, checks the code changes and the wider repository against them, and reports requirements that are missing, partly done or contradicted, with code evidence. Engineers decide what each mismatch means.',
    searchText:
      'prd verification requirements document specification acceptance criteria mismatch pull request review missing partly done contradicted code evidence human review',
  },
  {
    id: 'prd-sources',
    title: 'PRD document sources',
    href: '/features/pr-review/',
    questions: [
      /\b(document sources?|document systems?|which documents?|what documents?|source documents?|supported documents?)\b/i,
      /\b(confluence|google docs|notion)\b/i,
      /\b(prd|prds|requirements?|specs?)\b.*\b(document sources?|document systems?|which documents?|what documents?|sources?|systems?|read from)\b/i,
      /\b(document sources?|document systems?|which documents?|what documents?|read from)\b.*\b(prd|prds|requirements?|specs?)\b/i,
    ],
    answer:
      'PRD verification is built into pull request review. Document sources include GitHub documents, Jira tickets, Confluence pages, Google Docs, Notion pages, and other readable web pages. Some need access to be set up by the customer. Access to documents is read-only.',
    searchText:
      'prd document sources systems github jira confluence google docs notion readable web pages read only customer setup unreadable document review',
  },
  {
    id: 'prd-tickets',
    title: 'PRD verification and Jira tickets',
    href: '/features/pr-review/',
    questions: [
      /\b(tickets?|jira)\b.*\b(prd|requirements?|specs?|mismatch)\b/i,
      /\b(prd|requirements?|specs?|mismatch)\b.*\b(tickets?|jira)\b/i,
      /\bcreate\s+tickets?\b.*\b(requirements?|spec|mismatch)\b/i,
    ],
    answer:
      'PRD verification is built into pull request review. Jira ticket creation is available only when the customer has enabled Jira. After the engineer confirms, Myco can create a ticket to update the PRD or a ticket to fix the implementation. No ticket is created without explicit confirmation, and none for needs clarification.',
    searchText:
      'prd jira tickets ticket creation update prd fix implementation engineer confirmation explicit needs clarification human review',
  },
  {id:'overview',title:'Myco product overview',href:'/#overview',questions:[/^(?:what is|what does|how does|explain|describe|tell me about|can you explain)\s+myco(?:\s+(?:do|work|doing))?[?.!\s]*$/i],answer:'Myco helps engineers get features ready to ship while they are still working on them. Its live foundation is contextual GitHub pull request review: it assesses proposed changes against relevant code and available requirements, and explains potential problems for engineers to investigate.',searchText:'myco overview product what does myco do contextual code review pull request change engineers'},
  {id:'live',title:'What is available today',href:'/#availability',questions:[/\b(live|available|current|today|currently|support)\b.*\b(feature|capabilit|product|review|myco)\w*/i,/\bmyco\b.*\b(live|available|today|currently)\b/i],answer:'Contextual pull request review in GitHub is the live foundation. Connected sources, repository scope, permissions and supported actions need to be confirmed for each evaluation.',searchText:'live available today current github pull request review feature capability'},
  {id:'workflow',title:'Pull request review workflow',href:'/#workflow',questions:[/\b(how|what|explain)\b.*\b(pull request|pr review|code review|review workflow|review process)\b/i,/\b(pull request|pr review)\b.*\b(how|work|process)\w*/i],answer:'Myco reviews a GitHub pull request against available requirements and relevant authorized code. It checks suspected issues against available evidence and can explain the behaviour at risk and what to investigate. Engineers decide what to fix and when to release.',searchText:'workflow github pull request pr review works requirements code finding evidence'},
  {id:'integrations',title:'Integrations and scope',href:'/#workflow',questions:[/\b(integrations?|connectors?|platforms?|connect|github|gitlab|jira|vscode|vs code|slack|linear)\b/i],answer:'GitHub pull request review is the live foundation. Other connected sources and integrations depend on configuration and availability; please confirm the specific integration with the Myco team. Local development in VS Code is on the roadmap.',searchText:'integrations github jira gitlab slack linear vscode vs code connect connectors platform'},
  {id:'languages',title:'Programming language support',href:'/#technologies',questions:[/\b(languages?|typescript|javascript|python|rust|golang|java|c\+\+|c#)\b/i],answer:'Myco supports all programming languages. The website shows examples; language support and integration availability are separate, so confirm the repositories and setup for your evaluation.',searchText:'languages programming code support python typescript javascript java rust go c++ c#'},
  {id:'roadmap',title:'Product roadmap',href:'/#lifecycle',questions:[/\b(roadmap|future|planned|lifecycle|requirements review|local development|pre.production|deployment diagnosis|production monitoring)\b/i],answer:'Myco’s direction is to carry context from requirements through production. Requirements review, local development, pre-production validation, deployment diagnosis and production monitoring are on the roadmap. GitHub pull request review is the live foundation.',searchText:'roadmap future planned lifecycle requirements local development preproduction deployment production monitoring'},
  {id:'testing',title:'Testing and sign-off',href:'/#availability',questions:[/\b(tests?|testing|coverage|run tests|execution|failure diagnosis|failures?)\b/i],answer:'Coverage analysis, test suggestions, execution and failure investigation are directions for the PR workflow. Their availability and scope need to be confirmed for each evaluation; they should not be assumed to be live in every configuration.',searchText:'testing test coverage execution run failure diagnosis suggestions signoff'},
  {id:'autonomy',title:'Engineering control',href:'/#control',questions:[/\b(auto(matic(ally)?)?|autonomous|independent|replace|merge|sign.off|approval|fix(es)?|ticket)\b/i],answer:'Engineers own fixes, sign-off and releases. Permission to read context is separate from permission to comment, create tickets, modify code, run tests or affect a merge; confirm available actions and permissions for your configuration.',searchText:'engineer control autonomy auto automatic merge fix approval signoff action permissions'},
  {id:'security',title:'Data handling and permissions',href:'/privacy',questions:[/\b(security|privacy|retention|encrypt|soc\s?2|gdpr|training|train|data|compliance|private|confidential)\b/i],answer:'Data handling, deployment, model routing and security terms need to be confirmed for your environment. The available product draft does not establish a specific certification, retention period or model-training commitment; please ask the Myco team for the applicable documentation.',searchText:'security privacy retention encryption soc2 gdpr training data compliance private confidential'},
  {id:'billing',title:'Pricing and billing',href:'/pricing',questions:[/\b(pric(e|ing)|cost|billing|billed|monthly|annual(ly)?|subscription|\$\s?\d)\b/i],answer:'The existing pricing page lists Team at $20 per reviewed developer per month, or $16 per developer per month billed annually ($192 per developer per year). Enterprise pricing is custom. LLM usage is charged separately by your model provider. Confirm current commercial terms with the Myco team.',searchText:'pricing price cost billing monthly annually subscription team enterprise 20 16 192 model'},
  {id:'trial',title:'Trial details',href:'/pricing',questions:[/\b(trial|free|credit card)\b/i],answer:'The existing pricing page describes a 30-day Team trial with no credit card required. Model provider charges apply separately, including during the trial. It says reviews pause after the trial until you subscribe; confirm current trial terms with the Myco team.',searchText:'trial free 30 days card subscription model costs'},
  {id:'seats',title:'Seats',href:'/pricing',questions:[/\b(seats?|developer(s)?|view(ers?|ing) findings)\b.*\b(pay|cost|billed|seat|price|free|need)\b/i,/\b(who|which)\b.*\b(seat|pay)\b/i],answer:'The existing pricing page says paid seats are admin-approved and needed only for developers whose pull requests Myco reviews. People who only view findings are free. Confirm current terms with the Myco team.',searchText:'seats developer paid billed viewing findings free admin approved'},
  {id:'contact',title:'Discuss an evaluation',href:'/book-demo',questions:[/\b(contact|demo|pilot|book|sales|talk to|evaluation|get started)\b/i],answer:'You can discuss an evaluation with the Myco team. Start with one important workflow, agree what useful feedback looks like and confirm the available configuration and terms.',searchText:'contact demo pilot book sales evaluation start team'},
];

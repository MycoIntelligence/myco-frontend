export const features = [
  {
    slug:'pr-review', label:'PR Review', beta:false,
    title:['See what your PR','could break before you merge'],
    explanation:'Check the change against intended requirements, find potential bugs & regressions across authorised repositories',
    summary:'Myco checks pull requests against product requirements and traces what could break downstream. Each bug, regression, or potential security finding includes the exact line, supporting evidence, and likely impact.',
    indexCopy:'Catch changes that break the spec or downstream behavior.',
    sections:[
      ['Review against the behavior you agreed to ship','Requirements can live in a PRD, a ticket, meeting notes, or a Slack conversation. Myco checks the implementation against the requirements available to the review. If an expectation is unclear, reviewers can see what needs clarification before they approve a change based on an assumption.'],
      ['Follow the change into other repositories','A change can work in the repository where it was written and still break a service that depends on it. Myco follows those dependencies across authorized repositories and points reviewers to the affected consumer. That helps the author bring the right service owner into the PR while there’s still time to coordinate the fix.'],
      ["Resolve the issue in the PR","The author can see the expected behavior, the line responsible, and what could break in the same review. That can cut down on messages to clarify a finding and follow-up PRs to repair a regression after merge."],
    ],
    example:'Checkout correctly charges $85 after a discount, but the receipt still shows $100. Myco connects the discrepancy to the requirement that the receipt must match the charge and points to the line that uses the original subtotal.',
  },
  {
    slug:'testing', label:'Testing & Test Generation', beta:false,
    title:['Turn requirements into a test plan','and identify test coverage gaps'],
    explanation:'See which requirements lack coverage and get a test plan in GitHub',
    summary:'Test coverage analysis and test plan generation are live. Myco checks what your existing tests cover against the requirements for the change and posts the gaps in an inline GitHub comment.',
    indexCopy:'Find coverage gaps and get a test plan in GitHub.',
    sections:[
      ['See what your tests miss','The PR comment calls out how many cases are missing and which behaviours need a check. Reviewers can see what still needs coverage before they approve the change.'],
      ['Open the test plan from the PR','The same comment links to an Excel sheet. It groups numbered test cases by scenario and shows the expected result and coverage status for each case.'],
      ['Use the plan to add the right tests','Engineers use the proposed cases and expected results to write the checks that matter for the change.'],
      ['Test failure analysis','Myco pinpoints why a test failed and recommends a fix that addresses the underlying cause.',true],
    ],
    example:'In checkout PR #214, the existing test covers a receipt with no discount. Myco flags two gaps: the receipt should show $85 after a $15 discount on a $100 order, and an explicit $0 discount should skip the default. The inline comment links to an Excel test plan with the expected results, so the author knows which checks to add before merging.',
  },
  {
    slug:'pre-prod-validation', label:'Pre-Prod Validation', beta:true,
    title:['Know if the release candidate','is ready to ship'],
    explanation:'Validate customer workflows, integrations, and performance in a production-like environment',
    summary:'We’re building Myco to validate features in staging and test the exact release candidate in isolated, production-like infrastructure. Release owners get evidence on customer workflows, integrations, and performance.',
    indexCopy:'Check the release candidate in staging.',
    sections:[
      ['Validate individual features in staging','Myco will turn acceptance criteria into scenarios with a user role, starting data, allowed actions, and expected outcomes. Agents will exercise the product with test data, including paths like resuming checkout or retrying payment. QA can review the steps and hand the developer a scenario they can rerun.'],
      ['Match the environment to the release','Set up an isolated pre-production environment with the service dependencies, feature flags, and configuration that matter to the release. Use separate infrastructure, databases, credentials, and test accounts for external services. Identify the candidate by build or commit and record the environment settings used for the run.'],
      ['Run acceptance and integration checks','Deploy the full candidate and run the priority customer journeys across the services that ship together. Check the browser or API response and the downstream result it should produce, such as the charge recorded by billing. Record what passed, what failed, and any check that couldn’t run because a dependency or test input was unavailable.'],
      ['Compare performance under the same load','Run the candidate and the current release against the same workload and representative data volume. Compare p95 latency and error rates at expected traffic, then increase load to see where the system starts to degrade. Tie each result to the traffic level, test window, and limit your team agreed to.'],
      ['Give the release owner evidence for sign-off','Bring acceptance results, performance measurements, and relevant logs or traces into one report. When a check fails, show the scenario, the observed result, and the evidence behind the likely cause. Engineers can rerun the affected check after a fix, and the release owner decides whether to ship.'],
    ],
    example:'The checkout candidate passes the receipt and billing checks. At 100 checkouts per minute, p95 latency rises from 245 ms on the current release to 420 ms on the candidate, above the 350 ms limit. Myco’s illustrative report recommends holding the release, inspecting the slow checkout traces, and rerunning the load check after a fix.',
  },
  {
    slug:'production-monitoring', label:'Production Monitoring', beta:true,
    title:['See what changed','after you shipped'],
    explanation:'Link unexpected behaviour to the rollout and give on-call engineers a place to start',
    summary:'We’re building Myco to monitor how changed workflows behave under real traffic. When a signal moves outside expectations, Myco will use what the team intended to ship and what actually went out to help the on-call engineer decide where to look.',
    indexCopy:'Trace unexpected behavior back to a release.',
    sections:[
      ['See what changed after rollout','Track signals such as latency, errors, and CPU usage in the workflows a release affected. When behavior shifts, see when the change started and how it compares with the baseline. The goal is to show the affected workflow and rollout window in the same view, so on-call engineers can start from the change that matters.'],
      ['Give the engineer a starting point','Myco will alert the responsible engineer with the affected workflow, the likely change, and the evidence to investigate it. The engineer can verify the cause and turn a confirmed failure into a check for future changes.'],
      ["Give on-call a lead they can verify","Attach the rollout, affected workflow, and likely change to the alert. The responsible engineer can start with the relevant evidence instead of asking every author what shipped. A confirmed incident can inform a regression check for the next release."],
    ],
    example:'In a separate rollout example, checkout latency rises after v2.9.0 ships. Myco connects the rise to the rollout and highlights slow traces where cache misses are followed by shipping-rate requests. The on-call engineer can compare cache hit rates with the previous release.',
  },
] as const

export const href = (slug:string) => '/features/'+slug+'/'

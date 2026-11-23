export const features = [
  {
    slug:'pr-review', label:'PR Review',
    title:['See what your PR','could break before merge.'],
    explanation:'What you get in a pull request review',
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
    slug:'testing', label:'Testing & Test Generation',
    title:['Turn requirements','into tests that can fail.'],
    explanation:'From requirement to test result',
    summary:'We’re building Myco to find what your tests miss, generate tests from your requirements, and show what happened when they ran. Engineers can review the proposed coverage and use the results to decide what’s ready to merge.',
    indexCopy:'Turn a coverage gap into a test case.',
    sections:[
      ['Find gaps and generate reviewable tests','Myco will compare your requirements with what existing tests actually assert, then propose cases for missing behavior. Each case will show the setup, test data, steps, and expected result so engineers can check it before adding it to the suite.'],
      ['Test the behavior at the right level','Cover pricing rules with unit tests, UI behavior with component tests, and service handoffs with integration or API contract tests. For a complete user journey, Myco will exercise the flow in a browser against an authorized test environment.'],
      ['Run affected tests and explain failures','Myco will run the checks relevant to the change and show the failing step or assertion, the expected and actual results, and supporting evidence from the run. Engineers can rerun the case to see whether the failure reproduces.'],
      ['Reuse tests when related code changes','Keep approved tests in your regression suite so the same behavior can be checked on later changes. The requirement and run evidence give developers and QA a shared starting point, reducing the work of recreating failures before sign-off.'],
    ],
    example:'A payment test already confirms the customer is charged $85. Myco proposes a second check for the receipt returned by checkout. If checkout returns a $100 receipt total, the failing assertion shows the expected and actual amounts.',
  },
  {
    slug:'pre-prod-validation', label:'Pre-Prod Validation',
    title:['Test the exact release','in a production-like environment.'],
    explanation:'From staging checks to release sign-off',
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
    slug:'production-monitoring', label:'Production Monitoring',
    title:['Trace unexpected behavior','back to the release.'],
    explanation:'What happens after an alert',
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

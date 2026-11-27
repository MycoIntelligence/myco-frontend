import {BetaRequest} from './beta-request'
import {DitherFlow} from './dither-flow'
import {FeatureIllustration} from './review-illustration'
import {ProductionDemo} from './production-demo'
import {PreProdDemo} from './quality-demos'

const staging = {
  title: 'Try the customer workflow',
  emphasis: 'before you ship it',
  intro: 'Myco is building staging validation that turns requirements into workflows your team can run against a release candidate.',
  problem: 'The first real checkout shouldn’t happen after deploy',
  problemCopy: [
    'The checkout PR is approved. Billing’s tests pass. The release owner asks, “Has anyone tried applying a discount, leaving checkout, and coming back?”',
    'Now someone has to find a test account, set up a cart, run the flow, and check what billing recorded. If it fails, the developer needs enough detail to reproduce it. That’s the work Myco is designed to make repeatable.',
  ],
  example: 'Checkout resumes. The receipt shows the full price',
  exampleCopy: [
    'Say the requirement is that a valid discount should stay applied when a customer returns to checkout. Start with a $100 cart and apply a $15 discount. Leave checkout, return to the cart, and complete the purchase with a test payment.',
    'The confirmation, receipt, and billing record should all show $85. In this example, checkout resumes successfully, but the receipt shows $100. A useful finding tells the release owner which candidate was tested, how to repeat the failure, and where the first mismatch appeared.',
  ],
  workflow: 'Give the release owner a check they can rerun',
  steps: [
    ['Start with the behavior you agreed to ship', 'Turn the requirement into a scenario with a starting state, a sequence of actions, and an expected result.'],
    ['Run it in lightweight staging', 'Use mock data and the services needed for the workflow. That gives the team a practical way to check acceptance criteria and regressions before release. [Confirm who provisions staging and which dependencies Myco can exercise.]'],
    ['Give engineering a reproducible failure', 'Show which step failed, what was expected, and what happened. The engineer can rerun the same scenario after a fix. [Confirm which evidence the beta captures and how reruns work.]'],
  ],
  next: 'Start with one workflow your team checks by hand',
  nextCopy: 'Pick a journey that takes coordination to validate today, like resuming checkout, retrying a payment, or completing an approval.',
  faq: [
    ['Do we need a full copy of production?', 'The planned approach uses lightweight staging with mock data. Production-only configuration, customer-specific behavior, and deployment at production scale need their own checks.'],
    ['Can we use our existing staging environment?', 'Yes. The private beta is designed to run release checks in the staging environment your team already uses. During onboarding, we’ll work with you to identify which workflows to validate and what test data they need.'],
    ['What happens when a check fails?', 'The planned release report shows which test cases passed or failed and includes evidence where available, such as a screenshot for a UI failure or a relevant log line for a backend failure. Your engineers can use that evidence to reproduce the issue and decide whether it should block the release.'],
  ],
}

const monitoring = {
  title: 'Give on-call a place to start',
  emphasis: 'when a release changes behavior',
  intro: 'Myco is building post-deploy validation to help engineers connect unexpected behavior to a rollout and investigate with the context of what the team shipped.',
  problem: 'You know what’s broken. You’re still figuring out where to look',
  problemCopy: [
    'Checkout latency climbs after a deployment. The dashboard shows when it started. The deploy history shows what went out. To work out which change matters, on-call still has to open the merged PRs, check the affected paths, and ask who touched them.',
    'The goal for Myco is to bring that context together so the engineer can start with a change they can actually investigate.',
  ],
  example: 'Checkout got slower after the rollout',
  exampleCopy: [
    'Imagine checkout latency rises shortly after a release that changes how shipping rates are cached. Slow requests spend extra time fetching rates. That makes the cache change worth checking, and the engineer can compare cache hit rates and slow traces before and after the rollout to see whether the evidence holds up.',
    'The handoff we’re working toward would show the affected workflow, when it changed, the rollout worth inspecting, and the evidence behind the lead.',
    '[Confirm which signals and release details Myco can bring together before depicting a beta workflow.]',
  ],
  workflow: 'Carry the context from review into the incident',
  steps: [
    ['Know what the release was supposed to change', 'Bring the intent behind the PR into the investigation so on-call can tell an expected shift from a possible regression. [Confirm how requirements and PRs are linked to a rollout.]'],
    ['Put the signal next to the rollout', 'Show what moved and when. Give the engineer a relevant change to check against their monitoring data. [Confirm telemetry sources, comparisons, and alert thresholds.]'],
    ['Send evidence the engineer can act on', 'The useful alert gives on-call a place to look and enough context to verify the lead. [Confirm where alerts go and what they include.]'],
  ],
  next: 'Start with a release your team already investigated',
  nextCopy: 'Pick a rollout where the alert was clear but identifying the relevant change took time.',
  faq: [
    ['Which monitoring tools does Myco connect to?', 'Grafana is one of the integrations we’re offering in private beta. Tell us what your team uses today, and we’ll confirm what we can connect to during onboarding.'],
    ['How does Myco link an alert to a rollout?', 'We approach this by comparing when the issue appeared with what changed in recent deployments. If you ship several times a day, checks tied to each rollout can help narrow down which release to investigate first.'],
    ['Does Myco identify the root cause?', 'It depends on the evidence. If a checkout flow breaks after a release and the logs point to a specific error, Myco is designed to help narrow the investigation. A broad signal like a CPU spike may still need an engineer to trace the cause.'],
  ],
}

export function ReleaseStory({isMonitoring}: {isMonitoring: boolean}) {
  const story = isMonitoring ? monitoring : staging
  const illustrations = isMonitoring
    ? (['releaseIntent', 'rollout', 'alert'] as const)
    : (['scenario', 'stagingData', 'rerun'] as const)
  return <>
    <DitherFlow className="feature-hero-flow">
      <section className="feature-layout-intro pr-story-hero">
        <h1><span>{story.title}</span> <br className="feature-layout-break"/><em>{story.emphasis}</em></h1>
        <span className="feature-beta">Beta</span>
        <p>{story.intro}</p>
      </section>
    </DitherFlow>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>{story.problem}</h2>
      {story.problemCopy.map(copy => <p key={copy}>{copy}</p>)}
    </section>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>{story.example}</h2>
      {story.exampleCopy.map(copy => <p key={copy}>{copy}</p>)}
      <div className="feature-layout-visual">
        {isMonitoring ? <ProductionDemo/> : <>
          <h3>Staging walkthrough</h3>
          <PreProdDemo/>
        </>}
      </div>
    </section>
    <section className="pr-story-section">
      <h2>{story.workflow}</h2>
      <div className="pr-story-review-rows">
        {story.steps.map(([title, copy], index) => {
          const [description, note] = copy.split(' [')
          return <div className="pr-story-review-row" key={title}>
            <FeatureIllustration kind={illustrations[index]}/>
            <div>
              <h3>{title}</h3>
              <ul role="list">
                {description.split(/(?<=\.) /).map(point => <li key={point}>{point}</li>)}
              </ul>
              {note && <p className="pr-story-draft-note">[{note}</p>}
            </div>
          </div>
        })}
      </div>
    </section>
    <section className="pr-story-section pr-story-closing">
      <h2>{story.next}</h2>
      <p>{story.nextCopy}</p>
      <BetaRequest feature={isMonitoring ? "Production Monitoring" : "Pre-Prod Validation"}/>
    </section>
    <section className="pr-story-section pr-story-faq" aria-labelledby="release-faq-title">
      <h2 id="release-faq-title">Frequently asked questions</h2>
      {story.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
  </>
}

'use client'

import Link from "next/link"
import {Arrow} from './feature-bento'
import {features,href} from './feature-data'
import {useReducedMotion} from 'motion/react'
import {PilotLink,SiteHeader,SiteFooter} from './home-sections'
import {TestingDemo} from './quality-demos'
import {FeatureIllustration, ReviewIllustration} from './review-illustration'
import {ReleaseStory} from './release-stories'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'
import {PRReviewContext} from './pr-review-context'

function ReviewSample() {
  const reduced=useReducedMotion()
  return <div className="feature-sample sample-pr">
    <img src={'/animations/prd-github-myco-finding.'+(reduced?'png':'gif')} width={1200} height={660} alt="Example Myco review. Jira ticket CHECKOUT-17 says the receipt total must match the amount charged. Line 40 returns the $100 subtotal even though the customer paid $85."/>
  </div>
}

function PRReviewStory() {
  return <>
    <DitherFlow className="feature-hero-flow">
    <section className="feature-layout-intro pr-story-hero">
      <h1><span>Catch what your PR gets wrong</span> <br className="feature-layout-break"/><em>before you merge</em></h1>
      <p>Myco checks GitHub pull requests against the behavior your team agreed to ship. When a change misses a requirement or could break an existing workflow, Myco shows you the line to look at and why it matters.</p>
      <PilotLink/>
    </section>
    </DitherFlow>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>CI is green. Would you ship this?</h2>
      <p>You open a checkout PR between meetings. The discount is applied, the payment goes through, and the tests pass. The diff looks fine until you check the receipt. It still shows the full price.</p>
      <p>Finding that bug means remembering a decision from the checkout spec while reading a line that looks reasonable on its own. A regression can take even longer to spot when the affected code lives in another repo. Myco brings the relevant requirement and code into the review so you can spend your time deciding what to fix.</p>
    </section>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>The customer paid $85. The receipt showed $100</h2>
      <p>The checkout requirement in <code>CHECKOUT-17</code> is simple: the receipt must show what the customer was charged. Start with a $100 order and apply a $15 discount. The charge and the receipt should both be $85.</p>
      <p>In the PR, checkout charges $85. But line 40 of <code>src/checkout/receipt.ts</code> returns the original subtotal when it builds the receipt.</p>
      <p>Myco flags that line in GitHub and cites <code>CHECKOUT-17</code>. The reviewer can see what was expected, what the code returns, and why the difference matters. The author can use the amount already calculated for the charge, update the receipt, and push the fix in the same PR.</p>
      <div className="feature-layout-visual"><ReviewSample/></div>
    </section>
    <section className="pr-story-section">
      <h2>Review the change in the context it ships into</h2>
      <PRReviewContext/>
      <div className="pr-story-review-rows">
        <div className="pr-story-review-row">
          <ReviewIllustration kind="requirements"/>
          <div>
            <h3>Check what your team agreed to build</h3>
            <ul role="list">
              <li>Share the Jira issue, Google Doc, or Confluence page that describes the change.</li>
              <li>Myco uses the requirements it can access to check whether the PR implements the behavior your team agreed to ship.</li>
            </ul>
          </div>
        </div>
        <div className="pr-story-review-row">
          <ReviewIllustration kind="dependencies"/>
          <div>
            <h3>Follow the change to the code that relies on it</h3>
            <ul role="list">
              <li>Give Myco read access to the repositories involved in the change.</li>
              <li>If a backend PR renames a response field, Myco can point reviewers to the frontend code that still expects the old name.</li>
            </ul>
          </div>
        </div>
        <div className="pr-story-review-row">
          <img className="pr-story-review-icon" src="/security/security-readonly.svg" width={144} height={144} alt=""/>
          <div>
            <h3>Give the author a finding they can verify</h3>
            <ul role="list">
              <li>The GitHub comment shows the file, line, and evidence, so engineers can see what could break, push a fix, and decide what to merge.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section className="pr-story-section pr-story-closing">
      <h2>Try it on a PR your team already reviewed</h2>
      <p>Pick a change with a clear requirement or a dependency you had to double-check. Run Myco on it and see whether the findings point to something your team can verify directly in GitHub.</p>
      <PilotLink/>
    </section>
    <section className="pr-story-section pr-story-faq" aria-labelledby="pr-story-faq-title">
      <h2 id="pr-story-faq-title">Frequently asked questions</h2>
      <details>
        <summary>Does Myco need a linked Jira issue for every PR?</summary>
        <p>No. For a small fix, you can run a review without linking anything. If the change has acceptance criteria or a specific behavior to match, share the Jira issue, PRD, or relevant notes so Myco can check the implementation against what your team agreed to build.</p>
      </details>
      <details>
        <summary>When does Myco review a PR?</summary>
        <p>By default, Myco runs through GitHub Actions when a PR is opened, reopened, or updated with a new commit. If your team prefers to review only when a PR is ready, you can configure a label to trigger it.</p>
      </details>
      <details>
        <summary>What GitHub access does Myco need?</summary>
        <p>Myco needs read access to the repositories you authorise and permission to post findings on pull requests. It does not need permission to edit source code. Optional integrations such as jira, slack etc require their own permissions.</p>
      </details>
      <details>
        <summary>Can we turn a finding into a Jira issue?</summary>
        <p>Yes. Once you connect Jira and choose the target project, Myco can automatically create Jira issues for findings it flags as merge blockers. Suggestions stay in the GitHub review.</p>
      </details>
      <details>
        <summary>How is Myco different from the Claude or GPT agent we already use for code review?</summary>
        <p>You can set up a general-purpose agent to do these checks. Myco brings them into the same GitHub review: it checks whether the PR matches the requirements you share, follows the change through the code that depends on it, and flags what could break across the repositories you’ve connected. If a backend PR renames a response field, for example, Myco can point your reviewer to the frontend code that still expects the old name.</p>
      </details>
    </section>
  </>
}

function TestingStory() {
  return <>
    <DitherFlow className="feature-hero-flow">
      <section className="feature-layout-intro pr-story-hero">
        <h1><span>Find the tests your PR is missing</span><br className="feature-layout-break"/> <em>before you merge</em></h1>
        <p>Myco checks your existing tests against what the change is supposed to do. It flags missing scenarios in GitHub and gives you a test plan with the cases to add and the results to assert.</p>
        <PilotLink/>
      </section>
    </DitherFlow>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>CI is green. Did it test the part you changed?</h2>
      <p>You open a checkout PR that adds a default discount. The existing tests pass. Before you approve it, you still need to answer a question the green check can’t answer for you: does the suite cover what happens when a customer explicitly enters a $0 discount?</p>
      <p>Finding out means reading the requirements, opening the test files, and checking which inputs and outcomes the tests actually cover. Myco does that comparison in the PR so the author can see what still needs a test.</p>
    </section>
    <section className="pr-story-section pr-story-wide-copy">
      <h2>A blank discount and a $0 discount should behave differently</h2>
      <p>The checkout requirement says to apply the default discount when no discount is provided. If a customer explicitly enters $0, the order should stay at full price.</p>
      <p>The PR already has a test for a missing discount. That test can pass even if the code treats an explicit zero as missing and applies the default anyway.</p>
      <p>Myco flags the missing case in GitHub and links to the test plan. The proposed test gives the author a concrete assertion: on a $100 order with an explicit $0 discount, the total should still be $100. The author adds that case to the existing suite and pushes it with the PR.</p>
      <div className="feature-layout-visual"><TestingDemo/></div>
    </section>
    <section className="pr-story-section">
      <h2>Turn a coverage gap into a test someone can write</h2>
      <div className="pr-story-review-rows">
        <div className="pr-story-review-row">
          <FeatureIllustration kind="coverage"/>
          <div>
            <h3>Check the behavior behind the change.</h3>
            <ul role="list">
              <li>Myco uses the requirements you share from Jira, Google Docs, or Confluence to check which scenarios your existing tests cover.</li>
              <li>A single test can cover several scenarios.</li>
            </ul>
          </div>
        </div>
        <div className="pr-story-review-row">
          <FeatureIllustration kind="testPlan"/>
          <div>
            <h3>Show what’s missing where the team is already reviewing.</h3>
            <ul role="list">
              <li>Myco lists missing scenarios in an inline GitHub comment and links to the full test plan.</li>
              <li>The spreadsheet groups test cases by scenario and shows the expected result and coverage status for each case.</li>
            </ul>
          </div>
        </div>
        <div className="pr-story-review-row">
          <FeatureIllustration kind="testCase"/>
          <div>
            <h3>Give the author enough detail to add the test.</h3>
            <ul role="list">
              <li>Each proposed case describes the scenario and the outcome the test should assert.</li>
              <li>Engineers use the plan to write the tests in their own suite.</li>
            </ul>
          </div>
        </div>
        <div className="pr-story-review-row">
          <FeatureIllustration kind="testFailure"/>
          <div>
            <h3>Test failure analysis <span className="feature-beta">Beta</span></h3>
            <ul role="list">
              <li>We’re building this to help engineers investigate a failed test and see what to fix.</li>
              <li>We’re working with GitHub Actions and Jenkins so teams can use the CI setup they already have.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section className="pr-story-section pr-story-closing">
      <h2>Try it on a PR your team is about to merge</h2>
      <p>Pick a change with a clear requirement and a passing test suite. See whether Myco surfaces a scenario your team would want covered before shipping.</p>
      <PilotLink/>
    </section>
    <section className="pr-story-section pr-story-faq" aria-labelledby="testing-faq-title">
      <h2 id="testing-faq-title">Frequently asked questions</h2>
      <details>
        <summary>Does Myco write the tests for me?</summary>
        <p>Myco generates a test plan that shows what your existing tests cover, which scenarios are missing, and what each new test should assert. Your engineers use it to write tests in their existing suite. If you’d like Myco to help implement those tests, we can discuss that as part of a paid engagement.</p>
      </details>
      <details>
        <summary>What does the coverage check look at?</summary>
        <p>Myco compares what your existing tests actually check with the behaviors the PR is meant to deliver. If you share a PRD, Myco uses it to build the test plan. One test can cover several scenarios. Myco marks those as covered and calls out the gaps in the PR.</p>
      </details>
      <details>
        <summary>Where do I find the test plan?</summary>
        <p>Open Myco’s inline comment on the GitHub pull request. It links to a spreadsheet where you can see the proposed test cases, the expected results, and which scenarios still need coverage.</p>
      </details>
      <details>
        <summary>When does coverage analysis run?</summary>
        <p>By default, it runs in GitHub Actions when a PR is opened, reopened, or updated with a new commit. That includes commits that add or change tests. You can also configure it to run when you add a label.</p>
      </details>
    </section>
  </>
}

function FeatureDetail({index}: {index:number}) {
  const feature=features[index]
  const next=features[(index+1)%features.length]
  return <main className={'feature-main feature-layout feature-layout-'+feature.slug}>
    <nav className="feature-layout-nav" aria-label="Features">
      {features.map(({slug,label},i)=><Link key={slug}
        href={href(slug)}
        aria-current={i===index?'page':undefined}>
          <span className="feature-nav-pill">{label}</span></Link>)}
    </nav>
    {feature.slug==='pr-review' ? <PRReviewStory/> :
      feature.slug==='testing' ? <TestingStory/> :
      <ReleaseStory isMonitoring={feature.slug==='production-monitoring'}/>}
    <div className="feature-layout-actions">
      <Link className="eyebrow feature-layout-next" href={href(next.slug)}>
        {next.label} <Arrow/>
      </Link>
    </div>
  </main>
}

export default function FeaturesPage({slug}: {slug:string}) {
  const reduced=useReducedMotion()
  const index=features.findIndex(feature=>feature.slug===slug)
  return <>
    {!reduced && <SmoothCursor/>}
    <SiteHeader featuresPage/>
    <FeatureDetail index={index}/>
    <SiteFooter featuresPage/>
  </>
}

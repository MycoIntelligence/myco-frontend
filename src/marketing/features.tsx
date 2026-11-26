'use client'

import Link from "next/link"
import {Arrow} from './feature-bento'
import {features,href} from './feature-data'
import {useReducedMotion} from 'motion/react'
import {SiteHeader,SiteFooter} from './home-sections'
import {TestingDemo} from './quality-demos'
import {FeatureIllustration, ReviewIllustration} from './review-illustration'
import {ReleaseStory} from './release-stories'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'
import {TrialRequestButton} from './trial-request'
import {PRReviewContext} from './pr-review-context'

function ReviewSample() {
  const reduced=useReducedMotion()
  return <div className="feature-sample sample-pr">
    <img src={'/animations/prd-github-myco-finding.'+(reduced?'png':'gif')} width={1200} height={660} alt="Example Myco review. Jira ticket CHECKOUT-17 says the receipt total must match the amount charged. Line 40 returns the $100 subtotal even though the customer paid $85."/>
  </div>
}

function PRReviewStory() {
  return <>
    <DitherFlow>
    <section className="feature-layout-intro pr-story-hero">
      <h1><span>Catch what your PR gets wrong</span> <br className="feature-layout-break"/><em>before you merge</em></h1>
      <p>Myco checks GitHub pull requests against the behavior your team agreed to ship. When a change misses a requirement or could break an existing workflow, Myco shows you the line to look at and why it matters.</p>
      <TrialRequestButton className="pilot"/>
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
              <li>PR descriptions rarely repeat every acceptance criterion.</li>
              <li>Myco checks the changed code against the requirements available to the review.</li>
            </ul>
            <p className="pr-story-draft-note">[Confirm which requirement sources are supported today and how teams make them available to the review.]</p>
          </div>
        </div>
        <div className="pr-story-review-row">
          <ReviewIllustration kind="dependencies"/>
          <div>
            <h3>Follow the change to the code that relies on it</h3>
            <ul role="list">
              <li>An API can pass its own tests after renaming a field while a service in another repo still expects the old name.</li>
              <li>Myco traces dependencies across authorized repositories and points reviewers to the affected caller.</li>
            </ul>
            <p className="pr-story-draft-note">[Confirm which kinds of cross-repo dependencies Myco can trace today and how teams grant access.]</p>
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
      <TrialRequestButton className="pilot"/>
    </section>
    <section className="pr-story-section pr-story-faq" aria-labelledby="pr-story-faq-title">
      <h2 id="pr-story-faq-title">Frequently asked questions</h2>
      <details>
        <summary>Does Myco need a linked Jira issue for every PR?</summary>
        <p>[Confirm what context Myco uses when a PR has no linked requirement and what it does when the available requirements are unclear.]</p>
      </details>
      <details>
        <summary>When does Myco review a PR?</summary>
        <p>[Confirm what triggers the first review, how draft PRs are handled, and whether pushing a fix triggers another review.]</p>
      </details>
      <details>
        <summary>What GitHub access does Myco need?</summary>
        <p>[Confirm the permissions needed to read code, inspect authorized repositories, and post inline findings.]</p>
      </details>
      <details>
        <summary>Can we turn a finding into a Jira issue?</summary>
        <p>[Confirm availability, what triggers issue creation, and what gets copied into the issue.]</p>
      </details>
    </section>
  </>
}

function TestingStory() {
  return <>
    <DitherFlow>
      <section className="feature-layout-intro pr-story-hero">
        <h1><span>Find the tests your PR is missing</span><br className="feature-layout-break"/> <em>before you merge</em></h1>
        <p>Myco checks your existing tests against what the change is supposed to do. It flags missing scenarios in GitHub and gives you a test plan with the cases to add and the results to assert.</p>
        <TrialRequestButton className="pilot"/>
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
              <li>Myco looks at the requirements available to the review and compares them with what the existing tests check.</li>
            </ul>
            <p className="pr-story-draft-note">[Confirm which requirement sources and test frameworks are supported today.]</p>
          </div>
        </div>
        <div className="pr-story-review-row">
          <FeatureIllustration kind="testPlan"/>
          <div>
            <h3>Show what’s missing where the team is already reviewing.</h3>
            <ul role="list">
              <li>The GitHub comment lists the missing scenarios and links to an Excel test plan with numbered cases grouped by scenario, expected results, and coverage status.</li>
            </ul>
            <p className="pr-story-draft-note">[Confirm the Excel format and fields available in the current build.]</p>
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
      </div>
      <h3>Test failure analysis <span className="feature-beta">Beta</span></h3>
      <p>When an existing test fails, Myco investigates why it failed and recommends a fix that addresses the cause. [Confirm which test runners and CI outputs are supported, and how teams get beta access.]</p>
    </section>
    <section className="pr-story-section pr-story-closing">
      <h2>Try it on a PR your team is about to merge</h2>
      <p>Pick a change with a clear requirement and a passing test suite. See whether Myco surfaces a scenario your team would want covered before shipping.</p>
      <TrialRequestButton className="pilot"/>
    </section>
    <section className="pr-story-section pr-story-faq" aria-labelledby="testing-faq-title">
      <h2 id="testing-faq-title">Frequently asked questions</h2>
      <details>
        <summary>Does Myco write the tests for me?</summary>
        <p>Myco identifies missing scenarios and proposes test cases with expected results. Your engineers add the tests to the codebase.</p>
      </details>
      <details>
        <summary>What does the coverage check look at?</summary>
        <p>Myco checks whether your existing tests exercise the behavior called for by the change. [Confirm supported test types and whether line coverage is also reported.]</p>
      </details>
      <details>
        <summary>Where do I find the test plan?</summary>
        <p>Open the link in Myco’s GitHub PR comment. [Confirm who can open the plan and whether it updates when new tests are pushed.]</p>
      </details>
      <details>
        <summary>When does coverage analysis run?</summary>
        <p>[Confirm what triggers an analysis and whether it reruns after the author pushes new tests.]</p>
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

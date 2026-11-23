'use client'

import Link from "next/link"
import {useReducedMotion} from 'motion/react'
import {SiteHeader, SiteFooter} from './home-sections'
import {SmoothCursor} from './smooth-cursor'

function Comparison() {
  return <main className="blog-main comparison-main">
    <article className="blog-article">
      <header className="blog-heading">
        <span className="blog-kicker">Tool comparison</span>
        <h1>Myco vs CodeRabbit</h1>
        <p>CodeRabbit and Myco both review pull requests in GitHub. Myco checks whether the change meets your product requirements, follows what could break across repositories, and shows the exact line behind each finding.</p>
        <div className="blog-hero-actions">
          <Link href="/#pilot">Request your 14-day free trial <span aria-hidden="true">&#8599;</span></Link>
        </div>
      </header>
      <div className="blog-reading-layout">
      <nav className="blog-contents" aria-label="On this page">
        <span>On this page</span>
        <a href="#finding-accuracy">Finding accuracy</a>
        <a href="#review-workflows">Review workflows</a>
        <a href="#review-gaps">Where reviews miss things</a>
        <a href="#compare-on-your-code">How to evaluate</a>
        <a href="#which-reviewer">Which fits your team?</a>
      </nav>
      <div className="blog-body">

      <section id="finding-accuracy">
        <h2>How many findings hold up?</h2>
        <p>Every finding asks an engineer to stop and check it. A useful bug report names the behavior that would change, points to the line responsible, and gives the author enough evidence to verify it before merging.</p>
        <p>Engineers who switched from CodeRabbit to Myco tell us they value the accuracy of the bugs Myco flags. To see what that means on your code, compare which findings your team confirms, which it dismisses, and how long it takes to decide.</p>
      </section>

      <section id="review-workflows">
        <h2>How Myco and CodeRabbit review a pull request</h2>
        <p>CodeRabbit offers automated code review with PR summaries, inline findings, and suggested fixes. It can also assess linked Jira acceptance criteria and inspect related repositories when those sources are configured. <a href="https://docs.coderabbit.ai/guides/code-review-overview">CodeRabbit review documentation &#8599;</a></p>
        <p>There’s overlap with CodeRabbit on PR review. We’re building Myco as a QA layer for the feature you’re shipping. Myco checks the PR against the requirements available to the review, whether they’re captured in a ticket, PRD, meeting notes, or a Slack message. It also traces what could break across authorized repositories. When it flags a bug, it shows you the exact line and why it matters.</p>
        <p>We’re building toward using that same context to automate tests and help engineers catch and explain failures in staging and production.</p>
        <div className="blog-table" role="region" aria-label="Side-by-side comparison" tabIndex={0}>
          <table className="blog-comparison">
            <caption>GitHub PR review, side by side</caption>
            <thead><tr><th scope="col">What to compare</th><th scope="col">Myco</th><th scope="col">CodeRabbit</th></tr></thead>
            <tbody>
              <tr>
                <th scope="row">Requirements</th>
                <td>Checks the implementation against the product requirements available to the review and flags where behavior diverges.</td>
                <td>Assesses changes against acceptance criteria from linked Jira issues.</td>
              </tr>
              <tr>
                <th scope="row">Downstream changes</th>
                <td>Traces a change into authorized repositories to identify which consumers could break.</td>
                <td>Uses linked repositories to identify issues such as API mismatches and breaking changes.</td>
              </tr>
              <tr>
                <th scope="row">GitHub feedback</th>
                <td>Flags requirement mismatches, implementation bugs, regressions, and potential security issues with the relevant line and supporting evidence.</td>
                <td>Provides PR summaries, inline comments, and suggested fixes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="review-gaps">
        <h2>Where automated reviews can miss things</h2>
        <div className="blog-review-gaps">
          <div>
            <h3>The requirement lives outside the pull request</h3>
            <p>CodeRabbit can check acceptance criteria when the linked Jira issue is available to the review. A change can look valid on its own when that context is missing. Myco checks the implementation against the requirements your team captured and explains where the behavior diverges.</p>
          </div>
          <div>
            <h3>The impact is in another repository</h3>
            <p>CodeRabbit can examine linked repositories, and the context it sees depends on that setup. Myco follows the change into authorized repositories and points to the affected consumer when it finds a regression. That gives the author a concrete place to check before merging.</p>
          </div>
          <div>
            <h3>A comment takes longer to verify than to read</h3>
            <p>A plausible warning can send an engineer looking for a bug that isn’t there. Myco focuses its findings on the line responsible, the behavior that would change, and the evidence the author can use to check it.</p>
          </div>
        </div>
      </section>

      <section id="compare-on-your-code">
        <h2>Run both reviews on a PR your team knows</h2>
        <p>Choose a change with an explicit acceptance criterion or a dependency in another repository. A PR with a known issue gives you something concrete to check. A routine PR helps you see how much attention the review asks for on an ordinary day.</p>
        <ol>
          <li><strong>Match the inputs.</strong> Use the same commit and provide the same requirements and relevant repository context wherever possible. Record any difference in what each reviewer could see.</li>
          <li><strong>Verify the finding with a maintainer.</strong> For each issue, check the cited code and reproduce the behavior where practical. Record confirmed bugs, incorrect claims, and feedback your team considers out of scope. Count duplicate reports of the same bug once, then mark which findings would change what you merge.</li>
          <li><strong>Measure the follow-up.</strong> Include time spent confirming good findings, investigating unclear ones, and dismissing incorrect ones. Track findings either reviewer missed when your team already knows the issue exists.</li>
        </ol>
      </section>

      <section id="which-reviewer">
        <h2>Which reviewer fits your team?</h2>
        <p>If your priorities are PR summaries, inline comments, and suggested fixes in GitHub, evaluate CodeRabbit on the review workflow your team uses every day. If engineers still need to dig through product requirements or ask another team what a change might break, try Myco on a PR that required that work. The comparison is most useful when you can name a finding that changed what you shipped or made the issue easier to verify.</p>
      </section>

      </div>
      </div>
    </article>
  </main>
}

export default function Blog() {
  const reduceMotion = useReducedMotion()
  return <>
    {!reduceMotion && <SmoothCursor />}
    <SiteHeader blogPage />
    <Comparison />
    <SiteFooter blogPage />
  </>
}

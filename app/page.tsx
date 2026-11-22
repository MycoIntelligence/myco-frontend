import Link from "next/link";
import { Nav } from "@/src/components/Nav";
import { CtaFooter } from "@/src/components/CtaFooter";

import { TechnologyCatalog } from "@/src/components/TechnologyCatalog";
import { ScrollExperience } from "@/src/components/ScrollExperience";
import { CinematicStory } from "@/src/components/CinematicStory";
import { ConnectedWorkflow } from "@/src/components/ConnectedWorkflow";
import { Playground } from "@/src/components/Playground";

const questions = [
  ["What can we evaluate today?", "Contextual pull request review in GitHub is the live foundation. Connected sources, repository scope and supported review actions are confirmed for your configuration."],
  ["Does Myco replace our engineers or QA team?", "Engineers own fixes, sign-off and release decisions. Myco provides evidence and explanations to support those decisions alongside your existing review and testing process."],
  ["Can it follow dependencies across repositories?", "Myco can follow dependencies within a repository and across authorized repositories where the connection is configured. Missing context should be visible in a finding."],
  ["Can it run tests or fix code?", "Coverage analysis, test suggestions, execution and failure investigation are directions for the PR workflow. Availability and permissions must be confirmed for each evaluation, including proposed fixes and merge-related actions."],
];

export default function HomePage() {
  return <><Nav /><ScrollExperience /><main id="main" className="md-site">
    <section className="md-hero" id="overview" data-theme="light">
      <div className="md-sculptural-scene" aria-hidden="true" /><div className="md-wrap">
        <div className="md-kicker"><span className="md-dot" /> CONTEXTUAL PULL REQUEST REVIEW</div>
        <div className="md-hero-grid">
          <div>
            <h1>From code change<br />to <span>confident next step.</span></h1>
            <p className="md-lead">Get features ready to ship while you’re still working on them.</p>
            <p className="md-hero-copy">Myco reviews GitHub pull requests against available requirements and surrounding code, explaining what could break and why.</p>
            <div className="md-actions"><Link className="md-button md-light" href="/book-demo">Request a pilot <span aria-hidden="true">→</span></Link><a className="md-text-link" href="#workflow">See how it works <span aria-hidden="true">↓</span></a></div>
            <div className="md-hero-note">Built around GitHub. Guided by your engineers.</div>
          </div>
          <div className="md-hero-playground-wrap">
            <Playground />
          </div>
        </div>
        <div className="md-hero-bottom"><span>01 / UNDERSTAND THE CHANGE</span><span>Intent. Context. Evidence.</span></div>
      </div>
    </section>
    <CinematicStory />
    <TechnologyCatalog />
    <section className="md-section md-wrap md-audience"><div className="md-section-head"><div><div className="md-kicker">BUILT AROUND YOUR TEAM</div><h2>Less context to rebuild.<br />More clarity to work with.</h2></div><p>One review can support different decisions. Keep the evidence accessible to the people doing the work.</p></div><div className="md-audience-grid">{[
      ["ENGINEERS", "Catch the question while the code is fresh.", "Understand the behaviour at risk and the relevant code. Investigate a finding before another handoff takes you away from the change.", "Change → evidence → next step"],
      ["QA LEADS", "Start with the behaviour that matters.", "Use review findings to inform the questions your team investigates. Confirm testing capabilities separately for your evaluation.", "Intended behaviour → review questions"],
      ["ENGINEERING LEADERS", "Evaluate progress with evidence.", "Compare review cycles and investigation effort on one workflow. Measure delivery time alongside release quality.", "One workflow → measured learning"],
    ].map(([label,title,body,caption])=><article key={label}><div className="md-kicker">{label}</div><h3>{title}</h3><p>{body}</p><div className="md-audience-caption">{caption}</div></article>)}</div></section>
    <ConnectedWorkflow />
    <section className="md-trust" data-theme="dark"><div className="md-wrap md-trust-grid"><div><div className="md-kicker">CLEAR BOUNDARIES</div><h2>Your context.<br />Your engineering decisions.</h2></div><div><p>Reading code and taking action are different permissions. Agree what Myco can access and do before connecting a workflow.</p><ul><li>Authorize the relevant sources and repositories.</li><li>Confirm permissions for comments, checks and other actions.</li><li>Review data handling and deployment terms for your environment.</li></ul><Link href="/privacy" className="md-text-link">Review evaluation considerations <span aria-hidden="true">→</span></Link></div></div></section>
    <section className="md-section md-wrap md-evaluate"><div><div className="md-kicker">A FOCUSED EVALUATION</div><h2>One workflow.<br />A useful place to start.</h2><p>Choose an important workflow your team already reviews. Agree what useful feedback looks like, compare it with your current process and expand as trust grows.</p><Link href="/book-demo" className="md-button md-dark">Discuss a pilot <span aria-hidden="true">→</span></Link></div><ol>{[["Choose the workflow", "A downstream dependency, a customer journey or a change that often returns from QA."],["Agree on useful evidence", "Relevant findings, investigation effort and review cycles. Measure quality alongside speed."],["Review what changed", "Use the results and their limitations to decide what to evaluate next."]].map(([t,b])=><li key={t}><h3>{t}</h3><p>{b}</p></li>)}</ol></section>
    <section className="md-section md-wrap md-faq"><div><div className="md-kicker">A FEW USEFUL ANSWERS</div><h2>Before you begin.</h2><Link href="/faq">All questions <span aria-hidden="true">→</span></Link></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
  </main><CtaFooter /></>;
}

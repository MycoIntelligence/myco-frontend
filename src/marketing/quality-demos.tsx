import {useReducedMotion} from 'motion/react'
import {FeatureWalkthrough} from './feature-walkthrough'
import {Terminal} from './terminal'

const preProdSteps=['Deploy candidate','Acceptance checks','Load test','Release decision']

function FindingHeading({title}:{title:string}){
  return <div className="monitor-card-heading">
    <img src="/animations/monitor-myco-dark.png" alt="" width="22" height="22"/>
    <h3>{title}</h3>
  </div>
}

export function TestingDemo(){
  const reduced=useReducedMotion()
  return <div className="feature-sample sample-pr">
    <img
      src={'/animations/testing-coverage-plan.'+(reduced?'png':'gif')}
      width={1200}
      height={660}
      alt="Illustrative GitHub inline review flags two missing checkout tests and links to a spreadsheet test plan. The plan groups numbered cases by scenario and lists their expected results and current coverage."
    />
  </div>
}

const releaseChecks=[
  {name:'Customer acceptance', detail:'Receipt matches the discounted charge', result:'Passed', className:'quality-pass', stage:1},
  {name:'Integration check', detail:'Checkout sends the correct total to billing', result:'Passed', className:'quality-pass', stage:1},
  {name:'Checkout latency under load', detail:'420 ms p95 · 350 ms limit · 100 checkouts/min', result:'Failed', className:'quality-fail', stage:2},
]

export function PreProdDemo(){
  return <FeatureWalkthrough label="Illustrative Myco pre-production validation walkthrough" context="Checkout API / Isolated pre-production" title="Release quality report" steps={preProdSteps}>
    {step=><div className="monitor-body preprod-body">
      <section className="preprod-candidate" aria-labelledby="preprod-candidate">
        <h3 id="preprod-candidate">Release candidate</h3>
        <div className="preprod-candidate-body">
          <strong><code>v2.8.0-rc.1</code></strong>
          <p>Checkout API</p>
          <dl>
            <div><dt>Environment</dt><dd>Pre-production</dd></div>
            <div><dt>Baseline</dt><dd><code>v2.7.4</code></dd></div>
            <div><dt>Run</dt><dd><code>PP-1842</code></dd></div>
          </dl>
        </div>
      </section>

      <div className="preprod-results">
        <Terminal title="Release checks" label="Pre-production check output" status={step>=2?'2 passed · 1 failed':undefined}>
          <ul className="demo-terminal-checks">
            {releaseChecks.map(check=><li key={check.name}>
              <div><strong>{check.name}</strong><span>{step>=check.stage?check.detail:'Waiting for results'}</span></div>
              {step>=check.stage?<strong className={check.className}><span aria-hidden="true">{check.result==='Passed'?'✓':'×'}</span> {check.result}</strong>:<span className="preprod-pending">Pending</span>}
            </li>)}
          </ul>
        </Terminal>
        <section className="monitor-card quality-card preprod-finding" data-visible={step>=2} inert={step<2}>
          <div className="preprod-finding-header">
            <FindingHeading title="Myco finding"/>
            <span className="preprod-hold" data-visible={step===3}>Hold recommended</span>
          </div>
          <strong>Checkout exceeded the latency limit.</strong>
          <p>p95 rose from <code>245 ms</code> to <code>420 ms</code> under the same load. The agreed limit is <code>350 ms</code>.</p>
          <div className="monitor-evidence"><code>LOAD-018</code></div>
          <p className="preprod-handoff" data-visible={step===3}>Inspect the slow checkout traces and rerun the load check before release sign-off.</p>
        </section>
      </div>
    </div>}
  </FeatureWalkthrough>
}

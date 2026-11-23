import {FeatureWalkthrough} from './feature-walkthrough'
import {Terminal} from './terminal'

const testingSteps=['Requirement','Generate test','Run checks','Review evidence']
const preProdSteps=['Deploy candidate','Acceptance checks','Load test','Release decision']

function FindingHeading({title}:{title:string}){
  return <div className="monitor-card-heading">
    <img src="/animations/monitor-myco-dark.png" alt="" width="22" height="22"/>
    <h3>{title}</h3>
  </div>
}

export function TestingDemo(){
  return <FeatureWalkthrough label="Illustrative Myco testing walkthrough" context="Pull request #214 / Checkout API" title="Test generation and execution" steps={testingSteps}>
    {step=><div className="monitor-body quality-body">
      <div className="monitor-release">
        <span><strong>checkout/discounted-receipts</strong></span>
        <span className={step>=2?'monitor-alert':''}>{['Coverage gap found','Test proposed','1 check failed','Engineer review pending'][step]}</span>
      </div>
      <div className="monitor-metrics">
        <section className="monitor-card quality-card">
          <div className="monitor-card-heading"><h3>PRD · CHECKOUT-17</h3></div>
          <strong>Receipt total must match the amount charged.</strong>
          <p>A $100 order with a $15 discount should produce an $85 receipt.</p>
          <div className="monitor-evidence"><code>Acceptance criterion AC-03</code></div>
        </section>
        <div className="quality-terminal-stage" data-visible={step>=1} inert={step<1}>
          <Terminal title="receipt.test.ts" label="Proposed test" status="Proposed">
            <pre className="demo-terminal-code"><code><span className="terminal-function">test</span>{'('}<span className="terminal-string">&quot;returns the amount charged&quot;</span>{',\n  '}<span className="terminal-keyword">async</span>{' () => {\n    '}<span className="terminal-keyword">const</span>{' receipt = '}<span className="terminal-keyword">await</span>{' checkout({\n      subtotal: 10000, discount: 1500,\n    });\n    '}<span className="terminal-function">expect</span>{'(receipt.total).toBe(8500);\n  }\n);'}</code></pre>
          </Terminal>
        </div>
      </div>
      <div className="monitor-handoff">
        <div className="quality-terminal-stage" data-visible={step>=2} inert={step<2}>
          <Terminal title="Test run" label="Receipt test output" status="Failed" failed>
            <div className="demo-terminal-output">
              <div className="quality-fail"><span aria-hidden="true">× </span>returns the amount charged</div>
              <div><span>Expected</span> $85.00</div>
              <div><span>Received</span> <strong className="quality-fail">$100.00</strong></div>
            </div>
          </Terminal>
        </div>
        <section className="monitor-card monitor-finding quality-card" data-visible={step>=3} inert={step<3}>
          <FindingHeading title="Myco finding"/>
          <strong>The receipt uses the subtotal before discount.</strong>
          <p>Check the returned value at receipt.ts:40 before signing off.</p>
          <div className="monitor-evidence"><code>receipt.ts:40</code></div>
        </section>
      </div>
    </div>}
  </FeatureWalkthrough>
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

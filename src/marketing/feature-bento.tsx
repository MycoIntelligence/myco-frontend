import Link from "next/link"
import {LayoutDashboard} from 'lucide-react'
import {features,href} from './feature-data'
import {Terminal} from './terminal'

export function Arrow() {
  return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export function FeatureIcon({index}: {index:number}) {
  // Reuse the Myco workflow drawings, with stronger strokes for small UI sizes.
  const drawings = [
<g key="review">
    <path d="M34 46H13a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3h32a3 3 0 0 1 3 3v16M10 21h38"/>
    <path d="M16 16.5h.1m4 0h.1m4 0h.1M22 27l-5 5 5 5m11-10 5 5-3 3m-5-9-5 12"/>
    <circle cx="44" cy="42" r="8"/>
    <path d="m49.7 47.7 7 7"/>
  </g>,
<g key="testing">
    <path d="m29 8 1-3h4l1 3 3 1 3-1 3 3-1 3 1 3 3 1v4l-3 1-1 3 1 3-3 3-3-1-3 1-1 3h-4l-1-3-3-1-3 1-3-3 1-3-1-3-3-1v-4l3-1 1-3-1-3 3-3 3 1z"/>
    <circle cx="32" cy="20" r="7"/>
    <path d="m29 20 2 2 4-4"/>
    <path d="M29 43c-4-4-7-6-11-6a10 10 0 1 0 0 20c6 0 10-4 16-10 5-5 8-7 12-7a7 7 0 1 1 0 14c-4 0-7-2-11-6M35 51c4 4 7 6 11 6a10 10 0 1 0 0-20c-6 0-10 4-16 10-5 5-8 7-12 7a7 7 0 1 1 0-14c4 0 7 2 11 6"/>
  </g>,
<g key="validation">
    <rect x="9" y="10" width="33" height="24" rx="3"/>
    <path d="M9 16h33m-20 6-3 3 3 3m7-6 3 3-3 3m-2-7-3 8M18 39h14m-9-5-2 5m7-5 2 5"/>
    <path d="M38 49h-2a5 5 0 0 1-1-9.9 7 7 0 0 1 13.1-2.7A6.4 6.4 0 1 1 52 49h-3"/>
    <rect x="38" y="43" width="11" height="12" rx="1.5"/>
    <path d="M38 49h11m-7.5-3h.1m-.1 6h.1"/>
  </g>,
<g key="monitoring">
<rect x="9" y="13" width="46" height="34" rx="3"/>
<path d="M25 53h14m-7-6v6"/>
<path d="M16 21v19h32M20 35l7-2 6 1 7-11 7 5"/><circle cx="40" cy="23" r="2.5" fill="var(--bg, #090a0c)"/>
</g>
  ]
  return <span className="feature-icon"><svg width="24" height="24" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[index]}</svg></span>
}

function BentoDemo({index}: {index:number}) {
  if (index===0) return <div className="bento-demo bento-review-demo">
    <div className="bento-demo-header"><span>GitHub · PR #214</span><code>receipt.ts:40</code></div>
    <div className="bento-review-finding">
      <strong>Receipt total doesn’t match the spec</strong>
      <dl className="bento-review-values">
        <div><dt>Expected</dt><dd>$85.00</dd></div>
        <div className="bento-result"><dt>Returned</dt><dd className="bento-failure">$100.00</dd></div>
      </dl>
    </div>
  </div>

  if (index===1) return <div className="bento-demo bento-test-demo">
    <Terminal title="receipt.test.ts" label="Receipt test">
      <pre className="demo-terminal-code"><code>{'expect(receipt.total).toBe(8500)'}</code></pre>
      <div className="bento-result bento-failure">Failed · received 10000</div>
    </Terminal>
  </div>

  if (index===2) return <div className="bento-demo bento-release-demo">
    <div className="bento-demo-header">Staging · v2.8.0-rc.1</div>
    <dl className="bento-release-checks">
      <div><dt>Customer acceptance</dt><dd className="bento-success">Passed</dd></div>
      <div><dt>Billing integration</dt><dd className="bento-success">Passed</dd></div>
      <div><dt>Checkout latency</dt><dd className="bento-result bento-failure">Failed</dd></div>
    </dl>
  </div>

  return <div className="bento-demo bento-monitor-demo">
    <div className="bento-demo-header"><span>Checkout latency · p95</span><span className="bento-result bento-failure">620 ms · Alert</span></div>
    <div className="bento-chart">
      <svg viewBox="0 0 320 67" preserveAspectRatio="none" role="img" aria-label="Checkout latency rises above the 350 millisecond threshold after rollout">
        <path className="bento-chart-threshold" d="M0 35H320"/>
        <path className="bento-chart-rollout" d="M143 2V65"/>
        <path className="bento-chart-baseline" d="M0 57L28 55 51 58 76 53 100 56 124 55 143 56"/>
        <path className="bento-chart-rise" pathLength="1" d="M143 56L165 55 183 46 201 26 222 15 242 20 263 13 288 15 319 11"/>
      </svg>
      <span className="bento-chart-label">Rollout</span>
    </div>
  </div>
}

function BentoFeature({index}: {index:number}) {
  const feature=features[index]
  const titleId='bento-title-'+feature.slug

  return <Link
    className={'feature-card bento-card bento-'+feature.slug+(index===0?' feature-primary-card':'')}
    href={href(feature.slug)}
    aria-labelledby={titleId}
  >
    <div className="feature-card-top">
      <h3 id={titleId} className="feature-card-title">{feature.label}</h3>
      <span className="bento-arrow"><Arrow/></span>
    </div>
    <p>{feature.indexCopy}</p>
    <BentoDemo index={index}/>
  </Link>
}

export function FeatureBento() {
  return <section id="features" className="feature-main home-feature-bento" aria-labelledby="home-features-title">
    <div className="feature-intro">
      <div className="eyebrow home-features-eyebrow">
        <LayoutDashboard size={16} aria-hidden="true"/>
        Features
      </div>
      <h2 id="home-features-title" className="feature-intro-title">Know what to check<br/> before you ship.</h2>
      <p>GitHub PR review is live, with testing, release validation, and monitoring on the roadmap.</p>
    </div>
    <div className="feature-grid">
      {features.map((feature,index)=><BentoFeature key={feature.slug} index={index}/>)}
    </div>
  </section>
}

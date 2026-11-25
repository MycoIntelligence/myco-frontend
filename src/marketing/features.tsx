'use client'

import Link from "next/link"
import {Arrow} from './feature-bento'
import {features,href} from './feature-data'
import {useReducedMotion} from 'motion/react'
import {SiteHeader,SiteFooter} from './home-sections'
import {TestingDemo,PreProdDemo} from './quality-demos'
import {ProductionDemo} from './production-demo'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'
import {PRReviewContext} from './pr-review-context'

function Sample({index}: {index:number}) {
  const reduced=useReducedMotion()
  if(index===0) return <div className="feature-sample sample-pr">
    <img src={'/animations/prd-github-myco-finding.'+(reduced?'png':'gif')} width={1200} height={660} alt="Example Myco review. Jira ticket CHECKOUT-17 says the receipt total must match the amount charged. Line 40 returns the $100 subtotal even though the customer paid $85."/>
  </div>
  if(index===1) return <TestingDemo/>
  if(index===2) return <PreProdDemo/>
  return <ProductionDemo/>
}

function FeatureDetail({index}: {index:number}) {
  const feature=features[index]
  const next=features[(index+1)%features.length]
  const [title,emphasis]=feature.title
  const isPRReview=feature.slug==='pr-review'
  const isTesting=feature.slug==='testing'
  const checksHeading = {
    'pr-review': 'A green PR can still miss the requirement',
    testing: 'Passing tests can leave critical behavior untested',
    'pre-prod-validation': 'A change can pass review and still fail in staging',
    'production-monitoring': 'When behavior changes after a release, where do you start?',
  }[feature.slug]
  const example=<>
    <div className="feature-layout-visual"><Sample index={index}/></div>
    <p className="feature-layout-example"><strong>In practice.</strong> {feature.example}</p>
  </>
  return <main className={'feature-main feature-layout feature-layout-'+feature.slug}>
    <nav className="feature-layout-nav" aria-label="Features">
      {features.map(({slug,label},i)=><Link key={slug}
        href={href(slug)}
        aria-current={i===index?'page':undefined}>
          <span className="feature-nav-pill">{label}</span></Link>)}
    </nav>
    <section className="feature-layout-intro" aria-labelledby="feature-title">
      <h1 id="feature-title">
        <span>{title}</span><br className="feature-layout-break"/> <em>{emphasis}</em>
      </h1>
      <h2 id="feature-explanation">{feature.explanation}</h2>
    </section>
    {isPRReview ? <PRReviewContext/> : isTesting ? null : example}
    {isTesting && (
      <section className="feature-layout-requirement-check" aria-labelledby="testing-example-title">
        <div className="feature-layout-checkout-copy">
          <h2 id="testing-example-title">What should happen when a customer enters a $0 discount?</h2>
          <p>An explicit $0 discount should leave the order at full price. Myco flags this missing test case and includes the expected result in the test plan linked from the GitHub pull request.</p>
        </div>
        <div className="feature-layout-visual"><Sample index={index}/></div>
      </section>
    )}
    <section className="feature-layout-explanation" aria-labelledby="feature-checks">
      <h2 id="feature-checks">{checksHeading}</h2>
      <p className="feature-layout-summary">{feature.summary}</p>
      <dl>
        {feature.sections.map(([label,copy,beta])=><div key={label}>
          <dt>{label}{beta && <span className="feature-beta">Beta</span>}</dt>
          <dd>
            <ul role="list">{copy.split(/(?<=\.) /).map(point => <li key={point}>{point}</li>)}</ul>
          </dd>
        </div>)}
      </dl>
    </section>
    {isPRReview && (
      <section className="feature-layout-requirement-check" aria-labelledby="checkout-example-title">
        <div className="feature-layout-checkout-copy">
          <h2 id="checkout-example-title">Example: Catch a receipt total that breaks the checkout requirement</h2>
          <p>The customer paid $85 after a $15 discount, but the receipt showed $100. Myco flags line 40 in <code>receipt.ts</code> and links it to the Jira requirement that the receipt must show the amount charged.</p>
        </div>
        <div className="feature-layout-visual"><Sample index={index}/></div>
      </section>
    )}
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
    <DitherFlow><FeatureDetail index={index}/></DitherFlow>
    <SiteFooter featuresPage/>
  </>
}

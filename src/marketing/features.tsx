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
    {isPRReview ? <PRReviewContext/> : example}
    <section className="feature-layout-explanation" aria-labelledby="feature-explanation">
      <p className="feature-layout-summary">{feature.summary}</p>
      <dl>
        {feature.sections.map(([label,copy,beta])=><div key={label}>
          <dt>{label}{beta && <span className="feature-beta">Beta</span>}</dt>
          <dd>{copy}</dd>
        </div>)}
      </dl>
    </section>
    {isPRReview && <div className="feature-layout-requirement-check">{example}</div>}
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

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

function Sample({index}: {index:number}) {
  const reduced=useReducedMotion()
  if(index===0) return <div className="feature-sample sample-pr">
    <img src={'/animations/prd-github-myco-finding.'+(reduced?'png':'gif')} width={1200} height={660} alt="Example Myco review. The PRD says the receipt must show $85 after a discount. The PR changes line 40 to return the $100 subtotal."/>
  </div>
  if(index===1) return <TestingDemo/>
  if(index===2) return <PreProdDemo/>
  return <ProductionDemo/>
}

function FeatureDetail({index}: {index:number}) {
  const feature=features[index]
  const next=features[(index+1)%features.length]
  const [title,emphasis]=feature.title
  return <main className={'feature-main feature-layout feature-layout-'+feature.slug}>
    <nav className="feature-layout-nav" aria-label="Features">
      {features.map(({slug,label},i)=><Link key={slug}
        href={href(slug)}
        aria-current={i===index?'page':undefined}>{label}</Link>)}
    </nav>
    <section className="feature-layout-intro" aria-labelledby="feature-title">
      <div className="eyebrow feature-detail-label">{feature.label}</div>
      <h1 id="feature-title">
        <span>{title}</span><br className="feature-layout-break"/> <em>{emphasis}</em>
      </h1>
      <p>{feature.summary}</p>
    </section>
    <div className="feature-layout-visual"><Sample index={index}/></div>
    <p className="feature-layout-example"><strong>In practice.</strong> {feature.example}</p>
    <section className="feature-layout-explanation" aria-labelledby="feature-explanation">
      <h2 id="feature-explanation">{feature.explanation}</h2>
      <dl>{feature.sections.map(([label,copy])=><div key={label}><dt>{label}</dt><dd>{copy}</dd></div>)}</dl>
      <div className="feature-layout-actions">
        <Link className="eyebrow feature-layout-next" href={href(next.slug)}>
          {next.label} <Arrow/>
        </Link>
      </div>
    </section>
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

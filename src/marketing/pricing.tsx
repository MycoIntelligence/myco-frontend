'use client'

import {useState} from 'react'
import {SiteHeader,SiteFooter} from './home-sections'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'
import {useReducedMotion} from 'motion/react'

const trial = '14-day trial'
const monthly = 20
const yearlyMonthly = 16
const faqs = [
  ['How does the 14-day trial work?', 'Request access by email. Once approved, connect GitHub for 14 days of free code review.'],
  ['What is the difference between monthly and annual billing?', 'Team is $20 per developer per month when billed monthly, or $192 per developer when billed annually. That works out to $16 per month.'],
  ['What is included in Enterprise?', 'Enterprise pricing and configuration depend on your organization’s needs. Talk to us about your workflow, configuration, and support requirements.'],
  ['Which capabilities are available?', 'Contextual GitHub pull request review is available today. Ask us about supported integrations, permissions, and access to other capabilities during your evaluation.'],
]

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h9m-4-4 4 4-4 4"/></svg>
}

function PlanFeatures({features}: {features:string[]}) {
  return <ul className="plan-features">{features.map(feature=><li key={feature}>
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.2 2.7 2.7 6.1-6.2"/></svg>
    <span>{feature}</span>
  </li>)}</ul>
}

export default function PricingPage() {
  const [annual,setAnnual]=useState(false)
  const reduceMotion=useReducedMotion()
  return <>
    {!reduceMotion && <SmoothCursor />}
    <SiteHeader pricing />
    <DitherFlow className="pricing-dither-flow">
      <main className="pricing-main">
        <section className="pricing-intro" aria-labelledby="pricing-heading">
          <p className="pricing-label">Pricing</p>
          <h1 id="pricing-heading">Simple pricing for engineering teams.</h1>
          <p>Start with contextual PR review. Get in touch if your team needs a broader setup.</p>
        </section>
        <section className="pricing-plans" aria-label="Myco plans">
          <fieldset className="billing-period">
            <legend className="sr">Billing period</legend>
            <label><input type="radio" name="billing" checked={!annual} onChange={()=>setAnnual(false)}/><span>Monthly</span></label>
            <label><input type="radio" name="billing" checked={annual} onChange={()=>setAnnual(true)}/><span>Annual <small>Save 20%</small></span></label>
          </fieldset>
          <div className="pricing-grid">
            <article className="plan plan-team plan-glare">
              <div className="plan-heading"><h2>Team</h2><span className="plan-trial">{trial}</span></div>
              <p className="plan-summary">For engineering teams getting started with contextual review.</p>
              <div className="plan-price" aria-live="polite"><div><strong>${annual ? yearlyMonthly : monthly}</strong><span> / developer / month</span></div><p>{annual ? '$192 per developer, billed annually.' : 'Billed monthly.'}</p></div>
              <PlanFeatures features={['Contextual GitHub pull request review','Review against available requirements and authorized code','14-day trial with no credit card required']}/>
              <a className="plan-button plan-primary" href="https://app.mycointelligence.com">Upgrade to Pro <Arrow/></a>
            </article>
            <article className="plan plan-glare">
              <div className="plan-heading"><h2>Enterprise</h2></div>
              <p className="plan-summary">For organizations with broader requirements.</p>
              <div className="plan-price"><div><strong>Custom</strong></div><p>Pricing tailored to your organization.</p></div>
              <PlanFeatures features={['Discuss your team’s requirements','Explore configuration and support options','Plan an evaluation around your workflow']}/>
              <a className="plan-button" href="https://calendly.com/abhishika-mycointelligence/30min">Contact Sales <Arrow/></a>
            </article>
          </div>
        </section>
        <section className="pricing-faq" aria-labelledby="pricing-faq-title">
          <h2 id="pricing-faq-title">Questions about pricing</h2>
          <div>
            {faqs.map(([question,answer])=><details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
          </div>
        </section>
      </main>
    </DitherFlow>
    <SiteFooter pricing />
  </>
}

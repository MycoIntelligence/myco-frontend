'use client'

import {useReducedMotion} from 'motion/react'
import {SiteHeader,SiteFooter} from './home-sections'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'

const principles=[
  {icon:'boundary',title:'You set the review scope',copy:'Myco uses the proposed change and relevant context from the repositories your team authorizes.'},
  {icon:'lifecycle',title:'Source code stays in your environment',copy:'Source code never leaves the environment you authorize. Myco uses it during active analysis and never retains it.'},
  {icon:'readonly',title:'Engineers own code changes',copy:'Engineers make the required changes, then push commits and decide what to merge.'},
] as const

export default function SecurityPage(){
  const reduced=useReducedMotion()
  return <>
    {!reduced&&<SmoothCursor/>}
    <SiteHeader securityPage/>
    <main>
      <DitherFlow className="security-hero-flow">
        <section className="security-detail-hero" aria-labelledby="security-title">
          <span className="eyebrow">Security by Architecture</span>
          <h1 id="security-title">You choose what<br/> <em>Myco can review</em></h1>
          <p>How Myco accesses your repositories, handles source code, and shares its findings.</p>
        </section>
      </DitherFlow>
      <div className="security-detail">
        <div className="security-detail-principles">
          {principles.map(({icon,title,copy})=><section key={icon}>
            <img src={`/security/security-${icon}.svg`} alt="" width="94" height="94"/>
            <h2>{title}</h2><p>{copy}</p>
          </section>)}
        </div>
        <section className="security-detail-section" id="security-access" aria-labelledby="security-access-title">
          <div className="security-detail-lead">
            <h2 id="security-access-title">What Myco can access</h2>
            <p>You choose the repositories Myco can review. Source access and review output serve different purposes.</p>
          </div>
          <dl className="security-detail-permissions">
            <div><dt>Contents: read</dt><dd>Myco reads source code from repositories you authorize.</dd></div>
            <div><dt>Pull requests: write</dt><dd>GitHub requires this permission to post inline review comments when that output is enabled. Source code access is read-only.</dd></div>
            <div><dt>Stays with your team</dt><dd>Updating source code, pushing commits, and deciding what to merge.</dd></div>
          </dl>
        </section>
        <section className="security-detail-section" aria-labelledby="security-data-title">
          <div className="security-detail-lead"><h2 id="security-data-title">Source code and review findings</h2></div>
          <dl className="security-detail-permissions">
            <div><dt>Source code</dt><dd>Myco uses source code only for active analysis inside your authorized environment. Myco never retains it.</dd></div>
            <div><dt>Review findings</dt><dd>When comments are enabled, findings appear on the pull request with the relevant file and line, an explanation, and supporting evidence. Anyone with access to the pull request can see the comments.</dd></div>
            <div><dt>Jira issue tracking</dt><dd>When Jira issue creation is enabled, Myco automatically creates tickets for the bugs it finds so your team can track them through resolution.</dd></div>
          </dl>
        </section>
      </div>
    </main>
    <SiteFooter securityPage/>
  </>
}

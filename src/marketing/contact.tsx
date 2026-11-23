'use client'

import {useReducedMotion} from 'motion/react'
import {Arrow} from './feature-bento'
import {SiteHeader,SiteFooter} from './home-sections'
import {DitherFlow} from './dither-flow'
import {SmoothCursor} from './smooth-cursor'
import {contactEmail} from './contact-email'

export default function ContactPage(){
  const reduced=useReducedMotion()
  return <>
    {!reduced&&<SmoothCursor/>}
    <SiteHeader contactPage/>
    <DitherFlow>
      <main className="contact-detail">
        <span className="eyebrow">Contact</span>
        <h1>Talk to <em>Myco.</em></h1>
        <p>Have a question about Myco or want to discuss a pilot? Email Grege directly.</p>
        <a className="contact-email-card" href={'mailto:'+contactEmail}>
          <span className="contact-email-icon">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span><strong>Email Grege</strong><span>{contactEmail}</span></span>
          <Arrow/>
        </a>
      </main>
    </DitherFlow>
    <SiteFooter contactPage/>
  </>
}

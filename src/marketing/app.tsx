'use client'

import Link from "next/link"
import {useEffect, useState} from 'react'
import {DitherFlow} from './dither-flow'
import {FeatureBento} from './feature-bento'
import {ReviewSection} from './review'
import {PilotLogos} from './pilot-logos'
import {HomeFooter, PilotLink, SiteHeader} from './home-sections'
import {SmoothCursor} from './smooth-cursor'
import {useReducedMotion} from 'motion/react'
import {LiveWorkflowSection,LiveSecuritySection} from './live-sections'

const variants = ['against product requirements.', 'to catch implementation bugs.', 'to catch cross-repo regressions.', 'to catch potential security risks.']

export default function Preview() {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (location.hash === '#features' || location.hash === '#pilot-logos' || location.hash === '#pilot') {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    }
  }, [])
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setInterval> | undefined
    function update() {
      clearInterval(timer)
      if (!preference.matches) timer = setInterval(() => setIndex(i => (i + 1) % variants.length), 2480)
    }
    update()
    preference.addEventListener('change', update)
    return () => { clearInterval(timer); preference.removeEventListener('change', update) }
  }, [])
  return <>
    {!reduceMotion && <SmoothCursor />}
    <SiteHeader />
    <main>
      <DitherFlow className="home-dither-flow">
        <section className="hero" aria-label="Myco overview">
        <div className="hero-copy">
          <div className="eyebrow"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 1.8 10 5.5-10 5.5L2 7.3z"/><path d="m3 12 9 5 9-5M3 16.7l9 5 9-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>Software Quality Infrastructure</div>
          <h1>Review your pull requests<span className="rotate" aria-hidden="true"><span key={index}>{variants[index]}</span></span><span className="sr"> against product requirements and to catch implementation bugs, cross-repo regressions, and potential security risks.</span></h1>
          <p>Myco shows what could break, the exact line of code, and the evidence behind each finding.</p>
          <PilotLink />
          <div><Link className="comparison-link" href="/blog/myco-vs-coderabbit/"><span>Compare Myco and CodeRabbit</span><span aria-hidden="true">&#8599;</span></Link></div>
          </div>
          <PilotLogos />
        </section>
        <ReviewSection />
      </DitherFlow>
      <FeatureBento />
      <LiveWorkflowSection />
      <LiveSecuritySection />
    </main>
    <HomeFooter />
  </>
}

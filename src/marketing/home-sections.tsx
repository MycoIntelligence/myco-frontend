import Link from "next/link"
import {ClipboardList, FolderGit2, GitPullRequest, ListChecks} from 'lucide-react'
import {BorderBeam} from './border-beam-local'
import {contactEmail} from './contact-email'
import {FeaturesNavigation} from './features-navigation'
import {TrialRequestButton} from './trial-request'

function Icon({name}: {name:'branch'|'document'|'lock'|'shield'|'layers'|'arrow'}) {
  const paths={
    branch:'M6 7v10m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v1a5 5 0 0 1-5 5H6',
    document:'M14 3H6v18h12V7l-4-4Zm0 0v5h4M9 12h6m-6 4h4',
    lock:'M7 10V7a5 5 0 1 1 10 0v3M5 10h14v11H5zM12 14v3',
    shield:'M12 3 5 6v5c0 4 3 7 7 10 4-3 7-6 7-10V6l-7-3Zm-3 9 2 2 4-4',
    layers:'m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
    arrow:'M5 12h14m-5-5 5 5-5 5',
  }
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>
}

export function PilotLink() {
  return <TrialRequestButton className="pilot">
    Request a free trial <span aria-hidden="true">→</span>
    <BorderBeam size={57} duration={5} initialOffset={15} colorFrom="#5aa9f2" colorTo="#c9e8ff" borderWidth={1.5} />
  </TrialRequestButton>
}

export function WorkflowSection() {
  return <section className="home-section workflow" id="integration" aria-labelledby="integration-title">
    <div className="home-section-heading">
      <p className="home-label">Integrations</p>
      <h2 id="integration-title">Connect to the workflow</h2>
      <p>Give Myco the context behind a change. Get the finding and its evidence right on the pull request.</p>
    </div>
    <div className="workflow-layout">
      <div className="workflow-inputs">
        <div className="workflow-card"><span className="home-icon"><img src="/marketing/github.png" alt=""/></span><div><strong>GitHub</strong><span>Pull request and repository context</span></div></div>
        <div className="workflow-card"><span className="home-icon"><Icon name="document"/></span><div><strong>Product requirements</strong><span>Available specs and acceptance criteria</span></div></div>
        <div className="workflow-card"><span className="home-icon"><Icon name="branch"/></span><div><strong>Connected repositories</strong><span>Authorized dependencies</span></div></div>
      </div>
      <div className="workflow-hub">
        <div className="workflow-hub-mark"><img src="/marketing/myco-mark.png" alt=""/></div>
        <strong>Myco</strong>
      </div>
      <div className="workflow-output">
        <div className="workflow-output-header"><img src="/marketing/github.png" alt=""/><strong>GitHub pull request</strong></div>
        <div className="workflow-output-body"><span className="workflow-dot" aria-hidden="true"/><div><strong>Review finding</strong><p>What could break, the relevant line, and the evidence behind it.</p></div></div>
      </div>
    </div>
  </section>
}

export function SecuritySection() {
  return <section className="security-band" id="security" aria-labelledby="security-title">
    <div className="home-section">
      <div className="home-section-heading">
        <p className="home-label">Security</p>
        <h2 id="security-title">You decide what Myco can access</h2>
        <p>Scope the review to the repositories and sources you authorize.</p>
      </div>
      <div className="security-grid">
        <article><span className="home-icon"><Icon name="lock"/></span><h3>Scoped repository access</h3><p>Choose the repositories Myco can use for review and only connect the context you want it to see.</p></article>
        <article><span className="home-icon"><Icon name="branch"/></span><h3>Read-only source access</h3><p>Myco reads authorized code and posts findings. Your team controls code changes and merges.</p></article>
        <article><span className="home-icon"><Icon name="shield"/></span><h3>Clear data handling</h3><p>Review how code is processed and what data is retained before connecting your team’s workflow.</p></article>
      </div>
    </div>
  </section>
}

export function HomeFooter() {
  return <>
    <section className="pilot-close" id="pilot" aria-labelledby="pilot-title">
      <div className="pilot-close-inner">
        <h2 id="pilot-title">14 days of free code review</h2>
        <p className="pilot-close-intro">Try Myco on a pull request. We’ll review your request and email you an onboarding guide.</p>
        <ol className="pilot-close-steps" aria-label="How to get started">
          <li>
            <span className="pilot-step-icon"><ClipboardList size={21} aria-hidden="true" /></span>
            <h3>Request a free trial</h3>
            <p>Share your name, business email, and GitHub username.</p>
          </li>
          <li>
            <span className="pilot-step-icon"><FolderGit2 size={21} aria-hidden="true" /></span>
            <h3>Choose a repository</h3>
            <p>Follow the onboarding guide to choose where you’d like to start.</p>
          </li>
          <li>
            <span className="pilot-step-icon"><GitPullRequest size={21} aria-hidden="true" /></span>
            <h3>Open a pull request</h3>
            <p>Start with a change your team is already working on.</p>
          </li>
          <li>
            <span className="pilot-step-icon"><ListChecks size={21} aria-hidden="true" /></span>
            <h3>Inspect a review</h3>
            <p>Read each finding, the line it points to, and the evidence behind it.</p>
          </li>
        </ol>
        <PilotLink />
      </div>
    </section>
    <SiteFooter />
  </>
}

export function SiteHeader({pricing=false,featuresPage=false,securityPage=false,contactPage=false,blogPage=false,accountPage=false}: {pricing?:boolean;featuresPage?:boolean;securityPage?:boolean;contactPage?:boolean;blogPage?:boolean;accountPage?:boolean}) {
  const home=pricing || featuresPage || securityPage || contactPage || blogPage || accountPage ? '/' : ''
  return <>
  <div id="home" aria-hidden="true"/>
  <header className="site-header">
    <div className="nav">
      <Link className="brand" href={home+'#home'}><img src="/marketing/myco-mark.png" alt="" />myco</Link>
      <nav aria-label="Main navigation">
        <Link href={home+'#home'} aria-current={home ? undefined : 'page'}>Home</Link>
        <FeaturesNavigation active={featuresPage}/>
        <Link href="/security/" aria-current={securityPage ? 'page' : undefined}>Security</Link>
        <Link href="/pricing/" aria-current={pricing ? 'page' : undefined}>Pricing</Link>
      </nav>
      <TrialRequestButton className="nav-pilot" />
    </div>
  </header>
  </>
}

export function SiteFooter({pricing=false,featuresPage=false,securityPage=false,contactPage=false,blogPage=false}: {pricing?:boolean;featuresPage?:boolean;securityPage?:boolean;contactPage?:boolean;blogPage?:boolean}) {
  const home=pricing || featuresPage || securityPage || contactPage || blogPage ? '/' : ''
  return <footer className="site-footer" id="footer">
      <div className="footer-inner">
        <div className="footer-row">
          <Link className="brand" href={home+'#home'}><img src="/marketing/myco-mark.png" alt="" />myco</Link>
          <a className="footer-social" href="https://www.linkedin.com/company/1myco" aria-label="Myco on LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45H16.9v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z"/>
            </svg>
          </a>
        </div>
        <div className="footer-row footer-links">
          <nav aria-label="Footer navigation"><Link href={home+'#features'}>Features</Link><Link href={home+'#integration'}>Integration</Link><Link href="/security/" aria-current={securityPage ? 'page' : undefined}>Security</Link><Link href="/pricing/">Pricing</Link><Link href="/blog/myco-vs-coderabbit/" aria-current={blogPage ? 'page' : undefined}>Blog</Link><Link href="/contact/" aria-current={contactPage?'page':undefined}>Contact us</Link></nav>
          <span className="copyright">© 2026 Myco. All rights reserved.</span>
        </div>
        <a className="footer-email" href={'mailto:'+contactEmail}>{contactEmail}</a>
        <div className="footer-wordmark" aria-hidden="true"><span data-wordmark="MYCO">MYCO</span></div>
      </div>
    </footer>
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/src/components/Nav";
import { CtaFooter } from "@/src/components/CtaFooter";
import "./pricing-page.css";

const faqs = [
  ["How does the 30-day trial work?", "Start a 30-day trial with no credit card required. Discuss your repositories and evaluation scope with the Myco team."],
  ["What is the difference between monthly and annual billing?", "The Team plan is $20 per developer per month, or $16 per developer per month when billed annually ($192 per developer per year)."],
  ["What is included in Enterprise?", "Enterprise pricing and configuration depend on your organization’s needs. Contact the team to discuss your requirements."],
  ["Which capabilities are available?", "Contextual GitHub pull request review is the live foundation. Other capabilities and actions depend on configuration or are on the roadmap; confirm their availability during your evaluation."],
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <Nav />
      <main id="main" className="pricing-page">
        <section className="pricing-intro pricing-wrap">
          <p className="pricing-eyebrow"><span /> PRICING / MYCO</p>
          <h1>Simple pricing.<br /><em>Built for your team.</em></h1>
          <p>Start with Myco for your team or get in touch about your organization’s requirements.</p>
        </section>

        <section className="pricing-wrap pricing-plans" aria-labelledby="plans-title">
          <div className="pricing-toolbar">
            <div>
              <p className="pricing-eyebrow">PLANS</p>
              <h2 id="plans-title">Choose your starting point.</h2>
            </div>
            <fieldset className="pricing-toggle">
              <legend>Billing period</legend>
              <label>
                <input
                  type="radio"
                  name="billing"
                  checked={!annual}
                  onChange={() => setAnnual(false)}
                />
                <span>Monthly</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="billing"
                  checked={annual}
                  onChange={() => setAnnual(true)}
                />
                <span>Annual <small>Save 20%</small></span>
              </label>
            </fieldset>
          </div>

          <div className="pricing-cards">
            <article className="pricing-card pricing-team">
              <div className="pricing-card-top">
                <span>01 / TEAM</span>
                <span className="pricing-badge">30-DAY TRIAL</span>
              </div>
              <h3>Team</h3>
              <p className="pricing-card-description">For engineering teams getting started with contextual review.</p>
              <div className="pricing-price">
                <strong>${annual ? "16" : "20"}</strong>
                <span> / developer / month</span>
                <p>{annual ? "$192 per developer, billed annually." : "Billed monthly."}</p>
              </div>
              <ul>
                <li>Contextual GitHub pull request review</li>
                <li>Review available requirements and authorized code</li>
                <li>Start with a 30-day trial</li>
              </ul>
              <Link href="/book-demo" className="pricing-button light">
                <span>Start 30-day trial</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <small>No credit card required.</small>
            </article>

            <article className="pricing-card pricing-enterprise">
              <div className="pricing-card-top">
                <span>02 / ENTERPRISE</span>
              </div>
              <h3>Enterprise</h3>
              <p className="pricing-card-description">For organizations with broader requirements.</p>
              <div className="pricing-price">
                <strong className="pricing-custom">Custom</strong>
                <p>Pricing tailored to your organization.</p>
              </div>
              <ul>
                <li>Discuss your team’s requirements</li>
                <li>Explore configuration and support options</li>
                <li>Plan an evaluation around your workflow</li>
              </ul>
              <Link href="/book-demo" className="pricing-button dark">
                <span>Request a pilot</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </article>
          </div>

          <div className="pricing-notes">
            <div>
              <span>START WITH A WORKFLOW</span>
              <p>Choose an important workflow and agree what useful feedback looks like for your team.</p>
            </div>
            <div>
              <span>CONFIRM YOUR SCOPE</span>
              <p>Available context sources, permissions and supported actions depend on configuration.</p>
            </div>
          </div>
        </section>

        <section className="pricing-wrap pricing-faq" aria-labelledby="pricing-faq-title">
          <div>
            <p className="pricing-eyebrow">QUESTIONS</p>
            <h2 id="pricing-faq-title">Good to know.</h2>
            <p>Have another question? Get in touch with our team.</p>
          </div>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}

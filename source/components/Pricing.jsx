import React, { useState } from "react";

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const isAnnual = billing === "annual";

  return (
    <div className="wrap pricing-wrap" id="pricing" aria-label="Pricing">
      <div className="pricing-container">
        <section class="intro" aria-labelledby="pricing-title">
          <div>
            <p className="eyebrow">PRICING</p>
            <h2 id="pricing-title" className="pricing-title">
              Unlimited code review.<br /><span>Pay per developer.</span>
            </h2>
          </div>
          <p className="intro-copy">
            Review every pull request with Team. Add governance, deployment options and priority support with Enterprise.
          </p>
        </section>

        <section id="plans" aria-label="Plans and billing">
          <div className="plan-toolbar">
            <p>30-day trial. No credit card required.</p>
            <fieldset className="billing">
              <legend className="sr-only">Billing period</legend>
              <label>
                <input
                  type="radio"
                  name="billing"
                  value="monthly"
                  checked={!isAnnual}
                  onChange={() => setBilling("monthly")}
                />
                <span>Monthly</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="billing"
                  value="annual"
                  checked={isAnnual}
                  onChange={() => setBilling("annual")}
                />
                <span>Annually <small>Save 20%</small></span>
              </label>
            </fieldset>
          </div>

          <div className="llm-explainer">
            <p><strong>Your subscription covers Myco.</strong> LLM usage is paid separately through your own API key.</p>
            <p className="trial-cost">LLM charges also apply during the free trial.</p>
          </div>

          <div className="plans">
            <article className="plan team" aria-labelledby="team-title">
              <header className="plan-heading">
                <h3 id="team-title">Team</h3>
              </header>
              <div className="price-region" aria-live="polite" aria-atomic="true">
                <p className="price">
                  <span id="team-price">{isAnnual ? "$16" : "$20"}</span>
                  <span className="price-unit">/ developer / month</span>
                </p>
                <p id="billing-detail">
                  {isAnnual ? "$192 per developer, billed yearly. Save 20%." : "Billed monthly."}
                </p>
              </div>
              <p className="plan-description">For engineering teams reviewing every pull request.</p>
              <div className="feature-section">
                <h4>Included in Team</h4>
                <ul className="features">
                  <li>Full review and validation pipeline</li>
                  <li>Unlimited reviews and repositories</li>
                  <li>Dashboard and analytics</li>
                  <li>Community and email support</li>
                </ul>
              </div>
              <a
                className="button primary"
                data-pricing-cta="trial"
                href="https://calendly.com/rodriguesgrege_/myco-introduction"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start 30-day free trial <span aria-hidden="true">↗</span>
              </a>
              <p className="cta-note">No credit card. Start with a Myco introduction.</p>
            </article>

            <article className="plan enterprise" aria-labelledby="enterprise-title">
              <header className="plan-heading">
                <h3 id="enterprise-title">Enterprise</h3>
              </header>
              <div className="price-region">
                <p className="custom-price">Custom pricing</p>
                <p>A plan tailored to your organization.</p>
              </div>
              <p className="plan-description">For organizations that need governance, custom deployment and dedicated support.</p>
              <div className="feature-section">
                <h4>Everything in Team, plus</h4>
                <ul className="features">
                  <li>Identity controls, governance and self-learning</li>
                  <li>Custom connectors and deployment options</li>
                  <li>Priority support and dedicated CSM</li>
                </ul>
              </div>
              <a
                className="button secondary"
                data-pricing-cta="sales"
                href="https://calendly.com/rodriguesgrege_/myco-introduction"
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk to us <span aria-hidden="true">↗</span>
              </a>
              <p className="cta-note">Discuss deployment, governance and support.</p>
            </article>
          </div>

          <p className="seat-note">
            <strong>Paid seats are admin-approved.</strong> Only developers whose PRs Myco reviews need a seat. Viewing findings is free.
          </p>
        </section>

        <section className="comparison" aria-labelledby="compare-title">
          <div className="section-heading">
            <p className="eyebrow">SIDE BY SIDE</p>
            <h3 id="compare-title">Choose your level of control.</h3>
            <p>Both plans include the complete review pipeline. Here’s what changes.</p>
          </div>
          <div className="comparison-overview" aria-label="Plan pricing summary">
            <div>
              <span className="comparison-intro-label">PLAN COMPARISON</span>
              <p>Core review in both.<br />More control in Enterprise.</p>
            </div>
            <div>
              <strong>Team</strong>
              <span id="comparison-price">{isAnnual ? "$16 / developer / month" : "$20 / developer / month"}</span>
              <small id="comparison-billing">{isAnnual ? "$192 per developer, billed yearly" : "Billed monthly"}</small>
            </div>
            <div>
              <strong>Enterprise</strong>
              <span>Custom pricing</span>
            </div>
          </div>

          <div className="capability-groups">
            <section className="capability-group governance" aria-labelledby="group-governance">
              <header className="capability-heading">
                <p className="capability-label">ACCESS &amp; OVERSIGHT</p>
                <h4 id="group-governance">Governance</h4>
                <p>Control who can access Myco, understand review activity and adapt to your team’s standards.</p>
              </header>
              <div className="table-wrap">
                <table role="table">
                  <caption className="sr-only">Governance: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Governance capabilities</th>
                      <th scope="col" role="columnheader">Team</th>
                      <th scope="col" role="columnheader">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    <tr role="row">
                      <th scope="row" role="rowheader">SSO / SAML and audit logs</th>
                      <td role="cell" data-plan="Team">Not included</td>
                      <td role="cell" data-plan="Enterprise">Included</td>
                    </tr>
                    <tr role="row">
                      <th scope="row" role="rowheader">Dashboard and analytics</th>
                      <td role="cell" data-plan="Team">Included</td>
                      <td role="cell" data-plan="Enterprise">Included</td>
                    </tr>
                    <tr role="row">
                      <th scope="row" role="rowheader">Advanced self-learning</th>
                      <td role="cell" data-plan="Team">Not included</td>
                      <td role="cell" data-plan="Enterprise">Included</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="capability-group deployment" aria-labelledby="group-deployment">
              <header className="capability-heading">
                <p className="capability-label">INFRASTRUCTURE &amp; INTEGRATIONS</p>
                <h4 id="group-deployment">Deployment</h4>
                <p>Choose single-tenant SaaS or on-prem deployment, and connect the internal tools your team relies on.</p>
              </header>
              <div className="table-wrap">
                <table role="table">
                  <caption className="sr-only">Deployment: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Deployment capabilities</th>
                      <th scope="col" role="columnheader">Team</th>
                      <th scope="col" role="columnheader">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    <tr role="row">
                      <th scope="row" role="rowheader">Custom connectors</th>
                      <td role="cell" data-plan="Team">Not included</td>
                      <td role="cell" data-plan="Enterprise">Included</td>
                    </tr>
                    <tr role="row">
                      <th scope="row" role="rowheader">Single-tenant SaaS or on-prem deployment</th>
                      <td role="cell" data-plan="Team">Not included</td>
                      <td role="cell" data-plan="Enterprise">Available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="capability-group support" aria-labelledby="group-support">
              <header className="capability-heading">
                <p className="capability-label">SERVICE &amp; PARTNERSHIP</p>
                <h4 id="group-support">Support</h4>
                <p>Get community and email support in Team, or priority Slack support and a dedicated customer success manager in Enterprise.</p>
              </header>
              <div className="table-wrap">
                <table role="table">
                  <caption className="sr-only">Support: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Support capabilities</th>
                      <th scope="col" role="columnheader">Team</th>
                      <th scope="col" role="columnheader">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    <tr role="row">
                      <th scope="row" role="rowheader">Support and account management</th>
                      <td role="cell" data-plan="Team">Community and email support</td>
                      <td role="cell" data-plan="Enterprise">Priority Slack support and a dedicated customer success manager</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        <section className="faq" aria-labelledby="faq-title">
          <div className="section-heading">
            <p className="eyebrow">THE DETAILS</p>
            <h3 id="faq-title">Billing, trials and seats.</h3>
          </div>
          <div className="questions">
            <details>
              <summary>Who needs a paid seat?</summary>
              <p>Only admin-approved developers whose pull requests Myco reviews need paid seats. People who only view findings are free.</p>
            </details>
            <details>
              <summary>What does the 30-day trial include?</summary>
              <p>Book a Myco introduction to get started. Your 30-day trial includes the full Team review pipeline, with unlimited reviews and repositories. No credit card is required. Bring your own LLM API key; your provider charges you for model usage during the trial.</p>
            </details>
            <details>
              <summary>What happens after 30 days?</summary>
              <p>Reviews pause until you subscribe. The trial does not automatically turn into a paid subscription.</p>
            </details>
            <details>
              <summary>How does annual billing work?</summary>
              <p>Team costs $16 per developer per month when billed annually, paid as $192 per developer per year. Monthly billing is $20 per developer per month.</p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}

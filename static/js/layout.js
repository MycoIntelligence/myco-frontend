/* Keeps the published static build aligned with the editable component source. */
(() => {
  const proofMetrics = window.MYCO_PROOF_METRICS || [];

  const formatMetric = (metric, value) => `${value.toLocaleString("en-US")}${metric.suffix}`;

  const countMetric = (element, metric) => {
    const duration = 720;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.max(0, Math.min((now - start) / duration, 1));
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatMetric(metric, Math.round(metric.value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const applyProofMetrics = () => {
    const legacyGrid = document.querySelector(".stats-grid");
    if (!legacyGrid || legacyGrid.dataset.proofMetricsApplied || !proofMetrics.length) return Boolean(legacyGrid);

    const section = document.createElement("section");
    section.className = "proof-metrics";
    section.setAttribute("aria-label", "Myco proof points");
    section.innerHTML = `
      <div class="proof-metrics__grid">
        ${proofMetrics.map((metric, index) => `
          <article class="proof-metric" style="--metric-delay: ${index * 95}ms">
            <div class="proof-metric__number" data-value="${metric.value}" aria-hidden="true">${formatMetric(metric, metric.value)}</div>
            <div class="sr-only">${formatMetric(metric, metric.value)} ${metric.label}. ${metric.detail}.</div>
            <p class="proof-metric__label">${metric.label}</p>
            <p class="proof-metric__detail">${metric.detail}</p>
          </article>
        `).join("")}
      </div>
    `;

    legacyGrid.dataset.proofMetricsApplied = "true";
    legacyGrid.replaceWith(section);

    const showMetrics = (animate = true) => {
      section.classList.add("is-visible");
      if (!animate) return;
      section.querySelectorAll(".proof-metric__number").forEach((number, index) => {
        countMetric(number, proofMetrics[index]);
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showMetrics(false);
      return true;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        showMetrics();
        observer.disconnect();
      }
    }, { threshold: 0.24 });
    observer.observe(section);
    return true;
  };

  const applySectionLayout = () => {
    const sections = [...document.querySelectorAll('.App > .wrap')];
    const diff = sections.find(section => section.querySelector('h2')?.textContent.includes('A diff is not the whole system.'));
    const engine = sections.find(section => section.querySelector('h2')?.textContent.includes('Myco reads your whole system.'));
    if (!diff || !engine) return false;
    engine.classList.add('context-section');
    engine.querySelector(':scope > div:first-child')?.classList.add('context-section__header');
    engine.parentElement.insertBefore(engine, diff);
    diff.classList.add('diff-centered');
    diff.querySelector('.eyebrow')?.remove();
    return true;
  };

  const applyDiffRedesign = () => {
    const diff = [...document.querySelectorAll('.App > .wrap')]
      .find(section => section.querySelector('h2')?.textContent.includes('A diff is not the whole system.'));
    if (!diff || diff.dataset.diffRedesignApplied !== undefined) return Boolean(diff);

    const title = diff.querySelector('h2')?.textContent.trim() || 'A diff is not the whole system.';
    const body = diff.querySelector('p')?.textContent.trim() || '';
    const stages = [{"num": "01", "tag": "CONTEXT", "body": "We map the relevant code, ownership, dependencies and historical changes around the pull request."}, {"num": "02", "tag": "REASONING", "body": "We analyze intent, design trade-offs, and potential impact across the broader system."}, {"num": "03", "tag": "VALIDATION", "body": "We check the change against tests, standards, security, and operational constraints."}, {"num": "04", "tag": "SIGNAL", "body": "We produce a single, validated signal that captures what the change means in the full system."}];

    diff.dataset.diffRedesignApplied = 'true';
    diff.classList.add('diff-system-wrap');
    diff.innerHTML = `
      <section class="diff-system" aria-labelledby="diff-system-title">
        <div class="diff-system__top">
          <header class="diff-system__intro">
            <span class="diff-system__rule" aria-hidden="true"></span>
            <h2 class="display" id="diff-system-title"><span>A diff is not </span><span>the whole system.</span></h2>
            <p>${body}</p>
          </header>

        </div>
        <ol class="diff-system__ledger">
          ${stages.map(stage => `
            <li>
              <span class="diff-system__index">${stage.num}</span>
              <span class="diff-system__label">${stage.tag}</span>
              <span class="diff-system__mark" aria-hidden="true"></span>
              <p>${stage.body}</p>
            </li>`).join('')}
        </ol>
      </section>`;
    return true;
  };

  const applyWorkflowProofRedesign = () => {
    const proof = [...document.querySelectorAll('.App > .wrap')]
      .find(section => section.querySelector('h2')?.textContent.includes('The bug isn’t always in the changed line.'));
    if (!proof || proof.dataset.workflowProofApplied !== undefined) return Boolean(proof);

    const title = proof.querySelector('h2')?.textContent.trim() || 'The bug isn’t always in the changed line.';
    proof.dataset.workflowProofApplied = 'true';
    proof.classList.add('workflow-proof-wrap');
    proof.innerHTML = `
      <section class="workflow-proof" aria-labelledby="workflow-proof-title">
        <header class="workflow-proof__intro">
          <span class="workflow-proof__eyebrow">PROOF IN WORKFLOW</span>
          <span class="workflow-proof__rule" aria-hidden="true"></span>
          <h2 class="display" id="workflow-proof-title"><span>The bug isn’t always </span><span>in the changed line.</span></h2>
          <p>Myco follows the full execution path, across code, policies and past decisions, to catch issues that slip through review.</p>
        </header>
        <article class="workflow-proof__panel" aria-label="Validated pull request finding">
          <header class="workflow-proof__panel-header">
            <span class="workflow-proof__panel-label">PULL REQUEST #4827</span>
            <span class="workflow-proof__panel-change">Add retry for tool execution failures</span>
          </header>
          <section class="workflow-proof__finding" aria-labelledby="workflow-finding-title">
            <span class="workflow-proof__severity">P1</span>
            <div>
              <span class="workflow-proof__finding-label">VALIDATED FINDING</span>
              <h3 id="workflow-finding-title">Retry path bypasses the tool approval policy.</h3>
              <p>The agent retry path executes tool calls without going through the approval check after a failed attempt.</p>
            </div>
          </section>
          <section class="workflow-proof__evidence" aria-labelledby="workflow-evidence-title">
            <header><h3 id="workflow-evidence-title">Evidence trail</h3><span>3 connected artifacts</span></header>
            <ol>
              <li>
                <span class="workflow-proof__step">01</span>
                <div><strong>AgentRunner</strong><span>agent-runner.ts</span></div>
                <p>The retry path calls executeTool again without an approval check.</p>
              </li>
              <li>
                <span class="workflow-proof__step">02</span>
                <div><strong>toolPolicy.requiresApproval</strong><span>tool-policy.ts</span></div>
                <p>Approval is required for sensitive tool calls, but the retry path skips it.</p>
              </li>
              <li>
                <span class="workflow-proof__step">03</span>
                <div><strong>AGENT-12</strong><span>Product requirement</span></div>
                <p>Tool calls require approval after retry.</p>
              </li>
            </ol>
          </section>
        </article>
      </section>`;
    return true;
  };

  const removeLiveFindings = () => {
    const signals = [...document.querySelectorAll('.App > .wrap')]
      .find(section => section.querySelector('h3')?.textContent.includes('Signals as they surface.'));
    signals?.remove();
    return true;
  };

  const removeHowJourney = () => {
    const how = document.querySelector('#how') || document.querySelector('.how-journey-wrap') || document.querySelector('.how-journey');
    if (how) {
      how.remove();
    }
    document.querySelectorAll('a[href="#how"]').forEach(link => {
      if (link.closest('.nav-links') || link.closest('.mobile-navigation') || (link.getAttribute('href') === '#how' && link.textContent.trim().toLowerCase().includes('how it works'))) {
        link.remove();
      } else if (link.classList.contains('btn') || link.closest('.btn')) {
        link.setAttribute('href', '#playground');
        if (link.textContent.toLowerCase().includes('how it works')) {
          link.innerHTML = 'Explore Playground <span aria-hidden="true">→</span>';
        }
      }
    });
    return true;
  };
  const applyIntegrationWorkflowRedesign = () => {
    const grid = document.querySelector('#integrate .wf-grid');
    if (!grid) return Boolean(document.querySelector('.integration-workflow'));
    grid.outerHTML = `<section class="integration-workflow" aria-labelledby="integration-workflow-title">
<header class="integration-workflow__header"><span class="eyebrow">CONNECT IN THE WORKFLOW</span><h3 class="display" id="integration-workflow-title">Infrastructure, not interruption.</h3><p>The implementation is intentionally simple: authorize the context, let Myco build its working view, then receive actionable findings in the systems engineers already use.</p></header>
<div class="integration-workflow__diagram" role="group" aria-label="Read-only repository context flows through Myco to GitHub, Jira, Slack and custom integrations">
<svg class="integration-workflow__wires" viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#89aaa1" stroke-width="1"><path d="M120 140H410M500 140H550C584 140 578 35 600 35H625M550 140C584 140 578 105 600 105H625M550 140C584 140 578 175 600 175H625"/><path d="M550 140C584 140 578 245 600 245H625" stroke-dasharray="4 5" opacity=".6"/></g></svg>
<div class="integration-workflow__repository"><img src="assets/integration-repository.svg" width="40" height="40" alt=""><strong>Repository</strong><span class="mono">READ ONLY</span></div>
<div class="integration-workflow__logo"><img src="assets/myco-icon.svg" width="100" height="103" alt="Myco"></div>
<ul class="integration-workflow__tools"><li class="integration-workflow__tool"><img src="assets/integration-github.svg" width="32" height="32" alt=""><strong>GitHub</strong><span>Inline review comments</span></li><li class="integration-workflow__tool"><img src="assets/integration-jira.svg" width="32" height="32" alt=""><strong>Jira</strong><span>Issues for tracking</span></li><li class="integration-workflow__tool"><img src="assets/integration-slack.svg" width="32" height="32" alt=""><strong>Slack</strong><span>Team notifications</span></li><li class="integration-workflow__tool is-custom"><img src="assets/integration-custom.svg" width="32" height="32" alt=""><strong>Custom integrations</strong><span>Adapted to your workflow</span></li></ul></div><div class="integration-workflow__permissions"><span class="eyebrow">SCOPED ACCESS</span><ul><li><span>Read repository contents</span><strong class="mono is-allow">ALLOW</strong></li><li><span>Read pull request metadata</span><strong class="mono is-allow">ALLOW</strong></li><li><span>Write to source code</span><strong class="mono is-deny">DENY</strong></li><li><span>Push commits</span><strong class="mono is-deny">DENY</strong></li></ul></div></section>`;
    return true;
  };
  const applySecurityRedesign = () => {
    const section = document.querySelector("#security");
    if (!section) return false;
    if (section.dataset.securityApplied) return true;
    section.dataset.securityApplied = "true";
    section.innerHTML = `<section class="security-editorial" aria-labelledby="security-editorial-title"><header class="security-editorial__intro"><span class="eyebrow">SECURITY BY ARCHITECTURE</span><h2 class="display" id="security-editorial-title"><span>Your code stays </span><span>in your environment.</span></h2><p>Source code never leaves the environment you authorize. It is used only for active analysis and is never retained afterwards.</p></header><div class="security-editorial__rows"><article class="security-editorial__row"><img src="assets/security-boundary.svg" width="96" height="96" alt=""><div><span class="eyebrow">01 · PROCESSING BOUNDARY</span><h3 class="display">Code does not leave.</h3><p>Myco performs analysis within your authorized environment. Source code is not sent outside that boundary.</p></div></article><article class="security-editorial__row"><img src="assets/security-lifecycle.svg" width="96" height="96" alt=""><div><span class="eyebrow">02 · DATA LIFECYCLE</span><h3 class="display">Nothing to retain.</h3><p>Source code is discarded after the analysis that needs it. Myco does not retain a copy of your code.</p></div></article><article class="security-editorial__row"><img src="assets/security-readonly.svg" width="96" height="96" alt=""><div><span class="eyebrow">03 · ACCESS MODEL</span><h3 class="display">Read only by design.</h3><p>Myco observes authorized repository context. It does not write to source code or push changes to your repository.</p></div></article></div></section>`;
    return true;
  };
  const applyPricingNavLink = () => {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
      let pricingLink = navLinks.querySelector('a[href="#pricing"]');
      const oldExternalLink = navLinks.querySelector('a[href="/pricing/"]');
      if (oldExternalLink) oldExternalLink.remove();

      const securityLink = navLinks.querySelector('a[href="#security"]');
      if (!pricingLink) {
        pricingLink = document.createElement("a");
        pricingLink.href = "#pricing";
        pricingLink.className = "mono";
        pricingLink.style.cssText = "font-size:13px;text-decoration:none;color:var(--ink-soft);display:inline-flex;align-items:center;gap:7px;transition:color .2s ease;";
        pricingLink.textContent = "Pricing";
        pricingLink.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector("#pricing");
          if (target) target.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", "#pricing");
        });
        if (securityLink) {
          navLinks.insertBefore(pricingLink, securityLink);
        } else {
          navLinks.appendChild(pricingLink);
        }
      } else if (securityLink && pricingLink.nextSibling !== securityLink) {
        navLinks.insertBefore(pricingLink, securityLink);
      }
    }

    const mobileMenu = document.querySelector("#mobile-navigation");
    if (mobileMenu) {
      let mItem = mobileMenu.querySelector('a[href="#pricing"]');
      const oldMobileExternal = mobileMenu.querySelector('a[href="/pricing/"]');
      if (oldMobileExternal) oldMobileExternal.remove();

      const secMItem = mobileMenu.querySelector('a[href="#security"]');
      if (!mItem) {
        mItem = document.createElement("a");
        mItem.href = "#pricing";
        mItem.textContent = "Pricing";
        mItem.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector("#pricing");
          if (target) target.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", "#pricing");
        });
        if (secMItem) {
          mobileMenu.insertBefore(mItem, secMItem);
        } else {
          mobileMenu.appendChild(mItem);
        }
      } else if (secMItem && mItem.nextSibling !== secMItem) {
        mobileMenu.insertBefore(mItem, secMItem);
      }
    }
    return Boolean(navLinks?.querySelector('a[href="#pricing"]'));
  };

  const applyPricingSection = () => {
    const security = document.querySelector("#security");
    if (!security) return false;

    let pricing = document.querySelector("#pricing");
    if (!pricing) {
      pricing = document.createElement("div");
      pricing.className = "wrap pricing-wrap";
      pricing.id = "pricing";
      pricing.setAttribute("aria-label", "Pricing");
      pricing.innerHTML = `
        <div class="pricing-container">
          <section class="intro" aria-labelledby="pricing-title">
            <div><p class="eyebrow">PRICING</p><h2 id="pricing-title">Unlimited code review.<br><span>Pay per developer.</span></h2></div>
            <p class="intro-copy">Review every pull request with Team. Add governance, deployment options and priority support with Enterprise.</p>
          </section>
          <section id="plans" aria-label="Plans and billing">
            <div class="plan-toolbar"><p>30-day trial. No credit card required.</p><fieldset class="billing"><legend class="sr-only">Billing period</legend><label><input type="radio" name="billing" value="monthly" checked><span>Monthly</span></label><label><input type="radio" name="billing" value="annual"><span>Annually <small>Save 20%</small></span></label></fieldset></div>
            <div class="llm-explainer"><p><strong>Your subscription covers Myco.</strong> LLM usage is paid separately through your own API key.</p><p class="trial-cost">LLM charges also apply during the free trial.</p></div>
            <div class="plans">
              <article class="plan team" aria-labelledby="team-title">
                <header class="plan-heading"><h3 id="team-title">Team</h3></header>
                <div class="price-region" aria-live="polite" aria-atomic="true"><p class="price"><span id="team-price">$20</span><span class="price-unit">/ developer / month</span></p><p id="billing-detail">Billed monthly.</p></div>
                <p class="plan-description">For engineering teams reviewing every pull request.</p>
                <div class="feature-section"><h4>Included in Team</h4><ul class="features"><li>Full review and validation pipeline</li><li>Unlimited reviews and repositories</li><li>Dashboard and analytics</li><li>Community and email support</li></ul></div>
                <a class="button primary" data-pricing-cta="trial" href="https://calendly.com/rodriguesgrege_/myco-introduction" target="_blank" rel="noopener noreferrer">Start 30-day free trial <span aria-hidden="true">↗</span></a>
                <p class="cta-note">No credit card. Start with a Myco introduction.</p>
              </article>
              <article class="plan enterprise" aria-labelledby="enterprise-title">
                <header class="plan-heading"><h3 id="enterprise-title">Enterprise</h3></header>
                <div class="price-region"><p class="custom-price">Custom pricing</p><p>A plan tailored to your organization.</p></div>
                <p class="plan-description">For organizations that need governance, custom deployment and dedicated support.</p>
                <div class="feature-section"><h4>Everything in Team, plus</h4><ul class="features"><li>Identity controls, governance and self-learning</li><li>Custom connectors and deployment options</li><li>Priority support and dedicated CSM</li></ul></div>
                <a class="button secondary" data-pricing-cta="sales" href="https://calendly.com/rodriguesgrege_/myco-introduction" target="_blank" rel="noopener noreferrer">Talk to us <span aria-hidden="true">↗</span></a>
                <p class="cta-note">Discuss deployment, governance and support.</p>
              </article>
            </div>
            <p class="seat-note"><strong>Paid seats are admin-approved.</strong> Only developers whose PRs Myco reviews need a seat. Viewing findings is free.</p>
          </section>
          <section class="comparison" aria-labelledby="compare-title">
            <div class="section-heading"><p class="eyebrow">SIDE BY SIDE</p><h3 id="compare-title">Choose your level of control.</h3><p>Both plans include the complete review pipeline. Here’s what changes.</p></div>
            <div class="comparison-overview" aria-label="Plan pricing summary">
              <div><span class="comparison-intro-label">PLAN COMPARISON</span><p>Core review in both.<br>More control in Enterprise.</p></div>
              <div><strong>Team</strong><span id="comparison-price">$20 / developer / month</span><small id="comparison-billing">Billed monthly</small></div>
              <div><strong>Enterprise</strong><span>Custom pricing</span></div>
            </div>
            <div class="capability-groups">
              <section class="capability-group governance" aria-labelledby="group-governance">
                <header class="capability-heading"><p class="capability-label">ACCESS &amp; OVERSIGHT</p><h4 id="group-governance">Governance</h4><p>Control who can access Myco, understand review activity and adapt to your team’s standards.</p></header>
                <div class="table-wrap"><table role="table"><caption class="sr-only">Governance: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Governance capabilities</th><th scope="col" role="columnheader">Team</th><th scope="col" role="columnheader">Enterprise</th></tr></thead><tbody role="rowgroup">
                    <tr role="row"><th scope="row" role="rowheader">SSO / SAML and audit logs</th><td role="cell" data-plan="Team">Not included</td><td role="cell" data-plan="Enterprise">Included</td></tr>
                    <tr role="row"><th scope="row" role="rowheader">Dashboard and analytics</th><td role="cell" data-plan="Team">Included</td><td role="cell" data-plan="Enterprise">Included</td></tr>
                    <tr role="row"><th scope="row" role="rowheader">Advanced self-learning</th><td role="cell" data-plan="Team">Not included</td><td role="cell" data-plan="Enterprise">Included</td></tr>
                  </tbody></table></div>
              </section>
              <section class="capability-group deployment" aria-labelledby="group-deployment">
                <header class="capability-heading"><p class="capability-label">INFRASTRUCTURE &amp; INTEGRATIONS</p><h4 id="group-deployment">Deployment</h4><p>Choose single-tenant SaaS or on-prem deployment, and connect the internal tools your team relies on.</p></header>
                <div class="table-wrap"><table role="table"><caption class="sr-only">Deployment: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Deployment capabilities</th><th scope="col" role="columnheader">Team</th><th scope="col" role="columnheader">Enterprise</th></tr></thead><tbody role="rowgroup">
                    <tr role="row"><th scope="row" role="rowheader">Custom connectors</th><td role="cell" data-plan="Team">Not included</td><td role="cell" data-plan="Enterprise">Included</td></tr>
                    <tr role="row"><th scope="row" role="rowheader">Single-tenant SaaS or on-prem deployment</th><td role="cell" data-plan="Team">Not included</td><td role="cell" data-plan="Enterprise">Available</td></tr>
                  </tbody></table></div>
              </section>
              <section class="capability-group support" aria-labelledby="group-support">
                <header class="capability-heading"><p class="capability-label">SERVICE &amp; PARTNERSHIP</p><h4 id="group-support">Support</h4><p>Get community and email support in Team, or priority Slack support and a dedicated customer success manager in Enterprise.</p></header>
                <div class="table-wrap"><table role="table"><caption class="sr-only">Support: compare Myco Team and Enterprise</caption>
                  <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Support capabilities</th><th scope="col" role="columnheader">Team</th><th scope="col" role="columnheader">Enterprise</th></tr></thead><tbody role="rowgroup">
                    <tr role="row"><th scope="row" role="rowheader">Support and account management</th><td role="cell" data-plan="Team">Community and email support</td><td role="cell" data-plan="Enterprise">Priority Slack support and a dedicated customer success manager</td></tr>
                  </tbody></table></div>
              </section>
            </div>
          </section>
          <section class="faq" aria-labelledby="faq-title">
            <div class="section-heading"><p class="eyebrow">THE DETAILS</p><h3 id="faq-title">Billing, trials and seats.</h3></div>
            <div class="questions">
              <details><summary>Who needs a paid seat?</summary><p>Only admin-approved developers whose pull requests Myco reviews need paid seats. People who only view findings are free.</p></details>
              <details><summary>What does the 30-day trial include?</summary><p>Book a Myco introduction to get started. Your 30-day trial includes the full Team review pipeline, with unlimited reviews and repositories. No credit card is required. Bring your own LLM API key; your provider charges you for model usage during the trial.</p></details>
              <details><summary>What happens after 30 days?</summary><p>Reviews pause until you subscribe. The trial does not automatically turn into a paid subscription.</p></details>
              <details><summary>How does annual billing work?</summary><p>Team costs $16 per developer per month when billed annually, paid as $192 per developer per year. Monthly billing is $20 per developer per month.</p></details>
            </div>
          </section>
        </div>
      `;
      security.parentNode.insertBefore(pricing, security);
      if (window.initPricingToggle) {
        window.initPricingToggle();
      }
    } else {
      if (security.previousElementSibling !== pricing) {
        security.parentNode.insertBefore(pricing, security);
      }
    }
    return true;
  };

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const proofReady = applyProofMetrics();
    const layoutReady = applySectionLayout();
    const diffReady = applyDiffRedesign();
    const workflowProofReady = applyWorkflowProofRedesign();
    const signalsReady = removeLiveFindings();
    const howJourneyReady = removeHowJourney();
    const integrationReady = applyIntegrationWorkflowRedesign();
    const pricingSectionReady = applyPricingSection();
    const securityReady = applySecurityRedesign();
    const pricingNavReady = applyPricingNavLink();
    if ((proofReady && layoutReady && diffReady && workflowProofReady && signalsReady && howJourneyReady && integrationReady && pricingSectionReady && securityReady && pricingNavReady) || attempts === 25) clearInterval(timer);
  }, 50);
})();

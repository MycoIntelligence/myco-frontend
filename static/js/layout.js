/* Keeps the published static build aligned with the editable component source. */
(() => {
  const proofMetrics = window.MYCO_PROOF_METRICS || [];

  const formatMetric = (metric, value) => `${value.toLocaleString("en-US")}${metric.suffix}`;

  const countMetric = (element, metric) => {
    const duration = 720;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
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
          <h2 class="display" id="workflow-proof-title">${title}</h2>
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

  const applySignalsRedesign = () => {
    const signals = [...document.querySelectorAll('.App > .wrap')]
      .find(section => section.querySelector('h3')?.textContent.includes('Signals as they surface.'));
    if (!signals || signals.dataset.signalsRedesignApplied !== undefined) return Boolean(signals);

    signals.dataset.signalsRedesignApplied = 'true';
    signals.classList.add('signals-queue-wrap');
    signals.innerHTML = `
      <section class="signals-queue" aria-labelledby="signals-queue-title">
        <header class="signals-queue__intro">
          <span class="signals-queue__eyebrow">LIVE FINDINGS</span>
          <h2 class="display" id="signals-queue-title">Signals as they surface.</h2>
          <p>New risks, misconfigurations and anomalies as they appear in your code and runtime.</p>
        </header>
        <ol class="signals-queue__list" aria-label="Validated engineering signals">
          <li class="is-current">
            <span class="signals-queue__severity signals-queue__severity--p1">P1</span>
            <strong>Tool retry skips approval check</strong>
            <span class="signals-queue__file">agent-runner.ts</span>
            <span class="signals-queue__state" aria-label="Current signal"></span>
          </li>
          <li>
            <span class="signals-queue__severity signals-queue__severity--p2">P2</span>
            <strong>Prompt version mismatch</strong>
            <span class="signals-queue__file">prompt.ts</span>
            <span class="signals-queue__state" aria-label="Validated signal"></span>
          </li>
          <li>
            <span class="signals-queue__severity signals-queue__severity--p1">P1</span>
            <strong>Unsafe tool scope</strong>
            <span class="signals-queue__file">tool-scope.ts</span>
            <span class="signals-queue__state" aria-label="Validated signal"></span>
          </li>
        </ol>
      </section>`;
    return true;
  };

  const applyHowJourneyRedesign = () => {
    const how = document.querySelector('#how');
    if (!how || how.dataset.howJourneyApplied !== undefined) return Boolean(how);

    how.dataset.howJourneyApplied = 'true';
    how.classList.add('how-journey-wrap');
    how.innerHTML = `
      <section class="how-journey" aria-labelledby="how-journey-title">
        <header class="how-journey__header">
          <span class="how-journey__eyebrow">HOW MYCO WORKS</span>
          <div class="how-journey__headline">
            <h2 class="display" id="how-journey-title"><span>Context first.</span><span>Then reasoning.</span></h2>
            <p>Myco builds a scoped engineering view of your codebase, systems and intent before evaluating a change. This gives the model the right context to reason, validate and surface what matters.</p>
          </div>
        </header>
        <ol class="how-journey__steps">
          <li>
            <div class="how-journey__symbol" aria-hidden="true"><span class="how-symbol how-symbol--layers"><i></i><i></i><i></i></span></div>
            <span class="how-journey__number">01</span><h3 class="display">Ingest</h3><p>We take in your change, codebase and relevant signals.</p>
          </li>
          <li>
            <div class="how-journey__symbol" aria-hidden="true"><span class="how-symbol how-symbol--overlap"><i></i><i></i></span></div>
            <span class="how-journey__number">02</span><h3 class="display">Build context</h3><p>We assemble a scoped view of the code, systems and intent.</p>
          </li>
          <li class="is-reason">
            <div class="how-journey__symbol" aria-hidden="true"><span class="how-symbol how-symbol--reason"><i></i></span></div>
            <span class="how-journey__number">03</span><h3 class="display">Reason</h3><p>We analyze the change with full context to find real impact.</p>
          </li>
          <li>
            <div class="how-journey__symbol" aria-hidden="true"><span class="how-symbol how-symbol--validate"><i></i><i></i></span></div>
            <span class="how-journey__number">04</span><h3 class="display">Validate</h3><p>We check findings across multiple signals and constraints.</p>
          </li>
          <li>
            <div class="how-journey__symbol" aria-hidden="true"><span class="how-symbol how-symbol--surface"><i></i><i></i><i></i></span></div>
            <span class="how-journey__number">05</span><h3 class="display">Score and surface</h3><p>We rank what matters and present clear, actionable insights.</p>
          </li>
        </ol>
      </section>`;
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
    section.innerHTML = `<section class="security-editorial" aria-labelledby="security-editorial-title"><header class="security-editorial__intro"><span class="eyebrow">SECURITY BY ARCHITECTURE</span><h2 class="display" id="security-editorial-title">Your code stays in your environment.</h2><p>Source code never leaves the environment you authorize. It is used only for active analysis and is never retained afterwards.</p></header><div class="security-editorial__rows"><article class="security-editorial__row"><img src="assets/security-boundary.svg" width="96" height="96" alt=""><div><span class="eyebrow">01 · PROCESSING BOUNDARY</span><h3 class="display">Code does not leave.</h3><p>Myco performs analysis within your authorized environment. Source code is not sent outside that boundary.</p></div></article><article class="security-editorial__row"><img src="assets/security-lifecycle.svg" width="96" height="96" alt=""><div><span class="eyebrow">02 · DATA LIFECYCLE</span><h3 class="display">Nothing to retain.</h3><p>Source code is discarded after the analysis that needs it. Myco does not retain a copy of your code.</p></div></article><article class="security-editorial__row"><img src="assets/security-readonly.svg" width="96" height="96" alt=""><div><span class="eyebrow">03 · ACCESS MODEL</span><h3 class="display">Read only by design.</h3><p>Myco observes authorized repository context. It does not write to source code or push changes to your repository.</p></div></article></div></section>`;
    return true;
  };
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const proofReady = applyProofMetrics();
    const layoutReady = applySectionLayout();
    const diffReady = applyDiffRedesign();
    const workflowProofReady = applyWorkflowProofRedesign();
    const signalsReady = applySignalsRedesign();
    const howJourneyReady = applyHowJourneyRedesign();
    const integrationReady = applyIntegrationWorkflowRedesign();
    const securityReady = applySecurityRedesign();
    if ((proofReady && layoutReady && diffReady && workflowProofReady && signalsReady && howJourneyReady && integrationReady && securityReady) || attempts === 20) clearInterval(timer);
  }, 50);
})();

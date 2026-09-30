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
    const stages = [...diff.querySelectorAll('.diff-card')].map((card, index) => ({
      number: card.querySelector('.eyebrow')?.textContent.split('·')[0].trim() || String(index + 1).padStart(2, '0'),
      label: card.querySelector('.eyebrow')?.textContent.split('·')[1]?.trim() || '',
      title: card.querySelector('.display')?.textContent.trim() || '',
      body: card.querySelector('p')?.textContent.trim() || '',
    }));
    if (stages.length !== 4) return false;

    diff.dataset.diffRedesignApplied = 'true';
    diff.classList.add('diff-system-wrap');
    diff.innerHTML = `
      <section class="diff-system" aria-labelledby="diff-system-title">
        <div class="diff-system__top">
          <header class="diff-system__intro">
            <span class="diff-system__rule" aria-hidden="true"></span>
            <h2 class="display" id="diff-system-title">${title}</h2>
            <p>${body}</p>
          </header>
          <div class="diff-system__diagram" aria-label="Context, reasoning, validation and signal inform a pull request review">
            <svg viewBox="0 0 620 330" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
              <path class="ds-wire" d="M102 77H174Q194 77 194 98V140H260"/>
              <path class="ds-wire" d="M102 244H174Q194 244 194 222V190H260"/>
              <path class="ds-wire" d="M518 77H446Q426 77 426 98V140H360"/>
              <path class="ds-wire" d="M518 244H446Q426 244 426 222V190H360"/>
              <path class="ds-output" d="M310 246V284"/>
              <g class="ds-annotation"><text x="24" y="71">CONTEXT</text><line x1="24" y1="86" x2="92" y2="86"/><line x1="24" y1="100" x2="78" y2="100"/></g>
              <g class="ds-annotation"><text x="24" y="238">REASONING</text><line x1="24" y1="253" x2="92" y2="253"/><line x1="24" y1="267" x2="68" y2="267"/></g>
              <g class="ds-annotation ds-annotation--right"><text x="596" y="71" text-anchor="end">VALIDATION</text><line x1="528" y1="86" x2="596" y2="86"/><line x1="542" y1="100" x2="596" y2="100"/></g>
              <g class="ds-annotation ds-annotation--right"><text x="596" y="238" text-anchor="end">SIGNAL</text><line x1="528" y1="253" x2="596" y2="253"/><line x1="552" y1="267" x2="596" y2="267"/></g>
              <g class="ds-pr">
                <rect x="260" y="70" width="100" height="176" rx="1"/>
                <path d="M278 99h64M278 117h49M278 145h64M278 163h41M278 181h60M278 199h46"/>
                <circle cx="280" cy="135" r="3"/><circle cx="280" cy="189" r="3"/>
                <text x="310" y="91" text-anchor="middle">PULL REQUEST</text>
              </g>
              <g class="ds-signal"><circle cx="310" cy="293" r="7"/><circle cx="310" cy="293" r="11"/><text x="310" y="320" text-anchor="middle">VALIDATED SIGNAL</text></g>
            </svg>
          </div>
        </div>
        <ol class="diff-system__ledger">
          ${stages.map(stage => `
            <li>
              <span class="diff-system__index">${stage.number}</span>
              <span class="diff-system__label">${stage.label}</span>
              <span class="diff-system__mark" aria-hidden="true"></span>
              <strong>${stage.title}</strong>
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
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const proofReady = applyProofMetrics();
    const layoutReady = applySectionLayout();
    const diffReady = applyDiffRedesign();
    const workflowProofReady = applyWorkflowProofRedesign();
    const signalsReady = applySignalsRedesign();
    if ((proofReady && layoutReady && diffReady && workflowProofReady && signalsReady) || attempts === 20) clearInterval(timer);
  }, 50);
})();

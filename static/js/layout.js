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
            <span class="proof-metric__marker" aria-hidden="true"></span>
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

    const showMetrics = () => {
      section.classList.add("is-visible");
      section.querySelectorAll(".proof-metric__number").forEach((number, index) => {
        countMetric(number, proofMetrics[index]);
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showMetrics();
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
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const proofReady = applyProofMetrics();
    const layoutReady = applySectionLayout();
    if ((proofReady && layoutReady) || attempts === 20) clearInterval(timer);
  }, 50);
})();

(() => {
  const mountMotion = (attempt = 0) => {
    const panel = document.querySelector('.hero-grid > div:nth-child(2)');
    if (!panel) {
      if (attempt < 40) setTimeout(() => mountMotion(attempt + 1), 50);
      return;
    }
    if (panel.dataset.mycoMotion) return;
    panel.dataset.mycoMotion = 'true';
    panel.replaceChildren();
    panel.classList.add('myco-motion-panel');
    panel.insertAdjacentHTML('beforeend', `
      <div class="review-trace" role="img" aria-label="A smooth animated review trace from a requirement and pull request to a validated bug report.">
        <svg viewBox="0 0 540 430" class="review-trace-svg" aria-hidden="true">
          <defs>
            <linearGradient id="traceGradient" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#39756D" stop-opacity=".12"/><stop offset=".48" stop-color="#39756D" stop-opacity=".78"/><stop offset="1" stop-color="#39756D" stop-opacity=".15"/></linearGradient>
            <filter id="traceGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path class="trace-line faint" d="M115 102 C176 116 188 183 257 207"/>
          <path class="trace-line faint" d="M425 111 C390 133 351 159 304 202"/>
          <path class="trace-line active" id="review-path" d="M286 237 C325 255 344 282 368 309 C391 335 420 333 451 325"/>
          <circle class="trace-dot dot-one" cx="115" cy="102" r="4"/><circle class="trace-dot dot-two" cx="425" cy="111" r="4"/>
          <circle class="trace-particle" cx="115" cy="102" r="4" filter="url(#traceGlow)"><animateMotion dur="4.8s" repeatCount="indefinite" path="M115 102 C176 116 188 183 257 207 C280 216 295 222 304 226 C325 255 344 282 368 309 C391 335 420 333 451 325"/></circle>
          <circle class="trace-particle secondary" cx="425" cy="111" r="3"><animateMotion dur="4.8s" begin="2.4s" repeatCount="indefinite" path="M425 111 C390 133 351 159 304 202 C325 255 344 282 368 309 C391 335 420 333 451 325"/></circle>
          <g class="trace-card source-card"><rect x="35" y="65" width="160" height="60" rx="3"/><circle cx="57" cy="87" r="5"/><text x="72" y="92">REQUIREMENT</text><text class="trace-sub" x="57" y="111">TAX-19 · preserve exemption</text></g>
          <g class="trace-card source-card"><rect x="335" y="74" width="165" height="60" rx="3"/><circle cx="357" cy="96" r="5"/><text x="372" y="101">PULL REQUEST</text><text class="trace-sub" x="357" y="120">#482 · amendment retry</text></g>
          <g class="trace-core"><circle class="core-ripple" cx="280" cy="221" r="49"/><circle class="core-disc" cx="280" cy="221" r="36"/><path d="M280 188 L309 205 L309 237 L280 254 L251 237 L251 205 Z"/><text x="280" y="218">MYCO</text><text class="trace-sub" x="280" y="233">REVIEW</text></g>
          <g class="trace-report"><rect x="294" y="292" width="206" height="92" rx="3"/><rect class="report-mark" x="294" y="292" width="4" height="92" rx="2"/><text class="report-label" x="316" y="318">VALIDATED BUG REPORT</text><line x1="316" y1="330" x2="478" y2="330"/><circle cx="320" cy="349" r="4"/><text class="report-body" x="332" y="353">Retry restores tax on exempt order</text><text class="report-evidence" x="316" y="373">3 EVIDENCE PATHS ATTACHED</text></g>
        </svg>
      </div>`);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMotion);
  else mountMotion();
})();

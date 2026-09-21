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
      <div class="evidence-field" role="img" aria-label="An animated evidence field where requirements, code context, review history and dependencies converge into a validated bug report.">
        <svg viewBox="0 0 560 440" class="evidence-field-svg" aria-hidden="true">
          <defs><filter id="fieldGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <circle class="field-ring ring-one" cx="282" cy="215" r="143"/><circle class="field-ring ring-two" cx="282" cy="215" r="109"/><circle class="field-ring ring-three" cx="282" cy="215" r="76"/>
          <g class="field-lines"><path d="M104 108 C181 111 191 160 241 190"/><path d="M100 310 C176 302 192 260 238 235"/><path d="M459 104 C393 125 373 161 327 190"/><path d="M468 313 C388 295 371 257 327 235"/><path class="field-output-line" d="M282 273 C282 310 282 329 282 359"/></g>
          <g class="field-particles"><circle r="3.5" filter="url(#fieldGlow)"><animateMotion dur="5.6s" repeatCount="indefinite" path="M104 108 C181 111 191 160 241 190"/></circle><circle r="3.5"><animateMotion dur="5.9s" begin="1.4s" repeatCount="indefinite" path="M100 310 C176 302 192 260 238 235"/></circle><circle r="3.5"><animateMotion dur="5.3s" begin="2.6s" repeatCount="indefinite" path="M459 104 C393 125 373 161 327 190"/></circle><circle r="3.5"><animateMotion dur="5.7s" begin=".7s" repeatCount="indefinite" path="M468 313 C388 295 371 257 327 235"/></circle></g>
          <g class="field-label label-a"><circle cx="100" cy="104" r="5"/><text x="117" y="100">REQUIREMENT</text><text class="field-sub" x="117" y="118">product intent</text></g>
          <g class="field-label label-b"><circle cx="96" cy="314" r="5"/><text x="113" y="310">DEPENDENCIES</text><text class="field-sub" x="113" y="328">impact path</text></g>
          <g class="field-label label-c"><circle cx="463" cy="100" r="5"/><text x="447" y="96" text-anchor="end">PR HISTORY</text><text class="field-sub" x="447" y="114" text-anchor="end">review context</text></g>
          <g class="field-label label-d"><circle cx="472" cy="317" r="5"/><text x="455" y="313" text-anchor="end">CODEBASE</text><text class="field-sub" x="455" y="331" text-anchor="end">system behavior</text></g>
          <g class="field-core"><circle cx="282" cy="215" r="57"/><path d="M282 174 L317 194 L317 236 L282 256 L247 236 L247 194 Z"/><text x="282" y="212">MYCO</text><text class="field-sub" x="282" y="230">REASONING</text></g>
          <g class="field-report"><circle cx="282" cy="374" r="5"/><line x1="302" y1="374" x2="458" y2="374"/><text x="302" y="367">VALIDATED BUG REPORT</text><text class="field-sub" x="302" y="389">evidence attached · ready to review</text></g>
        </svg>
      </div>`);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMotion);
  else mountMotion();
})();

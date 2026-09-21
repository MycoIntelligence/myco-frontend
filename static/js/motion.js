(() => {
  const mountMotion = () => {
    const panel = document.querySelector('.hero-grid > div:nth-child(2)');
    if (!panel || panel.dataset.mycoMotion) return;
    panel.dataset.mycoMotion = 'true';
    panel.replaceChildren();
    panel.classList.add('myco-motion-panel');
    panel.insertAdjacentHTML('beforeend', `
      <div class="myco-motion" role="img" aria-label="A subtle animated map showing engineering context becoming a validated Myco signal.">
        <div class="map-topline"><span>LIVE CONTEXT MAP</span><span>1,284 ARTIFACTS</span></div>
        <svg class="context-map" viewBox="0 0 520 390" aria-hidden="true">
          <g class="map-wires"><path d="M136 78 C180 78 192 147 222 177"/><path d="M124 196 C170 196 184 196 222 196"/><path d="M142 315 C179 315 195 245 222 216"/><path d="M298 185 C342 168 354 112 390 102"/><path d="M298 208 C345 224 355 273 397 276"/></g>
          <g class="map-flow"><circle r="3"><animateMotion dur="5s" repeatCount="indefinite" path="M136 78 C180 78 192 147 222 177"/></circle><circle r="3"><animateMotion dur="5.4s" begin=".8s" repeatCount="indefinite" path="M124 196 C170 196 184 196 222 196"/></circle><circle r="3"><animateMotion dur="5.1s" begin="1.4s" repeatCount="indefinite" path="M142 315 C179 315 195 245 222 216"/></circle><circle r="3"><animateMotion dur="4.8s" begin=".4s" repeatCount="indefinite" path="M298 208 C345 224 355 273 397 276"/></circle></g>
          <g class="map-node input"><rect x="42" y="57" width="94" height="42" rx="4"/><text x="58" y="76">INTENT</text><text class="map-sub" x="58" y="90">requirements</text></g>
          <g class="map-node input"><rect x="32" y="175" width="92" height="42" rx="4"/><text x="48" y="194">CHANGE</text><text class="map-sub" x="48" y="208">pull request</text></g>
          <g class="map-node input"><rect x="48" y="294" width="94" height="42" rx="4"/><text x="64" y="313">SCOPE</text><text class="map-sub" x="64" y="327">dependencies</text></g>
          <g class="map-core"><circle class="core-halo" cx="260" cy="196" r="60"/><circle class="core-ring" cx="260" cy="196" r="48"/><path d="M260 151 L299 174 L299 219 L260 241 L221 219 L221 174 Z"/><text x="260" y="193">MYCO</text><text class="map-sub" x="260" y="209">REASONING</text></g>
          <g class="map-node output"><rect x="390" y="81" width="94" height="42" rx="4"/><text x="406" y="100">IMPACT</text><text class="map-sub" x="406" y="114">traced paths</text></g>
          <g class="map-node output signal"><rect x="397" y="255" width="96" height="42" rx="4"/><circle cx="413" cy="276" r="4"/><text x="425" y="279">SIGNAL</text></g>
        </svg>
        <div class="map-footer"><span>CONTEXT</span><span>REASONING</span><span>VALIDATED SIGNAL</span></div>
      </div>`);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMotion);
  else mountMotion();
})();

(() => {
  const mountMotion = () => {
    const panel = document.querySelector('.hero-grid > div:nth-child(2)');
    if (!panel || panel.dataset.mycoMotion) return;
    panel.dataset.mycoMotion = 'true';
    panel.replaceChildren();
    panel.classList.add('myco-motion-panel');
    panel.insertAdjacentHTML('beforeend', `
      <div class="myco-motion" role="img" aria-label="An animated Myco analysis showing engineering context becoming validated signals.">
        <div class="motion-topline"><span>LIVE ANALYSIS</span><span class="motion-status"><i></i> RUNNING</span></div>
        <div class="motion-stage">
          <div class="motion-source source-one"><b>PR</b><span>checkout flow</span></div>
          <div class="motion-source source-two"><b>CTX</b><span>system context</span></div>
          <div class="motion-source source-three"><b>REQ</b><span>product intent</span></div>
          <span class="motion-wire wire-one"></span><span class="motion-wire wire-two"></span><span class="motion-wire wire-three"></span>
          <div class="motion-core"><span class="motion-orbit orbit-a"></span><span class="motion-orbit orbit-b"></span><div><strong>MYCO</strong><small>AGENT MESH</small></div></div>
          <span class="motion-wire wire-out"></span>
          <div class="motion-output"><div class="output-label">EVIDENCE-BACKED SIGNALS</div><div class="output-row"><i></i><span>Dependency traced</span><em>READY</em></div><div class="output-row active"><i></i><span>Requirement checked</span><em>FOUND</em></div><div class="output-row"><i></i><span>Review context attached</span><em>READY</em></div></div>
        </div>
        <div class="motion-footer"><span>SCOPED CONTEXT</span><span>→</span><span>TRACEABLE OUTPUT</span></div>
      </div>`);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMotion);
  else mountMotion();
})();

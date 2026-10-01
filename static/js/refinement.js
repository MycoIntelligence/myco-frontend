/* Final page composition, after the static build's section upgrades. */
(() => {
  const compose = () => {
    const engine = document.querySelector('.context-section');
    const diff = document.querySelector('.diff-system-wrap');
    const flow = engine?.querySelector('[data-flow-preview]');
    const workflow = document.querySelector('.integration-workflow');
    if (!engine || !diff || !flow || !workflow) return false;
    if (engine.dataset.pageComposed) return true;
    engine.dataset.pageComposed = 'true';
    const visual = flow.parentElement;
    visual.classList.add('context-section__visual');
    const integration = document.querySelector('#integrate');
    integration.querySelector('.split-head')?.remove();
    const heading = workflow.querySelector('h3');
    const h2 = document.createElement('h2');
    h2.id = heading.id;
    h2.className = heading.className;
    h2.textContent = 'Connect your repository. Keep your stack.';
    heading.replaceWith(h2);
    workflow.querySelector('.integration-workflow__header p').textContent = 'Myco fits into the workflow already in place. It observes authorized engineering context, builds the model it needs, and surfaces evidence where the team works.';
    const footerGrid = document.querySelector('.footer-grid');
    const footer = footerGrid?.parentElement;
    if (footer) {
      footer.classList.add('page-footer');
      const closing = document.createElement('section');
      closing.className = 'page-closing';
      closing.setAttribute('aria-labelledby', 'page-closing-title');
      closing.innerHTML = '<div><span class="eyebrow">REQUEST A PILOT</span><h2 id="page-closing-title">See Myco in your workflow.</h2><p>Request a pilot to explore Myco with your engineering team.</p></div><div class="page-closing__action"></div>';
      const button = footerGrid.querySelector('button');
      if (button) closing.querySelector('.page-closing__action').append(button);
      footer.prepend(closing);
      footerGrid.classList.add('page-footer__grid');
      footerGrid.nextElementSibling?.classList.add('page-footer__legal');
      footer.querySelectorAll('span').forEach(span => {
        if (span.textContent.trim() === 'DEMO CLONE · MOCK DATA') span.remove();
      });
    }
    engine.setAttribute('role', 'region');
    const engineTitle = engine.querySelector('h2');
    engineTitle.id = 'context-section-title';
    engine.setAttribute('aria-labelledby', engineTitle.id);
    return true;
  };
  if (compose()) return;
  const observer = new MutationObserver(() => { if (compose()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();

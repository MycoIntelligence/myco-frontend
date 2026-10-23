/* Public product narrative. Internal release names must not appear in customer copy. */
(() => {
  const apply = () => {
    const engine = document.querySelector('.context-section[data-page-composed]');
    const hero = document.querySelector('#overview');
    const diff = document.querySelector('.diff-system-wrap');
    const how = document.querySelector('#how');
    const closing = document.querySelector('.page-closing');
    if (!engine || !hero?.querySelector('h1') || !diff || !how || !closing) return false;
    if (hero.dataset.productNarrative) return true;
    hero.dataset.productNarrative = 'true';
    const set = (root, selector, text) => {
      const element = root.querySelector(selector);
      if (element) element.textContent = text;
    };
    const lines = (element, copy) => element.replaceChildren(...copy.map(text => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    }));

    set(hero, '.eyebrow', 'SOFTWARE QUALITY, IN THE DEVELOPMENT WORKFLOW');
    lines(hero.querySelector('h1'), ['AI made writing code faster.', 'Shipping is still the bottleneck.']);
    set(hero, '.hero-grid p', 'Myco reviews pull requests against product requirements, codebase context and dependencies, helping engineers catch bugs while the change is still fresh.');
    hero.classList.add('product-hero');

    // Explain the problem before introducing the current review mechanism.
    engine.before(diff);
    lines(diff.querySelector('h2'), ['Finished coding.', 'Still waiting to ship.']);
    set(diff, '.diff-system__intro>p', 'For many teams, implementation is only the start of validation. Requirements need interpreting, tests need preparing, and failures need investigating. Each handoff can delay feedback and pull engineers back into code they have moved on from.');
    const stages = [
      ['QA HANDOFF', 'The feature moves from implementation into a separate validation process.'],
      ['TEST PREPARATION', 'The team translates intended behavior into scenarios and checks.'],
      ['FAILURE INVESTIGATION', 'Engineers reconstruct context to understand what failed and why.'],
      ['FIX AND RETEST', 'Changes go back through another cycle before the release can move forward.'],
    ];
    diff.querySelectorAll('.diff-system__ledger li').forEach((item, index) => {
      set(item, '.diff-system__label', stages[index][0]);
      set(item, 'p', stages[index][1]);
    });
    set(engine, '.context-section__header .eyebrow', 'AVAILABLE TODAY · CONTEXT-AWARE PR REVIEW');
    lines(engine.querySelector('h2'), ['Catch bugs while', 'the change is fresh.']);
    set(engine, '.context-section__header p', 'Myco brings product requirements, pull request context and relevant code and dependencies into the review. Engineers get prioritized findings with evidence they can inspect, before the change is merged.');

    const proof = document.querySelector('.workflow-proof');
    if (proof) {
      set(proof, '.workflow-proof__eyebrow', 'AN ILLUSTRATIVE REVIEW');
      set(proof, '.workflow-proof__intro p', 'Myco traces relevant code paths and compares them with product requirements to identify issues that a diff alone can miss. This example shows how an agent retry can bypass an approval requirement.');
    }
    set(how, '.how-journey__eyebrow', 'HOW PR REVIEW WORKS TODAY');
    set(how, '.how-journey__headline p', 'Myco builds a scoped view of the change, relevant code and intended behavior. It reviews potential issues, validates findings and ranks what deserves attention. This review does not execute your tests.');

    const expansion = document.createElement('div');
    expansion.className = 'wrap quality-expansion-wrap';
    expansion.innerHTML = `<section class="quality-expansion" aria-labelledby="quality-expansion-title">
      <header class="quality-expansion__header"><div><p class="eyebrow">BUILDING NEXT</p><h2 class="display" id="quality-expansion-title">From requirements<br>to release confidence.</h2></div><div><p>We are expanding Myco beyond PR review to bring more of the quality-assurance process into the development workflow.</p><p class="quality-expansion__status">These capabilities are in development and are not included in the current PR-review release.</p></div></header>
      <ol class="quality-expansion__steps">
        <li><span class="mono">01 / INTENDED BEHAVIOR</span><h3>Derive the scenarios.</h3><p>Myco will derive test scenarios from requirements, including edge cases and failure paths, rather than relying only on tests already written.</p></li>
        <li><span class="mono">02 / COVERAGE GAPS</span><h3>Evaluate the tests.</h3><p>Myco will compare those scenarios with existing tests to identify missing or incorrect coverage and recommend additional checks.</p></li>
        <li><span class="mono">03 / FAILURE EVIDENCE</span><h3>Run and investigate.</h3><p>Myco will execute relevant tests in supported, authorized environments and investigate failures, explaining likely causes with evidence and visible uncertainty.</p></li>
      </ol><p class="quality-expansion__outcome">The goal: less time from implementation complete to production, without compromising release quality. Engineers and QA teams stay in control.</p>
    </section>`;
    how.after(expansion);
    set(closing, '.eyebrow', 'EXPLORE MYCO WITH YOUR TEAM');
    set(closing, 'h2', 'Bring quality feedback closer to the code.');
    set(closing, 'p', 'Explore today’s PR review with your team and discuss the quality workflows we are building next.');
    set(document, '.footer-grid p', 'Software-quality intelligence for engineering teams. Built to help you ship reliable software faster.');
    return true;
  };
  if (apply()) return;
  const observer = new MutationObserver(() => { if (apply()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();

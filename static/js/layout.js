/* Keeps the published static build aligned with the editable component source. */
(() => {
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
    if (applySectionLayout() || attempts === 20) clearInterval(timer);
  }, 50);
})();

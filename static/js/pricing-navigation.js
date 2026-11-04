/* Keep the separate pricing page discoverable from existing homepage navigation. */
(() => {
  const addLink = (container) => {
    if (!container || container.querySelector('a[href="/pricing/"]')) return;
    const link = document.createElement('a');
    link.href = '/pricing/';
    link.textContent = 'Pricing';
    container.append(link);
  };
  const mount = () => {
    const nav = document.querySelector('.App > div:first-child nav .nav-links');
    if (!nav) return false;
    addLink(nav);
    addLink(document.getElementById('mobile-navigation'));
    addLink(document.querySelector('footer nav'));
    return true;
  };
  if (!mount()) {
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.getElementById('root'), {childList:true, subtree:true});
  }
})();

(() => {
  const header = document.getElementById('site-header');
  const menuButton = document.getElementById('menu-toggle');
  const currentLabel = document.getElementById('menu-current');
  const links = [...document.querySelectorAll('[data-section-link]')];
  const sections = links.map(link => document.getElementById(link.dataset.sectionLink));
  const mobile = window.matchMedia('(max-width: 800px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeMenu(returnFocus = false) {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  }
  function setActive(id) {
    links.forEach(link => {
      const active = link.dataset.sectionLink === id;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
        currentLabel.textContent = link.textContent;
      } else link.removeAttribute('aria-current');
    });
  }
  function updateNavigation() {
    const readingLine = header.offsetHeight + 120;
    let active = sections[0];
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= readingLine) active = section;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = sections[sections.length - 1];
    setActive(active.id);
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateNavigation(); scheduled = false; });
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  menuButton.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  header.addEventListener('focusout', () => {
    requestAnimationFrame(() => { if (!header.contains(document.activeElement)) closeMenu(); });
  });
  mobile.addEventListener('change', () => closeMenu());

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      const wasMenuLink = mobile.matches && link.closest('#site-nav');
      closeMenu(Boolean(wasMenuLink));
      history.pushState(null, '', `#${id}`);
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (id === 'main') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
  function alignFragment() {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    updateNavigation();
  }
  window.addEventListener('hashchange', alignFragment);
  // Align direct fragment visits after font loading to avoid layout-shift offsets.
  window.addEventListener('load', () => document.fonts.ready.then(alignFragment));
  updateNavigation();

  const replay = document.getElementById('replay-trace');
  const record = document.getElementById('evidence-record');
  let replayTimer;
  replay.hidden = false;
  replay.addEventListener('click', () => {
    clearTimeout(replayTimer);
    record.classList.remove('playing');
    if (reducedMotion.matches) return;
    void record.offsetWidth;
    record.classList.add('playing');
    replayTimer = setTimeout(() => record.classList.remove('playing'), 2400);
  });
  reducedMotion.addEventListener('change', () => {
    clearTimeout(replayTimer);
    record.classList.remove('playing');
  });
})();

/* A single illustrative reading path. Text and layout never depend on animation. */
(() => {
  const figure = document.querySelector('.hero-evidence');
  const trace = document.getElementById('hero-trace');
  const replay = document.querySelector('.hero-replay');
  if (!figure || !trace || !replay) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let startTimer;
  let finishTimer;
  let hasPlayed = false;
  let running = false;
  let ready = false;

  function syncControl() {
    replay.setAttribute('aria-disabled', String(running || reduced.matches));
    replay.title = reduced.matches ? 'Animation off: reduced motion is enabled.' : 'Replay the illustrative evidence trace';
  }
  function complete() {
    clearTimeout(startTimer);
    clearTimeout(finishTimer);
    hasPlayed = true;
    running = false;
    trace.classList.remove('hero-waiting', 'hero-playing');
    syncControl();
  }
  function play() {
    if (running || reduced.matches || document.hidden) return;
    clearTimeout(startTimer);
    hasPlayed = true;
    running = true;
    trace.classList.remove('hero-waiting', 'hero-playing');
    // Restart CSS choreography only on an explicit replay; repeated clicks are ignored.
    void trace.offsetWidth;
    trace.classList.add('hero-playing');
    syncControl();
    finishTimer = setTimeout(complete, 3050);
  }
  function inspectVisibility() {
    if (!ready || (hasPlayed && !running)) return;
    const bounds = figure.getBoundingClientRect();
    const top = document.getElementById('site-header').offsetHeight + 20;
    const bottom = window.innerHeight - 24;
    const fits = bounds.height <= bottom - top;
    const comfortablyVisible = bounds.top >= top && bounds.bottom <= bottom;
    if (!fits || reduced.matches) { complete(); return; }
    if (running) {
      if (bounds.bottom <= top || bounds.top >= bottom) complete();
      return;
    }
    // Fast scrolling or direct section visits should leave finished evidence, not a waiting state.
    if (bounds.top < top) { complete(); return; }
    clearTimeout(startTimer);
    if (!hasPlayed && comfortablyVisible && !document.hidden) {
      startTimer = setTimeout(play, 250);
    }
  }

  replay.hidden = false;
  replay.addEventListener('click', play);
  syncControl();
  if (!reduced.matches && 'IntersectionObserver' in window) {
    trace.classList.add('hero-waiting');
    observer = new IntersectionObserver(inspectVisibility, { threshold: [0, .5, .95, 1] });
    observer.observe(figure);
    // Geometry checks also account for the sticky header and narrow viewports.
    window.addEventListener('scroll', inspectVisibility, { passive: true });
    window.addEventListener('resize', () => {
      if (running) complete();
      inspectVisibility();
    });
    const initialize = () => {
      ready = true;
      inspectVisibility();
    };
    if (document.fonts) document.fonts.ready.then(initialize);
    else initialize();
    window.addEventListener('load', inspectVisibility, { once: true });
  } else complete();
  reduced.addEventListener('change', complete);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(startTimer);
      if (running) complete();
    } else inspectVisibility();
  });
})();

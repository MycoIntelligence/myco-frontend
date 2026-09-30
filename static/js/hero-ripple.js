/* Approved travelling ripple: an eight-second, full-width woven background. */
(() => {
  function mount() {
    const hero = document.querySelector('#overview');
    if (!hero) return false;
    if (hero.querySelector('.hero-ripple')) return true;
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-ripple';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    hero.prepend(canvas);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hero-ripple-toggle';
    button.textContent = 'Pause background motion';
    hero.append(button);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, elapsed = 0, last = 0, frame = 0;
    let paused = false, visible = true;
    const accent = getComputedStyle(hero).getPropertyValue('--accent').trim() || '#39756d';
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed / 8 * Math.PI * 2;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (let row = -1; row < Math.ceil(height / 21) + 1; row++) {
        for (let col = -1; col < Math.ceil(width / 24) + 1; col++) {
          const x = col * 24 + 10;
          const phase = t - col * .24 - row * .13;
          const y = row * 21 + 10 + 5 * Math.sin(phase);
          const angle = .7 * Math.cos(phase);
          const length = 11 + 2 * Math.sin(phase);
          const edge = Math.pow(Math.min(1, Math.abs(x - width / 2) / (width / 2)), 1.8);
          ctx.globalAlpha = (.014 + .48 * edge) * (.72 + .28 * (Math.sin(phase) + 1) / 2);
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(angle) * length / 2, y - Math.sin(angle) * length / 2);
          ctx.lineTo(x + Math.cos(angle) * length / 2, y + Math.sin(angle) * length / 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    function tick(now) {
      if (last) elapsed += Math.min((now - last) / 1000, .1);
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      button.hidden = reduced.matches;
      if (!paused && !reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
      else draw();
    }
    new ResizeObserver(() => {
      width = hero.clientWidth;
      height = hero.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }).observe(hero);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
    button.addEventListener('click', () => {
      paused = !paused;
      button.textContent = paused ? 'Resume background motion' : 'Pause background motion';
      sync();
    });
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return true;
  }
  if (!mount()) {
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
  }
})();

/* A non-modal disclosure menu for mobile navigation. */
(() => {
  const mount = () => {
    const nav = document.querySelector('.App > div:first-child nav') || document.querySelector('nav.site-nav');
    const links = nav?.querySelector('.nav-links');
    if (!nav || !links) return false;
    if (nav.dataset.mobileNavigation) return true;
    nav.dataset.mobileNavigation = 'true';
    nav.classList.add('site-nav');

    let actions = nav.querySelector('.site-nav__actions');
    if (!actions) {
      actions = nav.lastElementChild;
      actions.classList.add('site-nav__actions');
    }

    let button = nav.querySelector('.mobile-menu-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-menu-toggle';
      button.setAttribute('aria-label', 'Open navigation menu');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'mobile-navigation');
      button.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span>';
      actions.prepend(button);
    }

    let menu = nav.querySelector('#mobile-navigation');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'mobile-navigation';
      menu.className = 'mobile-navigation';
      menu.hidden = true;
      links.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href') === '#playground') return;
        const item = document.createElement('a');
        item.href = link.getAttribute('href');
        item.textContent = link.textContent.trim();
        menu.append(item);
      });
      nav.append(menu);
    }

    const setOpen = (open, focusToggle = false) => {
      menu.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (open) {
        const activeItem = menu.querySelector('a[aria-current="location"]') || menu.querySelector('a');
        activeItem?.focus({ preventScroll: true });
      } else if (focusToggle) {
        button.focus();
      }
    };

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(menu.hidden);
    });

    menu.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      setOpen(false);
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        try {
          const section = document.querySelector(href);
          if (section) { section.setAttribute('tabindex', '-1'); section.focus({preventScroll:true}); }
        } catch (_) {}
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) { setOpen(false, true); event.preventDefault(); }
    });

    document.addEventListener('click', event => {
      if (!menu.hidden && (!nav.contains(event.target) || event.target.closest('.site-nav__actions .btn'))) {
        setOpen(false);
      }
    });

    const narrow = window.matchMedia('(max-width:900px)');
    narrow.addEventListener('change', () => setOpen(false));

    let scheduled = false;
    const updateCurrent = () => {
      scheduled = false;
      const items = [...menu.querySelectorAll('a')];
      let current = null;
      items.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.startsWith('#')) {
          try {
            const section = document.querySelector(href);
            if (section && section.getBoundingClientRect().top <= 160) current = item;
          } catch (_) {}
        } else if (href && (window.location.pathname === href || window.location.pathname + '/' === href)) {
          current = item;
        }
      });
      if (current) {
        items.forEach(item => item === current ? item.setAttribute('aria-current','location') : item.removeAttribute('aria-current'));
      }
    };

    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateCurrent); }
    }, {passive:true});
    updateCurrent();
    return true;
  };
  if (mount()) return;
  const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();

/* Shared page behaviour: fade-out navigation fallback, header scroll state,
   scroll reveals, 3D tilt on product mocks, copy buttons. */
(function () {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');

  /* ── fade out before leaving (only where view transitions aren't available) ── */
  if (root.classList.contains('fade-nav')) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return; // in-page anchor
      if (url.pathname.startsWith('/api/')) return;
      e.preventDefault();
      root.classList.add('leaving');
      setTimeout(() => { location.href = url.href; }, 190);
    });
    // Coming back via the back/forward cache: don't stay faded out.
    window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });
  }

  /* ── header gets a solid backdrop once the page scrolls ── */
  const bar = document.querySelector('.topbar:not(.home-bar)');
  if (bar) {
    const sync = () => bar.setAttribute('data-scrolled', String(window.scrollY > 8));
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  /* ── scroll reveal ── */
  const reveals = document.querySelectorAll('.rv, .rv-stagger');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ── 3D tilt toward the pointer ── */
  document.querySelectorAll('.tilt').forEach((frame) => {
    let raf = 0;
    const max = Number(frame.dataset.tilt || 8);
    frame.addEventListener('pointermove', (e) => {
      if (!fine.matches || reduced.matches || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = frame.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        frame.classList.add('tracking');
        frame.style.setProperty('--ty', (x * max).toFixed(2) + 'deg');
        frame.style.setProperty('--tx', (-y * max).toFixed(2) + 'deg');
        frame.style.setProperty('--lx', ((x + 0.5) * 100).toFixed(1) + '%');
        frame.style.setProperty('--ly', ((y + 0.5) * 100).toFixed(1) + '%');
      });
    });
    frame.addEventListener('pointerleave', () => {
      frame.classList.remove('tracking');
      frame.style.removeProperty('--tx');
      frame.style.removeProperty('--ty');
    });
  });

  /* ── copy buttons ── */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('.copy-t') || btn;
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      label.textContent = 'Copied';
      btn.setAttribute('data-done', '');
      setTimeout(() => { label.textContent = 'Copy'; btn.removeAttribute('data-done'); }, 1600);
    });
  });
})();

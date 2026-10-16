/* Burger menu: keeps aria-expanded on the button and data-open on the menu in sync. */
(function () {
  var btn = document.querySelector('.burger');
  var menu = document.getElementById('site-menu');
  if (!btn || !menu) return;

  function isOpen() { return menu.getAttribute('data-open') === 'true'; }

  function set(open, returnFocus) {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('data-open', String(open));
    if (open) {
      var first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      btn.focus({ preventScroll: true });
    }
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(!isOpen());
  });

  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (menu.contains(e.target)) {
      if (e.target.closest('a')) set(false);
      return;
    }
    set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) set(false, true);
  });

  // Landscape frames never show the collapsed menu.
  var landscape = window.matchMedia('(min-aspect-ratio: 1/1)');
  function onShape(e) { if (e.matches && isOpen()) set(false); }
  if (landscape.addEventListener) landscape.addEventListener('change', onShape);
  else if (landscape.addListener) landscape.addListener(onShape);
})();

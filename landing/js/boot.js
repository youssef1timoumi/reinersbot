/* Runs blocking in <head> on every page, before first paint:
   - .js        lets CSS pre-hide scroll-reveal content only when JS will reveal it
   - .fade-nav  page fade for browsers without cross-document view transitions
   Kept external (not inline) so the CSP can stay script-src 'self'. */
(function (root) {
  root.classList.add('js');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && !('onpagereveal' in window)) root.classList.add('fade-nav');
})(document.documentElement);

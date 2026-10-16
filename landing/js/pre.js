/* Entrance pre-state: loaded as a blocking script in <head> so .pre is on <html>
   before first paint. Skipped without WAAPI or with reduced motion; self-heals
   after 4s in case js/entrance.js never runs. Kept external (not inline) so the
   CSP can stay script-src 'self'. */
(function (root) {
  root.classList.add('js'); // lets CSS hide scroll-reveal content only when JS will reveal it
  if (!('animate' in Element.prototype)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('pre');
  setTimeout(function () { root.classList.remove('pre'); }, 4000);
})(document.documentElement);

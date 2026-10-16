/* Background plate: shows the clip once it can actually play, holds it on
   frame 1 for reduced motion, resyncs after the tab is backgrounded, and falls
   back to the CSS backdrop (.card.no-video) if the clip is missing or broken. */
(function () {
  var card = document.querySelector('.card');
  var video = card && card.querySelector('video.bg');
  if (!video) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var failed = false;

  function fail() {
    if (failed) return;
    failed = true;
    card.classList.remove('video-ready');
    card.classList.add('no-video');
    try { video.pause(); } catch (e) {}
  }

  function sync() {
    if (failed) return;
    if (reduced.matches) {
      video.pause();
      if (video.readyState >= 1 && video.currentTime !== 0) {
        try { video.currentTime = 0; } catch (e) {}
      }
      return;
    }
    if (document.hidden) { video.pause(); return; }
    if (video.paused) {
      var p = video.play();
      if (p && p.catch) {
        p.catch(function (err) {
          // AbortError just means a pause() interrupted us; anything else means it can't play.
          if (!err || err.name !== 'AbortError') fail();
        });
      }
    }
  }

  var hasSource = video.getAttribute('src') || video.querySelector('source');
  if (!hasSource || !video.canPlayType || video.canPlayType('video/mp4') === '') { fail(); return; }

  video.addEventListener('error', fail);
  var sources = video.querySelectorAll('source');
  if (sources.length) sources[sources.length - 1].addEventListener('error', fail);

  video.addEventListener('loadeddata', function () {
    if (failed) return;
    card.classList.add('video-ready');
    sync();
  });

  // Errors may have fired before this deferred script ran.
  if (video.error || video.networkState === 3 /* NETWORK_NO_SOURCE */) { fail(); return; }
  if (video.readyState >= 2) card.classList.add('video-ready');

  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  else if (reduced.addListener) reduced.addListener(sync);
  document.addEventListener('visibilitychange', sync);

  sync();
})();

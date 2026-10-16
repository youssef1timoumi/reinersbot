/* Entrance timeline (WAAPI). Runs once, then removes html.pre, cancels every
   animation and deletes its own <script>. The background plate never animates.

   Four behaviours:
     rise   — masked upward reveal (headline lines, stat numbers)
     lift   — quiet fade + small rise (eyebrow, tagline, labels, credit)
     settle — glass scale + translate + fade (pills, panel, play, burger)
     accent — scale-draw (nav divider, dot, feature icons, slash) */
(function () {
  var root = document.documentElement;
  var script = document.currentScript;

  function done() { if (script && script.parentNode) script.parentNode.removeChild(script); }

  if (!root.classList.contains('pre')) { done(); return; }

  var narrow = window.matchMedia('(max-width: 640px), (max-aspect-ratio: 1/1)').matches;
  var k = narrow ? 0.85 : 1;
  var u = Math.min(window.innerWidth / 1280, window.innerHeight / 960);
  if (narrow) u = Math.max(u, 0.8);
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  var FRAMES = {
    rise: [
      { translate: '0 100%', clipPath: 'inset(-20% -5% 100% -5%)' },
      { translate: '0 0', clipPath: 'inset(-20% -5% -20% -5%)' }
    ],
    lift: [
      { opacity: 0, translate: '0 ' + (10 * u) + 'px' },
      { opacity: 1, translate: '0 0' }
    ],
    settle: [
      { opacity: 0, scale: '.94', translate: '0 ' + (14 * u) + 'px' },
      { opacity: 1, scale: '1', translate: '0 0' }
    ],
    accent: [{ scale: '0' }, { scale: '1' }],
    accentX: [{ scale: '0 1' }, { scale: '1 1' }],
    accentY: [{ scale: '1 0' }, { scale: '1 1' }]
  };
  var DURATION = { rise: 1000, lift: 800, settle: 900, accent: 700, accentX: 1100, accentY: 600 };

  // [selector, behaviour, first delay (ms), stagger between matches (ms)]
  var TIMELINE = [
    // header
    ['.brand', 'settle', 0, 0],
    ['.nav', 'settle', 80, 0],
    ['.n-div', 'accentY', 320, 0],
    ['.cta', 'settle', 160, 0],
    ['.burger', 'settle', 160, 0],
    // headline
    ['.eyebrow', 'lift', 260, 0],
    ['.dot', 'accent', 420, 0],
    ['.hero-h .line', 'rise', 340, 110],
    // tagline + play
    ['.play', 'settle', 640, 0],
    ['.tag', 'lift', 700, 0],
    // panel
    ['.panel', 'settle', 820, 0],
    ['.p-icon', 'accent', 960, 70],
    ['.feats li > span:last-child', 'lift', 1000, 70],
    // stats
    ['.num', 'rise', 1000, 120],
    ['.lbl', 'lift', 1120, 120],
    ['.slash', 'accent', 1100, 0],
    // meet pill last
    ['.meet', 'settle', 1250, 0],
    ['.credit', 'lift', 1350, 0]
  ];

  var started = false;
  function start() {
    if (started) return;
    started = true;

    var anims = [];
    TIMELINE.forEach(function (step) {
      var els = document.querySelectorAll(step[0]);
      for (var i = 0; i < els.length; i++) {
        anims.push(els[i].animate(FRAMES[step[1]], {
          duration: DURATION[step[1]] * k,
          delay: (step[2] + i * step[3]) * k,
          easing: EASE,
          fill: 'both'
        }));
      }
    });

    function finish() {
      root.classList.remove('pre');
      anims.forEach(function (a) { a.cancel(); });
      done();
    }
    Promise.all(anims.map(function (a) { return a.finished; })).then(finish, finish);
  }

  // Wait for Inter (display=block) so lines don't reveal as invisible text, but never for long.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
    setTimeout(start, 700);
  } else {
    start();
  }
})();

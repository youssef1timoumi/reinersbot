/* Live preview: scripted Discord scenes played inside the 3D stage.
   - Scenes autoplay in tab order; clicking a tab jumps to it.
   - Scene time only advances while the stage is on screen and the tab is
     visible, so nothing plays to an empty room.
   - Reduced motion: each scene renders straight to its final state, no autoplay.
   - The rig tilts toward the pointer on devices with a fine pointer. */
(function () {
  const stage = document.getElementById('sc-stage');
  if (!stage) return;

  const $ = (sel) => stage.querySelector(sel);
  const log = $('.dc-log');
  const input = $('.dc-input');
  const typed = $('.dc-typed');
  const placeholder = $('.dc-ph');
  const title = $('.dc-title');
  const channels = stage.querySelectorAll('.dc-ch');
  const sats = stage.querySelectorAll('.sat');
  const dashItems = stage.querySelectorAll('.sb-side span');
  const dashKey = document.getElementById('sb-k1');
  const dashVal = document.getElementById('sb-v1');
  const descs = stage.querySelectorAll('#sc-desc li');
  const tabs = Array.from(document.querySelectorAll('.sc-tab'));
  const order = tabs.map((t) => t.dataset.scene);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const LOGO = '/assets/logo-112.webp';
  // Inline icon from the sprite, optionally tinted.
  const I = (id, color) => `<svg class="ic"${color ? ` style="--ic:${color}"` : ''} aria-hidden="true"><use href="/assets/icons.svg#${id}"/></svg>`;
  const STOP = {};

  let run = 0;          // id of the scene currently allowed to touch the DOM
  let visible = false;  // stage on screen
  let played = 0;       // visible ms played in the current scene (drives the tab progress bar)
  let current = null;

  /* ── timing ── */
  function wait(ms, id) {
    if (reduced.matches) ms = 0;
    return new Promise((resolve, reject) => {
      let left = ms;
      let last = performance.now();
      const tick = (now) => {
        if (id !== run) return reject(STOP);
        if (visible && !document.hidden) {
          const dt = Math.min(now - last, 100);
          left -= dt;
          played += dt;
        }
        last = now;
        if (left <= 0) return resolve();
        requestAnimationFrame(tick);
      };
      tick(last);
    });
  }

  /* ── scene API ── */
  function api(id) {
    const P = {
      wait: (ms) => wait(ms, id),

      channel(name) {
        title.textContent = name;
        placeholder.textContent = 'Message #' + name;
        channels.forEach((c) => c.toggleAttribute('data-on', c.dataset.ch === name));
      },

      async type(text) {
        input.setAttribute('data-typing', '');
        for (let i = 1; i <= text.length; i++) {
          typed.textContent = text.slice(0, i);
          await P.wait(text[i - 1] === ' ' ? 70 : 40);
        }
        await P.wait(360);
        typed.textContent = '';
        input.removeAttribute('data-typing');
      },

      user(name, color, html) {
        return post(
          `<span class="av" style="--a:${color}">${name[0]}</span>` +
          `<div class="m-body"><p class="m-meta"><b style="--n:${color}">${name}</b><time>Today at 21:04</time></p>` +
          `<p class="m-text">${html}</p></div>`
        );
      },

      bot({ used, text, embed }) {
        let html = '<span class="av"><img src="' + LOGO + '" alt=""></span><div class="m-body">';
        if (used) html += `<p class="m-used">↳ <b>${used[0]}</b> used <code>${used[1]}</code></p>`;
        html += '<p class="m-meta"><b style="--n:#c4b5fd">Reiner</b><span class="tag-app">APP</span><time>Today at 21:04</time></p>';
        if (text) html += `<p class="m-text">${text}</p>`;
        if (embed) {
          html += `<div class="em" style="--em:${embed.color}"><b class="em-t">${embed.title}</b><div class="em-b">${embed.body}</div></div>`;
        }
        return post(html + '</div>');
      },

      sat(i, icon, head, sub, color) {
        const el = sats[i];
        if (!el) return;
        el.removeAttribute('data-on');
        el.style.setProperty('--c', color);
        el.style.setProperty('--g', color + '99');
        el.innerHTML = `<i>${I(icon)}</i><span>${head}<small>${sub}</small></span>`;
        void el.offsetWidth; // restart the pop-in transition
        el.setAttribute('data-on', '');
      },

      dash(key, label, value) {
        dashItems.forEach((d) => d.toggleAttribute('data-on', d.dataset.k === key));
        dashKey.textContent = label;
        dashVal.textContent = value;
      },

      bar(msg, pct) {
        const fill = msg.querySelector('.em-bar');
        if (fill) requestAnimationFrame(() => fill.style.setProperty('--w', pct + '%'));
      }
    };
    return P;
  }

  function post(inner) {
    const m = document.createElement('div');
    m.className = 'm anim';
    m.innerHTML = inner;
    log.appendChild(m);
    while (log.children.length > 7) log.removeChild(log.firstElementChild);
    return m;
  }

  /* ── scenes (commands and replies mirror the real bot) ── */
  const SCENES = {
    async lobby(P) {
      P.channel('lobby-queue');
      P.dash('lobby', 'Lobbies today', '3');
      await P.wait(500);
      await P.type('/sendqueue #lobby-queue');
      const q = P.bot({
        used: ['Nova', '/sendqueue'],
        embed: {
          color: '#34d399', title: 'League custom lobby',
          body: '<p>Join the <b>Queue Lobby</b> voice channel to play.</p><p><b class="qn">9 / 10</b> players in the lobby</p><div class="em-bar"><i></i></div>' +
                '<p class="qp">Kai, Nova, Zed_Main, Lumi, Ash, Pyro, Vex, Mira, Duo</p>'
        }
      });
      P.bar(q, 90);
      P.sat(0, 'volume', 'Queue Lobby', '9 / 10 in voice', '#34d399');
      await P.wait(1300);
      q.querySelector('.qn').textContent = '10 / 10';
      q.querySelector('.qp').textContent += ', Rook';
      P.bar(q, 100);
      P.sat(0, 'volume', 'Queue Lobby', 'full · voting on format', '#34d399');
      await P.wait(1000);
      P.bot({
        embed: {
          color: '#7c3aed', title: 'Teams set · moved to voice',
          body: '<div class="em-cols"><div><b style="color:#7dd3fc">Team 1 · 1,284 MMR</b><span>Kai · Nova · Lumi · Vex · Rook</span></div>' +
                '<div><b style="color:#fca5a5">Team 2 · 1,279 MMR</b><span>Zed_Main · Ash · Pyro · Mira · Duo</span></div></div>'
        }
      });
      P.sat(1, 'scale', 'Balanced by MMR', '1,284 vs 1,279', '#a78bfa');
      await P.wait(2000);
      P.bot({
        embed: {
          color: '#22d3ee', title: 'Match complete · Team 1 wins',
          body: `<p>${I('trophy', '#fbbf24')}Winners <span class="up">+50 MMR</span> · losers <span class="down">−50 MMR</span></p><p>Result posted to #match-history</p>`
        }
      });
      P.sat(2, 'trending-up', 'Kai', '+50 MMR · 1,334', '#22d3ee');
      P.dash('lobby', 'Lobbies today', '4');
      await P.wait(3000);
    },

    async imposter(P) {
      P.channel('general');
      P.dash('games', 'Games today', '12');
      await P.wait(500);
      await P.type('/imposter');
      P.bot({
        used: ['Nova', '/imposter'],
        embed: {
          color: '#f472b6', title: 'Imposter · Round 1',
          body: '<p>Everyone got the secret word in DMs, except <b>one</b> player.</p><p>Players: Nova · Kai · Lumi · Ash · Mira</p>'
        }
      });
      P.sat(0, 'user-question', 'Imposter', '5 players · 1 imposter', '#f472b6');
      await P.wait(1500);
      P.user('Lumi', '#34d399', "it's something you buy late game");
      await P.wait(1000);
      P.user('Ash', '#fbbf24', 'uh… yeah, definitely late game');
      await P.wait(1100);
      const v = P.bot({
        embed: {
          color: '#f472b6', title: 'Vote: who is the imposter?',
          body: '<div class="btns"><span>Nova 0</span><span>Kai 0</span><span>Lumi 0</span><span class="sus">Ash 0</span><span>Mira 0</span></div>'
        }
      });
      const sus = v.querySelector('.sus');
      for (let n = 1; n <= 4; n++) {
        await P.wait(420);
        sus.textContent = 'Ash ' + n;
        P.sat(1, 'ballot', 'Voting', n + ' of 5 votes in', '#a78bfa');
      }
      sus.className = 'pick';
      await P.wait(700);
      P.bot({
        embed: {
          color: '#34d399', title: 'Imposter caught!',
          body: "<p>The imposter was <b>Ash</b>.</p><p>The word was <b>Rabadon's Deathcap</b>.</p>"
        }
      });
      P.sat(2, 'trophy', 'Crew wins', 'rewards paid out', '#34d399');
      await P.wait(3000);
    },

    async quiz(P) {
      P.channel('lol-quiz');
      P.dash('games', 'Quiz rounds', '27');
      await P.wait(500);
      await P.type('/quizz');
      const q = P.bot({
        used: ['Mira', '/quizz'],
        embed: {
          color: '#22d3ee', title: 'League Quiz · Question 3 / 10',
          body: '<p>Which champion is known as <b>the Unforgiven</b>?</p>' +
                '<div class="btns"><span>Riven</span><span class="right">Yasuo</span><span>Yone</span><span>Irelia</span></div>' +
                '<p class="qt">10s left</p>'
        }
      });
      P.sat(0, 'help', 'Live quiz', '6 players answering', '#22d3ee');
      const qt = q.querySelector('.qt');
      for (let s = 9; s >= 7; s--) {
        await P.wait(600);
        qt.textContent = s + 's left';
      }
      q.querySelectorAll('.btns span').forEach((b) => { b.className = b.classList.contains('right') ? 'ok' : 'no'; });
      qt.textContent = 'Answer: Yasuo';
      await P.wait(600);
      P.bot({ text: `${I('zap', '#fbbf24')}<b>Kai</b> got it right: <span class="up">+5 points</span>, streak 3.` });
      P.sat(1, 'zap', 'Kai', 'correct · +5 points', '#fbbf24');
      await P.wait(900);
      P.sat(2, 'calendar', 'Daily question', 'every day at 20:00', '#a78bfa');
      await P.wait(3000);
    },

    async ai(P) {
      P.channel('general');
      P.dash('overview', 'Reminders set', '8');
      await P.wait(500);
      await P.type('@Reiner remind me in 30 mins to study');
      P.user('Duo', '#60a5fa', '<span class="men">@Reiner</span> remind me in 30 mins to study');
      await P.wait(700);
      P.bot({ text: `${I('bell')}Got it. I'll remind you in 30 minutes: <b>study</b>.` });
      P.sat(0, 'bell', 'Reminder', 'in 30 min · study', '#a78bfa');
      await P.wait(1100);
      await P.type('@Reiner how many points do I have?');
      P.user('Duo', '#60a5fa', '<span class="men">@Reiner</span> how many points do I have?');
      await P.wait(700);
      P.bot({ text: `${I('trophy', '#ffd700')}You have <b>3,200 points</b>, rank <b>Gold</b>. 1,800 more to Diamond.` });
      P.sat(1, 'trophy', 'Gold', '3,200 points', '#fbbf24');
      await P.wait(1100);
      await P.type('@Reiner start a timer for coding');
      P.user('Duo', '#60a5fa', '<span class="men">@Reiner</span> start a timer for coding');
      await P.wait(700);
      P.bot({ text: `${I('timer', '#60a5fa')}Timer started for <b>coding</b>. Good luck!` });
      P.sat(2, 'timer', 'Timer running', 'coding', '#60a5fa');
      await P.wait(3000);
    },

    async ranks(P) {
      P.channel('general');
      P.dash('points', 'Points today', '1,940');
      await P.wait(500);
      await P.type('/me');
      const me = P.bot({
        used: ['Lumi', '/me'],
        embed: {
          color: '#ffd700', title: 'Lumi · Gold',
          body: '<p><b>3,200</b> points · #4 on the server</p><div class="em-bar"><i></i></div><p>55% of the way to <b>Diamond</b> (5,000)</p>'
        }
      });
      P.bar(me, 55);
      P.sat(0, 'medal', 'Gold', '3,200 points', '#ffd700');
      await P.wait(1600);
      await P.type('/ld');
      P.bot({
        used: ['Lumi', '/ld'],
        embed: {
          color: '#7c3aed', title: 'Leaderboard',
          body: '<p>1. <b>Kai</b> · Master · 10,420</p><p>2. <b>Nova</b> · Diamond · 6,880</p><p>3. <b>Zed_Main</b> · Diamond · 5,310</p><p>4. <b>Lumi</b> · Gold · 3,200</p>'
        }
      });
      P.sat(1, 'crown', 'Kai', 'Master · 10,420', '#ff6b6b');
      await P.wait(1400);
      P.bot({ text: `${I('arrow-up-circle', '#c0c0c0')}<b>Pyro</b> ranked up to <b>Silver</b>!` });
      P.sat(2, 'arrow-up-circle', 'Rank up', 'Pyro → Silver', '#c0c0c0');
      await P.wait(3000);
    },

    async timer(P) {
      P.channel('focus-room');
      P.dash('overview', 'Focus hours', '42h');
      await P.wait(500);
      await P.type('/timer 25m');
      const t = P.bot({
        used: ['Ash', '/timer'],
        embed: {
          color: '#60a5fa', title: 'Focus timer · goal 25m',
          body: '<div class="ring-t"><svg viewBox="0 0 60 60"><circle class="bgc" cx="30" cy="30" r="25"/><circle class="fg" cx="30" cy="30" r="25"/></svg>' +
                '<div><b class="tt">00:00</b><p>Ash is focusing</p></div></div>'
        }
      });
      P.sat(0, 'timer', 'Focus', 'goal 25:00', '#60a5fa');
      const tt = t.querySelector('.tt');
      const ring = t.querySelector('.fg');
      for (const [label, frac] of [['06:15', 0.25], ['12:30', 0.5], ['18:45', 0.75], ['25:00', 1]]) {
        await P.wait(750);
        tt.textContent = label;
        ring.style.setProperty('--off', String(157 * (1 - frac)));
      }
      await P.wait(500);
      P.bot({ text: `${I('check-circle', '#4ade80')}<b>Ash</b> finished <b>25 minutes</b> of focus. Saved to /tasks.` });
      P.sat(1, 'flame', 'Goal reached', '25 / 25 min', '#fbbf24');
      await P.wait(900);
      P.sat(2, 'chart', 'This week', 'progress in /tasks', '#34d399');
      await P.wait(3000);
    }
  };

  // Rough visible-time length of each scene, for the tab progress bar.
  const LENGTH = { lobby: 10500, imposter: 12000, quiz: 9500, ai: 13500, ranks: 10500, timer: 10000 };

  /* ── player ── */
  function select(name) {
    tabs.forEach((t) => {
      const on = t.dataset.scene === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.querySelector('.sc-prog').style.setProperty('--p', '0');
      if (on) stage.setAttribute('aria-labelledby', t.id);
    });
  }

  function play(name) {
    const id = ++run;
    current = name;
    played = 0;
    select(name);
    log.textContent = '';
    typed.textContent = '';
    input.removeAttribute('data-typing');
    sats.forEach((s) => s.removeAttribute('data-on'));

    SCENES[name](api(id))
      .then(() => {
        played = LENGTH[name];
        if (reduced.matches) return;
        return wait(400, id).then(() => play(order[(order.indexOf(name) + 1) % order.length]));
      })
      .catch((e) => { if (e !== STOP) console.error(e); });
  }

  (function progress() {
    const tab = tabs.find((t) => t.dataset.scene === current);
    if (tab) tab.querySelector('.sc-prog').style.setProperty('--p', String(Math.min(played / LENGTH[current], 1)));
    requestAnimationFrame(progress);
  })();

  /* ── tabs: click + arrow-key roving focus ── */
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => play(t.dataset.scene));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      tabs[j].focus();
      play(tabs[j].dataset.scene);
    });
  });

  /* ── start when first seen; pause while off screen ── */
  let started = false;
  function onSeen(isVisible) {
    visible = isVisible;
    if (!visible) return;
    stage.classList.add('in');
    if (!started) { started = true; play(order[0]); }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => onSeen(entries[0].isIntersecting), { threshold: 0.25 }).observe(stage);
  } else {
    onSeen(true);
  }

  /* ── pointer tilt ── */
  const fine = window.matchMedia('(pointer: fine)');
  let frame = 0;
  stage.addEventListener('pointermove', (e) => {
    if (!fine.matches || reduced.matches || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      stage.classList.add('tracking');
      stage.style.setProperty('--rx', (10 - dy * 10).toFixed(2) + 'deg');
      stage.style.setProperty('--ry', (-14 + dx * 18).toFixed(2) + 'deg');
    });
  });
  stage.addEventListener('pointerleave', () => {
    stage.classList.remove('tracking');
    stage.style.removeProperty('--rx');
    stage.style.removeProperty('--ry');
  });
})();

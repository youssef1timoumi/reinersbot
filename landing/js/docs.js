/* Docs page: section nav (sidebar on desktop, collapsible on mobile),
   scrollspy, and the live quiz backed by the bot's public /api/quiz. */
(function () {
  /* ── section nav: always open on desktop, collapsed on mobile ── */
  const toc = document.getElementById('toc-d');
  const wide = window.matchMedia('(min-width: 980px)');
  const syncToc = () => { if (toc) toc.open = wide.matches; };
  syncToc();
  wide.addEventListener('change', syncToc);
  if (toc) {
    toc.addEventListener('click', (e) => {
      if (e.target.closest('a') && !wide.matches) toc.open = false;
    });
  }

  /* ── scrollspy ── */
  const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = Array.from(document.querySelectorAll('.doc[id]'));
  if ('IntersectionObserver' in window && sections.length) {
    const visible = new Set();
    const mark = () => {
      const first = sections.find((s) => visible.has(s.id));
      if (!first) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = byId.get(first.id);
      if (a) a.setAttribute('aria-current', 'true');
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id)));
      mark();
    }, { rootMargin: '-90px 0px -55% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ── live quiz ── */
  const box = document.getElementById('quiz-box');
  if (!box) return;
  const body = box.querySelector('.quiz-body');
  const INVITE = 'https://discord.com/oauth2/authorize?client_id=1346151882518827008&permissions=8&integration_type=0&scope=bot';
  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="/assets/icons.svg#${id}"/></svg>`;
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let started = false;

  async function api(path, opts) {
    const res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'The quiz is resting right now. Try again in a moment.');
    return data;
  }

  async function load() {
    body.innerHTML = '<div class="quiz-img loading"></div>';
    let quiz;
    try {
      quiz = await api('/quiz/new');
    } catch (e) {
      body.innerHTML = `<p class="quiz-err">${esc(e.message)}</p><div class="band-actions" style="justify-content:center"><button class="s-ghost" type="button" data-retry>Try again</button></div>`;
      body.querySelector('[data-retry]').addEventListener('click', load);
      return;
    }

    body.innerHTML =
      `<h3>${esc(quiz.prompt)}</h3>` +
      `<div class="quiz-img loading">${quiz.image && quiz.image.url ? `<img alt="Quiz image" src="${esc(quiz.image.url)}">` : ''}</div>` +
      `<div class="quiz-choices">${quiz.choices.map((c) => `<button type="button" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
    const img = body.querySelector('.quiz-img img');
    if (img) {
      const done = () => { img.classList.add('ok'); img.parentElement.classList.remove('loading'); };
      img.complete ? done() : img.addEventListener('load', done);
      img.addEventListener('error', () => img.parentElement.classList.remove('loading'));
    }

    const buttons = Array.from(body.querySelectorAll('.quiz-choices button'));
    buttons.forEach((b) => b.addEventListener('click', async () => {
      buttons.forEach((x) => { x.disabled = true; });
      const choice = b.dataset.c;
      let result;
      try {
        result = await api('/quiz/answer', { method: 'POST', body: JSON.stringify({ token: quiz.token, choice }) });
      } catch (e) {
        body.insertAdjacentHTML('beforeend', `<p class="quiz-err">${esc(e.message)}</p>`);
        buttons.forEach((x) => { x.disabled = false; });
        return;
      }
      buttons.forEach((x) => {
        if (x.dataset.c === result.answer) { x.classList.add('right'); x.insertAdjacentHTML('beforeend', icon('check')); }
        else if (x === b && !result.correct) { x.classList.add('wrong'); x.insertAdjacentHTML('beforeend', icon('x')); }
        else x.classList.add('dim');
      });
      body.insertAdjacentHTML('beforeend',
        `<div class="quiz-res ${result.correct ? 'good' : 'bad'}">` +
          `<span class="big">${icon(result.correct ? 'check-circle' : 'x-circle')}</span>` +
          `<strong>${result.correct ? 'Correct!' : 'Not quite'}</strong>` +
          `<p>${result.correct ? `Nice, it's <b>${esc(result.answer)}</b>.` : `It was <b>${esc(result.answer)}</b>. Want another go?`}</p>` +
          `<div class="band-actions">` +
            `<a class="s-cta btn-shine" href="${INVITE}" rel="noopener"><span>Add the bot to your server</span><span class="s-knob" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6"/></svg></span></a>` +
            `<button class="s-ghost" type="button" data-again>Try another</button>` +
          `</div>` +
        `</div>`);
      body.querySelector('[data-again]').addEventListener('click', load);
    }));
  }

  // Only hit the API once the quiz is near the viewport.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) { started = true; io.disconnect(); load(); }
    }, { rootMargin: '300px 0px' });
    io.observe(box);
  } else {
    load();
  }
})();

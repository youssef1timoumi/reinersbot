/* Home page only: the header that slides in after the hero, and the contact
   form. Shared behaviour (reveals, tilt, copy buttons, transitions) is in site.js. */
(function () {
  /* ── header slides in once the hero is out of view ── */
  const bar = document.querySelector('.home-bar');
  const hero = document.querySelector('.page');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      bar.setAttribute('data-show', String(!entries[0].isIntersecting));
    }, { threshold: 0.08 }).observe(hero);
  }

  /* ── contact form: validates, then posts to /api/contact. If the request
     fails, offer a pre-filled email instead so the message isn't lost. ── */
  const form = document.getElementById('contact-form');
  if (form) {
    const err = document.getElementById('c-err');
    const note = form.querySelector('.c-note');
    const send = form.querySelector('.c-send');
    const sendLabel = send.querySelector('span');
    let busy = false;

    const mailtoHref = (name, topic, msg) => {
      const subject = `[Reiner] ${topic} from ${name}`;
      const body = `${msg}\n\n— ${name}`;
      return `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      const name = form.elements.name;
      const msg = form.elements.message;
      const topic = form.elements.topic.value;
      let bad = null;
      [name, msg].forEach((f) => {
        const empty = !f.value.trim();
        f.setAttribute('aria-invalid', String(empty));
        if (empty && !bad) bad = f;
      });
      if (bad) {
        err.textContent = bad === name ? 'Please add your name.' : 'Please write a message.';
        bad.focus();
        return;
      }
      err.textContent = '';

      busy = true;
      send.disabled = true;
      sendLabel.textContent = 'Sending…';
      const payload = {
        name: name.value.trim(),
        topic,
        message: msg.value.trim(),
        website: form.elements.website ? form.elements.website.value : ''
      };
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        // Endpoint not deployed (404/405): hand off to email without an error.
        if (res.status === 404 || res.status === 405) {
          window.location.href = mailtoHref(payload.name, topic, payload.message);
          note.textContent = 'Your email app should open with the message ready. Just hit send.';
          sendLabel.textContent = 'Send message';
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Could not send your message right now.');
        form.reset();
        note.textContent = 'Thanks — your message was sent. We\'ll get back to you soon.';
        sendLabel.textContent = 'Sent';
      } catch (ex) {
        err.textContent = ex instanceof TypeError ? 'Could not reach the server.' : ex.message;
        note.textContent = '';
        const a = document.createElement('a');
        a.href = mailtoHref(payload.name, topic, payload.message);
        a.textContent = 'send it by email instead';
        note.append('You can ', a, ' — your message will be filled in.');
        sendLabel.textContent = 'Send message';
      } finally {
        busy = false;
        send.disabled = false;
      }
    });
  }
})();

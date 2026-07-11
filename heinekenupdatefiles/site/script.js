(() => {
  'use strict';

  // ---------- bubble generator (loader + celebration) ----------
  function makeBubbles(container, n, colors, cover) {
    if (!container) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const size = 5 + Math.random() * (cover ? 22 : 26);
      const b = document.createElement('span');
      b.style.cssText =
        'position:absolute;bottom:-50px;left:' + (Math.random() * 100) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
        'background:' + colors[i % colors.length] + ';' +
        'box-shadow:inset 0 2px 3px rgba(255,255,255,.35);' +
        'animation:bubbleUp ' + (5 + Math.random() * 6) + 's linear ' +
        (Math.random() * (cover ? 2 : 5)) + 's infinite;';
      frag.appendChild(b);
    }
    container.appendChild(frag);
  }

  makeBubbles(
    document.getElementById('loaderBubbles'), 16,
    ['rgba(198,162,75,.55)', 'rgba(244,238,222,.4)', 'rgba(120,200,150,.4)'], false
  );

  // ---------- loader dismiss ----------
  const loader = document.getElementById('loader');
  setTimeout(() => { if (loader) loader.classList.add('eb-loader--done'); }, 3600);

  // ---------- countdown ----------
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');
  const target = new Date(2026, 6, 28, 14, 0, 0).getTime();
  const p2 = (x) => String(x).padStart(2, '0');
  function tick() {
    const diff = Math.max(0, target - Date.now());
    if (cdDays) cdDays.textContent = p2(Math.floor(diff / 86400000));
    if (cdHours) cdHours.textContent = p2(Math.floor(diff / 3600000) % 24);
    if (cdMins) cdMins.textContent = p2(Math.floor(diff / 60000) % 60);
    if (cdSecs) cdSecs.textContent = p2(Math.floor(diff / 1000) % 60);
  }
  tick();
  setInterval(tick, 1000);

  // ---------- scroll reveals ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  // ---------- hero particle canvas ----------
  (function initCanvas() {
    const c = document.getElementById('heroCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const N = 64, P = [];
    const mk = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 12,
      r: Math.random() * 2.2 + 0.5,
      s: Math.random() * 0.5 + 0.12,
      dr: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
      g: Math.random() < 0.32,
    });
    for (let i = 0; i < N; i++) P.push(mk(true));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.s; p.x += p.dr;
        if (p.y < -14) Object.assign(p, mk(false));
        const col = p.g ? '124,255,176' : '214,189,119';
        const rad = p.r * 4;
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        gr.addColorStop(0, 'rgba(' + col + ',' + p.a + ')');
        gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
  })();

  // ---------- ambient generated audio ----------
  const audio = { ctx: null, master: null, on: true, started: false };
  function initAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    audio.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    audio.master = master;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 850; filter.Q.value = 0.5;
    filter.connect(master);
    const freqs = [110, 164.81, 220, 277.18];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.14 / (i + 1);
      o.connect(g); g.connect(filter); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain); lfoGain.connect(master.gain); lfo.start();
    master.gain.setTargetAtTime(audio.on ? 0.13 : 0, ctx.currentTime, 2.2);
  }
  const startAudio = () => {
    if (audio.started || !audio.on) return;
    audio.started = true;
    try { initAudio(); } catch (e) { /* no-op */ }
  };
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);

  const musicBtn = document.getElementById('musicToggle');
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      audio.on = !audio.on;
      musicBtn.style.textDecoration = audio.on ? 'none' : 'line-through';
      musicBtn.title = audio.on ? 'Mute music' : 'Play music';
      if (!audio.ctx) {
        if (audio.on) { audio.started = true; try { initAudio(); } catch (e) { /* no-op */ } }
        return;
      }
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      audio.master.gain.setTargetAtTime(audio.on ? 0.13 : 0, audio.ctx.currentTime, 0.4);
    });
  }

  // ---------- RSVP form ----------
  const form = document.getElementById('rsvpForm');
  const confirmView = document.getElementById('rsvpConfirm');
  const btnYes = document.getElementById('btnYes');
  const btnNo = document.getElementById('btnNo');
  const errorEl = document.getElementById('formError');
  const fName = document.getElementById('fName');
  const fEmail = document.getElementById('fEmail');
  const celebrate = document.getElementById('celebrate');
  let attending = null;
  let cheerBuilt = false;

  function clearError() { errorEl.hidden = true; errorEl.textContent = ''; }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function setAttending(v) {
    attending = v;
    btnYes.classList.toggle('is-active', v === 'yes');
    btnNo.classList.toggle('is-active', v === 'no');
    clearError();
  }

  btnYes.addEventListener('click', () => setAttending('yes'));
  btnNo.addEventListener('click', () => setAttending('no'));
  form.addEventListener('input', clearError);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!attending) return showError('Please let us know whether you can attend.');
    if (!fName.value.trim()) return showError('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fEmail.value)) return showError('Please enter a valid email address.');
    clearError();

    const isNo = attending === 'no';
    document.getElementById('confirmTitle').textContent = isNo ? "We'll miss you" : 'Thank you!';
    document.getElementById('confirmBody').textContent = isNo
      ? "We're sorry you can't join us — thank you for letting us know. We hope to celebrate with you another time."
      : "Your place is reserved. We can't wait to share this milestone with you. A confirmation will follow by email.";
    document.getElementById('confirmName').textContent = fName.value.trim();

    form.hidden = true;
    confirmView.hidden = false;

    if (!isNo) {
      if (!cheerBuilt) {
        makeBubbles(
          document.getElementById('cheerBubbles'), 32,
          ['rgba(0,132,61,.7)', 'rgba(198,162,75,.8)', 'rgba(228,0,43,.55)', 'rgba(244,238,222,.7)'], true
        );
        cheerBuilt = true;
      }
      celebrate.hidden = false;
    } else {
      celebrate.hidden = true;
    }
  });

  document.getElementById('editRsvp').addEventListener('click', () => {
    confirmView.hidden = true;
    form.hidden = false;
    celebrate.hidden = true;
  });
})();

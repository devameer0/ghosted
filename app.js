/* GHOSTED — the orbit. Plain canvas + DOM, no libraries, no network calls. The bot link comes from config.js (BOT_URL). */
(function () {
  'use strict';
  var html = document.documentElement;
  var page = document.body.getAttribute('data-page');
  var cv = document.getElementById('sky');
  var ctx = cv.getContext('2d');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mq.matches;
  var BONE = '#efe8d8', GONE = '#ff5d3b', NEW = '#d4ff3f';
  var HANDLES = ['example_one', 'example_two', 'fake_account_3', 'sample_person', 'demo_dana', 'test_tobi', 'mock_mira', 'not_a_real_user'];

  var W, H, DPR, cx, cy, R, small;
  var dots = [], parts = [], t = 0, last = 0, nextLeave = 1.0, handleIx = 0;
  var mouse = { x: -999, y: -999 };
  var ghosts = [];
  var pulse = -1;
  var PITCH = 46; // px between stacked ghost pills on phones

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  /* ---------- layout ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight; small = W < 640;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = page === 'home' ? H * (small ? 0.42 : 0.5) : H * (small ? 0.47 : 0.5);
    R = page === 'demo' && small ? Math.min(W * 0.27, H * 0.15) : Math.min(W * 0.3, H * (small ? 0.2 : 0.3));
    var core = clamp(R * 0.62, 110, 170);
    var st = document.querySelector('.stage').style;
    st.setProperty('--cx', cx + 'px'); st.setProperty('--cy', cy + 'px'); st.setProperty('--core', core + 'px');
    var rt = document.getElementById('ringtext');
    if (rt) { var s = R * 1.26 * 2; rt.setAttribute('width', s); rt.setAttribute('height', s); }
    ghosts.forEach(function (g) { g.w = g.el.offsetWidth; });
    if (!dots.length) seed();
    if (reduce) { placeGhosts(); draw(); }
  }

  /* ---------- the ring: everyone who follows you, nameless ---------- */
  function seed() {
    var n = small ? 120 : 210, i;
    for (i = 0; i < n; i++) {
      var rf = 0.8 + (i % 4) * 0.085 + Math.random() * 0.04;
      dots.push({ a: Math.random() * 6.2832, rf: rf, sp: 0.05 + (1.2 - rf) * 0.06, s: rnd(1.2, 2.5), ph: rnd(0, 6.28),
        ox: 0, oy: 0, st: 0, fade: 1, x: 0, y: 0 });
    }
  }
  function ringPos(d) {
    var ang = d.a + (reduce ? 0 : t) * d.sp;
    return { x: cx + Math.cos(ang) * R * d.rf, y: cy + Math.sin(ang) * R * d.rf };
  }

  function burst(x, y, n, col, spd) {
    for (var i = 0; i < n && parts.length < 500; i++) {
      var a = rnd(0, 6.28), v = rnd(5, spd || 40);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, life: 0, max: rnd(0.7, 1.6), c: col, s: rnd(0.8, 1.8) });
    }
  }

  function leave(d, label) {
    var p = ringPos(d);
    var ang = Math.atan2(p.y - cy, p.x - cx);
    d.st = 1; d.x = p.x + d.ox; d.y = p.y + d.oy; d.vx = Math.cos(ang) * rnd(22, 40) - Math.sin(ang) * 10;
    d.vy = Math.sin(ang) * rnd(22, 40) + Math.cos(ang) * 10; d.life = 0; d.max = rnd(4.5, 6); d.label = '@' + label;
    burst(d.x, d.y, 8, GONE, 50);
  }
  function nextHandle() { return HANDLES[handleIx++ % HANDLES.length]; }

  /* ---------- per frame ---------- */
  function update(dt) {
    var i, d, p;
    if (page === 'home') {
      nextLeave -= dt;
      if (nextLeave <= 0) {
        nextLeave = rnd(1.6, 2.6);
        d = dots[Math.floor(Math.random() * dots.length)];
        if (d.st === 0 && d.fade >= 1) leave(d, nextHandle());
      }
    }
    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      if (d.st === 1) {
        d.x += d.vx * dt; d.y += d.vy * dt; d.life += dt;
        if (d.life > d.max * 0.45) burst(d.x, d.y, 1, GONE, 28);
        if (d.life >= d.max) { d.st = 0; d.fade = 0; d.a = rnd(0, 6.28); d.ox = d.oy = 0; }
        continue;
      }
      if (d.fade < 1) d.fade = Math.min(1, d.fade + dt * 0.5);
      p = ringPos(d);
      // the cursor pushes dots aside
      var dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy), tx = 0, ty = 0;
      if (dist < 120 && dist > 0.1) { var f = Math.pow(1 - dist / 120, 2) * 46; tx = dx / dist * f; ty = dy / dist * f; }
      d.ox += (tx - d.ox) * 0.14; d.oy += (ty - d.oy) * 0.14;
      if (d.st === 2) {
        var k = clamp((t - d.delay) / 3, 0, 1);
        if (k >= 1) d.st = 3;
      }
    }
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; p.vy *= 0.98;
      if (p.life >= p.max) parts.splice(i, 1);
    }
    if (page === 'demo') placeGhosts();
    if (pulse >= 0) { pulse += dt; if (pulse > 1.8) pulse = -1; }
  }

  function draw() {
    var i, d, p, a;
    ctx.clearRect(0, 0, W, H);
    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      if (d.st === 1) {
        a = 1 - d.life / d.max;
        ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = GONE;
        ctx.shadowColor = GONE; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(d.x, d.y, 3.4, 0, 6.2832); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '700 ' + (small ? 11 : 13) + 'px "Martian Mono",monospace';
        ctx.fillText(d.label, d.x + 10, d.y + 4);
        continue;
      }
      p = ringPos(d);
      var x = p.x + d.ox, y = p.y + d.oy, sz = d.s * 1.15, col = BONE, stt = (reduce && d.st === 2) ? 3 : d.st;
      a = (0.6 + 0.35 * Math.sin(t * 1.3 + d.ph)) * d.fade;
      if (stt === 2) {
        var k = clamp((t - d.delay) / 3, 0, 1), e = ease(k);
        var fx = cx + Math.cos(d.from) * R * 2.3, fy = cy + Math.sin(d.from) * R * 1.6;
        x = fx + (x - fx) * e; y = fy + (y - fy) * e; col = NEW; sz = 3.4; a = k > 0 ? 1 : 0;
        if (!reduce && k > 0 && k < 1 && Math.random() < 0.5) burst(x, y, 1, NEW, 14);
      } else if (stt === 3) { col = NEW; sz = 2.8; a = 0.95; }
      if (reduce) a = stt >= 2 ? 1 : 0.7;
      ctx.globalAlpha = a; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.2832); ctx.fill();
    }
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; ctx.globalAlpha = Math.max(0, 1 - p.life / p.max) * 0.8; ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    if (pulse >= 0) {
      ctx.globalAlpha = 1 - pulse / 1.8; ctx.strokeStyle = NEW; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R * (0.6 + pulse * 0.8), 0, 6.2832); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (reduce && page === 'home') staticGhosts();
  }
  // reduced motion on the landing page: freeze a few "gone" dots in place
  function staticGhosts() {
    ctx.font = '700 ' + (small ? 11 : 13) + 'px "Martian Mono",monospace';
    var spots = [[1.1, -0.7], [-1.15, -0.4], [0.95, 0.55]];
    spots.forEach(function (s, i) {
      var x = clamp(cx + s[0] * R * 1.3, 12, W - 130), y = cy + s[1] * R * 1.2;
      ctx.globalAlpha = 0.9; ctx.fillStyle = GONE; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 6.2832); ctx.fill();
      ctx.fillText('@' + HANDLES[i], x + 10, y + 4);
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- dashboard: ghosts are real links, moved by script ---------- */
  function placeGhosts() {
    var n = ghosts.length, rx = Math.min(W * 0.4, R * 1.8), ry = R * 1.4;
    for (var i = 0; i < n; i++) {
      var g = ghosts[i], born = g.born;
      var e = reduce ? 1 : ease(clamp((t - born) / 2.4, 0, 1));
      if (!reduce && !g.hover) g.ph += 0.016 * 0.022; // stops drifting while you point at it
      var ang = 0.6 + i * 6.2832 / n + g.ph;
      var ox = cx + Math.cos(ang) * rx, oy = cy + Math.sin(ang) * ry;
      if (small) { // phones: two pills above the ring, two below, drifting sideways
        var amp = Math.max(0, (W - g.w) / 2 - 14), up = i < n / 2, k2 = i % Math.ceil(n / 2);
        ox = cx - g.w / 2 + 8 + Math.sin(g.ph * 7 + i * 1.9) * amp;
        oy = cy + R * 1.3 + k2 * PITCH;
        if (up) oy = cy - R * 1.3 - (Math.ceil(n / 2) - 1 - k2) * PITCH;
      }
      var sx = cx + Math.cos(ang) * R * 0.95, sy = cy + Math.sin(ang) * R * 0.95;
      var x = sx + (ox - sx) * e, y = sy + (oy - sy) * e;
      x = clamp(x, 18, Math.max(18, W - g.w + 4));
      y = clamp(y, 64, H - 64);
      g.px = x; g.py = y;
      g.el.parentNode.style.transform = 'translate(' + (x - 8).toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      g.el.parentNode.style.opacity = e > 0 ? Math.min(1, e * 2) : 0;
      if (!reduce) {
        if (e < 1 && e > 0 && Math.random() < 0.6) burst(x, y, 1, GONE, 20);
        if (g.hover) burst(x, y, 2, GONE, 55);
      }
    }
  }
  /* ---------- cursor ---------- */
  var cur = document.querySelector('.cur');
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && cur) html.classList.add('has-cursor');
  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (cur && finePointer) {
      cur.classList.add('on');
      cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      cur.classList.toggle('big', !!e.target.closest && !!e.target.closest('a,button'));
    }
  }, { passive: true });
  window.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; if (cur) cur.classList.remove('on'); });
  document.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });

/* ---------- landing: click a dot, it leaves ---------- */
  if (page === 'home') {
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('a,button')) return;
      var best = null, bd = 1e9;
      dots.forEach(function (d) {
        if (d.st !== 0) return;
        var p = ringPos(d), dx = p.x + d.ox - e.clientX, dy = p.y + d.oy - e.clientY, k = dx * dx + dy * dy;
        if (k < bd) { bd = k; best = d; }
      });
      if (best) { leave(best, nextHandle()); }
    });
  }

  /* ---------- every "Get the bot" button uses BOT_URL, every "Tip" button TIP_URL (both from config.js) ---------- */
  var botUrl = (typeof BOT_URL === 'string' && /^https?:\/\//.test(BOT_URL)) ? BOT_URL : '#';
  var tipUrl = (typeof TIP_URL === 'string' && /^https?:\/\//.test(TIP_URL)) ? TIP_URL : '#';
  Array.prototype.forEach.call(document.querySelectorAll('[data-bot]'), function (a) { a.setAttribute('href', botUrl); a.rel = 'noopener noreferrer'; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (a) { if (tipUrl === '#' || /example\.com/.test(tipUrl)) { a.hidden = true; a.style.display = 'none'; return; } a.setAttribute('href', tipUrl); a.rel = 'noopener noreferrer'; a.target = '_blank'; });

  /* ---------- example page: fixed example data, nothing fetched ---------- */
  var CYCLE = 600, left0 = 372, t0 = Date.now(); // pretend the next check is in 6:12, then loop every 10:00
  var $ = function (id) { return document.getElementById(id); };
  var f2 = function (n) { return (n < 10 ? '0' : '') + n; };

  function adoptGhosts() {
    var els = document.querySelectorAll('#ghostlist a.ghost');
    ghosts = Array.prototype.map.call(els, function (a, ix) {
      var g = { el: a, w: a.offsetWidth, px: 0, py: 0, hover: false, ph: 0, born: 0.5 + ix * 0.35 };
      a.addEventListener('mouseenter', function () { g.hover = true; });
      a.addEventListener('mouseleave', function () { g.hover = false; });
      a.addEventListener('focus', function () { g.hover = true; });
      a.addEventListener('blur', function () { g.hover = false; });
      return g;
    });
  }
  function setNewDots(n) {
    n = Math.min(n, Math.floor(dots.length / 3));
    var k = 0;
    for (var tries = 0; tries < 5000 && k < n; tries++) {
      var d = dots[Math.floor(Math.random() * dots.length)];
      if (d.st !== 0 || d.fade < 1) continue;
      d.st = reduce ? 3 : 2; d.delay = t + 0.3 + k * 0.35; d.from = rnd(0, 6.28); k++;
    }
  }
  var lastLeft = -1;
  function paintClock() {
    var el = Math.floor((Date.now() - t0) / 1000), left = CYCLE - ((CYCLE - left0 + el) % CYCLE);
    if (left === lastLeft) return;
    if (lastLeft >= 0 && left > lastLeft && !reduce) pulse = 0; // a new "check" just happened
    lastLeft = left;
    $('clock').textContent = f2(Math.floor(left / 60)) + ':' + f2(left % 60);
    $('arc').style.strokeDashoffset = String(100 - ((CYCLE - left) / CYCLE) * 100);
    var m = Math.floor((CYCLE - left) / 60);
    $('checked').textContent = m < 1 ? 'Checked just now' : 'Checked ' + m + 'm ago';
  }
  function demoInit() {
    adoptGhosts(); setNewDots(5);
    paintClock(); setInterval(paintClock, 1000);
    if (reduce) { placeGhosts(); draw(); }
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    if (reduce) { running = false; return; }
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts; t += dt;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  var running = false;
  function start() {
    if (reduce) { resize(); return; }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }
  var onMQ = function (e) { reduce = e.matches; if (reduce) { parts.length = 0; resize(); } else start(); };
  if (mq.addEventListener) mq.addEventListener('change', onMQ); else if (mq.addListener) mq.addListener(onMQ);

  window.addEventListener('resize', resize);
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ghosts.forEach(function (g) { g.w = g.el.offsetWidth; }); if (reduce) { placeGhosts(); draw(); } });
  if (page === 'demo') demoInit();
  start();
})();

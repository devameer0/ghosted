/* GHOSTED — notebook page. Plain DOM + SVG, no libraries, no network calls. Links come from config.js (BOT_URL, TIP_URL). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- links: one place (config.js) ---------- */
  var ok = function (u) { return typeof u === 'string' && /^https?:\/\//.test(u) && !/REPLACE_WITH_|\/\/example\.com/.test(u); };
  var botUrl = (typeof BOT_URL === 'string' && /^https?:\/\//.test(BOT_URL)) ? BOT_URL : '#';
  Array.prototype.forEach.call(document.querySelectorAll('[data-bot]'), function (a) {
    a.setAttribute('href', botUrl); a.rel = 'noopener noreferrer';
  });
  var tipOk = typeof TIP_URL !== 'undefined' && ok(TIP_URL);
  Array.prototype.forEach.call(document.querySelectorAll('[data-tip]'), function (a) {
    if (tipOk) { a.setAttribute('href', TIP_URL); a.rel = 'noopener noreferrer'; a.target = '_blank'; a.hidden = false; }
    else { a.hidden = true; a.removeAttribute('href'); }
  });

  /* ---------- the ledger: tap a name, it gets scribbled out ---------- */
  var names = document.querySelectorAll('.name');
  if (!names.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function scribble(btn, ix) {
    var r = rng(97 + ix * 31), t = btn.querySelector('.t');
    var w = Math.round(t.offsetWidth + 16), h = Math.round(btn.offsetHeight);
    var svg = el('svg', { 'class': 'scr', width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, 'aria-hidden': 'true', focusable: 'false' });
    var d = 'M' + (2 + r() * 5).toFixed(1) + ' ' + (h * 0.5).toFixed(1), n = 6, k;
    for (k = 1; k <= n; k++) {
      d += ' L' + Math.min(w - 3, (w - 6) * k / n + r() * 5).toFixed(1) + ' ' + (k % 2 ? h * (0.22 + r() * 0.1) : h * (0.7 + r() * 0.1)).toFixed(1);
    }
    d += ' L' + (w * (0.1 + r() * 0.1)).toFixed(1) + ' ' + (h * (0.6 + r() * 0.1)).toFixed(1) + ' L' + (w - 4).toFixed(1) + ' ' + (h * (0.4 + r() * 0.1)).toFixed(1);
    var p = el('path', { d: d, pathLength: '1' });
    p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1';
    svg.appendChild(p); btn.appendChild(svg);
    return p;
  }

  var gone = document.querySelector('.goneline'), tally = document.getElementById('tally'), txt = document.getElementById('tallytxt');
  var none = document.createElement('span'); none.className = 'none'; none.textContent = 'none yet';
  gone.insertBefore(none, tally);

  function drawTally(n) {
    while (tally.firstChild) tally.removeChild(tally.firstChild);
    var r = rng(5 + n), x = 6, d = '', groups = Math.ceil(n / 5), g, i;
    for (g = 0; g < groups; g++) {
      var c = Math.min(5, n - g * 5), gx = x;
      for (i = 0; i < Math.min(c, 4); i++) { d += 'M' + (x + r() * 2).toFixed(1) + ' ' + (6 + r() * 3).toFixed(1) + ' L' + (x + r() * 3 - 1).toFixed(1) + ' ' + (34 + r() * 3).toFixed(1) + ' '; x += 10; }
      if (c === 5) d += 'M' + (gx - 5) + ' ' + (30 + r() * 3).toFixed(1) + ' L' + (x + 1) + ' ' + (10 + r() * 3).toFixed(1) + ' ';
      x += 16;
    }
    tally.setAttribute('width', Math.max(0, x - 6));
    tally.setAttribute('viewBox', '0 0 ' + Math.max(1, x - 6) + ' 40');
    if (d) tally.appendChild(el('path', { d: d }));
    none.hidden = n > 0;
    tally.hidden = n === 0;
    txt.textContent = n === 0 ? 'None unfollowed.' : n + (n === 1 ? ' person' : ' people') + ' unfollowed.';
  }

  var paths = [];
  function count() { var n = 0; Array.prototype.forEach.call(names, function (b) { if (b.getAttribute('aria-pressed') === 'true') n++; }); return n; }
  function show(i, on, animate) {
    var p = paths[i], off = on ? '0' : '1';
    if (!animate || reduce) { var tr = p.style.transition; p.style.transition = 'none'; p.style.strokeDashoffset = off; void p.getBoundingClientRect(); p.style.transition = tr; }
    else p.style.strokeDashoffset = off;
  }
  function init() {
    Array.prototype.forEach.call(names, function (b, i) {
      paths[i] = scribble(b, i);
      show(i, b.getAttribute('aria-pressed') === 'true', false);
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        show(i, on, true);
        drawTally(count());
      });
    });
    drawTally(count());
  }
  var started = false;
  function go() { if (!started) { started = true; init(); } }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  setTimeout(go, 2500);
})();

/* GHOSTED — no libraries, no network calls. Links come from config.js (BOT_URL, TIP_URL). */
(function () {
  'use strict';
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
})();

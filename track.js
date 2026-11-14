/* Perspekt! activity tracker for profile badges: time in app, asset pages opened, news read, early opens. */
(function () {
  try {
    var L = localStorage, f = (location.pathname.split('/').pop() || ''), h = location.hash || '';
    var get = function (k, d) { try { var v = JSON.parse(L.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
    if (!L.getItem('pk-bdemo')) {
      L.setItem('pk-bdemo', '1');
      var s0 = get('pk-seen', []); ["THYAO", "ASELS", "GARAN", "BIMAS", "KCHOL", "TUPRS", "EREGL", "SISE", "AKBNK", "YKBNK", "AAPL", "NVDA", "TSLA", "MSFT", "BTC", "ETH", "SOL", "XAU", "USD/TRY", "EUR/TRY"].forEach(function (k) { if (s0.indexOf(k) < 0) s0.push(k); }); L.setItem('pk-seen', JSON.stringify(s0));
      var r0 = get('pk-read', []); for (var i = 1; i <= 14; i++) if (r0.indexOf('demo' + i) < 0) r0.push('demo' + i); L.setItem('pk-read', JSON.stringify(r0));
      L.setItem('pk-sec', String((+L.getItem('pk-sec') || 0) + 2520));
    }
    if (new Date().getHours() < 8) L.setItem('pk-early', '1');
    var tok = function (c) { var m = new RegExp('(?:#|\\.)' + c + '([A-Za-z0-9_]+)').exec(h); return m ? m[1] : ''; };
    if (/^Varlik(Mum|Sutun)?(EN|ES|DE|Light)?\.dc\.html$/.test(f)) {
      var a = (tok('a') || 'QQQ').replace('_', '/'), seen = get('pk-seen', []);
      if (seen.indexOf(a) < 0) { seen.push(a); L.setItem('pk-seen', JSON.stringify(seen)); }
    }
    if (/^Haber(Scroll)?(EN|ES|DE|Light)?\.dc\.html$/.test(f)) {
      var n = tok('n') || 'top', rd = get('pk-read', []);
      if (rd.indexOf(n) < 0) { rd.push(n); L.setItem('pk-read', JSON.stringify(rd)); }
    }
    setInterval(function () { if (document.visibilityState === 'visible') L.setItem('pk-sec', String((+L.getItem('pk-sec') || 0) + 10)); }, 10000);
  } catch (e) {}
})();

/* Haptics: Vibration API where it exists (Android); on iPhone (iOS 18+ Safari has no vibrate) a hidden switch toggle gives
   a light tap. Browsers only allow it right after a touch, so it rides on taps and typing. window.pkHaptic(kind) for others. */
(function () {
  var sw = null;
  function ios() { try { if (!sw) { var l = document.createElement('label'), i = document.createElement('input'); l.setAttribute('aria-hidden', 'true');
      l.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'; i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1; l.appendChild(i); document.body.appendChild(l); sw = l; }
    sw.click(); } catch (e) {} }
  window.pkHaptic = function (kind) { var pat = ({ light: 8, medium: 16, success: [12, 70, 20], error: [30, 50, 30] })[kind || 'light'] || 8, done = false;
    var ua = navigator.userActivation; if (ua && !ua.hasBeenActive) return;
    try { if (navigator.vibrate) done = navigator.vibrate(pat); } catch (e) {}
    if (!done || /iP(hone|ad|od)/.test(navigator.userAgent)) { ios(); if (kind === 'success' || kind === 'error') setTimeout(ios, 110); } };
  document.addEventListener('click', function (e) { var t = e.target && e.target.closest && e.target.closest('button,a,[role=switch],label'); if (t && t !== sw && !(sw && sw.contains(t))) window.pkHaptic('light'); }, true);
  document.addEventListener('input', function (e) { if (e.target && e.target.tagName === 'INPUT') window.pkHaptic('light'); }, true);
})();

/* Headers in Title Case: every word of h1/h2 and story titles starts with a capital, with the page language's rules
   (Turkish i -> İ, which CSS capitalize gets wrong). News articles keep their headline as written. */
(function () {
  if (/^Haber/.test(location.pathname.split('/').pop() || '')) return;
  var lang = (document.documentElement.lang || 'tr').toLowerCase(), busy = false;
  function fix(el) { var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n, prev = ' ';
    while ((n = w.nextNode())) { if (n.nodeType === 1) { if (n.tagName === 'BR') prev = ' '; continue; } var t = n.nodeValue, out = '';
      for (var i = 0; i < t.length; i++) { var ch = t.charAt(i); out += /\s/.test(prev) && /\S/.test(ch) ? ch.toLocaleUpperCase(lang) : ch; prev = ch; }
      if (out !== t) n.nodeValue = out; } }
  function run() { busy = true; try { var els = document.querySelectorAll('h1, h2, .gt[style*="font-size: 40px"]'); for (var i = 0; i < els.length; i++) fix(els[i]); } catch (e) {} busy = false; }
  var queued = false;
  function later() { if (busy || queued) return; queued = true; requestAnimationFrame(function () { queued = false; run(); }); }
  function start() { run(); try { new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

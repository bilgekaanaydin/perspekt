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

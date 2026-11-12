/* Perspekt! prototype: pull-to-refresh for a screen's main scroller (.nos).
   Pull down from the top, a spinner follows the finger; past the threshold it spins, the content settles back and fades in again.
   Works with touch and, for the desktop preview, with the mouse. No data is fetched: the prototype only shows the gesture. */
(function () {
  if (window.__pkPtr) return; window.__pkPtr = 1;
  var MAX = 120, HOLD = 64, TRIGGER = 70;
  var st = null, busy = false, ind = null, arc = null, noClick = 0;

  function css() {
    var s = document.createElement('style');
    s.textContent = '.pk-ptr{position:fixed;z-index:6;width:38px;height:38px;margin-left:-19px;border-radius:19px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;'
      + 'background:var(--k151518,#151518);border:.75px solid var(--kt21,rgba(255,255,255,.16));box-shadow:0 6px 20px rgba(0,0,0,.35);opacity:0;pointer-events:none;will-change:transform,opacity}'
      + '.pk-ptr svg{display:block}.pk-ptr.spin svg{animation:pk-ptr-spin .7s linear infinite}'
      + '@keyframes pk-ptr-spin{to{transform:rotate(360deg)}}'
      + '.pk-ptr-on *{-webkit-user-select:none !important;user-select:none !important}'
      + '.pk-ptr-back{transition:transform .32s cubic-bezier(.2,.8,.2,1)}.pk-ptr.pk-ptr-out{transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .24s}';
    document.head.appendChild(s);
  }
  function indicator() {
    if (ind) return ind;
    ind = document.createElement('div'); ind.className = 'pk-ptr'; ind.setAttribute('aria-hidden', 'true');
    ind.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#205DF4" stroke-opacity=".22" stroke-width="2.4"></circle>'
      + '<circle class="a" cx="12" cy="12" r="8.5" stroke="#205DF4" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="53.4" stroke-dashoffset="53.4" transform="rotate(-90 12 12)"></circle></svg>';
    arc = ind.querySelector('.a');
    document.body.appendChild(ind);
    return ind;
  }
  function scroller(el) { var n = document.querySelector('.nos'); return n && el && n.contains(el) ? n : null; }
  function pt(e) { var t = e.touches ? (e.touches[0] || e.changedTouches[0]) : e; return { x: t.clientX, y: t.clientY }; }
  function place(n) { var r = n.getBoundingClientRect(); indicator().style.left = (r.left + r.width / 2) + 'px'; ind.style.top = (r.top + 8) + 'px'; }
  function draw(n, d, spin) {
    var p = Math.min(1, d / TRIGGER);
    n.style.transform = d ? 'translateY(' + d + 'px)' : '';
    ind.style.opacity = String(Math.min(1, d / 28));
    ind.style.transform = 'translateY(' + Math.max(0, d * 0.5 + 18) + 'px) scale(' + (0.6 + 0.4 * p) + ')';
    if (!spin) { arc.setAttribute('stroke-dashoffset', String(53.4 * (1 - 0.82 * p))); ind.firstChild.style.transform = 'rotate(' + Math.round(d * 2.4) + 'deg)'; }
  }
  function settle(n, d, done) {
    n.classList.add('pk-ptr-back'); ind.classList.add('pk-ptr-out'); draw(n, d, true);
    setTimeout(function () { n.classList.remove('pk-ptr-back'); ind.classList.remove('pk-ptr-out'); if (done) done(); }, 340);
  }
  function refresh(n) {
    busy = true; ind.firstChild.style.transform = ''; arc.setAttribute('stroke-dashoffset', '38'); ind.classList.add('spin');
    settle(n, HOLD);
    setTimeout(function () {
      // content "arrives" again: replay the screen's entrance animation
      Array.prototype.forEach.call(n.children, function (c) { c.style.animation = 'none'; void c.offsetHeight; c.style.animation = ''; });
      settle(n, 0, function () { ind.classList.remove('spin'); ind.style.opacity = '0'; busy = false; });
      ind.style.opacity = '0';
    }, 1150);
  }

  function down(e) {
    if (busy || st || (e.type === 'mousedown' && e.button !== 0)) return;
    var n = scroller(e.target); if (!n || n.scrollTop > 0) return;
    var p = pt(e); st = { n: n, x: p.x, y: p.y, on: false, d: 0 };
  }
  function move(e) {
    if (!st) return; var p = pt(e), dy = p.y - st.y, dx = p.x - st.x;
    if (!st.on) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { st = null; return; }     // a sideways swipe (carousel)
      if (dy < -4 || st.n.scrollTop > 0) { st = null; return; }                       // scrolling the page
      if (dy < 8) return;
      st.on = true; st.y = p.y; place(st.n); document.documentElement.classList.add('pk-ptr-on');
    }
    if (e.cancelable) e.preventDefault();
    st.d = Math.max(0, Math.min(MAX, (p.y - st.y) * 0.5));
    draw(st.n, st.d, false);
  }
  function up() {
    var s = st; st = null; if (!s || !s.on) return;
    document.documentElement.classList.remove('pk-ptr-on');
    noClick = Date.now();
    if (s.d >= TRIGGER) refresh(s.n); else settle(s.n, 0, function () { ind.style.opacity = '0'; });
  }

  css();
  document.addEventListener('touchstart', down, { passive: true });
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', up); document.addEventListener('touchcancel', up);
  document.addEventListener('mousedown', down); document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  // a pull that ends over a link or button must not open it
  document.addEventListener('click', function (e) { if (Date.now() - noClick < 350) { e.stopPropagation(); e.preventDefault(); } }, true);
})();

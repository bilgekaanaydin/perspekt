/* Perspekt! prototype runtime: renders a .dc.html screen (template + Component) with React. */
(function () {
  var REACT = 'https://unpkg.com/react@18.3.1/umd/react.production.min.js';
  var REACT_DOM = 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js';

  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  var HOLE = /\{\{([\s\S]+?)\}\}/g;
  var ONLY = /^\s*\{\{([\s\S]+?)\}\}\s*$/;
  var cache = {};
  function compile(expr) {
    if (!cache[expr]) cache[expr] = new Function('sc', 'with (sc) { return (' + expr + '); }');
    return cache[expr];
  }
  function ev(expr, sc) { try { return compile(expr)(sc); } catch (e) { return undefined; } }
  function text(str, sc) {
    return str.replace(HOLE, function (_, e) { var v = ev(e, sc); return v == null || v === false ? '' : String(v); });
  }
  function value(str, sc) {
    var m = str.match(ONLY);
    return m ? ev(m[1], sc) : text(str, sc);
  }

  function camel(k) {
    if (k.indexOf('--') === 0) return k;
    if (k.indexOf('-webkit-') === 0) k = 'Webkit' + k.slice(8).replace(/^./, function (c) { return '-' + c; });
    return k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }
  function styleObj(str) {
    var o = {};
    str.split(';').forEach(function (part) {
      var i = part.indexOf(':');
      if (i < 0) return;
      var k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
      if (k) o[camel(k)] = v;
    });
    return o;
  }

  var EVENTS = { onclick: 'onClick', oninput: 'onInput', onchange: 'onChange', onscroll: 'onScroll', onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp', onpointercancel: 'onPointerCancel', onkeydown: 'onKeyDown', onfocus: 'onFocus', onblur: 'onBlur', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd' };
  var RENAME = { 'class': 'className', 'for': 'htmlFor', 'autofocus': 'autoFocus', 'tabindex': 'tabIndex', 'readonly': 'readOnly', 'maxlength': 'maxLength' };

  // template DOM -> light tree (built once)
  function tree(node) {
    if (node.nodeType === 3) return { t: node.nodeValue };
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    var attrs = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      if (a.name.indexOf('hint-') === 0) continue;
      attrs.push([a.name, a.value]);
    }
    var kids = [];
    var src = tag === 'template' ? node.content : node;
    for (var j = 0; j < src.childNodes.length; j++) { var c = tree(src.childNodes[j]); if (c) kids.push(c); }
    return { tag: tag, attrs: attrs, kids: kids };
  }

  function render(R, n, sc, key) {
    if (n.t !== undefined) {
      if (!/\S/.test(n.t)) return n.t.indexOf('\n') >= 0 ? null : n.t;
      return text(n.t, sc);
    }
    var attr = {}; n.attrs.forEach(function (a) { attr[a[0]] = a[1]; });
    if (n.tag === 'sc-if') {
      return value(attr.value || '', sc) ? R.createElement(R.Fragment, { key: key }, kidsOf(R, n, sc)) : null;
    }
    if (n.tag === 'sc-for') {
      var list = value(attr.list || '', sc) || [], as = attr.as || 'item';
      return R.createElement(R.Fragment, { key: key }, list.map(function (it, i) {
        var s2 = Object.create(sc); s2[as] = it;
        return R.createElement(R.Fragment, { key: i }, kidsOf(R, n, s2));
      }));
    }
    var props = { key: key };
    n.attrs.forEach(function (a) {
      var name = a[0], raw = a[1];
      if (/^on[a-zA-Z]/.test(name)) { var f = value(raw, sc); if (typeof f === 'function') props[EVENTS[name.toLowerCase()] || name] = f; return; }
      var v = value(raw, sc);
      if (v === false || v == null) return;
      if (name === 'style') { props.style = styleObj(String(v)); return; }
      if (name === 'value') { props.defaultValue = v; return; }
      props[RENAME[name] || name] = v === true ? '' : v;
    });
    var kids = kidsOf(R, n, sc);
    return R.createElement.apply(null, [n.tag, props].concat(kids.length ? [kids] : []));
  }
  function kidsOf(R, n, sc) {
    var out = [];
    n.kids.forEach(function (k, i) { var r = render(R, k, sc, i); if (r !== null && r !== '') out.push(r); });
    return out;
  }

  function boot() {
    var R = window.React, RD = window.ReactDOM;
    var host = document.querySelector('x-dc');
    var scriptEl = document.querySelector('script[type="text/x-dc"]');
    var props = {};
    try {
      var spec = JSON.parse(scriptEl.getAttribute('data-props') || '{}');
      Object.keys(spec).forEach(function (k) { if (k[0] !== '$' && spec[k] && 'default' in spec[k]) props[k] = spec[k]['default']; });
    } catch (e) {}

    var tpl = document.createElement('template');
    var inner = host.querySelector('template');
    tpl.innerHTML = inner ? inner.innerHTML : host.innerHTML;
    var frag = tpl.content;
    var helmet = frag.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.childNodes).forEach(function (c) { if (c.nodeType === 1) document.head.appendChild(c.cloneNode(true)); });
      helmet.parentNode.removeChild(helmet);
    }
    var roots = [];
    Array.prototype.slice.call(frag.childNodes).forEach(function (c) { var t = tree(c); if (t && (t.tag || /\S/.test(t.t))) roots.push(t); });

    var DCLogic = function (p) { R.Component.call(this, p); };
    DCLogic.prototype = Object.create(R.Component.prototype);
    DCLogic.prototype.constructor = DCLogic;
    DCLogic.prototype.render = function () {
      var vals = this.renderVals ? this.renderVals() : {};
      return R.createElement(R.Fragment, null, roots.map(function (n, i) { return render(R, n, vals, i); }));
    };
    var Component = new Function('DCLogic', 'React', scriptEl.textContent + '\n;return Component;')(DCLogic, R);

    var mount = document.createElement('div');
    mount.id = 'dc-root';
    host.parentNode.replaceChild(mount, host);
    RD.createRoot(mount).render(R.createElement(Component, props));
  }

  function start() {
    load(REACT).then(function () { return load(REACT_DOM); }).then(boot).catch(function (e) {
      document.body.innerHTML = '<p style="color:#fff;font:14px sans-serif;padding:24px">Could not load the prototype runtime.</p>';
      console.error(e);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

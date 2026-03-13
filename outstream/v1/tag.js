(function () {
  'use strict';

  var w = typeof window !== 'undefined' ? window : undefined;
  if (!w) return;

  var d = w.document;
  var ns = 'lupon-outstream-v1';
  var containerId = ns + '-container-' + Math.random().toString(36).slice(2, 11);

  function createContainer(slot) {
    var el = d.getElementById(slot) || d.querySelector('[data-lupon-slot="' + slot + '"]');
    if (!el) {
      el = d.createElement('div');
      el.id = slot;
      el.setAttribute('data-lupon-slot', slot);
      el.className = ns;
      d.body.appendChild(el);
    }
    var wrap = d.createElement('div');
    wrap.id = containerId;
    wrap.className = ns + '-wrap';
    wrap.setAttribute('data-lupon-container', '1');
    el.appendChild(wrap);
    return wrap;
  }

  function load(slot, opts) {
    opts = opts || {};
    var container = createContainer(slot || 'lupon-outstream');
    container.style.cssText = 'position:relative;width:100%;max-width:' + (opts.maxWidth || '100%') + ';margin:0 auto;background:#000;';
    var placeholder = d.createElement('div');
    placeholder.setAttribute('data-lupon-placeholder', '1');
    placeholder.style.cssText = 'width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#666;font-family:sans-serif;';
    placeholder.textContent = 'Lupon Outstream';
    container.appendChild(placeholder);
    if (typeof opts.onReady === 'function') opts.onReady(container);
  }

  if (w.LuponOutstream) return;
  w.LuponOutstream = { load: load, version: '1' };

  var slot = (d.currentScript && d.currentScript.getAttribute('data-slot')) || 'lupon-outstream';
  load(slot);
})();

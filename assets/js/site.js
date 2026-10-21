/* Strategia rozwoju – skrypty (bez zależności). Strona działa również bez JS. */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var root = (d.documentElement.getAttribute('data-root') || '');
  var reduce = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || /\bstill\b/.test(d.documentElement.getAttribute('data-a11y') || '');

  /* ustawienia dostępności */
  var ad = $('#a11y');
  if (ad && ad.showModal) {
    var de = d.documentElement, form = $('#a11y-form');
    function cur() { return (de.getAttribute('data-a11y') || '').split(/\s+/).filter(Boolean); }
    function sync() {
      var t = cur();
      $$('input[name=contrast]', ad).forEach(function (i) { i.checked = i.value ? t.indexOf(i.value) >= 0 : t.indexOf('contrast') < 0; });
      $$('input[name=fs]', ad).forEach(function (i) { i.checked = i.value ? t.indexOf(i.value) >= 0 : !/fs[123]/.test(t.join(' ')); });
      $$('input[name=opt]', ad).forEach(function (i) { i.checked = t.indexOf(i.value) >= 0; });
    }
    function save() {
      var t = [];
      var c = $('input[name=contrast]:checked', ad); if (c && c.value) t.push(c.value);
      var f = $('input[name=fs]:checked', ad); if (f && f.value) t.push(f.value);
      $$('input[name=opt]:checked', ad).forEach(function (i) { t.push(i.value); });
      if (t.length) de.setAttribute('data-a11y', t.join(' ')); else de.removeAttribute('data-a11y');
      try { if (t.length) localStorage.setItem('a11y', t.join(' ')); else localStorage.removeItem('a11y'); } catch (e) { }
    }
    $$('[data-a11y-open]').forEach(function (b) { b.addEventListener('click', function () { sync(); ad.showModal(); }); });
    $$('[data-a11y-close]', ad).forEach(function (b) { b.addEventListener('click', function () { ad.close(); }); });
    ad.addEventListener('click', function (e) { if (e.target === ad) ad.close(); });
    form.addEventListener('change', save);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('[data-a11y-reset]', ad).addEventListener('click', function () { de.removeAttribute('data-a11y'); try { localStorage.removeItem('a11y'); } catch (e) { } sync(); });
  }

  /* menu mobilne */
  var burger = $('.burger'), nav = $('.nav');
  if (burger) burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });

  /* spis treści: zwinięty tylko na małych ekranach */
  var mob = $('.toc details.mob'); if (mob && window.matchMedia && matchMedia('(max-width:1000px)').matches) mob.open = false;

  /* pasek postępu + przycisk w górę */
  var bar = $('#progress'), top = $('#totop');
  function onScroll() {
    var h = d.documentElement, max = h.scrollHeight - h.clientHeight, y = h.scrollTop || d.body.scrollTop;
    if (bar) bar.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
    if (top) top.classList.toggle('on', y > 900);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (top) top.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* zakładki (SWOT, sfery) */
  $$('[data-tabs]').forEach(function (g) {
    var tabs = $$('[role=tab]', g.querySelector('.tabs')), panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    function sel(i, focus) {
      tabs.forEach(function (t, j) { var on = i === j; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (panels[j]) panels[j].hidden = !on; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowRight') { e.preventDefault(); sel((i + 1) % n, 1); }
        else if (k === 'ArrowLeft') { e.preventDefault(); sel((i + n - 1) % n, 1); }
        else if (k === 'Home') { e.preventDefault(); sel(0, 1); }
        else if (k === 'End') { e.preventDefault(); sel(n - 1, 1); }
      });
    });
  });

  /* liczniki KPI */
  function countUp(el) {
    var txt = el.textContent, m = txt.match(/^([^\d-]*)(-?)(\d[\d\s\u00a0]*)(?:,(\d+))?(.*)$/);
    if (!m || reduce) return;
    var pre = m[1], sign = m[2], intS = m[3], dec = m[4] || '', post = m[5];
    var sep = /\s/.test(intS) ? '\u00a0' : '', target = parseFloat(intS.replace(/\s|\u00a0/g, '') + (dec ? '.' + dec : ''));
    if (!isFinite(target) || target > 1e7) return;
    var t0 = null, dur = 900;
    function fmt(v) {
      var s = v.toFixed(dec.length), p = s.split('.'), i = p[0];
      if (sep) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
      return pre + sign + i + (p[1] ? ',' + p[1] : '') + post;
    }
    el.setAttribute('aria-label', txt);
    function step(ts) {
      if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e); if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    requestAnimationFrame(step);
  }
  var kp = $$('.kpi b[data-count]');
  if (kp.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } }); }, { threshold: .6 });
    kp.forEach(function (k) { io.observe(k); });
  }

  /* scroll-spy spisu treści */
  var links = $$('.toc a[data-h]');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {}; links.forEach(function (a) { map[a.getAttribute('data-h')] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); }); var a = map[e.target.id]; if (a) a.classList.add('on'); }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = d.getElementById(id); if (h) spy.observe(h); });
  }

  /* lightbox */
  var lb = $('#lb');
  if (lb && lb.showModal) {
    var img = $('img', lb), cap = $('.cap', lb), stage = $('.stage', lb), scale = 1, base = 0, last = null;
    function fit() { var w = stage.clientWidth - 20; base = Math.min(w, img.naturalWidth || w); apply(1); }
    function apply(s) { scale = Math.max(.5, Math.min(4, s)); img.style.width = Math.round(base * scale) + 'px'; stage.style.placeItems = base * scale > stage.clientWidth ? 'start' : 'center'; }
    function open(btn) {
      last = btn; img.removeAttribute('width'); img.alt = btn.getAttribute('data-alt') || '';
      img.onload = fit; img.src = btn.getAttribute('data-full'); cap.textContent = btn.getAttribute('data-alt') || '';
      lb.showModal(); stage.scrollTop = 0; stage.scrollLeft = 0; if (img.complete) fit();
    }
    d.addEventListener('click', function (e) { var b = e.target.closest('.zoom[data-full]'); if (b) { e.preventDefault(); open(b); } });
    $('[data-z=in]', lb).addEventListener('click', function () { apply(scale * 1.35); });
    $('[data-z=out]', lb).addEventListener('click', function () { apply(scale / 1.35); });
    $('[data-z=fit]', lb).addEventListener('click', function () { apply(1); });
    $('[data-z=x]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('close', function () { if (last) last.focus(); });
    lb.addEventListener('click', function (e) { if (e.target === stage) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === '+' || e.key === '=') apply(scale * 1.35); if (e.key === '-') apply(scale / 1.35); });
    img.addEventListener('dblclick', function () { apply(scale > 1.2 ? 1 : 2.2); });
    stage.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); apply(scale * (e.deltaY < 0 ? 1.12 : .9)); } }, { passive: false });
    var pts = {}, pd = 0; // szczypanie dwoma palcami
    stage.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        var a = e.touches[0], b = e.touches[1], dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pd) apply(scale * dist / pd); pd = dist; e.preventDefault();
      }
    }, { passive: false });
    stage.addEventListener('touchend', function () { pd = 0; });
    var drag = null;
    img.addEventListener('mousedown', function (e) { drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop }; img.style.cursor = 'grabbing'; e.preventDefault(); });
    addEventListener('mousemove', function (e) { if (drag) { stage.scrollLeft = drag.l - (e.clientX - drag.x); stage.scrollTop = drag.t - (e.clientY - drag.y); } });
    addEventListener('mouseup', function () { drag = null; img.style.cursor = ''; });
  }

  /* wyszukiwarka */
  var sr = $('#sr'), idx = null, loading = false;
  function fold(s) { return s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load(cb) {
    if (idx) return cb(); if (loading) return; loading = true;
    var s = d.createElement('script'); s.src = root + 'search-index.js';
    s.onload = function () { idx = window.__SEARCH_INDEX || []; idx.forEach(function (x) { x.f = fold(x.t + ' ' + x.h + ' ' + x.x); }); cb(); };
    s.onerror = function () { loading = false; $('#sr ul').innerHTML = '<li class="empty">Nie udało się wczytać indeksu wyszukiwarki.</li>'; };
    d.head.appendChild(s);
  }
  function run(q) {
    var out = $('#sr ul'); q = fold(q.trim());
    if (q.length < 2) { out.innerHTML = '<li class="empty">Wpisz co najmniej 2 znaki, np. „kolej”, „demografia”, „park wodny”.</li>'; return; }
    var words = q.split(/\s+/), res = [];
    idx.forEach(function (x) {
      var sc = 0; for (var i = 0; i < words.length; i++) { var p = x.f.indexOf(words[i]); if (p < 0) { sc = 0; break; } sc += 1 + (fold(x.t + ' ' + x.h).indexOf(words[i]) >= 0 ? 6 : 0); }
      if (sc) res.push([sc, x]);
    });
    res.sort(function (a, b) { return b[0] - a[0]; });
    if (!res.length) { out.innerHTML = '<li class="empty">Brak wyników dla „' + esc(q) + '”.</li>'; return; }
    out.innerHTML = res.slice(0, 30).map(function (r) {
      var x = r[1], p = x.f.indexOf(words[0]), src = x.x, f = fold(src), pos = f.indexOf(words[0]);
      var a = Math.max(0, pos - 60), snip = pos < 0 ? src.slice(0, 140) : (a ? '…' : '') + src.slice(a, a + 190);
      var h = esc(snip); words.forEach(function (w) { if (w.length > 1) { var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/l/g, '[lł]').replace(/a/g, '[aą]').replace(/c/g, '[cć]').replace(/e/g, '[eę]').replace(/n/g, '[nń]').replace(/o/g, '[oó]').replace(/s/g, '[sś]').replace(/[zż]/g, '[zźż]') + ')', 'gi'); h = h.replace(re, '<mark>$1</mark>'); } });
      return '<li><a href="' + root + x.u + '"><small>' + esc(x.p) + '</small><b>' + esc(x.h || x.t) + '</b><span>' + h + '</span></a></li>';
    }).join('');
  }
  if (sr && sr.showModal) {
    var inp = $('input', sr);
    function openS() { sr.showModal(); inp.focus(); load(function () { run(inp.value); }); }
    $$('[data-search]').forEach(function (b) { b.addEventListener('click', openS); });
    inp.addEventListener('input', function () { load(function () { run(inp.value); }); });
    $('form', sr).addEventListener('submit', function (e) { e.preventDefault(); var a = $('#sr li a'); if (a) location.href = a.href; });
    $('.x', sr).addEventListener('click', function () { sr.close(); });
    sr.addEventListener('click', function (e) { if (e.target === sr) sr.close(); });
    d.addEventListener('keydown', function (e) {
      var t = e.target.tagName; if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); openS(); }
    });
  }

  /* wydruk: rozwiń wszystko */
  addEventListener('beforeprint', function () { $$('details').forEach(function (x) { x.setAttribute('data-was', x.open ? 1 : 0); x.open = true; }); });
  addEventListener('afterprint', function () { $$('details[data-was]').forEach(function (x) { x.open = x.getAttribute('data-was') === '1'; }); });

  /* otwórz akordeon wskazany przez #hash */
  function openHash() { var h = location.hash && d.getElementById(decodeURIComponent(location.hash.slice(1))); if (h) { var p = h.closest('details'); while (p) { p.open = true; p = p.parentElement && p.parentElement.closest('details'); } h.scrollIntoView(); } }
  addEventListener('hashchange', openHash); openHash();
})();

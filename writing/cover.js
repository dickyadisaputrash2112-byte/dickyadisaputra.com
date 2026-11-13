// Shared book-cover helpers for the Writing shelf and reader.
(() => {
  'use strict';
  const PAL = [['#22385a', '#fff'], ['#7a4a2a', '#fff'], ['#2f5d4f', '#fff'], ['#b8665a', '#fff'], ['#e9dcc6', '#3b3029'], ['#5a7db0', '#fff'], ['#3b3d42', '#fff'], ['#c9a46a', '#2a2117'], ['#86a9bd', '#14283a'], ['#6e4b6a', '#fff']];
  const hash = s => { let h = 0; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const color = post => PAL[hash(post.category || 'Catatan') % PAL.length];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const safeUrl = u => /^https:\/\//.test(u || '') ? u : '';
  // Cover: the uploaded image when there is one, otherwise a typographic cover.
  function html(post) {
    const [c, ct] = color(post), img = safeUrl(post.cover_url);
    const typo = `<div class="gc" style="--ct:${ct}"><span>${esc(post.category || 'Catatan')}</span><b>${esc(post.title)}</b><i>Dicky Adisaputra</i></div>`;
    return { c, ct, inner: img ? typo + `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">` : typo };
  }
  const READ_KEY = 'dicky-reading';
  const progress = {
    all() { try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch { return {}; } },
    get(slug) { return this.all()[slug] || null; },
    set(slug, v) { try { const a = this.all(); a[slug] = { ...v, at: Date.now() }; localStorage.setItem(READ_KEY, JSON.stringify(a)); } catch {} },
    latest() { const a = this.all(); return Object.entries(a).filter(([, v]) => v.p < 1).sort((x, y) => y[1].at - x[1].at)[0] || null; }
  };
  window.WritingCover = Object.freeze({ color, html, esc, safeUrl, progress });
})();

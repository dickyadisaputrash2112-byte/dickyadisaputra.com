(() => {
  'use strict';
  const { list } = window.WritingSource;
  const { html: coverHTML, esc, progress } = window.WritingCover;
  const root = document.getElementById('shelves');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let posts = [], view = 'shelves', query = '';
  const lockIcon = '<span class="lock" title="Terkunci"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>';
  const href = p => 'article.html?slug=' + encodeURIComponent(p.slug);

  function book(p) {
    const cv = coverHTML(p), pr = progress.get(p.slug);
    return `<a class="bk" href="${href(p)}" data-slug="${esc(p.slug)}" aria-label="${esc(p.title)}${p.access_level === 'password' ? ' (terkunci)' : ''}" title="${esc(p.title)}">
      <span class="cv" style="--c:${cv.c}">${cv.inner}${p.access_level === 'password' ? lockIcon : ''}</span>
      ${pr && pr.p > 0 && pr.p < 1 ? `<span class="prog"><i style="width:${Math.round(pr.p * 100)}%"></i></span>` : ''}
      <span class="cap">${esc(p.title)}</span></a>`;
  }
  function matches(p) { return !query || [p.title, p.subtitle, p.excerpt, p.category, ...(p.tags || [])].join(' ').toLocaleLowerCase('id-ID').includes(query); }

  function render() {
    const visible = posts.filter(matches);
    if (!posts.length) { root.innerHTML = '<p class="empty">Tulisan pertama sedang dipersiapkan.</p>'; return; }
    if (!visible.length) { root.innerHTML = '<p class="empty">Belum ada tulisan yang cocok. Coba kata kunci lain.</p>'; return; }
    if (view === 'all') {
      root.innerHTML = `<section class="shelf"><div class="shelf-top"><h2>Semua tulisan<small>${visible.length}</small></h2></div><div class="row wrap">${visible.map(book).join('')}</div></section>`;
    } else {
      const groups = new Map();
      visible.forEach(p => { const k = p.category || 'Catatan'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
      root.innerHTML = [...groups].map(([cat, items]) => `<section class="shelf" aria-label="${esc(cat)}">
        <div class="shelf-top"><h2>${esc(cat)}<small>${items.length} tulisan</small></h2>${items.length > 5 ? `<button data-full="${esc(cat)}">Lihat semua <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>` : ''}</div>
        <div class="row">${items.map(book).join('')}</div></section>`).join('');
    }
  }

  // continue reading card in the sidebar
  function continueCard() {
    const last = progress.latest(); if (!last) return;
    const [slug, v] = last, p = posts.find(x => x.slug === slug); if (!p) return;
    const cv = coverHTML(p), box = document.getElementById('continue');
    document.getElementById('continue-link').href = href(p);
    const mc = document.getElementById('continue-cover'); mc.style.setProperty('--c', cv.c); mc.innerHTML = cv.inner;
    document.getElementById('continue-title').textContent = p.title;
    document.getElementById('continue-bar').style.width = Math.round((v.p || 0) * 100) + '%';
    box.hidden = false;
  }

  // open animation: the book leaves the shelf, grows, and its cover swings open, then the reader loads
  function openBook(a, ev) {
    if (reduce || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
    ev.preventDefault();
    const cv = a.querySelector('.cv'), r = cv.getBoundingClientRect();
    const H = Math.min(innerHeight * .78, 640), W = H * 2 / 3;
    const fx = innerWidth / 2 - (innerWidth > 860 ? 0 : W / 2), fy = (innerHeight - H) / 2;
    const ghost = document.createElement('div'); ghost.className = 'opening';
    ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    ghost.innerHTML = `<div class="ob"><div class="pages"></div><div class="front" style="--c:${getComputedStyle(cv).getPropertyValue('--c')}">${cv.innerHTML}</div></div>`;
    const veil = document.createElement('div'); veil.className = 'veil';
    document.body.append(veil, ghost); cv.style.visibility = 'hidden';
    const front = ghost.querySelector('.front');
    ghost.animate([{ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }, { left: fx + 'px', top: fy + 'px', width: W + 'px', height: H + 'px' }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1150, easing: 'ease-in', fill: 'forwards' });
    front.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)', offset: .45 }, { transform: 'rotateY(-170deg)' }], { duration: 1150, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' })
      .finished.then(() => { location.href = a.href + '&open=1'; });
    setTimeout(() => { location.href = a.href + '&open=1'; }, 1600);
  }
  addEventListener('pageshow', e => { if (e.persisted) { document.querySelectorAll('.opening,.veil').forEach(n => n.remove()); document.querySelectorAll('.cv').forEach(c => c.style.visibility = ''); } });

  root.addEventListener('click', e => {
    const full = e.target.closest('[data-full]'); if (full) { query = ''; document.getElementById('search').value = full.dataset.full; query = full.dataset.full.toLocaleLowerCase('id-ID'); setView('all'); return; }
    const a = e.target.closest('a.bk'); if (a) openBook(a, e);
  });
  function setView(v) { view = v; document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === v))); render(); }
  document.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (b) setView(b.dataset.view); });
  document.getElementById('search').addEventListener('input', e => { query = e.target.value.trim().toLocaleLowerCase('id-ID'); render(); });

  list().then(result => {
    posts = result.posts;
    if (!result.live) { const n = document.getElementById('notice'); n.hidden = false; n.textContent = 'Koneksi ke rak tulisan belum tersedia. Silakan muat ulang halaman.'; }
    render(); continueCard();
  });
})();

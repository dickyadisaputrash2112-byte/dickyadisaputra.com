(() => {
  'use strict';
  const { list, formatDate, getPost } = window.WritingSource;
  const { html: coverHTML, esc, progress } = window.WritingCover;
  const $ = id => document.getElementById(id);
  const root = document.documentElement, book = $('book'), pgL = $('pg-l'), pgR = $('pg-r'), measure = $('measure');
  const slug = new URLSearchParams(location.search).get('slug');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let post = null, flowHTML = '', pages = [], single = false, si = 0, busy = true, L = {}, opened = false;

  // ---------- layout ----------
  function layout() {
    single = innerWidth < 860;
    const availH = innerHeight - (single ? 150 : 130), availW = single ? innerWidth - 24 : Math.min(innerWidth - 170, 1240) / 2;
    const pw = Math.floor(Math.min(availW, availH * .71)), ph = Math.floor(pw / .71);
    const fs = Math.max(12, Math.min(17, pw * .034));
    const px = Math.round(pw * .11), pt = Math.round(ph * .085), pb = Math.round(ph * .1);
    L = { pw, ph, fs, px, pt, pb, wi: pw - px * 2, hi: ph - pt - pb, gap: px * 2 };
    const set = (k, v) => root.style.setProperty(k, v);
    set('--pw', pw + 'px'); set('--ph', ph + 'px'); set('--fs', fs + 'px'); set('--px', px + 'px'); set('--pt', pt + 'px'); set('--pb', pb + 'px');
    set('--wi', L.wi + 'px'); set('--hi', L.hi + 'px'); set('--gap', L.gap + 'px');
    book.classList.toggle('single', single);
  }

  // ---------- pages ----------
  const titleSize = t => t.length < 18 ? '3em' : t.length < 34 ? '2.4em' : t.length < 60 ? '1.9em' : '1.55em';
  const titlePage = () => `<div class="tp"><span class="cat">${esc(post.category || 'Catatan')}</span><h1 style="--tsz:${titleSize(post.title)}">${esc(post.title)}</h1>${post.subtitle || post.excerpt ? `<span class="q">“</span><p class="sub">${esc(post.subtitle || post.excerpt)}</p>` : ''}<span class="meta">Dicky Adisaputra · ${esc(formatDate(post.published_at))}</span></div>`;
  const textPage = (k, n) => `<div class="tx"><span class="mark">${esc(post.category || 'Catatan')}</span><div class="clip"><div class="flow" style="transform:translateX(${-k * (L.wi + L.gap)}px)">${flowHTML}</div></div><span class="num">${k + 2}</span></div>`;
  const endPage = () => `<div class="cl"><span class="orn">◆ ◆ ◆</span><h2>Selesai dibaca.</h2><p>Terima kasih sudah membaca “${esc(post.title)}”.</p><a href="./">Kembali ke rak tulisan</a><a class="ghost" href="/">Ke ruang kerja</a></div>`;
  function lockPage(msg = '') {
    return `<div class="cl"><span class="orn">◆</span><h2>Tulisan ini dikunci.</h2><p>Judulnya terbuka untuk semua orang. Isinya hanya untuk pembaca yang menerima password dari Dicky.</p>
      <form id="unlock"><label class="sr" for="pw" style="position:absolute;left:-9999px">Password tulisan</label><input id="pw" type="password" required minlength="8" autocomplete="current-password" placeholder="Masukkan password"><button class="btn" type="submit">Buka tulisan</button><span class="err" role="status">${esc(msg)}</span></form></div>`;
  }

  async function paginate() {
    measure.innerHTML = `<div class="flow">${flowHTML}</div>`;
    const flow = measure.firstElementChild;
    await Promise.all([...flow.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 4000); })));
    const n = Math.max(1, Math.round((flow.scrollWidth + L.gap) / (L.wi + L.gap)));
    measure.innerHTML = '';
    pages = [titlePage, ...Array.from({ length: n }, (_, k) => () => textPage(k, n)), endPage];
  }

  const pageHTML = i => (i >= 0 && i < pages.length) ? pages[i]() : '';
  const maxSpread = () => single ? pages.length - 1 : Math.ceil(pages.length / 2) - 1;
  const leftIdx = s => single ? -1 : 2 * s, rightIdx = s => single ? s : 2 * s + 1;
  function render() {
    pgL.innerHTML = single ? '' : pageHTML(leftIdx(si)); pgR.innerHTML = pageHTML(rightIdx(si));
    const ms = maxSpread(), total = pages.length;
    $('prev').disabled = si <= 0; $('next').disabled = si >= ms;
    $('r-pages').textContent = single ? `Halaman ${si + 1} dari ${total}` : `Halaman ${leftIdx(si) + 1}–${Math.min(rightIdx(si) + 1, total)} dari ${total}`;
    const p = ms ? si / ms : 1; $('r-meter').style.width = (p * 100) + '%';
    if (post && post.content != null) progress.set(slug, { p, title: post.title });
    bindUnlock();
  }

  // ---------- page turning ----------
  function makeLeaf(cls, front, back) {
    const lf = document.createElement('div'); lf.className = 'leaf ' + cls;
    lf.innerHTML = `<div class="face front">${front}</div><div class="face back">${back}</div>`; book.append(lf); return lf;
  }
  function spin(lf, from, to, ms) {
    return new Promise(res => {
      if (reduce) { lf.remove(); return res(); }
      const a = lf.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], { duration: ms, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
      lf.querySelectorAll('.face').forEach(f => f.animate([{ '--shade': 0 }, { '--shade': .22 }, { '--shade': 0 }], { duration: ms }));
      a.onfinish = () => { lf.remove(); res(); };
    });
  }
  async function flip(dir) {
    if (busy || !pages.length) return; const ns = si + dir; if (ns < 0 || ns > maxSpread()) return;
    busy = true;
    if (dir > 0) {
      const lf = makeLeaf('fwd', pageHTML(rightIdx(si)), single ? '' : pageHTML(leftIdx(ns)));
      pgR.innerHTML = pageHTML(rightIdx(ns));
      await spin(lf, 0, -180, 950);
    } else if (single) {
      const lf = makeLeaf('fwd', pageHTML(rightIdx(ns)), ''); lf.style.transform = 'rotateY(-180deg)'; await spin(lf, -180, 0, 950);
    } else {
      const lf = makeLeaf('bwd', pageHTML(leftIdx(si)), pageHTML(rightIdx(ns))); pgL.innerHTML = pageHTML(leftIdx(ns)); await spin(lf, 0, 180, 950);
    }
    si = ns; render(); busy = false;
  }
  const coverLeaf = () => { const cv = coverHTML(post); return `<div class="cover" style="--c:${cv.c}">${cv.inner}</div>`; };
  async function openBook(startSpread) {
    si = 0; busy = true;
    book.classList.add('closed', 'arriving'); render();
    const lf = makeLeaf('fwd', coverLeaf(), single ? '' : pageHTML(0));
    if (single) pgR.innerHTML = pageHTML(0);
    await new Promise(r => setTimeout(r, reduce ? 0 : 60)); book.classList.remove('arriving');
    await new Promise(r => setTimeout(r, reduce ? 0 : 450));
    book.classList.remove('closed');
    await spin(lf, 0, -180, 1250);
    render(); busy = false; opened = true;
    if (startSpread > 0) { si = Math.min(startSpread, maxSpread()); render(); }
  }

  // ---------- locked posts ----------
  function bindUnlock() {
    const form = $('unlock'); if (!form) return;
    form.onsubmit = async e => {
      e.preventDefault(); const input = $('pw'), btn = form.querySelector('button'), err = form.querySelector('.err');
      btn.disabled = true; err.textContent = 'Memeriksa…';
      try {
        const full = await getPost(slug, input.value);
        if (!full) { err.textContent = 'Password belum cocok.'; return; }
        post = full; await buildFlow(); await paginate(); si = 0; render();
      } catch { err.textContent = 'Belum dapat dibuka. Periksa koneksi lalu coba lagi.'; }
      finally { input.value = ''; btn.disabled = false; }
    };
  }

  // ---------- content ----------
  async function buildFlow() {
    let body = '';
    try {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([import('https://cdn.jsdelivr.net/npm/marked@18.1.2/+esm'), import('https://cdn.jsdelivr.net/npm/dompurify@3.4.17/+esm')]);
      body = DOMPurify.sanitize(marked.parse(post.content || ''));
    } catch { body = (post.content || '').split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join(''); }
    flowHTML = `<div class="band">${esc(post.title)}</div>${post.excerpt && post.subtitle ? `<p class="lead">${esc(post.excerpt)}</p>` : ''}${body}`;
  }
  function message(text) { pgR.innerHTML = `<div class="loading-msg">${esc(text)}</div>`; }

  async function start() {
    layout(); message('Membuka buku…');
    const result = await list();
    const meta = result.posts.find(p => p.slug === slug);
    if (!meta) { busy = false; book.classList.remove('closed'); pgL.innerHTML = ''; pgR.innerHTML = `<div class="cl"><h2>${result.live ? 'Tulisan tidak ditemukan.' : 'Belum dapat dimuat.'}</h2><p>${result.live ? 'Mungkin tulisan ini sudah dipindahkan.' : 'Periksa koneksi lalu muat ulang halaman.'}</p><a href="./">Kembali ke rak tulisan</a></div>`; return; }
    post = { ...meta, content: null };
    document.title = meta.title + ' — Dicky Adisaputra';
    document.querySelector('meta[name="description"]').content = meta.excerpt || meta.subtitle || 'Tulisan oleh Dicky Adisaputra.';
    $('r-title').textContent = (meta.category || 'Catatan') + ' · ' + meta.title;
    if (meta.access_level === 'password') { pages = [titlePage, () => lockPage()]; return openBook(0); }
    try { const full = await getPost(slug); if (full) post = full; } catch {}
    if (post.content == null) { pages = [titlePage, () => `<div class="cl"><h2>Belum dapat dimuat.</h2><p>Silakan coba lagi sebentar lagi.</p><a href="./">Kembali ke rak tulisan</a></div>`]; return openBook(0); }
    await buildFlow(); await paginate();
    const saved = progress.get(slug);
    openBook(saved && saved.p > 0 && saved.p < 1 ? Math.round(saved.p * maxSpread()) : 0);
  }

  // ---------- input ----------
  $('next').onclick = () => flip(1); $('prev').onclick = () => flip(-1);
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); flip(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); flip(-1); }
    if (e.key === 'Escape') location.href = './';
  });
  book.addEventListener('click', e => {
    if (e.target.closest('a,button,input,form')) return;
    const r = book.getBoundingClientRect(); flip(e.clientX > r.left + r.width / 2 ? 1 : -1);
  });
  let sx = null;
  book.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 45) flip(dx < 0 ? 1 : -1); });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(async () => {
    if (busy || !opened) return; const ratio = maxSpread() ? si / maxSpread() : 0; layout();
    if (post && post.content != null) await paginate(); si = Math.round(ratio * maxSpread()); render();
  }, 200); });

  start();
})();

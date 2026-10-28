(() => {
  'use strict';
  const { node, list, formatDate, getPost } = window.WritingSource;
  const root = document.querySelector('#article-root'); const slug = new URLSearchParams(location.search).get('slug');
  function head(post) {
    document.title = post.title + ' — Dicky Adisaputra'; document.querySelector('meta[name="description"]').content = post.excerpt || post.subtitle || 'Tulisan oleh Dicky Adisaputra.';
    root.replaceChildren(); const header = node('header', 'article-head'); const back = node('a', 'writing-back', '← Semua tulisan'); back.href = './';
    header.append(back, node('p', 'eyebrow', post.category || 'Writing'), node('h1', 'article-title', post.title));
    if (post.subtitle) header.append(node('p', 'article-subtitle', post.subtitle));
    const byline = node('div', 'article-byline'); byline.append(node('span', '', 'Dicky Adisaputra'), node('span', '', '·'), node('time', '', formatDate(post.published_at))); header.append(byline); root.append(header);
  }
  async function show(post) {
    head(post); const article = node('article', 'reader-prose');
    try {
      const [{ marked }, { default: DOMPurify }] = await Promise.all([import('https://cdn.jsdelivr.net/npm/marked@18.1.2/+esm'), import('https://cdn.jsdelivr.net/npm/dompurify@3.4.17/+esm')]);
      article.innerHTML = DOMPurify.sanitize(marked.parse(post.content || ''));
    } catch { article.classList.add('plain-prose'); article.textContent = post.content || ''; }
    root.append(article); document.dispatchEvent(new Event('content:rendered'));
  }
  function locked(post, live) {
    head(post); const card = node('section', 'lock-card');
    card.append(node('span', 'reader-lock-icon', '⌁'), node('p', 'eyebrow', 'A private note'), node('h2', '', 'Tulisan ini dikunci.'), node('p', '', 'Judulnya terbuka untuk semua orang. Isinya hanya untuk pembaca yang menerima password dari Dicky.'));
    const form = node('form', 'unlock-form'); const label = node('label', 'screen-reader-only', 'Password tulisan'); label.htmlFor = 'article-password';
    const input = node('input'); input.id = 'article-password'; input.type = 'password'; input.name = 'password'; input.required = true; input.minLength = 8; input.autocomplete = 'current-password'; input.placeholder = 'Masukkan password tulisan';
    const button = node('button', 'button', 'Buka tulisan ↗'); button.type = 'submit'; const notice = node('p', 'unlock-notice'); notice.setAttribute('role', 'status');
    form.append(label, input, button); card.append(form, notice); root.append(card);
    if (!live) notice.textContent = 'Daftar dari arsip. Koneksi diperlukan untuk membuka isi tulisan.';
    form.addEventListener('submit', async event => {
      event.preventDefault(); button.disabled = true; notice.textContent = 'Memeriksa akses tulisan…';
      try { const opened = await getPost(slug, input.value); if (opened) await show(opened); else notice.textContent = 'Password belum cocok. Periksa kembali password dari Dicky.'; }
      catch { notice.textContent = 'Tulisan belum dapat dibuka. Periksa koneksi lalu coba kembali.'; }
      finally { input.value = ''; button.disabled = false; }
    });
    document.dispatchEvent(new Event('content:rendered'));
  }
  list().then(async result => {
    const post = result.posts.find(item => item.slug === slug);
    if (!post) { root.replaceChildren(node('p', 'writing-empty', result.live ? 'Tulisan tidak ditemukan.' : 'Tulisan belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.')); const back = node('a', 'text-link', 'Kembali ke Writing ↗'); back.href = './'; root.append(back); return; }
    if (post.access_level === 'password') { locked(post, result.live); return; }
    try { const full = await getPost(slug); if (full) await show(full); else locked(post, result.live); }
    catch { head(post); root.append(node('p', 'writing-empty', 'Tulisan belum dapat dimuat. Silakan coba lagi.')); }
  });
  addEventListener('scroll', () => { const max = document.documentElement.scrollHeight - innerHeight; document.querySelector('#reading-progress').style.width = (max > 0 ? Math.max(0, Math.min(100, scrollY / max * 100)) : 0) + '%'; }, { passive: true });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();

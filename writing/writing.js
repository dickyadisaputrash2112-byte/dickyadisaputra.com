(() => {
  'use strict';
  const { list, node, formatDate } = window.WritingSource;
  let posts = []; let category = 'all'; let search = '';
  const root = document.querySelector('#writing-posts');
  function render() {
    const visible = posts.filter(post => (category === 'all' || post.category === category) && [post.title, post.subtitle, post.excerpt, post.category].join(' ').toLocaleLowerCase('id-ID').includes(search));
    root.replaceChildren(); document.querySelector('#writing-count').textContent = visible.length + ' tulisan';
    if (!visible.length) { root.append(node('p', 'writing-empty', search || category !== 'all' ? 'Belum ada tulisan yang cocok. Coba kata kunci atau kategori lain.' : 'Tulisan pertama sedang dipersiapkan.')); return; }
    visible.forEach((post, index) => {
      const row = node('a', 'writing-row'); row.href = 'article.html?slug=' + encodeURIComponent(post.slug);
      const meta = node('div', 'writing-row-category'); meta.append(node('span', '', String(index + 1).padStart(2, '0')), node('span', '', post.category || 'Catatan'));
      const text = node('div', 'writing-row-text'); text.append(node('h3', '', post.title));
      if (post.excerpt || post.subtitle) text.append(node('p', '', post.excerpt || post.subtitle));
      else text.append(node('p', '', post.access_level === 'password' ? 'Judul terbuka untuk semua orang. Isi tulisan memerlukan password.' : 'Sebuah catatan dari Dicky Adisaputra.'));
      const side = node('div', 'writing-row-side'); side.append(node('time', '', formatDate(post.published_at)), node('span', post.access_level === 'password' ? 'writing-lock' : 'writing-open', post.access_level === 'password' ? '⌁ Terkunci' : 'Baca tulisan ↗'));
      row.append(meta, text, side, node('span', 'writing-row-arrow', '↗')); root.append(row);
    });
    document.dispatchEvent(new Event('content:rendered'));
  }
  list().then(result => {
    posts = result.posts;
    const filters = document.querySelector('#writing-filters');
    [...new Set(posts.map(post => post.category).filter(Boolean))].forEach(value => { const button = node('button', '', value); button.dataset.category = value; button.setAttribute('aria-pressed', 'false'); filters.append(button); });
    if (!result.live) { const notice = document.querySelector('#source-notice'); notice.hidden = false; notice.textContent = 'Koneksi belum tersedia. Silakan muat ulang halaman.'; }
    render();
  });
  document.querySelector('#writing-search').addEventListener('input', event => { search = event.target.value.trim().toLocaleLowerCase('id-ID'); render(); });
  document.querySelector('#writing-filters').addEventListener('click', event => {
    const target = event.target.closest('button[data-category]'); if (!target) return; category = target.dataset.category;
    document.querySelectorAll('#writing-filters button').forEach(button => { button.classList.toggle('selected', button === target); button.setAttribute('aria-pressed', String(button === target)); }); render();
  });
  const toggle = document.querySelector('#menu-toggle');
  toggle.addEventListener('click', () => { const open = document.querySelector('#primary-menu').classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();

(() => {
  'use strict';
  let listPromise;
  const node = (tag, className, text) => { const value = document.createElement(tag); if (className) value.className = className; if (text != null) value.textContent = text; return value; };
  const formatDate = value => value ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : '';
  async function rpc(name, args = {}) {
    if (!['blog_list_posts', 'blog_get_post'].includes(name)) throw Error('Read endpoint unavailable.');
    const config = window.DickyWritingConfig;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(config.url + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw Error('Tulisan belum dapat dimuat.');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function list() {
    if (!listPromise) listPromise = rpc('blog_list_posts').then(posts => ({ posts: Array.isArray(posts) ? posts : [], live: true })).catch(() => ({ posts: [], live: false }));
    return listPromise;
  }
  async function renderHome() {
    const root = document.querySelector('#home-writing-feed'); if (!root) return;
    const { posts, live } = await list(); root.replaceChildren();
    if (!posts.length) { root.append(node('p', 'writing-loading', live ? 'Tulisan pertama sedang dipersiapkan.' : 'Tulisan belum dapat dimuat. Silakan muat ulang halaman.')); return; }
    posts.slice(0, 3).forEach(post => {
      const link = node('a', 'note-row'); link.href = 'writing/article.html?slug=' + encodeURIComponent(post.slug);
      link.append(node('span', 'note-type', post.category || 'Writing'));
      const text = node('div'); text.append(node('h3', '', post.title), node('span', '', formatDate(post.published_at) + (post.access_level === 'password' ? ' · Terkunci' : ' · Baca tulisan')));
      link.append(text, node('span', 'note-arrow', '↗')); root.append(link);
    });
    if (!live) root.append(node('p', 'source-notice', 'Koneksi belum tersedia. Silakan muat ulang halaman.'));
    document.dispatchEvent(new Event('content:rendered'));
  }
  window.WritingSource = Object.freeze({ list, node, formatDate, getPost: async (slug, password = null) => {
    const result = await rpc('blog_get_post', { requested_slug: slug, supplied_password: password }); return result?.[0] || null;
  } });
  renderHome();
})();

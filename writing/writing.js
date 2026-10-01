import { supabase } from '../supabase-config.js';

const list = document.querySelector('#post-list');
const filters = document.querySelector('#filters');
document.querySelector('#year').textContent = new Date().getFullYear();
let posts = [];

const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const date = value => new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));

function render(category = 'all') {
  const visible = category === 'all' ? posts : posts.filter(post => post.category === category);
  if (!visible.length) {
    list.innerHTML = '<div class="empty">Belum ada tulisan di sini. Tulisan pertama sedang dipersiapkan.</div>';
    return;
  }
  list.innerHTML = visible.map(post => `
    <a class="post-card" href="article.html?slug=${encodeURIComponent(post.slug)}">
      <div class="post-meta">${esc(post.category)}</div>
      <div><h2 class="post-title">${esc(post.title)}</h2><p class="post-excerpt">${esc(post.excerpt || post.subtitle)}</p></div>
      <div class="post-side"><span>${date(post.published_at)}</span>${post.access_level === 'password' ? '<span class="access-pill">⌁ Terkunci</span>' : '<span>Baca →</span>'}</div>
    </a>`).join('');
}

const { data, error } = await supabase.rpc('blog_list_posts');
if (error) {
  list.innerHTML = '<div class="empty">Tulisan belum dapat dimuat. Silakan coba lagi sebentar.</div>';
} else {
  posts = data || [];
  [...new Set(posts.map(p => p.category).filter(Boolean))].forEach(category => {
    const button = document.createElement('button');
    button.className = 'filter'; button.dataset.category = category; button.textContent = category;
    filters.append(button);
  });
  render();
}

filters.addEventListener('click', event => {
  const button = event.target.closest('.filter'); if (!button) return;
  filters.querySelectorAll('.filter').forEach(node => node.classList.toggle('active', node === button));
  render(button.dataset.category);
});

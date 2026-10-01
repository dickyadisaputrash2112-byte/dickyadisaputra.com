import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/+esm';
import { supabase } from '../supabase-config.js';

const root = document.querySelector('#article-root');
const slug = new URLSearchParams(location.search).get('slug');
document.querySelector('#year').textContent = new Date().getFullYear();
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = value => new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));

const { data: index } = await supabase.rpc('blog_list_posts');
const meta = (index || []).find(post => post.slug === slug);

function head(post) {
  document.title = `${post.title} — Dicky Adisaputra`;
  document.querySelector('meta[name="description"]').content = post.excerpt || post.subtitle || 'Tulisan oleh Dicky Adisaputra.';
  return `<div class="article-shell"><header class="article-head"><a class="article-back" href="./">← Semua tulisan</a><div class="article-category">${esc(post.category)}</div><h1 class="article-title">${esc(post.title)}</h1>${post.subtitle ? `<p class="article-subtitle">${esc(post.subtitle)}</p>` : ''}<div class="article-byline"><span>Dicky Adisaputra</span><span class="byline-dot"></span><time>${formatDate(post.published_at)}</time></div></header>${post.cover_url ? `<img class="cover" src="${esc(post.cover_url)}" alt="">` : ''}`;
}

function showArticle(post) {
  const safe = DOMPurify.sanitize(marked.parse(post.content || ''));
  root.innerHTML = `${head(post)}<article class="prose">${safe}</article></div>`;
}

async function getPost(password = null) {
  const { data, error } = await supabase.rpc('blog_get_post',{requested_slug:slug,supplied_password:password});
  return { post: data?.[0], error };
}

if (!slug || !meta) {
  root.innerHTML = '<div class="article-shell"><div class="empty">Tulisan tidak ditemukan. <a href="./">Kembali ke Writing</a>.</div></div>';
} else if (meta.access_level === 'public') {
  const { post } = await getPost();
  post ? showArticle(post) : root.innerHTML = '<div class="article-shell"><div class="empty">Tulisan belum dapat dibuka.</div></div>';
} else {
  root.innerHTML = `${head(meta)}<section class="lock-card"><div class="lock-icon">⌁</div><h2>Tulisan ini dikunci</h2><p>Judulnya terbuka untuk semua orang, tetapi isinya hanya untuk pembaca yang menerima password dari Dicky.</p><form class="unlock-form"><input type="password" name="password" minlength="8" autocomplete="current-password" placeholder="Masukkan password" required><button type="submit">Buka tulisan</button></form><p class="notice" aria-live="polite"></p></section></div>`;
  root.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.target.querySelector('button'); const notice = root.querySelector('.notice');
    button.disabled = true; button.textContent = 'Membuka…'; notice.textContent = '';
    const { post } = await getPost(new FormData(event.target).get('password'));
    if (post) showArticle(post); else { notice.textContent = 'Password belum cocok. Coba periksa lagi.'; button.disabled = false; button.textContent = 'Buka tulisan'; }
  });
}

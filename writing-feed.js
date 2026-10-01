import { supabase } from './supabase-config.js';

const root = document.querySelector('#home-writing-list');
if (root) {
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const { data, error } = await supabase.rpc('blog_list_posts');
  if (error || !data?.length) {
    root.innerHTML = '<div class="writing-empty">Tulisan pertama sedang dipersiapkan.</div>';
  } else {
    root.innerHTML = data.slice(0, 3).map(post => `<a href="writing/article.html?slug=${encodeURIComponent(post.slug)}"><article><span>${esc(post.category)}</span><h3>${esc(post.title)}</h3><small>${post.access_level === 'password' ? 'Terkunci' : 'Baca'}</small></article></a>`).join('');
  }
}

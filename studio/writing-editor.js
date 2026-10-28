import { supabase } from '../supabase-config.js';
import { saveWritingPost } from './writing-store.js?v=20261028-2';

export function createWritingEditor({ user, onCount = () => {}, notify = () => {} }) {
  const $ = selector => document.querySelector(selector);
  const editor = $('#editor'), nav = $('#post-nav'), status = $('#save-state');
  const field = name => editor.elements[name];
  let posts = [], currentId = null, dirty = false, saving = false, ready = false;
  const slugify = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 150);
  function renderNav() {
    nav.replaceChildren(); onCount(posts);
    const statuses = { draft: 'Draf', published: 'Terbit', scheduled: 'Terjadwal' };
    for (const post of posts) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'nav-post' + (post.id === currentId ? ' active' : '');
      const title = document.createElement('strong'); title.textContent = post.title || 'Tanpa judul';
      const meta = document.createElement('span'); meta.textContent = `${statuses[post.status] || post.status} · ${post.access_level === 'password' ? 'Terkunci' : 'Publik'}`;
      button.append(title, meta); button.addEventListener('click', () => { if (canLeave()) loadPost(post); }); nav.append(button);
    }
    if (!posts.length) { const empty = document.createElement('p'); empty.textContent = 'Belum ada tulisan. Mulai dari satu catatan.'; nav.append(empty); }
  }
  async function refresh() {
    const { data, error } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false });
    if (error) throw Error('Tulisan belum dapat dimuat. Coba buka kembali menu Writing.');
    posts = data || []; renderNav(); ready = true;
  }
  function canLeave() { return !saving && (!dirty || confirm('Perubahan tulisan belum disimpan. Tinggalkan perubahan ini?')); }
  function fieldsChanged() {
    $('#schedule-field').hidden = field('status').value !== 'scheduled';
    $('#password-field').hidden = field('access_level').value !== 'password';
    for (const area of editor.querySelectorAll('.title-input,.subtitle-input')) { area.style.height = 'auto'; area.style.height = area.scrollHeight + 'px'; }
  }
  function newPost() {
    currentId = null; editor.reset(); delete field('slug').dataset.edited;
    field('category').value = 'Catatan'; field('status').value = 'draft'; field('access_level').value = 'public'; field('cover_url').value = '';
    $('#cover-preview').hidden = true; $('#archive-post').hidden = true;
    dirty = false; status.textContent = 'Tulisan baru · simpan sebagai draf saat siap.'; fieldsChanged(); renderNav();
  }
  function loadPost(post) {
    currentId = post.id;
    for (const name of ['title','subtitle','slug','excerpt','category','content','cover_url']) field(name).value = post[name] || '';
    field('slug').dataset.edited = 'true'; field('tags').value = (post.tags || []).join(', ');
    field('status').value = post.status; field('access_level').value = post.access_level; field('article_password').value = '';
    field('published_at').value = post.published_at ? new Date(new Date(post.published_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    $('#cover-preview').hidden = !post.cover_url; if (post.cover_url) $('#cover-preview').src = post.cover_url;
    $('#archive-post').hidden = post.status === 'draft'; dirty = false;
    status.textContent = 'Tersimpan · ' + new Date(post.updated_at).toLocaleString('id-ID'); fieldsChanged(); renderNav();
  }
  editor.addEventListener('input', event => {
    dirty = true; status.textContent = 'Ada perubahan yang belum disimpan.';
    if (event.target === field('title') && !currentId && !field('slug').dataset.edited) field('slug').value = slugify(field('title').value);
    if (event.target === field('slug')) field('slug').dataset.edited = 'true'; fieldsChanged();
  });
  editor.addEventListener('change', fieldsChanged); editor.addEventListener('submit', event => { event.preventDefault(); save(); });
  async function save() {
    if (saving) return;
    const existing = posts.find(post => post.id === currentId), locked = field('access_level').value === 'password', password = field('article_password').value;
    if (!field('title').value.trim() || !field('content').value.trim()) { status.textContent = 'Judul dan isi tulisan wajib diisi.'; return; }
    if (locked && ((!existing?.password_hash && password.length < 8) || (password && password.length < 8))) { status.textContent = 'Password tulisan minimal 8 karakter.'; return; }
    const desiredStatus = field('status').value;
    let publishedAt = desiredStatus === 'published' ? (existing?.published_at && new Date(existing.published_at) <= new Date() ? existing.published_at : new Date().toISOString()) : null;
    if (desiredStatus === 'scheduled') { if (!field('published_at').value) { status.textContent = 'Pilih waktu terbit terlebih dahulu.'; return; } publishedAt = new Date(field('published_at').value).toISOString(); }
    const payload = { author_id:user.id, title:field('title').value.trim(), subtitle:field('subtitle').value.trim(), slug:slugify(field('slug').value || field('title').value), excerpt:field('excerpt').value.trim(), category:field('category').value.trim() || 'Catatan', tags:field('tags').value.split(',').map(x=>x.trim()).filter(Boolean), content:field('content').value, cover_url:field('cover_url').value || null, status:desiredStatus, published_at:publishedAt, access_level:locked ? 'password' : 'public' };
    saving = true; $('#save-post').disabled = true; editor.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=true); status.textContent = 'Menyimpan tulisan…';
    try {
      const result = await saveWritingPost(supabase, { id: currentId, payload, password, existing }); currentId = result.id; dirty = false; field('article_password').value = '';
      await refresh(); const saved = posts.find(post=>post.id===currentId); if(saved) loadPost(saved);
      status.textContent = desiredStatus === 'draft' ? 'Draf tersimpan.' : desiredStatus === 'scheduled' ? 'Tulisan dijadwalkan.' : 'Tulisan sudah diterbitkan.';
      notify(status.textContent);
    } catch(error) { if(error.postId) currentId = error.postId; status.textContent = error.message; try { await refresh(); } catch {} }
    finally { saving = false; $('#save-post').disabled = false; editor.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=false); }
  }
  $('#save-post').addEventListener('click', save);
  $('#new-post').addEventListener('click', () => { if (canLeave()) newPost(); });
  $('#archive-post').addEventListener('click', async () => {
    if (!currentId || !canLeave() || !confirm('Sembunyikan tulisan dari publik dan simpan sebagai draf?')) return;
    const { error } = await supabase.from('blog_posts').update({ status:'draft' }).eq('id',currentId);
    if(error) { status.textContent='Tulisan belum dapat dijadikan draf.'; return; }
    await refresh(); loadPost(posts.find(post=>post.id===currentId)); notify('Tulisan disimpan sebagai draf.');
  });
  editor.querySelector('.toolbar').addEventListener('click', event => {
    const button=event.target.closest('button'); if(!button)return; const area=field('content'), start=area.selectionStart, end=area.selectionEnd, selected=area.value.slice(start,end);
    const text=button.dataset.wrap ? `${button.dataset.wrap}${selected||'teks'}${button.dataset.wrap}` : button.dataset.prefix ? `${button.dataset.prefix}${selected||'teks'}` : `[${selected||'teks tautan'}](https://)`;
    area.setRangeText(text,start,end,'end'); area.dispatchEvent(new Event('input',{bubbles:true})); area.focus();
  });
  $('#cover-file').addEventListener('change', async event => {
    const file=event.target.files[0]; if(!file)return;
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>8*1024*1024){status.textContent='Gunakan JPG, PNG, WebP, atau GIF di bawah 8 MB.';return;}
    $('#save-post').disabled=true; status.textContent='Mengunggah cover…';
    try {
      const path=`${user.id}/${crypto.randomUUID()}-${file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-')}`;
      const {error}=await supabase.storage.from('writing-media').upload(path,file,{upsert:false}); if(error)throw error;
      const url=supabase.storage.from('writing-media').getPublicUrl(path).data.publicUrl;
      field('cover_url').value=url; $('#cover-preview').src=url; $('#cover-preview').hidden=false; dirty=true; status.textContent='Cover siap. Simpan tulisan untuk menyelesaikan.';
    } catch {status.textContent='Unggah cover belum berhasil. Coba kembali.';} finally {$('#save-post').disabled=false;}
  });
  addEventListener('beforeunload', event => { if(dirty||saving){event.preventDefault();event.returnValue='';} });
  return { canLeave, newPost, async open() { if(!ready){await refresh();newPost();} fieldsChanged(); } };
}

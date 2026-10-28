import { supabase, OWNER_EMAIL } from '../supabase-config.js';
import { createWritingEditor } from './writing-editor.js?v=20261028-2';
import { uploadPhotoBatch } from './photo-queue.js?v=20261028-2';
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let user = null; let archived = [];
let state = { photos: [], books: [] };
let section = 'photos';
let filter = 'all';
let editing = null;
let pendingDelete = null;
let toastTimer;
let writer = null, writingPosts = [], photoQueue = [], uploadBusy = false;

async function readState() {
  const { data, error } = await supabase.from('personal_collections').select('*').order('created_at', { ascending: false });
  if (error) throw Error('Koleksi belum dapat dimuat. Coba lagi.');
  state = { photos: [], books: [] }; archived = [];
  for (const row of data || []) { const entry = { ...row.data, id: row.id, status: row.status }; if (row.status === 'archived') archived.push({ kind: row.kind, ...entry }); else state[row.kind]?.push(entry); }
}
async function persistEntry(kind, entry, refresh = true) {
  const { id, status, updatedAt, ...data } = entry;
  const { error } = await supabase.from('personal_collections').upsert({ id, author_id: user.id, kind, status, data, updated_at: new Date().toISOString() });
  if (error) throw Error('Konten belum tersimpan. Periksa koneksi dan coba kembali.');
  if (refresh) { await readState(); render(); }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function toast(message) {
  clearTimeout(toastTimer);
  const target = $('#studio-toast');
  target.textContent = message; target.hidden = false;
  toastTimer = setTimeout(() => { target.hidden = true; }, 5000);
}
function isPublished(item) { return item.status !== 'draft'; }
function badge(item, label) { return el('span', 'status-badge' + (isPublished(item) ? '' : ' draft'), label || (isPublished(item) ? 'Tampil' : 'Draf')); }
function button(text, callback) {
  const target = el('button', '', text); target.type = 'button'; target.addEventListener('click', callback); return target;
}
function itemActions(kind, item) {
  const actions = el('div', 'item-actions');
  actions.append(button('Edit', () => openEditor(kind, item)), button(isPublished(item) ? 'Jadikan draf' : 'Tampilkan', async () => {
    try { await persistEntry(kind, { ...item, status: isPublished(item) ? 'draft' : 'published' }); toast(isPublished(item) ? 'Disimpan sebagai draf.' : 'Ditampilkan di website.'); }
    catch (error) { toast(error.message); }
  }), button('Arsipkan', () => { pendingDelete = { kind, id: item.id }; $('#delete-dialog').showModal(); }));
  return actions;
}
function emptyCard(title, description, kind, mark) {
  const card = el('div', 'studio-empty');
  card.append(el('span', '', mark), el('h3', '', title), el('p', '', description));
  const add = button(kind === 'photos' ? '＋ Unggah foto' : '＋ Tambah buku', () => openEditor(kind)); add.className = 'outline-button'; card.append(add); return card;
}
function renderPhotos() {
  const grid = $('#studio-photo-grid'); grid.replaceChildren();
  if (filter === 'all' || filter === 'work') {
    const original = el('article', 'studio-photo-card');
    const image = el('img', 'studio-thumb'); image.src = '../assets/portrait.jpeg'; image.alt = 'Foto asli Dicky Adisaputra';
    const body = el('div'); const meta = el('div', 'studio-item-meta'); meta.append(el('span', '', 'Work'), badge({ status: 'published' }, 'Foto asli'));
    body.append(meta, el('h3', '', 'Dicky Adisaputra'), el('p', 'location', 'Portrait · foto yang sudah tersedia'), el('p', 'studio-original-note', 'Aset foto asli tetap dipertahankan.'));
    original.append(image, body); grid.append(original);
  }
  state.photos.filter(photo => filter === 'all' || photo.category === filter).forEach(photo => {
    const card = el('article', 'studio-photo-card'); const image = el('img', 'studio-thumb'); image.src = photo.src; image.alt = photo.caption;
    const body = el('div'); const meta = el('div', 'studio-item-meta'); meta.append(el('span', '', ({ work: 'Work', outdoors: 'Outdoors', other: 'Lain-lain' }[photo.category] || 'Lain-lain')), badge(photo));
    body.append(meta, el('h3', '', photo.caption), el('p', 'location', photo.location || 'Tanpa lokasi'), itemActions('photos', photo)); card.append(image, body); grid.append(card);
  });
  if (!state.photos.some(p => p.category === 'outdoors') && (filter === 'all' || filter === 'outdoors')) grid.append(emptyCard('Mountains & places.', 'Simpan foto gunung dan perjalananmu, lalu pilih yang ingin ditampilkan.', 'photos', '↗'));
  if (!state.photos.some(p => p.category === 'work') && (filter === 'all' || filter === 'work')) grid.append(emptyCard('A moment from work.', 'Foto profesional, kegiatan, dan momen di balik pekerjaan.', 'photos', '▧'));
  if (filter === 'other' && !state.photos.some(photo => photo.category === 'other')) grid.append(emptyCard('Other moments.', 'Momen keseharian dan cerita di luar pekerjaan serta perjalanan.', 'photos', '↗'));
}
function renderBooks() {
  const list = $('#studio-book-list'); list.replaceChildren();
  if (!state.books.length) { list.append(emptyCard('Mulai dari satu buku.', 'Catat judul, penulis, waktu selesai, cover, dan satu hal yang kamu bawa pulang.', 'books', '▤')); return; }
  state.books.forEach(book => {
    const row = el('article', 'studio-book-row'); const cover = el('div', 'studio-book-cover');
    if (book.cover && /^https:\/\//.test(book.cover)) { cover.classList.add('has-cover'); const image = el('img'); image.src = book.cover; image.alt = 'Cover ' + book.title; cover.append(image); }
    else cover.textContent = book.title;
    const info = el('div', 'studio-book-info'); info.append(badge(book), el('h3', '', book.title), el('p', '', book.author));
    if (book.takeaway) info.append(el('blockquote', '', book.takeaway));
    info.append(itemActions('books', book)); row.append(cover, info); list.append(row);
  });
}
function render() {
  const items = [...state.photos, ...state.books, ...writingPosts];
  $('#photo-count').textContent = $('#nav-photo-count').textContent = state.photos.length + 1;
  $('#book-count').textContent = $('#nav-book-count').textContent = state.books.length;
  $('#published-count').textContent = items.filter(item => item.status === "published" || (item.status === "scheduled" && new Date(item.published_at) <= new Date())).length;
  $('#draft-count').textContent = items.filter(item => !isPublished(item)).length;
  renderPhotos(); renderBooks();
  document.dispatchEvent(new Event('content:rendered'));
}
function selectSection(name, setHash = true) {
  if (section === 'writing' && name !== 'writing' && writer && !writer.canLeave()) return;
  section = name;
  $('#collection-workspace').dataset.section = name;
  if (setHash) history.replaceState(null, '', '#' + name);
  $$('[data-section]').forEach(target => {
    const selected = target.dataset.section === name; target.classList.toggle('selected', selected);
    if (selected) target.setAttribute('aria-current', 'page'); else target.removeAttribute('aria-current');
  });
  ['photos', 'books', 'writing'].forEach(kind => { $(`#${kind}-section`).hidden = kind !== name; });
  const labels = { photos: ['Foto & galeri', 'Pilih momen yang ingin kamu tampilkan ke pengunjung.', '＋ Unggah foto'], books: ['Rak buku', 'Buku yang sudah dibaca, dengan catatan yang terasa personal.', '＋ Tambah buku'], writing: ['Writing', 'Simpan gagasan, susun draf, dan terbitkan tulisan dari sini.', '＋ Tulisan baru'] };
  const content = labels[name]; $('#breadcrumb').textContent = content[0]; $('#studio-title').textContent = content[0] + '.'; $('#studio-subtitle').textContent = content[1];
  $('#new-content').hidden = false; $('#new-content').textContent = content[2];
  if (name === 'writing') writer?.open().catch(error => toast(error.message));
  document.dispatchEvent(new Event('content:rendered'));
}
function openEditor(kind, item = null) {
  clearPhotoQueue();
  editing = { kind, item };
  $('#batch-progress').hidden = true; $('#batch-progress').textContent = '';
  $('#photo-single-fields').hidden = false; $('#photo-batch-list').hidden = true;
  const form = $('#content-form'); form.reset(); if (kind === 'photos' && !item) form.elements.category.value = ['work','outdoors','other'].includes(filter) ? filter : 'work'; $('#editor-error').textContent = ''; $('#studio-file-preview').hidden = true;
  $('#photo-fields').hidden = kind !== 'photos'; $('#book-fields').hidden = kind !== 'books';
  form.elements.caption.required = kind === 'photos'; form.elements.title.required = form.elements.author.required = kind === 'books'; form.elements.photo.required = kind === 'photos' && !item; form.elements.photo.multiple = !item;
  $('#editor-title').textContent = (item ? 'Edit ' : 'Tambah ') + (kind === 'photos' ? 'foto.' : 'buku.');
  if (item) {
    for (const key of ['caption', 'category', 'location', 'title', 'author', 'finished', 'takeaway']) if (key in item && form.elements[key]) form.elements[key].value = item[key];
    form.elements.entry_id.value = item.id;
    if (kind === 'photos') { $('#studio-file-preview').src = item.src; $('#studio-file-preview').hidden = false; }
  }
  $('#studio-editor').showModal();
}
async function localImage(file, maxSide) {
  if (!file || !file.size) return '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Pilih gambar JPG, PNG, atau WebP.');
  if (file.size > 15 * 1024 * 1024) throw Error('Gunakan gambar di bawah 15 MB.');
  const image = new Image(); const url = URL.createObjectURL(file);
  try {
    image.src = url; await image.decode();
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82));
    if (!blob) throw Error('Gambar belum bisa diproses.');
    const path = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from('portfolio-media').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw Error('Unggah gambar gagal. Periksa koneksi dan coba lagi.');
    return supabase.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
  } catch (error) { throw Error(error.message || 'Gambar belum bisa dibuka. Coba gambar lain.'); }
  finally { URL.revokeObjectURL(url); }
}
function clearPhotoQueue() { for (const entry of photoQueue) if (entry.preview) URL.revokeObjectURL(entry.preview); photoQueue = []; }
function queueStatus(entry, phase) {
  const row = document.querySelector(`[data-photo-queue="${entry.id}"]`); if (!row) return;
  const target = row.querySelector('.queue-state'); target.textContent = phase === 'saved' ? 'Tersimpan ✓' : phase === 'uploading' ? 'Mengunggah…' : phase === 'failed' ? entry.error : 'Siap diunggah';
  row.classList.toggle('queue-error', phase === 'failed'); row.classList.toggle('queue-saved', phase === 'saved');
}
function renderPhotoQueue() {
  const list = $('#photo-batch-list'); list.replaceChildren(); list.hidden = !photoQueue.length;
  $('#photo-single-fields').hidden = photoQueue.length > 1;
  const form = $('#content-form'); form.elements.caption.required = photoQueue.length <= 1;
  if (photoQueue.length <= 1) { if(photoQueue.length === 1) { const entry = photoQueue[0]; $('#studio-file-preview').src = entry.preview; $('#studio-file-preview').hidden = false; form.elements.caption.value = entry.caption; form.elements.category.value = entry.category; form.elements.location.value = entry.location; } return; }
  for (const entry of photoQueue) {
    const row = el('article', 'photo-queue-item'); row.dataset.photoQueue = entry.id;
    const image = el('img'); image.src = entry.preview; image.alt = entry.file.name;
    const body = el('div', 'photo-queue-fields'); const top = el('div', 'photo-queue-top'); top.append(el('strong', '', entry.file.name));
    const remove = button('Hapus pilihan', () => { URL.revokeObjectURL(entry.preview); photoQueue = photoQueue.filter(item => item.id !== entry.id); renderPhotoQueue(); if (photoQueue.length === 1) form.elements.caption.value = photoQueue[0].caption; });
    top.append(remove); body.append(top);
    const captionLabel = el('label', '', 'Keterangan foto'); const caption = el('input'); caption.value = entry.caption; caption.maxLength = 120; caption.required = true; caption.setAttribute('aria-label', 'Keterangan ' + entry.file.name); caption.addEventListener('input', () => entry.caption = caption.value); captionLabel.append(caption); body.append(captionLabel);
    const fields = el('div', 'form-grid'); const categoryLabel = el('label', '', 'Koleksi'); const category = el('select');
    for (const [value, text] of [['work','Work — profesional'],['outdoors','Outdoors — gunung & perjalanan'],['other','Lain-lain — keseharian']]) { const option = el('option', '', text); option.value = value; category.append(option); }
    category.value = entry.category; category.addEventListener('change', () => entry.category = category.value); categoryLabel.append(category);
    const locationLabel = el('label', '', 'Lokasi (opsional)'); const location = el('input'); location.value = entry.location; location.maxLength = 80; location.addEventListener('input', () => entry.location = location.value); locationLabel.append(location);
    fields.append(categoryLabel, locationLabel); body.append(fields, el('p', 'queue-state', entry.saved ? 'Tersimpan ✓' : entry.error || 'Siap diunggah')); row.append(image, body); list.append(row);
    if (entry.saved) row.querySelectorAll('input,select,button').forEach(target => target.disabled = true);
  }
}
$('#content-form').addEventListener('submit', async event => {
  event.preventDefault(); if (uploadBusy) return;
  const form = event.currentTarget, intent = event.submitter?.value || 'draft';
  uploadBusy = true; $('#editor-error').textContent = '';
  try {
    const data = new FormData(form), { kind, item } = editing;
    if (kind === 'photos' && !item) {
      if (!photoQueue.length) throw Error('Pilih satu atau beberapa foto terlebih dahulu.');
      if (photoQueue.length === 1) Object.assign(photoQueue[0], { caption: String(data.get('caption') || '').trim(), category: data.get('category'), location: String(data.get('location') || '').trim() });
      if (photoQueue.some(entry => !entry.caption.trim())) throw Error('Isi keterangan untuk setiap foto.');
      form.querySelectorAll('input,select,button').forEach(target => target.disabled = true);
      $('#batch-progress').hidden = false;
      const result = await uploadPhotoBatch(photoQueue, {
        upload: file => localImage(file, 1400),
        persist: entry => persistEntry('photos', { id: entry.id, status: intent, caption: entry.caption.trim(), category: entry.category, location: entry.location.trim(), src: entry.src }, false),
        onProgress(entry,index,total,phase) { $('#batch-progress').textContent = `Foto ${index + 1} dari ${total} · ${photoQueue.filter(item => item.saved).length} tersimpan`; queueStatus(entry, phase); }
      });
      await readState(); render();
      if (result.failed) { $('#editor-error').textContent = `${result.saved} foto tersimpan, ${result.failed} belum berhasil. Klik simpan lagi untuk mencoba foto yang gagal.`; }
      else { $('#studio-editor').close(); toast(`${result.saved} foto ${intent === 'draft' ? 'tersimpan sebagai draf' : 'ditampilkan di website'}.`); clearPhotoQueue(); }
      return;
    }
    const entry = { ...item, id: item?.id || crypto.randomUUID(), status: intent };
    form.querySelectorAll('button').forEach(target => target.disabled = true);
    if (kind === 'photos') {
      entry.caption = String(data.get('caption') || '').trim(); if (!entry.caption) throw Error('Isi keterangan foto terlebih dahulu.');
      entry.category = data.get('category'); entry.location = String(data.get('location') || '').trim(); entry.src = await localImage(form.elements.photo.files[0], 1400) || item?.src;
      if (!entry.src) throw Error('Pilih foto terlebih dahulu.');
    } else {
      entry.title = String(data.get('title') || '').trim(); entry.author = String(data.get('author') || '').trim(); if (!entry.title || !entry.author) throw Error('Isi judul dan penulis buku.');
      entry.finished = data.get('finished'); entry.takeaway = String(data.get('takeaway') || '').trim(); entry.cover = await localImage(form.elements.cover.files[0], 600) || item?.cover || '';
    }
    await persistEntry(kind, entry); $('#studio-editor').close(); selectSection(kind); toast(intent === 'draft' ? 'Draf tersimpan.' : 'Konten tampil di website.');
  } catch (error) { $('#editor-error').textContent = error.message; }
  finally { uploadBusy = false; form.querySelectorAll('input,select,button').forEach(target => target.disabled = false); for (const entry of photoQueue.filter(item => item.saved)) document.querySelector(`[data-photo-queue="${entry.id}"]`)?.querySelectorAll('input,select,button').forEach(target => target.disabled = true); }
});
$('#studio-photo-file').addEventListener('change', event => {
  const files = [...event.target.files]; clearPhotoQueue();
  $('#editor-error').textContent = ''; $('#batch-progress').hidden = true;
  if (files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024)) { $('#editor-error').textContent = 'Pilih JPG, PNG, atau WebP dengan ukuran maksimal 15 MB per foto.'; event.target.value = ''; renderPhotoQueue(); return; }
  if (!editing.item) photoQueue = files.map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g,' ').slice(0,120), category: $('#content-form').elements.category.value, location: '', saved: false }));
  renderPhotoQueue();
  if (files.length === 1) { const image = $('#studio-file-preview'); image.src = photoQueue[0]?.preview || URL.createObjectURL(files[0]); image.hidden = false; if (!editing.item) $('#content-form').elements.caption.value = photoQueue[0].caption; }
});
$('#studio-editor').addEventListener('cancel', event => { if(uploadBusy) event.preventDefault(); });
$('#new-content').addEventListener('click', () => { if(section === 'writing') { if(writer?.canLeave()) writer.newPost(); } else openEditor(section); });
$('#close-editor').addEventListener('click', () => { if(!uploadBusy) { $('#studio-editor').close(); clearPhotoQueue(); } });
$$('[data-section]').forEach(target => target.addEventListener('click', () => selectSection(target.dataset.section)));
$$('[data-filter]').forEach(target => target.addEventListener('click', () => { filter = target.dataset.filter; $$('[data-filter]').forEach(item => item.classList.toggle('selected', item === target)); renderPhotos(); }));
$('#cancel-delete').addEventListener('click', () => $('#delete-dialog').close());
$('#confirm-delete').addEventListener('click', async () => {
  if (!pendingDelete) return;
  const { kind, id } = pendingDelete; const previous = state[kind].find(item => item.id === id); if (!previous) return;
  const target = $('#confirm-delete'); target.disabled = true;
  try { await persistEntry(kind, { ...previous, status: 'archived' }); $('#delete-dialog').close(); toast('Konten diarsipkan. Pulihkan melalui menu Arsip.'); }
  catch (error) { toast(error.message); } finally { target.disabled = false; }
});
$('#show-archive').addEventListener('click', () => {
  const list = $('#archive-list'); list.replaceChildren();
  if (!archived.length) list.append(el('p', '', 'Belum ada konten di arsip.'));
  for (const item of archived) { const row = el('div'); row.append(el('span', '', item.caption || item.title), button('Pulihkan ke draf', async () => {
    try { const { kind, ...entry } = item; await persistEntry(kind, { ...entry, status: 'draft' }); $('#archive-dialog').close(); toast('Konten dikembalikan sebagai draf.'); } catch (error) { toast(error.message); }
  })); list.append(row); }
  $('#archive-dialog').showModal();
});
$('#close-archive').addEventListener('click', () => $('#archive-dialog').close());
$('#export-content').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'dicky-personal-studio-1', ...state }, null, 2)], { type: 'application/json' }));
  const link = el('a'); link.href = url; link.download = 'personal-studio-content.json'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const loginForm = $('#collection-login-form'); loginForm.elements.email.value = OWNER_EMAIL;
async function openWorkspace() {
  $('#login-message').textContent = 'Memeriksa akun…';
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.email?.toLowerCase() !== OWNER_EMAIL) { $('#login-message').textContent = 'Masuk untuk melanjutkan.'; return; }
  user = data.user;
  writer ||= createWritingEditor({ user, notify: toast, onCount(posts) { writingPosts = posts; $('#nav-writing-count').textContent = posts.length; render(); } });
  try { await readState(); const writingSummary = await supabase.from('blog_posts').select('id,status,published_at'); if(!writingSummary.error) { writingPosts = writingSummary.data || []; $('#nav-writing-count').textContent = writingPosts.length; } render(); $('#collection-login').hidden = true; $('#collection-workspace').hidden = false; const requested = location.hash.slice(1); selectSection(['photos','books','writing'].includes(requested) ? requested : 'photos'); }
  catch (error) { $('#login-message').textContent = error.message; }
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); const target = loginForm.querySelector('button'); target.disabled = true;
  try { const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: loginForm.elements.password.value }); loginForm.elements.password.value = ''; if (error) throw Error('Email atau password belum cocok.'); await openWorkspace(); }
  catch (error) { $('#login-message').textContent = error.message; } finally { target.disabled = false; }
});
$('#sign-out').addEventListener('click', async () => { if(writer && !writer.canLeave())return; await supabase.auth.signOut(); location.reload(); });
supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { user = null; $('#collection-workspace').hidden = true; $('#collection-login').hidden = false; state = { photos: [], books: [] }; } });
await openWorkspace();

addEventListener('hashchange', () => { const name = location.hash.slice(1); if(['photos','books','writing'].includes(name) && user) selectSection(name); });

import { supabase, OWNER_EMAIL } from '../supabase-config.js';
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

async function readState() {
  const { data, error } = await supabase.from('personal_collections').select('*').order('created_at', { ascending: false });
  if (error) throw Error('Koleksi belum dapat dimuat. Coba lagi.');
  state = { photos: [], books: [] }; archived = [];
  for (const row of data || []) { const entry = { ...row.data, id: row.id, status: row.status }; if (row.status === 'archived') archived.push({ kind: row.kind, ...entry }); else state[row.kind]?.push(entry); }
}
async function persistEntry(kind, entry) {
  const { id, status, updatedAt, ...data } = entry;
  const { error } = await supabase.from('personal_collections').upsert({ id, author_id: user.id, kind, status, data, updated_at: new Date().toISOString() });
  if (error) throw Error('Konten belum tersimpan. Periksa koneksi dan coba kembali.');
  await readState(); render();
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
  const add = button(kind === 'photos' ? '＋ Tambah foto' : '＋ Tambah buku', () => openEditor(kind)); add.className = 'outline-button'; card.append(add); return card;
}
function renderPhotos() {
  const grid = $('#studio-photo-grid'); grid.replaceChildren();
  if (filter !== 'outdoors') {
    const original = el('article', 'studio-photo-card');
    const image = el('img', 'studio-thumb'); image.src = '../assets/portrait.jpeg'; image.alt = 'Foto asli Dicky Adisaputra';
    const body = el('div'); const meta = el('div', 'studio-item-meta'); meta.append(el('span', '', 'Work'), badge({ status: 'published' }, 'Foto asli'));
    body.append(meta, el('h3', '', 'Dicky Adisaputra'), el('p', 'location', 'Portrait · foto yang sudah tersedia'), el('p', 'studio-original-note', 'Aset foto asli tetap dipertahankan.'));
    original.append(image, body); grid.append(original);
  }
  state.photos.filter(photo => filter === 'all' || photo.category === filter).forEach(photo => {
    const card = el('article', 'studio-photo-card'); const image = el('img', 'studio-thumb'); image.src = photo.src; image.alt = photo.caption;
    const body = el('div'); const meta = el('div', 'studio-item-meta'); meta.append(el('span', '', photo.category === 'work' ? 'Work' : 'Outdoors'), badge(photo));
    body.append(meta, el('h3', '', photo.caption), el('p', 'location', photo.location || 'Tanpa lokasi'), itemActions('photos', photo)); card.append(image, body); grid.append(card);
  });
  if (!state.photos.some(p => p.category === 'outdoors') && filter !== 'work') grid.append(emptyCard('Mountains & places.', 'Simpan foto gunung dan perjalananmu, lalu pilih yang ingin ditampilkan.', 'photos', '↗'));
  if (!state.photos.some(p => p.category === 'work') && filter !== 'outdoors') grid.append(emptyCard('A moment from work.', 'Foto profesional, kegiatan, dan momen di balik pekerjaan.', 'photos', '▧'));
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
  const items = [...state.photos, ...state.books];
  $('#photo-count').textContent = $('#nav-photo-count').textContent = state.photos.length;
  $('#book-count').textContent = $('#nav-book-count').textContent = state.books.length;
  $('#published-count').textContent = items.filter(isPublished).length;
  $('#draft-count').textContent = items.filter(item => !isPublished(item)).length;
  renderPhotos(); renderBooks();
  document.dispatchEvent(new Event('content:rendered'));
}
function selectSection(name) {
  section = name;
  $$('[data-section]').forEach(target => {
    const selected = target.dataset.section === name; target.classList.toggle('selected', selected);
    if (selected) target.setAttribute('aria-current', 'page'); else target.removeAttribute('aria-current');
  });
  ['photos', 'books', 'writing'].forEach(kind => { $(`#${kind}-section`).hidden = kind !== name; });
  const labels = { photos: ['Foto & galeri', 'Pilih momen yang ingin kamu tampilkan ke pengunjung.', '＋ Tambah foto'], books: ['Rak buku', 'Buku yang sudah dibaca, dengan catatan yang terasa personal.', '＋ Tambah buku'], writing: ['Tulisan', 'Cerita profesional dan catatan kehidupan dalam satu tempat.', ''] };
  const content = labels[name]; $('#breadcrumb').textContent = content[0]; $('#studio-title').textContent = content[0] + '.'; $('#studio-subtitle').textContent = content[1];
  $('#new-content').hidden = name === 'writing'; $('#new-content').textContent = content[2];
  document.dispatchEvent(new Event('content:rendered'));
}
function openEditor(kind, item = null) {
  editing = { kind, item };
  const form = $('#content-form'); form.reset(); $('#editor-error').textContent = ''; $('#studio-file-preview').hidden = true;
  $('#photo-fields').hidden = kind !== 'photos'; $('#book-fields').hidden = kind !== 'books';
  form.elements.caption.required = kind === 'photos'; form.elements.title.required = form.elements.author.required = kind === 'books'; form.elements.photo.required = kind === 'photos' && !item;
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
  } catch { throw Error('Gambar belum bisa dibuka. Coba gambar JPG, PNG, atau WebP lain.'); }
  finally { URL.revokeObjectURL(url); }
}
$('#content-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget; const intent = event.submitter?.value || 'draft';
  const targets = $$('button[type=submit]', form); targets.forEach(target => { target.disabled = true; }); $('#editor-error').textContent = '';
  try {
    const data = new FormData(form); const { kind, item } = editing;
    const entry = { ...item, id: item?.id || crypto.randomUUID(), status: intent, updatedAt: new Date().toISOString() };
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
  finally { targets.forEach(target => { target.disabled = false; }); }
});
$('#studio-photo-file').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file) return;
  const image = $('#studio-file-preview'); const url = URL.createObjectURL(file); image.onload = () => URL.revokeObjectURL(url); image.onerror = () => { URL.revokeObjectURL(url); image.hidden = true; }; image.src = url; image.hidden = false;
});
$('#new-content').addEventListener('click', () => openEditor(section));
$('#close-editor').addEventListener('click', () => $('#studio-editor').close());
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
  try { await readState(); render(); $('#collection-login').hidden = true; $('#collection-workspace').hidden = false; }
  catch (error) { $('#login-message').textContent = error.message; }
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); const target = loginForm.querySelector('button'); target.disabled = true;
  try { const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: loginForm.elements.password.value }); loginForm.elements.password.value = ''; if (error) throw Error('Email atau password belum cocok.'); await openWorkspace(); }
  catch (error) { $('#login-message').textContent = error.message; } finally { target.disabled = false; }
});
$('#sign-out').addEventListener('click', async () => { await supabase.auth.signOut(); location.reload(); });
supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') { user = null; $('#collection-workspace').hidden = true; $('#collection-login').hidden = false; state = { photos: [], books: [] }; } });
await openWorkspace();

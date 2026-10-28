'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let state = { photos: [], books: [] };
let activeFilter = 'all';
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const galleryCategories = [
  { id: 'work', title: 'Work', subtitle: 'People, projects & moments in between.' },
  { id: 'outdoors', title: 'Mountains & places', subtitle: 'A little further from the everyday.' },
  { id: 'other', title: 'Other moments', subtitle: 'The little things along the way.' }
];
let galleryPhotos = [], galleryIndex = 0, galleryTitle = '';
const imageDialog = $('#image-dialog');
imageDialog.setAttribute('aria-labelledby', 'image-title');
const imageStage = el('div', 'image-stage');
const expandedImage = $('#expanded-image'); expandedImage.draggable = false;
expandedImage.before(imageStage);
const previousPhoto = el('button', 'gallery-arrow previous', '←'); previousPhoto.type = 'button'; previousPhoto.setAttribute('aria-label', 'Foto sebelumnya');
const nextPhoto = el('button', 'gallery-arrow next', '→'); nextPhoto.type = 'button'; nextPhoto.setAttribute('aria-label', 'Foto berikutnya');
imageStage.append(previousPhoto, expandedImage, nextPhoto);
const galleryPosition = el('p', 'gallery-position'); galleryPosition.setAttribute('aria-live', 'polite'); galleryPosition.setAttribute('aria-atomic', 'true');
const imageError = el('p', 'gallery-error', 'Foto belum dapat dimuat. Coba foto berikutnya atau buka kembali album ini.'); imageError.hidden = true; imageError.setAttribute('role', 'status');
const galleryThumbnails = el('div', 'gallery-thumbnails'); galleryThumbnails.setAttribute('role', 'group'); galleryThumbnails.setAttribute('aria-label', 'Pilih foto dalam album');
imageDialog.append(imageError, galleryPosition, galleryThumbnails);
function displayImage(src, title, caption) {
  imageError.hidden = true;
  expandedImage.src = src; expandedImage.alt = title;
  $('#image-title').textContent = title;
  $('#image-caption').textContent = caption || ''; $('#image-caption').hidden = !caption;
  expandedImage.classList.remove('slide-enter');
  void expandedImage.offsetWidth; expandedImage.classList.add('slide-enter');
}
expandedImage.addEventListener('error', () => { if(imageDialog.open) imageError.hidden = false; });
expandedImage.addEventListener('load', () => { imageError.hidden = true; });
function showImageDialog() {
  document.documentElement.classList.add('image-viewer-open');
  if (!imageDialog.open) imageDialog.showModal();
}
function openImage(src, title, caption = '') {
  galleryPhotos = []; imageDialog.classList.remove('gallery-viewer');
  previousPhoto.hidden = nextPhoto.hidden = galleryPosition.hidden = galleryThumbnails.hidden = true;
  galleryThumbnails.replaceChildren(); displayImage(src, title, caption); showImageDialog();
}
function showGalleryPhoto(index, moveThumbnail = true) {
  if (!galleryPhotos.length) return;
  galleryIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[galleryIndex];
  displayImage(photo.src, photo.caption, photo.location);
  galleryPosition.textContent = `${galleryTitle} · ${galleryIndex + 1} dari ${galleryPhotos.length} foto`;
  [...galleryThumbnails.children].forEach((button, i) => { button.setAttribute('aria-current', String(i === galleryIndex)); button.tabIndex = i === galleryIndex ? 0 : -1; });
  if (moveThumbnail) galleryThumbnails.children[galleryIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function openAlbum(photos, title) {
  if (!photos.length) return;
  galleryPhotos = [...photos]; galleryIndex = 0; galleryTitle = title; imageDialog.classList.add('gallery-viewer');
  previousPhoto.hidden = nextPhoto.hidden = photos.length < 2;
  galleryPosition.hidden = false; galleryThumbnails.hidden = photos.length < 2; galleryThumbnails.replaceChildren();
  photos.forEach((photo, index) => {
    const button = el('button', 'gallery-thumbnail'); button.type = 'button'; button.setAttribute('aria-label', `Lihat foto ${index + 1}: ${photo.caption}`);
    const image = el('img'); image.src = photo.src; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    button.append(image); button.addEventListener('click', () => showGalleryPhoto(index)); galleryThumbnails.append(button);
  });
  showGalleryPhoto(0, false); showImageDialog(); galleryThumbnails.scrollLeft = 0;
}
previousPhoto.addEventListener('click', () => showGalleryPhoto(galleryIndex - 1));
nextPhoto.addEventListener('click', () => showGalleryPhoto(galleryIndex + 1));
imageDialog.addEventListener('keydown', event => {
  if (!galleryPhotos.length) return;
  let target;
  if (event.key === 'ArrowLeft') target = galleryIndex - 1;
  if (event.key === 'ArrowRight') target = galleryIndex + 1;
  if (event.key === 'Home') target = 0;
  if (event.key === 'End') target = galleryPhotos.length - 1;
  if (target != null) { event.preventDefault(); showGalleryPhoto(target); if(event.target.closest('.gallery-thumbnail')) galleryThumbnails.children[galleryIndex]?.focus({preventScroll:true}); }
});
let swipeStart = null;
imageStage.addEventListener('touchstart', event => {
  const touch = event.touches.length === 1 && !event.target.closest('button') ? event.touches[0] : null;
  swipeStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
}, { passive: true });
imageStage.addEventListener('touchend', event => {
  if (!swipeStart || !galleryPhotos.length) return;
  const touch = event.changedTouches[0], dx = touch.clientX - swipeStart.x, dy = touch.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) showGalleryPhoto(galleryIndex + (dx < 0 ? 1 : -1));
}, { passive: true });
imageStage.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
imageDialog.addEventListener('close', () => { document.documentElement.classList.remove('image-viewer-open'); galleryPhotos = []; swipeStart = null; });
function albumCard(category, photos) {
  const article = el('article', 'photo-item album-item');
  const button = el('button', 'album-card hover-card'); button.type = 'button';
  button.setAttribute('aria-label', `Buka album ${category.title}, ${photos.length} foto`);
  const cover = el('span', 'album-cover');
  const image = el('img'); image.src = photos[0].src; image.alt = photos[0].caption; if(photos[0].id === 'original') image.classList.add('album-portrait'); image.loading = 'lazy'; image.decoding = 'async';
  const count = el('span', 'album-count', `${photos.length} foto`);
  const hint = el('span', 'album-cover-hint', 'Buka album ↗');
  cover.append(image, count, hint);
  const body = el('span', 'album-info'); const copy = el('span');
  copy.append(el('span', 'album-title', category.title), el('span', 'album-subtitle', category.subtitle));
  const arrow = el('span', 'album-open', '↗'); arrow.setAttribute('aria-hidden', 'true'); body.append(copy, arrow);
  button.append(cover, body); button.addEventListener('click', () => openAlbum(photos, category.title)); article.append(button); return article;
}
function renderPhotos() {
  const grid = $('#photo-grid'); grid.classList.add('album-grid'); grid.replaceChildren();
  const photos = [...state.photos.filter(photo => photo.status === 'published'), { id: 'original', src: 'assets/portrait.jpeg', caption: 'A face behind the work.', location: 'Dicky Adisaputra', category: 'work' }];
  for (const category of galleryCategories) {
    if (activeFilter !== 'all' && activeFilter !== category.id) continue;
    const members = photos.filter(photo => (['work','outdoors'].includes(photo.category) ? photo.category : 'other') === category.id);
    if (members.length) grid.append(albumCard(category, members));
  }
  if (!grid.children.length) {
    const empty = el('div', 'album-empty'); empty.append(el('span', 'eyebrow', 'A COLLECTION IN THE MAKING'), el('h4', '', 'A few moments, soon.'), el('p', '', 'Foto untuk koleksi ini akan segera hadir.')); grid.append(empty);
  }
  document.dispatchEvent(new Event('content:rendered'));
}

function renderBooks() {
  const grid = $('#book-grid');
  grid.replaceChildren();
  if (!state.books.some(b => b.status !== 'draft')) {
    const empty = el('div', 'empty-books');
    const icon = el('div', 'empty-book-icon', 'Aa');
    icon.setAttribute('aria-hidden', 'true');
    const text = el('div');
    text.append(el('h4', '', 'A shelf of my own.'), el('p', '', 'Buku yang sudah kubaca, dan hal-hal yang tetap tinggal setelah halaman terakhir. Koleksi ini akan segera hadir.'));
    empty.append(icon, text);
    grid.append(empty);
    document.dispatchEvent(new Event('content:rendered'));
    return;
  }
  state.books.filter(b => b.status !== 'draft').forEach(book => {
    const card = el('article', 'book-card');
    const cover = el('div', 'book-cover');
    if (book.cover && /^https:\/\//.test(book.cover)) {
      cover.classList.add('has-image');
      const image = el('img'); image.src = book.cover; image.alt = `Cover ${book.title}`; image.loading = 'lazy'; cover.append(image);
    } else { cover.append(el('span', '', book.title), el('small', '', book.author)); }
    card.append(cover, el('h4', '', book.title), el('p', 'book-author', book.author));
    if (/^\d{4}-\d{2}$/.test(book.finished)) {
      const [year, month] = book.finished.split('-');
      const date = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, 15));
      card.append(el('p', 'book-date', `Selesai · ${date}`));
    } else card.append(el('p', 'book-date', 'Sudah dibaca'));
    if (book.takeaway) card.append(el('p', 'book-takeaway', `“${book.takeaway}”`));
    grid.append(card);
  });
  document.dispatchEvent(new Event('content:rendered'));
}

function personalTab(name, focus = false) {
  $$('[data-personal-tab]').forEach(button => {
    const selected = button.dataset.personalTab === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(`#${button.dataset.personalTab}-panel`).hidden = !selected;
    if (selected) { const panel = $(`#${button.dataset.personalTab}-panel`); panel.classList.remove('panel-enter'); requestAnimationFrame(() => panel.classList.add('panel-enter')); }
    if (selected && focus) button.focus();
  });
}

$$('[data-personal-tab]').forEach((button, index, buttons) => {
  button.addEventListener('click', () => personalTab(button.dataset.personalTab));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next != null) { event.preventDefault(); personalTab(buttons[next].dataset.personalTab, true); }
  });
});

$$('[data-gallery-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.galleryFilter;
  $$('[data-gallery-filter]').forEach(target => {
    const selected = target === button;
    target.classList.toggle('selected', selected);
    target.setAttribute('aria-pressed', String(selected));
  });
  renderPhotos();
}));

$$('[data-open]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.open}`).showModal()));
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
}));
$$('[data-image]').forEach(button => button.addEventListener('click', () => openImage(button.dataset.image, button.dataset.title)));

const topics = {
  field: { title: 'Field Notes', description: 'Catatan yang lahir dari pekerjaan: satu situasi, apa yang dicoba, apa yang dipelajari, dan apa yang akan dilakukan berbeda. Formatnya pendek, praktis, dan tetap personal.', tags: ['Program building', 'Operations', 'People', 'Lessons learned'] },
  life: { title: 'Life & Reflections', description: 'Tulisan yang memberi konteks tentang dirimu di luar pekerjaan: iman, relasi, tanggung jawab, dan cara memandang kehidupan. Koleksi Belajar Menjadi Ayah bisa tinggal di sini.', tags: ['Faith', 'Relationships', 'Life', 'Fatherhood'] },
  fatherhood: { title: 'Belajar Menjadi Ayah', description: 'Sebuah koleksi tulisan dan bacaan. Dua jenis isi: catatan pribadimu tentang keluarga, relasi, dan tanggung jawab; serta buku atau artikel pilihan yang sudah kamu baca, dengan sumber dan satu refleksi pendek. Koleksi ini bisa menjadi bagian dari Life & Reflections.', tags: ['Tulisan pribadi', 'Bacaan pilihan', 'Keluarga', 'Relasi'] }
};
$$('[data-open-topic]').forEach(button => button.addEventListener('click', () => {
  const topic = topics[button.dataset.openTopic];
  $('#topic-title').textContent = topic.title;
  $('#topic-description').textContent = topic.description;
  $('#topic-tags').replaceChildren(...topic.tags.map(tag => el('span', '', tag)));
  $('#topic-dialog').showModal();
}));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reduceMotion.matches;
function updateMotion() {
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle').textContent = motionPaused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
reduceMotion.addEventListener('change', event => { motionPaused = event.matches; updateMotion(); });
updateMotion();

$('#menu-toggle').addEventListener('click', () => {
  const open = $('#primary-menu').classList.toggle('open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
$$('#primary-menu a').forEach(link => link.addEventListener('click', () => {
  $('#primary-menu').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#primary-menu').classList.contains('open')) {
    $('#primary-menu').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
    $('#menu-toggle').focus();
  }
});

const navigation = $$('#primary-menu a');
const observedSections = ['top', 'now', 'past', 'projects'];
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    let active = 'top';
    for (const id of observedSections) if ($(`#${id}`).getBoundingClientRect().top < 170) active = id;
    navigation.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${active}`));
    scrollTicking = false;
  });
}, { passive: true });

$('#year').textContent = new Date().getFullYear();
async function refreshPublishedContent() {
  const config = window.DickyWritingConfig;
  try {
    const response = await fetch(config.url + '/rest/v1/personal_collections?select=id,kind,status,data&status=eq.published&order=created_at.desc', { headers: { apikey: config.publishableKey }, credentials: 'omit', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Koleksi belum dapat dimuat.');
    const rows = await response.json();
    state = { photos: [], books: [] };
    for (const row of rows) if (state[row.kind]) state[row.kind].push({ ...row.data, id: row.id, status: row.status });
    document.querySelector('#collection-notice')?.remove();
  } catch {
    if (!document.querySelector('#collection-notice')) {
      const notice = el('p', 'source-notice', 'Koleksi belum dapat dimuat. Muat ulang halaman untuk mencoba kembali.'); notice.id = 'collection-notice'; document.querySelector('#photo-grid').before(notice);
    }
  }
  renderPhotos(); renderBooks();
}
window.addEventListener('pageshow', refreshPublishedContent);
renderPhotos(); renderBooks();

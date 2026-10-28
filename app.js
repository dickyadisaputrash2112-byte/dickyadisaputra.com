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

function openImage(src, title, caption = '') {
  const image = $('#expanded-image');
  image.src = src;
  image.alt = title;
  $('#image-title').textContent = title;
  $('#image-caption').textContent = caption;
  $('#image-caption').hidden = !caption;
  $('#image-dialog').showModal();
}

const mountainPlaceholder = '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="303" cy="65" r="27" fill="#d4d4d4"/><path d="M-30 300 150 50 330 300" fill="#cfcfcf"/><path d="m72 161 78-111 82 118-55-33-31 16-23-22Z" fill="#eaeaea"/><path d="M100 300 310 105 470 300" fill="#c0c0c0"/><path d="m0 258 113-79 127 121H0Z" fill="#b5b5b5" opacity=".65"/><path d="m280 300 30-195 160 195" fill="#b6b6b6" opacity=".5"/></svg>';

function placeholder(category) {
  const figure = el('figure', 'photo-item');
  const button = el('div', `photo-placeholder ${category === 'work' ? 'work-placeholder' : ''}`);
  button.setAttribute('aria-label', category === 'work' ? 'Koleksi foto profesional' : 'Koleksi foto gunung dan perjalanan');
  if (category === 'outdoors') button.innerHTML = mountainPlaceholder;
  else button.append(el('span', 'frame-outline'));
  const copy = el('span', 'placeholder-copy', category === 'work' ? 'A moment from work.' : 'Somewhere up there.');
  copy.append(el('small', '', category === 'work' ? 'A few frames from the work.' : 'A little further from the everyday.'));
  button.append(copy);

  const caption = el('figcaption', 'photo-caption');
  const title = el('span', '', category === 'work' ? 'At work, in between.' : 'Mountains & places');
  title.append(el('small', '', 'Coming soon · koleksi foto'));
  caption.append(title, el('span', 'photo-tag', category === 'work' ? 'Work' : 'Outdoors'));
  figure.append(button, caption);
  return figure;
}

function photoCard(photo, original = false) {
  const figure = el('figure', 'photo-item');
  const button = el('button', 'photo-image');
  button.type = 'button';
  button.setAttribute('aria-label', `Perbesar foto ${photo.caption}`);
  const image = el('img');
  image.src = photo.src;
  image.alt = photo.caption;
  image.loading = 'lazy';
  button.append(image);
  button.addEventListener('click', () => openImage(photo.src, photo.caption, photo.location));
  const caption = el('figcaption', 'photo-caption');
  const description = el('span', '', photo.caption);
  if (photo.location) description.append(el('small', '', photo.location));
  caption.append(description, el('span', 'photo-tag', photo.category === 'work' ? 'Work' : 'Outdoors'));
  figure.append(button, caption);
  return figure;
}

function renderPhotos() {
  const grid = $('#photo-grid');
  grid.replaceChildren();
  const photos = [{ id: 'original', src: 'assets/portrait.jpeg', caption: 'A face behind the work.', location: 'Dicky Adisaputra', category: 'work' }, ...state.photos.filter(p => p.status !== 'draft')];
  photos.filter(photo => activeFilter === 'all' || photo.category === activeFilter).forEach(photo => grid.append(photoCard(photo, photo.id === 'original')));
  if ((activeFilter === 'all' || activeFilter === 'outdoors') && !state.photos.some(p => p.category === 'outdoors' && p.status !== 'draft')) grid.append(placeholder('outdoors'));
  if ((activeFilter === 'all' || activeFilter === 'work') && !state.photos.some(p => p.category === 'work' && p.status !== 'draft')) grid.append(placeholder('work'));
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

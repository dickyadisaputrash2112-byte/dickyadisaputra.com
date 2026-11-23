// ============================================================
// Code.gs — Web app, menu spreadsheet, setup, dan pemicu
// ============================================================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .addMetaTag('apple-mobile-web-app-capable', 'yes');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// ---------------- Menu di spreadsheet ----------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('catat.id')
    .addItem('▶ Mulai / buka aplikasi', 'menuStart')
    .addSeparator()
    .addItem('Sinkronkan email sekarang', 'menuSync')
    .addItem('Bersihkan data lama — pratinjau', 'menuCleanupPreview')
    .addItem('Bersihkan data lama — jalankan', 'menuCleanupRun')
    .addItem('Kirim review mingguan sekarang', 'menuWeekly')
    .addItem('Reset PIN aplikasi', 'menuResetPin')
    .addItem('Setup ulang', 'menuSetup')
    .addToUi();
  try { ensureStartSheet_(SpreadsheetApp.getActiveSpreadsheet()); } catch (e) {}
}

var START_SHEET = 'Mulai di sini';

// Tab panduan singkat untuk pembeli. Dibuat otomatis saat spreadsheet dibuka
// (juga di salinan baru), tanpa perlu izin apa pun.
function ensureStartSheet_(ss) {
  if (!ss || ss.getSheetByName(START_SHEET)) return;
  var sh = ss.insertSheet(START_SHEET, 0);
  var rows = [
    ['catat.id — catat uangmu tanpa mencatat'],
    [''],
    ['Pasang sekali, sekitar 5 menit, dari laptop:'],
    ['1. Klik menu catat.id → ▶ Mulai / buka aplikasi (di baris menu atas, sebelah Bantuan).'],
    ['   Pertama kali, Google meminta izin: Lanjutkan → pilih akunmu → Lanjutan → Buka catat.id (tidak aman) → Pilih semua → Lanjutkan.'],
    ['   Setelah izin diberikan, klik ▶ Mulai / buka aplikasi sekali lagi.'],
    ['2. Muncul link aplikasimu. Kirim ke HP, buka dengan akun Google yang sama, lalu Tambahkan ke Layar Utama.'],
    ['3. Isi nama di rekening, pilih bank, dan atur PIN. Selesai — transaksi tercatat otomatis tiap 15 menit.'],
    [''],
    ['Data kamu tersimpan di spreadsheet ini, di Google Drive kamu sendiri. Tidak dikirim ke penjual.'],
    ['Butuh bantuan? Hubungi nomor WhatsApp di email pembelianmu.']
  ];
  sh.getRange(1, 1, rows.length, 1).setValues(rows);
  sh.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  sh.getRange(3, 1).setFontWeight('bold');
  sh.setColumnWidth(1, 900);
  sh.setHiddenGridlines(true);
}

function menuResetPin() {
  PropertiesService.getUserProperties().deleteProperty('JEJAK_PIN');
  SpreadsheetApp.getUi().alert('PIN dihapus. Buka aplikasi dan atur PIN baru di Profil.');
}

// Satu tombol untuk pembeli: pasang (kalau belum) lalu tampilkan link aplikasi.
function menuStart() {
  ensureSetup_();
  menuOpenApp();
}

// Setup otomatis sekali per versi. Dipanggil dari menu dan saat aplikasi dibuka,
// jadi pembeli tidak perlu menjalankan Setup terpisah.
function ensureSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('CATAT_SETUP_VERSION') === APP.version && sheet_(SHEET.SETTINGS).getLastRow() > 1) return false;
  setupApp();
  return true;
}

function menuSetup() {
  var r = setupApp();
  SpreadsheetApp.getUi().alert('catat.id siap',
    'Sheet, kategori, dan sinkron otomatis tiap 15 menit sudah terpasang.\n\n' +
    'Langkah berikutnya: klik menu catat.id → ▶ Mulai / buka aplikasi.' +
    (r.notes.length ? '\n\n' + r.notes.join('\n') : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function appUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function menuOpenApp() {
  var url = appUrl_();
  var css = '<style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#0B1835;margin:0}ol{padding-left:20px;margin:8px 0}li{margin:4px 0}' +
    'a.btn{display:inline-block;margin-top:10px;padding:10px 16px;border-radius:999px;background:#0E1F4D;color:#fff;text-decoration:none;font-weight:bold}' +
    'code{background:#EEF2FA;padding:1px 5px;border-radius:4px;word-break:break-all}</style>';
  var html, h;
  if (url) {
    html = css + '<p>Link aplikasi kamu:</p><p><code>' + url + '</code></p>' +
      '<a class="btn" href="' + url + '" target="_blank">Buka aplikasi</a>' +
      '<p style="font-size:12px;color:#555">Kirim link ini ke HP, buka di Chrome atau Safari dengan akun Google yang sama, lalu Tambahkan ke Layar Utama.</p>';
    h = 240;
  } else {
    var editor = 'https://script.google.com/d/' + ScriptApp.getScriptId() + '/edit';
    html = css + '<p><b>Aplikasi belum diterbitkan.</b> Cukup sekali:</p><ol>' +
      '<li>Klik <b>Buka editor</b> di bawah.</li>' +
      '<li>Klik tombol biru <b>Terapkan</b> (kanan atas) → <b>Penerapan baru</b>.</li>' +
      '<li>Klik ikon gerigi di samping "Pilih jenis" → <b>Aplikasi web</b>.</li>' +
      '<li>Jalankan sebagai: <b>Saya</b>. Yang memiliki akses: <b>Hanya saya</b>.</li>' +
      '<li>Klik <b>Terapkan</b>. Kalau diminta izin, setujui seperti saat Setup.</li>' +
      '<li>Salin link <b>Aplikasi web</b> (berakhiran /exec) dan buka di HP.</li></ol>' +
      '<a class="btn" href="' + editor + '" target="_blank">Buka editor</a>' +
      '<p style="font-size:12px;color:#555">Setelah itu, menu ini akan langsung menampilkan link aplikasimu.</p>';
    h = 400;
  }
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(h), 'Aplikasi catat.id');
}

function menuSync() {
  var r = syncTransactions({});
  SpreadsheetApp.getUi().alert(r.ok ? 'Sinkronisasi selesai' : 'Sinkronisasi gagal', r.message || '', SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuCleanupPreview() {
  var r = cleanupLegacy(true);
  SpreadsheetApp.getUi().alert('Pratinjau pembersihan (belum ada yang diubah)', cleanupSummary_(r), SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuCleanupRun() {
  var ui = SpreadsheetApp.getUi();
  var preview = cleanupLegacy(true);
  var ok = ui.alert('Jalankan pembersihan?', cleanupSummary_(preview) + '\n\nSalin spreadsheet dulu sebagai cadangan (File → Buat salinan) kalau belum.', ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;
  var r = cleanupLegacy(false);
  ui.alert('Pembersihan selesai', cleanupSummary_(r), ui.ButtonSet.OK);
}

function menuWeekly() {
  var r = sendWeeklyReview_();
  SpreadsheetApp.getUi().alert(r.sent ? 'Review mingguan terkirim ke email kamu.' : 'Tidak terkirim: ' + r.reason);
}

// ---------------- Setup ----------------

function setupApp() {
  var notes = [];
  fixProcessedHeader_();
  invalidate_();
  Object.keys(HEADERS).forEach(function (n) { table_(n); });
  ensureCategories_(notes);
  ensureAccounts_(notes);
  ensureDefaultSettings_();
  ensureTriggers_();
  invalidate_();
  _DB.settings = null; _DB.categories = null; _DB.accounts = null;
  PropertiesService.getScriptProperties().setProperty('CATAT_SETUP_VERSION', APP.version);
  if (!ownerList_().length && txRows_().length) notes.push('Isi "Nama di rekening" di aplikasi, lalu jalankan "Bersihkan data lama" supaya transfer ke rekening sendiri tidak dihitung pengeluaran.');
  return { ok: true, notes: notes };
}

// Versi lama menulis kolom ProcessedEmails dengan urutan berbeda. Samakan judulnya.
function fixProcessedHeader_() {
  var sh = sheet_(SHEET.PROCESSED);
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var h = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (String(h[1] || '').trim() !== 'ProcessedAt') {
    sh.getRange(1, 1, 1, lastCol).clearContent();
    sh.getRange(1, 1, 1, HEADERS.ProcessedEmails.length).setValues([HEADERS.ProcessedEmails]).setFontWeight('bold');
  }
}

function ensureCategories_(notes) {
  var t = table_(SHEET.CATEGORIES);
  var rows = rows_(SHEET.CATEGORIES);
  if (!rows.length) {
    DEFAULT_CATEGORIES.forEach(function (c) {
      append_(SHEET.CATEGORIES, { Name: c.name, Icon: c.key, Color: c.color, Keywords: c.keywords, Active: true, FinancialGroup: c.group, Key: c.key, Budget: '' });
    });
    notes.push('Kategori bawaan dibuat.');
    delete _DB.categories;
    return;
  }
  var haveKeys = {};
  rows.forEach(function (r) {
    var key = String(r.Key || '').trim() || keyForCategoryName_(r.Name);
    var patch = {};
    if (key && !String(r.Key || '').trim()) patch.Key = key;
    if (key && !String(r.FinancialGroup || '').trim()) {
      var def = defaultCategory_(key);
      if (def) patch.FinancialGroup = def.group;
    }
    if (Object.keys(patch).length) update_(SHEET.CATEGORIES, r._row, patch);
    if (key) haveKeys[key] = true;
  });
  REQUIRED_CATEGORY_KEYS.forEach(function (k) {
    if (haveKeys[k]) return;
    var c = defaultCategory_(k);
    append_(SHEET.CATEGORIES, { Name: c.name, Icon: c.key, Color: c.color, Keywords: c.keywords, Active: true, FinancialGroup: c.group, Key: c.key, Budget: '' });
    notes.push('Kategori "' + c.name + '" ditambahkan.');
  });
  delete _DB.categories;
}

function ensureAccounts_(notes) {
  var rows = rows_(SHEET.ACCOUNTS);
  if (!rows.length) {
    append_(SHEET.ACCOUNTS, { Name: 'Tunai', InitialBalance: 0, Color: '#4E6660', Icon: '', Active: true, Mode: 'manual' });
    return;
  }
  rows.forEach(function (r) {
    if (String(r.Mode || '').trim()) return;
    var src = sourceForAccount_(r.Name);
    update_(SHEET.ACCOUNTS, r._row, { Mode: src ? src.mode : 'smart' });
  });
  delete _DB.accounts;
}

function ensureDefaultSettings_() {
  var existing = {};
  rows_(SHEET.SETTINGS).forEach(function (r) { existing[String(r.Key).trim()] = true; });
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (!existing[k]) append_(SHEET.SETTINGS, { Key: k, Value: DEFAULT_SETTINGS[k] });
  });
  _DB.settings = null;
}

// ---------------- Pemicu otomatis ----------------

function ensureTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (LEGACY_TRIGGER_HANDLERS.indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('jejakSyncTrigger').timeBased().everyMinutes(SYNC_CONFIG.triggerMinutes).create();
  refreshWeeklyTrigger_();
}

var WEEKDAYS_ = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Pasang ulang pemicu review mingguan sesuai pilihan pengguna (hari, jam, aktif/mati).
function refreshWeeklyTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'jejakWeeklyReview') ScriptApp.deleteTrigger(t);
  });
  var s = settings_();
  if (s.weeklyReviewEnabled === false) return;
  var day = Number(s.weeklyReviewDay); if (!(day >= 0 && day <= 6)) day = 0;
  var hour = Number(s.weeklyReviewHour); if (!(hour >= 0 && hour <= 23)) hour = 16;
  ScriptApp.newTrigger('jejakWeeklyReview').timeBased().onWeekDay(ScriptApp.WeekDay[WEEKDAYS_[day]]).atHour(hour).create();
}

function jejakSyncTrigger() {
  syncTransactions({ fromTrigger: true });
}

function jejakWeeklyReview() {
  sendWeeklyReview_();
}

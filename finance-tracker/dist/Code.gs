// catat.id v2.0.0 — satu file. Jangan diubah manual; dibuat oleh finance-tracker/tools/build.js
// ============================================================
// Config.gs — Konstanta, skema sheet, dan data bawaan catat.id
// ============================================================

var APP = { name: 'catat.id', version: '2.0.0' };

var SHEET = {
  TX: 'Transactions',
  ACCOUNTS: 'Accounts',
  CATEGORIES: 'Categories',
  MERCHANTS: 'Merchants',
  GOALS: 'Goals',
  DEPOSITS: 'GoalDeposits',
  SETTINGS: 'Settings',
  PROCESSED: 'ProcessedEmails',
  PARSER_LOGS: 'ParserLogs',
  SYNC_LOGS: 'GmailSyncLogs'
};

// Kolom per sheet. Kolom lama tetap dipakai; kolom baru ditambahkan di kanan.
var HEADERS = {
  Transactions: ['ID', 'Date', 'Description', 'Amount', 'Type', 'Account', 'ToAccount', 'Category', 'Merchant', 'Note', 'EmailID', 'CreatedAt', 'Status', 'Source'],
  Accounts: ['Name', 'InitialBalance', 'Color', 'Icon', 'Active', 'Mode'],
  Categories: ['Name', 'Icon', 'Color', 'Keywords', 'Active', 'FinancialGroup', 'Key', 'Budget'],
  Merchants: ['Name', 'Category', 'Count', 'LastSeen', 'Locked'],
  Goals: ['ID', 'Name', 'Target', 'Current', 'Deadline', 'Description', 'Color', 'Icon', 'CreatedAt', 'LinkedAccount', 'Status'],
  GoalDeposits: ['ID', 'GoalID', 'Date', 'Amount', 'Source', 'TxnID', 'Note'],
  Settings: ['Key', 'Value'],
  ProcessedEmails: ['EmailID', 'ProcessedAt', 'Subject', 'From', 'EmailDate', 'Parser', 'Status', 'TransactionCount', 'Message'],
  ParserLogs: ['Timestamp', 'Parser', 'EmailID', 'Status', 'Message', 'Amount', 'Account'],
  GmailSyncLogs: ['Timestamp', 'Status', 'Message', 'ThreadsScanned', 'MessagesScanned', 'MessagesParsed', 'MessagesSkipped', 'TransactionsSaved', 'Errors']
};

var TYPE = { IN: 'Income', OUT: 'Expense', TR: 'Transfer' };
var STATUS = { OK: 'ok', REVIEW: 'review' };
var GROUP = { NEED: 'Need', WANT: 'Want', SAVE: 'Saving', TRANSFER: 'Transfer', INCOME: 'Income', REVIEW: 'Review' };

// Kategori bawaan untuk pemasangan baru. `key` dipakai kode; `name` boleh diganti pengguna.
var DEFAULT_CATEGORIES = [
  { key: 'food', name: 'Makan', color: '#D9652B', group: 'Need', keywords: 'makan,makanan,nasi,warteg,warung,ayam,bakso,soto,mie,padang,sate,resto,restoran,restaurant,rumah makan,kedai,gofood,grabfood,shopeefood,food,pecel,geprek,seblak,martabak' },
  { key: 'coffee', name: 'Kopi & Jajan', color: '#9A5A22', group: 'Want', keywords: 'kopi,coffee,cafe,kafe,boba,chatime,jajan,snack,roti,es teh,starbucks,kopi kenangan,janji jiwa,point coffee,fore,tomoro,mixue,tea,teh' },
  { key: 'groceries', name: 'Belanja Harian', color: '#1F7A52', group: 'Need', keywords: 'indomaret,alfamart,alfamidi,superindo,hypermart,transmart,lotte mart,sayur,beras,pasar,minimarket,idm,giant,hero' },
  { key: 'transport', name: 'Transportasi', color: '#2F64B8', group: 'Need', keywords: 'gojek,goride,gocar,grab,ojek,taxi,krl,mrt,lrt,transjakarta,busway,kai,kereta,bensin,pertamina,shell,parkir,tol,bbm,tiket.com,traveloka,garuda,citilink' },
  { key: 'shopping', name: 'Belanja Online', color: '#A93F75', group: 'Want', keywords: 'tokopedia,shopee,lazada,blibli,tiktok shop,zalora,bukalapak' },
  { key: 'bills', name: 'Tagihan', color: '#4E40B8', group: 'Need', keywords: 'pln,listrik,pdam,wifi,indihome,internet,telkomsel,simpati,xl,axis,smartfren,pulsa,kuota,cicilan,angsuran,kos,kontrakan,bpjs,asuransi,iuran,laundry,paylater,gopay later,tagihan' },
  { key: 'health', name: 'Kesehatan', color: '#1E8A8A', group: 'Need', keywords: 'apotek,apotik,klinik,rumah sakit,dokter,obat,farmasi,vitamin,halodoc,k24,kimia farma' },
  { key: 'fun', name: 'Hiburan', color: '#8C6608', group: 'Want', keywords: 'netflix,spotify,youtube,disney,vidio,bioskop,cinema,xxi,cgv,game,steam' },
  { key: 'edu', name: 'Pendidikan', color: '#4C7A2A', group: 'Need', keywords: 'buku,gramedia,kursus,kuliah,sekolah,udemy,coursera,bimbel' },
  { key: 'fee', name: 'Biaya Admin', color: '#5F6B7D', group: 'Need', keywords: 'biaya admin,biaya transaksi,admin fee' },
  { key: 'transfer', name: 'Transfer', color: '#3A4E78', group: 'Transfer', keywords: '' },
  { key: 'salary', name: 'Gaji', color: '#17643F', group: 'Income', keywords: 'gaji,payroll,salary,thr' },
  { key: 'income_other', name: 'Pemasukan Lain', color: '#2E8B57', group: 'Income', keywords: '' },
  { key: 'other', name: 'Lainnya', color: '#5F646C', group: 'Want', keywords: '' }
];

// Nama kategori lama (versi sebelumnya) yang dipetakan ke key baru.
var CATEGORY_ALIASES = {
  food: ['food & drink', 'food', 'makan', 'eating out'],
  coffee: ['coffee & cafe', 'kopi & jajan', 'snack & treats'],
  groceries: ['belanja harian', 'groceries'],
  transport: ['transport', 'transportasi'],
  shopping: ['shopping', 'belanja online'],
  bills: ['bills', 'tagihan'],
  health: ['health', 'kesehatan'],
  fun: ['entertainment', 'hiburan'],
  edu: ['education', 'pendidikan'],
  fee: ['admin fee', 'biaya admin'],
  transfer: ['transfer'],
  salary: ['gaji', 'salary'],
  income_other: ['pemasukan lain', 'income'],
  other: ['other', 'lainnya']
};

var REQUIRED_CATEGORY_KEYS = ['other', 'transfer', 'fee', 'salary', 'income_other'];

// Katalog sumber transaksi. mode: full = parser khusus, smart = parser universal, manual = dicatat sendiri.
var SOURCES = [
  { name: 'Mandiri', abbr: 'MD', color: '#1C3F8C', mode: 'full', kind: 'Bank', aliases: ['mandiri', 'livin'], domains: ['bankmandiri.co.id'] },
  { name: 'Jago', abbr: 'JG', color: '#C9741A', mode: 'full', kind: 'Bank', aliases: ['bank jago', 'jago'], domains: ['jago.com'] },
  { name: 'BSI', abbr: 'BS', color: '#13806E', mode: 'full', kind: 'Bank', aliases: ['bank syariah indonesia', 'bsi', 'byond'], domains: ['bankbsi.co.id'] },
  { name: 'Superbank', abbr: 'SB', color: '#5B3FD6', mode: 'full', kind: 'Bank', aliases: ['superbank', 'super bank'], domains: ['superbank.id'] },
  { name: 'BCA', abbr: 'BC', color: '#1E5AA8', mode: 'smart', kind: 'Bank', aliases: ['bca', 'bank central asia', 'klikbca', 'mybca'], domains: ['bca.co.id', 'klikbca.com'] },
  { name: 'BRI', abbr: 'BR', color: '#1B4F9C', mode: 'smart', kind: 'Bank', aliases: ['bri', 'brimo', 'bank rakyat indonesia'], domains: ['bri.co.id'] },
  { name: 'BNI', abbr: 'BN', color: '#C9551F', mode: 'smart', kind: 'Bank', aliases: ['bni', 'wondr', 'bank negara indonesia'], domains: ['bni.co.id'] },
  { name: 'SeaBank', abbr: 'SE', color: '#D2491F', mode: 'smart', kind: 'Bank', aliases: ['seabank', 'sea bank'], domains: ['seabank.co.id'] },
  { name: 'blu', abbr: 'BL', color: '#1D7DB5', mode: 'smart', kind: 'Bank', aliases: ['blu by bca', 'blu'], domains: ['blubybcadigital.id', 'bcadigital.co.id'] },
  { name: 'CIMB Niaga', abbr: 'CN', color: '#8E1B1B', mode: 'smart', kind: 'Bank', aliases: ['cimb niaga', 'octo'], domains: ['cimbniaga.co.id'] },
  { name: 'Permata', abbr: 'PM', color: '#2B7A3F', mode: 'smart', kind: 'Bank', aliases: ['permata', 'permatabank'], domains: ['permatabank.co.id'] },
  { name: 'GoPay', abbr: 'GP', color: '#0F86A0', mode: 'full', kind: 'E-wallet', aliases: ['gopay', 'go pay', 'gojek'], domains: ['gojek.com', 'gopay.co.id', 'go-pay.co.id'] },
  { name: 'OVO', abbr: 'OV', color: '#5A35B5', mode: 'full', kind: 'E-wallet', aliases: ['ovo'], domains: ['ovo.co.id', 'ovo.id'] },
  { name: 'DANA', abbr: 'DA', color: '#1F6FD0', mode: 'smart', kind: 'E-wallet', aliases: ['dana'], domains: ['dana.id'] },
  { name: 'ShopeePay', abbr: 'SP', color: '#D2491F', mode: 'smart', kind: 'E-wallet', aliases: ['shopeepay', 'shopee pay'], domains: ['shopeepay.co.id', 'shopee.co.id'] },
  { name: 'Tunai', abbr: 'Rp', color: '#4E6660', mode: 'manual', kind: 'Tunai', aliases: ['tunai', 'cash'], domains: [] }
];

var DEFAULT_SETTINGS = {
  nickname: '',
  ownerNames: '',
  onboarded: false,
  theme: 'biru',
  trackIncome: true,
  expectedIncome: 0,
  allocNeed: 50,
  allocWant: 20,
  allocSave: 30,
  monthlyBudget: 0,
  weeklyReviewEnabled: true,
  weeklyReviewHour: 16,
  initialDaysBack: 30,
  autoCategorize: true
};

var SYNC_CONFIG = {
  maxMessagesPerRun: 200,
  searchBatch: 50,
  triggerMinutes: 15,
  keepProcessedRows: 6000,
  keepParserLogRows: 2000,
  keepSyncLogRows: 500,
  lastSyncProp: 'GMAIL_ENGINE_LAST_SYNC_AT'
};

// Nama fungsi pemicu lama yang dibersihkan saat setup.
var LEGACY_TRIGGER_HANDLERS = [
  'triggerAutoSync', 'autoContinueSyncJanuary', 'autoContinueGmailSync',
  'syncGmailTransactions', 'runWeeklyReviewJob', 'jejakSyncTrigger', 'jejakWeeklyReview'
];


// ============================================================
// Db.gs — Akses spreadsheet dengan cache per eksekusi
// Semua baca/tulis memakai NAMA kolom, bukan posisi, supaya
// sheet lama tetap terbaca walau urutan kolomnya berbeda.
// ============================================================

var _DB = { tables: {} };

function getSpreadsheet_() {
  if (_DB.ss) return _DB.ss;
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) {
    var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (id) ss = SpreadsheetApp.openById(id);
  }
  if (!ss) throw new Error('Spreadsheet tidak ditemukan. Buka spreadsheet lalu klik menu catat.id → ▶ Mulai / buka aplikasi.');
  _DB.ss = ss;
  return ss;
}

function sheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var h = HEADERS[name] || [];
    if (h.length) {
      sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function table_(name) {
  if (_DB.tables[name]) return _DB.tables[name];
  var sh = sheet_(name);
  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var values = lastRow >= 1 ? sh.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  var headers = (values[0] || []).map(function (h) { return String(h || '').trim(); });
  var want = HEADERS[name] || [];

  if (!headers.some(Boolean) && want.length) {
    sh.getRange(1, 1, 1, want.length).setValues([want]).setFontWeight('bold');
    headers = want.slice();
    values = [want.slice()];
  } else {
    var missing = want.filter(function (h) { return headers.indexOf(h) === -1; });
    if (missing.length) {
      sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
      headers = headers.concat(missing);
    }
  }

  var width = headers.length;
  var rows = values.slice(1).map(function (r) {
    var row = r.slice(0, width);
    while (row.length < width) row.push('');
    return row;
  });

  var idx = {};
  headers.forEach(function (h, i) { if (h && idx[h] === undefined) idx[h] = i; });

  var t = { name: name, sheet: sh, headers: headers, idx: idx, rows: rows };
  _DB.tables[name] = t;
  return t;
}

function invalidate_(name) {
  if (name) delete _DB.tables[name];
  else _DB.tables = {};
}

function isBlankRow_(row) {
  return row.every(function (c) { return c === '' || c === null; });
}

// Semua baris sebagai objek { NamaKolom: nilai, _row: nomorBaris }
function rows_(name) {
  var t = table_(name);
  var out = [];
  t.rows.forEach(function (r, i) {
    if (isBlankRow_(r)) return;
    var o = { _row: i + 2 };
    t.headers.forEach(function (h, j) { if (h && !(h in o)) o[h] = r[j]; });
    out.push(o);
  });
  return out;
}

function rowFromObj_(t, obj) {
  return t.headers.map(function (h) {
    if (!h || obj[h] === undefined || obj[h] === null) return '';
    return obj[h];
  });
}

function append_(name, obj) {
  var t = table_(name);
  var row = rowFromObj_(t, obj);
  var rowNum = t.rows.length + 2;
  t.sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
  t.rows.push(row);
  return rowNum;
}

function update_(name, rowNum, patch) {
  var t = table_(name);
  var r = t.rows[rowNum - 2];
  if (!r) throw new Error('Baris ' + rowNum + ' tidak ditemukan di ' + name);
  var changed = false;
  Object.keys(patch).forEach(function (k) {
    var j = t.idx[k];
    if (j === undefined) return;
    r[j] = patch[k] === undefined || patch[k] === null ? '' : patch[k];
    changed = true;
  });
  if (changed) t.sheet.getRange(rowNum, 1, 1, r.length).setValues([r]);
}

function deleteRow_(name, rowNum) {
  var t = table_(name);
  t.sheet.deleteRow(rowNum);
  t.rows.splice(rowNum - 2, 1);
}

function findBy_(name, field, value) {
  var v = String(value);
  var all = rows_(name);
  for (var i = 0; i < all.length; i++) {
    if (String(all[i][field]) === v) return all[i];
  }
  return null;
}

function trimSheet_(name, keep) {
  var sh = sheet_(name);
  var dataRows = sh.getLastRow() - 1;
  if (dataRows > keep * 1.2) {
    sh.deleteRows(2, dataRows - keep);
    invalidate_(name);
  }
}

// ---------------- Settings ----------------

function coerce_(v) {
  if (v === true || v === false || typeof v === 'number') return v;
  if (v instanceof Date) return v;
  var t = String(v === undefined || v === null ? '' : v).trim();
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
  if (t !== '' && !isNaN(t)) return Number(t);
  return t;
}

function settings_() {
  if (_DB.settings) return _DB.settings;
  var s = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { s[k] = DEFAULT_SETTINGS[k]; });
  rows_(SHEET.SETTINGS).forEach(function (r) {
    var k = String(r.Key || '').trim();
    if (k) s[k] = coerce_(r.Value);
  });
  _DB.settings = s;
  return s;
}

function setSetting_(key, value) {
  var t = table_(SHEET.SETTINGS);
  var ki = t.idx.Key, vi = t.idx.Value;
  for (var i = 0; i < t.rows.length; i++) {
    if (String(t.rows[i][ki]).trim() === key) {
      t.rows[i][vi] = value;
      t.sheet.getRange(i + 2, vi + 1).setValue(value);
      if (_DB.settings) _DB.settings[key] = value;
      return;
    }
  }
  append_(SHEET.SETTINGS, { Key: key, Value: value });
  if (_DB.settings) _DB.settings[key] = value;
}

function ownerList_() {
  return String(settings_().ownerNames || '')
    .split('|')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

// ---------------- Helpers ----------------

function newId_() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function toDate_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? null : v;
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    var d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
    return isNaN(d.getTime()) ? null : d;
  }
  var d2 = new Date(s);
  return isNaN(d2.getTime()) ? null : d2;
}

function normType_(v) {
  var t = String(v || '').trim().toLowerCase();
  if (['income', 'pemasukan', 'kredit', 'credit', 'masuk'].indexOf(t) > -1) return TYPE.IN;
  if (['transfer', 'mutasi'].indexOf(t) > -1) return TYPE.TR;
  if (['expense', 'pengeluaran', 'debit', 'keluar', 'pembayaran'].indexOf(t) > -1) return TYPE.OUT;
  return t ? String(v).trim() : '';
}

function ymd_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}


// ============================================================
// Parsers.gs — Membaca email notifikasi bank & e-wallet
//
// Lapis A: parser khusus (Mandiri, Jago, BSI, Superbank, GoPay, OVO)
// Lapis B: SmartParser untuk bank lain — hasilnya berstatus "review"
// Semua hasil lewat finalizeTxn_() untuk cek tanggal, transfer ke
// rekening sendiri, dan pengaturan pemasukan.
// ============================================================

// Email yang jelas bukan notifikasi transaksi (rekap bulanan, promo, OTP, dll.)
var SKIP_SUBJECT_RE = /(total pengeluaran|ringkasan|e-?statement|rekening koran|laporan (bulanan|transaksi|keuangan)|promo|diskon|voucher|cashback hingga|undian|\botp\b|kode verifikasi|verifikasi|kata sandi|password|ganti pin|perangkat baru|login|info terkait|informasi terkait|pemeliharaan|pembaruan aplikasi|syarat (dan|&) ketentuan|newsletter|webinar|survei|selamat datang|tagihan kartu kredit)/i;
var FROM_SKIP_RE = /(marketing|newsletter|promo|deals|news@|@news|campaign)/i;
var TXN_RE = /(berhasil|transaksi|pembayaran|membayar|transfer|top ?-?up|tarik tunai|debit|kredit|dana masuk|uang masuk|menerima|qris|pembelian|nominal)/i;
var INCOME_RE = /(transfer masuk|dana masuk|uang masuk|udah masuk|sudah masuk|telah masuk|kamu menerima|kamu terima|telah menerima|menerima transfer|menerima dana|incoming transfer|kredit ke rekening|dana diterima)/i;
var PROMO_BODY_RE = /(berhenti berlangganan|unsubscribe|\d+\s?%\s?(off|diskon|cashback)|s\.?\/?d\.?\s+\d+\s?%|hingga \d+\s?%)/i;

// ---------------- Helper teks & angka ----------------

function normalizeText(value) {
  return String(value || '')
    .replace(/ /g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function stripHtml_(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// "Rp1.250.000", "Rp 52.000,00", "IDR 52,000.00" → angka bulat
function parseAmount(str) {
  var s = String(str || '').replace(/\s/g, '');
  if (!s) return 0;
  var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
  var dec = '';
  if (lastDot > -1 && lastComma > -1) dec = lastDot > lastComma ? '.' : ',';
  else if (lastComma > -1 && s.length - lastComma - 1 === 2) dec = ',';
  else if (lastDot > -1 && s.length - lastDot - 1 === 2 && (s.match(/\./g) || []).length === 1) dec = '.';
  var intPart = s, frac = '';
  if (dec) {
    var i = s.lastIndexOf(dec);
    intPart = s.slice(0, i);
    frac = s.slice(i + 1);
  }
  intPart = intPart.replace(/[.,]/g, '');
  var n = parseFloat(intPart + (frac ? '.' + frac : ''));
  return isFinite(n) ? Math.round(n) : 0;
}

function amountAfter_(text, labels) {
  var re = new RegExp('(?:' + labels + ')[^\\d]{0,60}?(?:Rp|IDR)\\s?\\.?\\s?(\\d[\\d.,]*)', 'i');
  var m = String(text).match(re);
  return m ? parseAmount(m[1]) : 0;
}

function anyAmount_(text) {
  var m = String(text).match(/(?:Rp|IDR)\s?\.?\s?(\d[\d.,]*)/i);
  return m ? parseAmount(m[1]) : 0;
}

// Nilai setelah label, di baris yang sama atau baris berikutnya.
function field_(text, labels) {
  for (var i = 0; i < labels.length; i++) {
    var re = new RegExp('(?:^|\\n)\\s*' + labels[i] + '(?![a-z])[ \\t]*:?[ \\t]*(?:\\n[ \\t]*)?([^\\n]{2,90})', 'i');
    var m = String(text).match(re);
    if (m) {
      var v = m[1].replace(/^[:\-\s]+/, '').trim();
      if (v.length > 1 && !/^(rp|idr)\s?[\d.,]+$/i.test(v)) return v;
    }
  }
  return '';
}

function cleanSubject_(s) {
  return String(s || '')
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿️]/gu, '')
    .replace(/^(kamu telah (membayar|melakukan)( ke)?|pembayaran( berhasil)?( ke)?|transaksi( berhasil)?)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippet_(text, amount) {
  var lines = String(text).split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (/(rp|idr)\s?\.?\s?\d/i.test(lines[i])) return lines[i].trim().slice(0, 110);
  }
  return lines.slice(0, 2).join(' ').trim().slice(0, 110);
}

function getMonthMap_() {
  return {
    jan: 0, januari: 0, january: 0, feb: 1, februari: 1, february: 1, mar: 2, maret: 2, march: 2,
    apr: 3, april: 3, mei: 4, may: 4, jun: 5, juni: 5, june: 5, jul: 6, juli: 6, july: 6,
    agu: 7, agt: 7, agustus: 7, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
    okt: 9, oktober: 9, oct: 9, october: 9, nov: 10, november: 10, des: 11, desember: 11, dec: 11, december: 11
  };
}

function extractDate_(text, fallback) {
  var value = String(text || '');
  var months = getMonthMap_();
  var y, mo, d;
  var tm = value.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  var nm = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/) || value.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (tm && months[tm[2].toLowerCase()] !== undefined) {
    d = Number(tm[1]); mo = months[tm[2].toLowerCase()]; y = Number(tm[3]);
  } else if (nm) {
    if (nm[1].length === 4) { y = Number(nm[1]); mo = Number(nm[2]) - 1; d = Number(nm[3]); }
    else { d = Number(nm[1]); mo = Number(nm[2]) - 1; y = Number(nm[3]); }
  } else {
    return fallback;
  }
  // Jam dicari setelah tanggal dulu; angka seperti "27.500" atau "00,00" bukan jam.
  var timeRe = /(?:^|[^\d.,])([01]?\d|2[0-3])[:.]([0-5]\d)(?::([0-5]\d))?(?![\d.,]\d)/;
  var dm = tm && months[tm[2].toLowerCase()] !== undefined ? tm : nm;
  var after = dm ? value.slice(value.indexOf(dm[0]) + dm[0].length, value.indexOf(dm[0]) + dm[0].length + 40) : '';
  var t = after.match(timeRe) || value.replace(/(rp|idr)\s?\.?\s?[\d.,]+/gi, ' ').match(timeRe);
  var date = new Date(y, mo, d, t ? Number(t[1]) : 12, t ? Number(t[2]) : 0, t && t[3] ? Number(t[3]) : 0);
  return isNaN(date.getTime()) ? fallback : date;
}

// Tanggal hasil parse harus dekat dengan tanggal email; kalau tidak, pakai tanggal email.
function sanitizeDate_(d, emailDate) {
  var ref = emailDate || new Date();
  if (!d || isNaN(d.getTime())) return ref;
  var diff = d.getTime() - ref.getTime();
  if (diff > 86400000 || diff < -45 * 86400000) return ref;
  return d;
}

// ---------------- Nama pemilik & akun ----------------

function normName_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isOwnerText_(s, owners) {
  var n = ' ' + normName_(s) + ' ';
  return (owners || []).some(function (o) {
    var on = normName_(o);
    return on.length >= 4 && n.indexOf(' ' + on + ' ') > -1;
  });
}

function sourceByText_(s) {
  var low = ' ' + String(s || '').toLowerCase() + ' ';
  var best = null, bestLen = 0;
  SOURCES.forEach(function (src) {
    src.aliases.forEach(function (a) {
      var re = new RegExp('[^a-z0-9]' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^a-z0-9]');
      if (re.test(low) && a.length > bestLen) { best = src; bestLen = a.length; }
    });
  });
  return best;
}

// Nama akun pengguna untuk teks bebas, mis. "DICKY Bank Syariah Indonesia • 123" → "BSI"
function detectAccountName_(s, accountNames) {
  var src = sourceByText_(s);
  if (!src) return '';
  var names = accountNames || [];
  for (var i = 0; i < names.length; i++) {
    var n = names[i].toLowerCase();
    if (n === src.name.toLowerCase() || src.aliases.indexOf(n) > -1) return names[i];
  }
  return src.name;
}

function detectEwallet_(s) {
  var src = sourceByText_(s);
  return src && src.kind === 'E-wallet' ? src.name : '';
}

// ---------------- Pembentuk transaksi ----------------

function tx_(ctx, o) {
  return {
    date: o.date || extractDate_(ctx.text, ctx.emailDate),
    description: String(o.description || '').trim(),
    amount: o.amount,
    type: o.type,
    account: o.account,
    toAccount: o.toAccount || '',
    merchant: o.merchant || '',
    counterparty: o.counterparty || '',
    categoryKey: o.categoryKey || '',
    note: o.note || '',
    emailId: ctx.emailId,
    status: o.status || STATUS.OK,
    source: 'email'
  };
}

// ctx: { owners, accountNames, trackIncome }
function finalizeTxn_(t, ctx, emailDate) {
  if (!t || !(Number(t.amount) >= 100)) return null;
  t.amount = Math.round(Number(t.amount));
  t.date = sanitizeDate_(t.date, emailDate);
  var cp = [t.counterparty, t.merchant, t.description].join(' ');

  if (t.type !== TYPE.TR && ctx.owners && ctx.owners.length && isOwnerText_(cp, ctx.owners)) {
    var other = detectAccountName_(cp, ctx.accountNames);
    if (t.type === TYPE.OUT) {
      t.toAccount = other && other !== t.account ? other : 'Rekening sendiri';
    } else {
      t.toAccount = t.account;
      t.account = other && other !== t.toAccount ? other : 'Rekening sendiri';
    }
    t.type = TYPE.TR;
    t.categoryKey = 'transfer';
    t.description = t.type === TYPE.TR && t.toAccount ? 'Pindah ke ' + t.toAccount : t.description;
    t.merchant = '';
  }

  if (t.type === TYPE.TR) {
    t.categoryKey = 'transfer';
    if (!t.toAccount) t.toAccount = 'Rekening sendiri';
  }
  if (t.type === TYPE.IN && ctx.trackIncome === false) return null;
  if (!t.description) t.description = t.merchant || 'Transaksi';
  return t;
}

// ---------------- Lapis A: parser khusus ----------------

var MandiriParser = {
  name: 'MandiriParser',
  canParse: function (subject, from) { return /bankmandiri\.co\.id|livin/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, subj = ctx.subject, full = subj + '\n' + text, acc = 'Mandiri';

    if (/tarik tunai|penarikan tunai/i.test(full)) {
      var a0 = amountAfter_(text, 'nominal|jumlah|total') || anyAmount_(text);
      return a0 ? [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: 'Tunai', amount: a0, description: 'Tarik tunai' })] : [];
    }

    if (/top[\s-]?up/i.test(full) && /(berhasil|nominal top)/i.test(full)) {
      return mandiriTopup_(ctx, acc);
    }

    if (INCOME_RE.test(full) && !/(pembayaran berhasil|kamu telah membayar)/i.test(subj)) {
      var a1 = amountAfter_(text, 'nominal|jumlah|sebesar|total') || anyAmount_(text);
      var from = field_(text, ['Nama Pengirim', 'Pengirim', 'Dari', 'Sumber Dana']);
      return a1 ? [tx_(ctx, { type: TYPE.IN, account: acc, amount: a1, description: from ? 'Transfer masuk · ' + from : 'Uang masuk', counterparty: from })] : [];
    }

    var amount = amountAfter_(text, 'nominal transaksi|total transaksi|total pembayaran|nominal|jumlah|total|sebesar') || anyAmount_(text);
    if (!amount) return [];
    var merchant = extractLivinMerchant_(text) || field_(text, ['Nama Penerima', 'Penerima', 'Nama Merchant', 'Merchant', 'Keterangan']) || cleanSubject_(subj);
    return [tx_(ctx, { type: TYPE.OUT, account: acc, amount: amount, description: merchant, merchant: merchant, counterparty: merchant })];
  }
};

function mandiriTopup_(ctx, acc) {
  var text = ctx.text;
  var provider = field_(text, ['Penyedia Jasa']) || detectEwallet_(text) || 'E-wallet';
  var toAccount = detectEwallet_(provider + ' ' + text) || provider;
  var nominal = amountAfter_(text, 'nominal top[\\s-]?up');
  var fee = amountAfter_(text, 'biaya transaksi|biaya admin');
  var total = amountAfter_(text, 'total transaksi');
  var amount = nominal || Math.max(total - fee, 0) || anyAmount_(text);
  if (!amount) return [];
  var out = [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: toAccount, amount: amount, description: 'Top-up ' + toAccount, merchant: '' })];
  if (fee > 0) out.push(tx_(ctx, { type: TYPE.OUT, account: acc, amount: fee, description: 'Biaya admin top-up ' + toAccount, merchant: 'Mandiri', categoryKey: 'fee' }));
  return out;
}

function extractLivinMerchant_(text) {
  var lines = String(text || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  var stop = /^(tanggal|jam|nominal|no\.?|merchant pan|customer pan|pengakuisisi|terminal|total|biaya|sumber)/i;
  for (var i = 0; i < lines.length; i++) {
    if (/^penerima\s*:?$/i.test(lines[i])) {
      var name = lines[i + 1] || '', city = lines[i + 2] || '';
      if (name && !stop.test(name)) return city && !stop.test(city) && city.length < 40 ? name + ' - ' + city : name;
    }
  }
  var m = String(text).match(/Penerima\s*:\s*([^\n]+)/i);
  return m ? m[1].trim() : '';
}

var JagoParser = {
  name: 'JagoParser',
  canParse: function (subject, from) { return /jago\.com|bank jago/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, subj = ctx.subject, full = subj + '\n' + text, acc = 'Jago';
    var amount = amountAfter_(text, 'jumlah|nominal|sebesar|total|amount') || anyAmount_(full);
    if (!amount) return [];

    if (INCOME_RE.test(full)) {
      var from = extractJagoBlock_(full, 'Dari');
      return [tx_(ctx, { type: TYPE.IN, account: acc, amount: amount, description: from ? 'Transfer masuk · ' + from : cleanSubject_(subj) || 'Uang masuk', counterparty: from })];
    }
    if (/tarik tunai|penarikan tunai/i.test(full)) {
      return [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: 'Tunai', amount: amount, description: 'Tarik tunai' })];
    }
    if (/(top ?-?up|isi saldo|pengisian saldo)/i.test(full)) {
      var w = detectEwallet_(full);
      return [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: w || 'E-wallet', amount: amount, description: 'Top-up ' + (w || 'e-wallet') })];
    }
    var rec = extractJagoRecipient_(full, subj) || cleanSubject_(subj);
    return [tx_(ctx, { type: TYPE.OUT, account: acc, amount: amount, description: rec, merchant: rec, counterparty: rec })];
  }
};

function extractJagoRecipient_(text, subject) {
  var sm = String(subject || '').match(/(?:membayar|bayar|transfer)\s+ke\s+(.+?)(?:\s*[\u{1F300}-\u{1FAFF}☀-➿]|$)/iu);
  var block = extractJagoBlock_(text, 'Ke');
  if (block) return block;
  if (sm) return cleanName_(sm[1].replace(/\s+(berhasil|sukses)\b.*$/i, ''));
  return '';
}

function extractJagoBlock_(text, label) {
  var stop = '(?:Jumlah|Tanggal Transaksi|Status Transaksi|Nama Acquirer|Lokasi Merchant|ID Terminal|PAN Nasabah|Jumlah Tip|Ke|Dari)';
  var re = new RegExp('(?:^|\\n)\\s*' + label + '\\s*\\n([\\s\\S]*?)(?=\\n\\s*' + stop + '\\b)', 'i');
  var m = String(text).match(re) || String(text).match(new RegExp('(?:^|\\n)\\s*' + label + '\\s*:\\s*([^\\n]+)', 'i'));
  if (!m) return '';
  var lines = m[1].split('\n').map(cleanName_).filter(Boolean)
    .filter(function (l) { return !/^\d{6,}$/.test(l); });
  return lines.slice(0, 3).join(' ').trim();
}

function cleanName_(v) {
  return String(v || '')
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿️]/gu, '')
    .replace(/\b(Kotak Masuk|Inbox)\b/gi, '')
    .replace(/[•·]?\s*\b\d{5,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

var BSIParser = {
  name: 'BSIParser',
  canParse: function (subject, from) { return /bankbsi\.co\.id|byond/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, subj = ctx.subject, full = subj + '\n' + text, acc = 'BSI';
    var amount = amountAfter_(text, 'nominal|jumlah|total|sebesar') || anyAmount_(text);
    if (!amount) return [];
    if (/tarik tunai|penarikan tunai/i.test(full)) {
      return [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: 'Tunai', amount: amount, description: 'Tarik tunai' })];
    }
    if (/(pembelian saldo|top ?-?up|isi saldo)/i.test(full)) {
      var w = detectEwallet_(full);
      return [tx_(ctx, { type: TYPE.TR, account: acc, toAccount: w || 'E-wallet', amount: amount, description: 'Top-up ' + (w || 'e-wallet') })];
    }
    if (INCOME_RE.test(full) || (/\bkredit\b/i.test(full) && !/\bdebit\b/i.test(full))) {
      var from = field_(text, ['Nama Pengirim', 'Pengirim', 'Dari']);
      return [tx_(ctx, { type: TYPE.IN, account: acc, amount: amount, description: from ? 'Transfer masuk · ' + from : 'Uang masuk', counterparty: from })];
    }
    var counter = field_(text, ['Nama Penerima', 'Penerima', 'Tujuan', 'Nama Merchant', 'Merchant', 'Keterangan', 'Deskripsi']) || cleanSubject_(subj);
    return [tx_(ctx, { type: TYPE.OUT, account: acc, amount: amount, description: counter, merchant: counter, counterparty: counter })];
  }
};

var SuperbankParser = {
  name: 'SuperbankParser',
  canParse: function (subject, from) { return /superbank\.id/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, full = ctx.subject + '\n' + text, acc = 'Superbank';
    var amount = amountAfter_(full, 'berhasil transfer|nominal transfer|nominal|jumlah|total|sebesar') || anyAmount_(full);
    if (!amount) return [];
    if (INCOME_RE.test(full)) {
      var m = full.match(/transfer dari\s+(.+?)\s+(udah|sudah|telah)\s+masuk/i);
      var from = m ? m[1].trim() : field_(text, ['Nama Pengirim', 'Pengirim', 'Dari']);
      return [tx_(ctx, { type: TYPE.IN, account: acc, amount: amount, description: from ? 'Transfer masuk · ' + from : 'Uang masuk', counterparty: from })];
    }
    var sm = full.match(/berhasil transfer\s+(?:Rp|IDR)?\.?\s*[\d.,]+\s+ke\s+([^\n.]+)/i);
    var rec = sm ? sm[1].trim() : field_(text, ['Penerima', 'Nama Penerima']);
    var desc = rec ? 'Transfer ke ' + rec : cleanSubject_(ctx.subject);
    return [tx_(ctx, { type: TYPE.OUT, account: acc, amount: amount, description: desc, merchant: rec || desc, counterparty: rec })];
  }
};

var GoPayParser = {
  name: 'GoPayParser',
  canParse: function (subject, from) { return /gojek\.com|gopay\.co\.id|go-pay\.co\.id/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, subj = ctx.subject, full = subj + '\n' + text;
    if (/total pengeluaran(mu)?\s+(di|bulan)/i.test(full)) return [];
    if (/(top ?-?up|isi saldo)/i.test(subj) && /berhasil/i.test(full)) return []; // sisi bank sudah mencatat
    var amount = amountAfter_(text, 'total dibayar|total pembayaran|total bayar|total|jumlah') || anyAmount_(full);
    if (!amount) return [];
    var merchant = '';
    var fm = text.match(/Diantarkan\s+jam\s+[^\n]*\s+dari\s+['"]?([^\n'"]+)/i);
    if (fm) merchant = fm[1].trim();
    if (!merchant) merchant = field_(text, ['Nama Merchant', 'Merchant', 'Penerima', 'Kepada']);
    if (!merchant) merchant = /gopay later/i.test(full) ? 'GoPay Later' : /gofood/i.test(full) ? 'GoFood' : cleanSubject_(subj) || 'GoPay';
    var key = /gofood|rincian pesanan|ongkir/i.test(full) ? 'food' : '';
    return [tx_(ctx, { type: TYPE.OUT, account: 'GoPay', amount: amount, description: merchant, merchant: merchant, counterparty: merchant, categoryKey: key })];
  }
};

var OVOParser = {
  name: 'OVOParser',
  canParse: function (subject, from) { return /ovo\.co\.id|ovo\.id/i.test(from); },
  parse: function (ctx) {
    var text = ctx.text, full = ctx.subject + '\n' + text;
    var amount = amountAfter_(full, 'pembayaran berhasil|total|pembayaran|jumlah');
    var status = STATUS.OK;
    if (!amount) { amount = anyAmount_(full); status = STATUS.REVIEW; }
    if (!amount) return [];
    var merchant = field_(text, ['Nama Toko', 'Merchant', 'Penerima']) || cleanSubject_(ctx.subject) || 'OVO';
    return [tx_(ctx, { type: TYPE.OUT, account: 'OVO', amount: amount, description: merchant, merchant: merchant, counterparty: merchant, status: status, note: status === STATUS.REVIEW ? '"' + snippet_(full) + '"' : '' })];
  }
};

// ---------------- Lapis B: parser universal ----------------

function smartSource_(from) {
  var f = String(from || '').toLowerCase();
  var emailPart = (f.match(/<([^>]+)>/) || [null, f])[1];
  for (var i = 0; i < SOURCES.length; i++) {
    var s = SOURCES[i];
    if (s.mode !== 'smart') continue;
    for (var j = 0; j < s.domains.length; j++) {
      if (emailPart.indexOf(s.domains[j]) > -1) return s;
    }
  }
  return null;
}

var SmartParser = {
  name: 'SmartParser',
  canParse: function (subject, from) { return !!smartSource_(from); },
  parse: function (ctx) {
    var src = smartSource_(ctx.from);
    var full = ctx.subject + '\n' + ctx.text;
    if (!TXN_RE.test(full) || PROMO_BODY_RE.test(full)) return [];
    var amount = amountAfter_(full, 'total pembayaran|total bayar|nominal|jumlah|total|sebesar|amount') || anyAmount_(full);
    if (!amount) return [];
    var isIn = INCOME_RE.test(full) || (/\bkredit\b/i.test(full) && !/\bdebit\b/i.test(full));
    var counter = field_(ctx.text, isIn ? ['Nama Pengirim', 'Pengirim', 'Dari'] : ['Nama Merchant', 'Merchant', 'Nama Penerima', 'Penerima', 'Tujuan', 'Keterangan', 'Kepada']) || cleanSubject_(ctx.subject);
    return [tx_(ctx, {
      type: isIn ? TYPE.IN : TYPE.OUT,
      account: src.name,
      amount: amount,
      description: isIn ? (counter ? 'Transfer masuk · ' + counter : 'Uang masuk') : counter,
      merchant: isIn ? '' : counter,
      counterparty: counter,
      status: STATUS.REVIEW,
      note: '"' + snippet_(full, amount) + '"'
    })];
  }
};

var PARSERS = [MandiriParser, JagoParser, BSIParser, SuperbankParser, GoPayParser, OVOParser, SmartParser];

function pickParser_(subject, from) {
  for (var i = 0; i < PARSERS.length; i++) {
    try { if (PARSERS[i].canParse(subject, from)) return PARSERS[i]; } catch (e) {}
  }
  return null;
}

// Gmail query: hanya dari domain bank/e-wallet yang dikenal.
function senderQuery_() {
  var domains = [];
  SOURCES.forEach(function (s) { s.domains.forEach(function (d) { if (domains.indexOf(d) === -1) domains.push(d); }); });
  return 'from:(' + domains.join(' OR ') + ')';
}


// ============================================================
// Transactions.gs — Kategori, akun, merchant, dan CRUD transaksi
// ============================================================

// ---------------- Kategori ----------------

function categories_() {
  if (_DB.categories) return _DB.categories;
  _DB.categories = rows_(SHEET.CATEGORIES).map(function (r) {
    var name = String(r.Name || '').trim();
    var key = String(r.Key || '').trim() || keyForCategoryName_(name);
    var def = defaultCategory_(key);
    return {
      name: name,
      key: key,
      color: String(r.Color || (def && def.color) || '#5F646C'),
      keywords: String(r.Keywords || '').split(',').map(function (k) { return k.trim().toLowerCase(); }).filter(Boolean),
      active: !(r.Active === false || String(r.Active).toLowerCase() === 'false'),
      group: String(r.FinancialGroup || (def && def.group) || GROUP.WANT),
      budget: Number(r.Budget) || 0,
      row: r._row
    };
  }).filter(function (c) { return c.name; });
  return _DB.categories;
}

function defaultCategory_(key) {
  for (var i = 0; i < DEFAULT_CATEGORIES.length; i++) if (DEFAULT_CATEGORIES[i].key === key) return DEFAULT_CATEGORIES[i];
  return null;
}

function keyForCategoryName_(name) {
  var n = String(name || '').trim().toLowerCase();
  var keys = Object.keys(CATEGORY_ALIASES);
  for (var i = 0; i < keys.length; i++) if (CATEGORY_ALIASES[keys[i]].indexOf(n) > -1) return keys[i];
  return '';
}

function catName_(key) {
  var cats = categories_();
  for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i].name;
  var def = defaultCategory_(key);
  return def ? def.name : 'Lainnya';
}

function categoryByName_(name) {
  var n = String(name || '').toLowerCase();
  var cats = categories_();
  for (var i = 0; i < cats.length; i++) if (cats[i].name.toLowerCase() === n) return cats[i];
  return null;
}

function kwMatch_(text, kw) {
  var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^a-z0-9])' + esc + '([^a-z0-9]|$)').test(text);
}

function categorize_(t) {
  if (t.type === TYPE.TR) return catName_('transfer');
  var text = (String(t.description || '') + ' ' + String(t.merchant || '')).toLowerCase();
  if (t.type === TYPE.IN) return /(^|[^a-z])(gaji|payroll|salary|thr)([^a-z]|$)/.test(text) ? catName_('salary') : catName_('income_other');
  var rule = merchantRule_(t.merchant);
  if (rule) return rule;
  if (settings_().autoCategorize === false) return catName_('other');
  var cats = categories_();
  for (var i = 0; i < cats.length; i++) {
    var c = cats[i];
    if (!c.active || c.group === GROUP.INCOME || c.group === GROUP.TRANSFER) continue;
    for (var j = 0; j < c.keywords.length; j++) {
      if (kwMatch_(text, c.keywords[j])) return c.name;
    }
  }
  return catName_('other');
}

// ---------------- Akun ----------------

function accounts_() {
  if (_DB.accounts) return _DB.accounts;
  _DB.accounts = rows_(SHEET.ACCOUNTS).map(function (r) {
    var name = String(r.Name || '').trim();
    var src = sourceForAccount_(name);
    return {
      name: name,
      active: !(r.Active === false || String(r.Active).toLowerCase() === 'false'),
      mode: String(r.Mode || (src ? src.mode : 'smart')),
      color: String(r.Color || (src ? src.color : '#4E6660')),
      abbr: src ? src.abbr : name.slice(0, 2).toUpperCase(),
      kind: src ? src.kind : 'Bank',
      row: r._row
    };
  }).filter(function (a) { return a.name; });
  return _DB.accounts;
}

function sourceForAccount_(name) {
  var n = String(name || '').trim().toLowerCase();
  for (var i = 0; i < SOURCES.length; i++) {
    if (SOURCES[i].name.toLowerCase() === n || SOURCES[i].aliases.indexOf(n) > -1) return SOURCES[i];
  }
  return null;
}

function accountNames_() {
  return accounts_().map(function (a) { return a.name; });
}

function saveSources_(names) {
  var wanted = (names || []).map(function (n) { return String(n).trim(); }).filter(Boolean);
  var existing = accounts_();
  existing.forEach(function (a) {
    var src = sourceForAccount_(a.name);
    var on = wanted.some(function (w) {
      return w.toLowerCase() === a.name.toLowerCase() || (src && src.name.toLowerCase() === w.toLowerCase());
    });
    update_(SHEET.ACCOUNTS, a.row, { Active: on, Mode: a.mode });
  });
  wanted.forEach(function (w) {
    var has = existing.some(function (a) {
      var src = sourceForAccount_(a.name);
      return a.name.toLowerCase() === w.toLowerCase() || (src && src.name.toLowerCase() === w.toLowerCase());
    });
    if (!has) {
      var src = sourceForAccount_(w);
      append_(SHEET.ACCOUNTS, { Name: src ? src.name : w, InitialBalance: 0, Color: src ? src.color : '#4E6660', Icon: '', Active: true, Mode: src ? src.mode : 'smart' });
    }
  });
  delete _DB.accounts;
}

// ---------------- Merchant ----------------

function merchants_() {
  if (_DB.merchants) return _DB.merchants;
  _DB.merchants = rows_(SHEET.MERCHANTS).map(function (r) {
    return { name: String(r.Name || ''), category: String(r.Category || ''), count: Number(r.Count) || 0, locked: r.Locked === true || String(r.Locked).toLowerCase() === 'true', row: r._row };
  });
  return _DB.merchants;
}

function merchantRule_(merchant) {
  var n = String(merchant || '').trim().toLowerCase();
  if (!n) return '';
  var list = merchants_();
  for (var i = 0; i < list.length; i++) {
    if (list[i].locked && list[i].name.toLowerCase() === n && list[i].category) return list[i].category;
  }
  return '';
}

function touchMerchant_(name, category) {
  var n = String(name || '').trim();
  if (!n) return;
  var list = merchants_();
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() === n.toLowerCase()) {
      list[i].count += 1;
      update_(SHEET.MERCHANTS, list[i].row, { Count: list[i].count, LastSeen: new Date() });
      return;
    }
  }
  var row = append_(SHEET.MERCHANTS, { Name: n, Category: category, Count: 1, LastSeen: new Date(), Locked: false });
  list.push({ name: n, category: category, count: 1, locked: false, row: row });
}

function setMerchantRule_(name, category) {
  var n = String(name || '').trim();
  if (!n) return;
  var list = merchants_();
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() === n.toLowerCase()) {
      list[i].category = category; list[i].locked = true;
      update_(SHEET.MERCHANTS, list[i].row, { Category: category, Locked: true });
      return;
    }
  }
  var row = append_(SHEET.MERCHANTS, { Name: n, Category: category, Count: 0, LastSeen: new Date(), Locked: true });
  list.push({ name: n, category: category, count: 0, locked: true, row: row });
}

function cleanMerchant_(description) {
  var clean = String(description || '')
    .replace(/\b(pembayaran|transfer|ke|dari|via|trx|ref|no)\b/gi, '')
    .trim();
  return (clean.split(/[|\/\\,]/)[0] || '').trim().substring(0, 60);
}

// ---------------- Transaksi ----------------

function normTx_(r) {
  var emailId = String(r.EmailID || '');
  return {
    id: String(r.ID || ''),
    row: r._row,
    date: toDate_(r.Date),
    description: String(r.Description || ''),
    amount: Number(r.Amount) || 0,
    type: normType_(r.Type) || TYPE.OUT,
    account: String(r.Account || ''),
    toAccount: String(r.ToAccount || ''),
    category: String(r.Category || ''),
    merchant: String(r.Merchant || ''),
    note: String(r.Note || ''),
    emailId: emailId,
    status: String(r.Status || '').toLowerCase() === STATUS.REVIEW ? STATUS.REVIEW : STATUS.OK,
    source: r.Source ? String(r.Source) : (emailId ? 'email' : 'manual')
  };
}

function txRows_() {
  if (_DB.tx) return _DB.tx;
  _DB.tx = rows_(SHEET.TX).map(normTx_).filter(function (t) { return t.date && t.id; });
  return _DB.tx;
}

function txOut_(t) {
  return {
    id: t.id, date: t.date.toISOString(), description: t.description, amount: t.amount, type: t.type,
    account: t.account, toAccount: t.toAccount, category: t.category, merchant: t.merchant,
    note: t.note, status: t.status, source: t.source
  };
}

function findTx_(id) {
  var all = txRows_();
  for (var i = 0; i < all.length; i++) if (all[i].id === String(id)) return all[i];
  return null;
}

function addTransaction(t) {
  var type = normType_(t.type) || TYPE.OUT;
  var amount = Math.round(Number(t.amount) || 0);
  if (amount <= 0) throw new Error('Nominal harus lebih dari 0.');
  var account = String(t.account || '').trim() || 'Tunai';
  var toAccount = type === TYPE.TR ? (String(t.toAccount || '').trim() || 'Rekening sendiri') : '';
  var description = String(t.description || t.merchant || 'Transaksi').trim();
  var merchant = type === TYPE.OUT ? String(t.merchant || cleanMerchant_(description)).trim() : String(t.merchant || '').trim();
  var category = t.category || (t.categoryKey ? catName_(t.categoryKey) : categorize_({ type: type, description: description, merchant: merchant }));
  var date = toDate_(t.date) || new Date();
  var id = newId_();
  var status = t.status === STATUS.REVIEW ? STATUS.REVIEW : STATUS.OK;

  append_(SHEET.TX, {
    ID: id, Date: date, Description: description, Amount: amount, Type: type,
    Account: account, ToAccount: toAccount, Category: category, Merchant: merchant,
    Note: t.note || '', EmailID: t.emailId || '', CreatedAt: new Date(),
    Status: status, Source: t.source || (t.emailId ? 'email' : 'manual')
  });
  delete _DB.tx;

  if (type === TYPE.OUT && merchant && status === STATUS.OK) touchMerchant_(merchant, category);
  if (type === TYPE.TR && status === STATUS.OK) autoGoalDeposit_({ id: id, date: date, amount: amount, toAccount: toAccount });
  return id;
}

function updateTransaction(id, p) {
  var t = findTx_(id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  var upd = {};
  if (p.type) {
    var type = normType_(p.type);
    upd.Type = type;
    if (type === TYPE.TR) {
      upd.ToAccount = p.toAccount || t.toAccount || 'Rekening sendiri';
      upd.Category = catName_('transfer');
    } else {
      upd.ToAccount = '';
      if (t.type === TYPE.TR && !p.category) upd.Category = categorize_({ type: type, description: t.description, merchant: t.merchant });
    }
  }
  if (p.description !== undefined) upd.Description = String(p.description);
  if (p.merchant !== undefined) upd.Merchant = String(p.merchant);
  if (p.note !== undefined) upd.Note = String(p.note);
  if (p.account) upd.Account = String(p.account);
  if (p.amount) upd.Amount = Math.round(Number(p.amount));
  if (p.date) upd.Date = toDate_(p.date) || t.date;
  if (p.category) {
    var cat = categoryByName_(p.category);
    if (!cat) throw new Error('Kategori "' + p.category + '" tidak ditemukan.');
    p.category = cat.name;
    upd.Category = cat.name;
  }
  if (p.status) upd.Status = p.status === STATUS.REVIEW ? STATUS.REVIEW : STATUS.OK;
  update_(SHEET.TX, t.row, upd);

  var recategorized = 0;
  if (p.remember && p.category && (t.merchant || t.description)) {
    var key = t.merchant || t.description;
    setMerchantRule_(key, p.category);
    txRows_().forEach(function (o) {
      if (o.id !== t.id && o.type === TYPE.OUT && (o.merchant || o.description).toLowerCase() === key.toLowerCase() && o.category !== p.category) {
        update_(SHEET.TX, o.row, { Category: p.category });
        recategorized++;
      }
    });
  }
  delete _DB.tx;
  return { id: id, recategorized: recategorized };
}

function deleteTransaction(id) {
  var t = findTx_(id);
  if (!t) throw new Error('Transaksi tidak ditemukan.');
  deleteRow_(SHEET.TX, t.row);
  delete _DB.tx;
  return { id: id };
}


// ============================================================
// Goals.gs — Goal tabungan, setoran, dan setoran otomatis
// Goal bisa dihubungkan ke satu akun (mis. "Superbank").
// Setiap transfer ke akun itu otomatis menambah progres goal.
// ============================================================

function goals_() {
  var deposits = rows_(SHEET.DEPOSITS);
  return rows_(SHEET.GOALS).map(function (r) {
    var id = String(r.ID || '');
    var mine = deposits.filter(function (d) { return String(d.GoalID) === id; });
    return goalOut_(r, mine);
  }).filter(function (g) { return g.id && g.status !== 'archived'; });
}

function monthsBetween_(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function goalOut_(r, deposits) {
  var now = new Date();
  var target = Number(r.Target) || 0;
  var current = Number(r.Current) || 0;
  var deadline = toDate_(r.Deadline);
  var created = toDate_(r.CreatedAt) || now;
  var pct = target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;
  var remaining = Math.max(target - current, 0);
  var monthsLeft = 0;
  if (deadline) {
    monthsLeft = monthsBetween_(now, deadline);
    if (deadline.getDate() < now.getDate()) monthsLeft -= 1;
    monthsLeft = Math.max(1, monthsLeft);
  }
  var monthly = deadline ? Math.ceil(remaining / monthsLeft / 1000) * 1000 : 0;
  var done = target > 0 && current >= target;

  var onTrack = true;
  if (!done && deadline && deadline > created) {
    var timePct = (now - created) / (deadline - created);
    onTrack = current / target >= Math.min(1, timePct) - 0.08;
  }
  var mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var thisMonth = (deposits || []).reduce(function (s, d) {
    var dd = toDate_(d.Date);
    return dd && dd >= mStart && d.Source !== 'initial' ? s + (Number(d.Amount) || 0) : s;
  }, 0);

  return {
    id: String(r.ID || ''),
    name: String(r.Name || ''),
    target: target,
    current: current,
    pct: pct,
    remaining: remaining,
    deadline: deadline ? deadline.toISOString() : '',
    monthly: monthly,
    thisMonth: thisMonth,
    description: String(r.Description || ''),
    color: String(r.Color || '#2E55B0'),
    icon: String(r.Icon || 'target'),
    linkedAccount: String(r.LinkedAccount || ''),
    status: done ? 'done' : String(r.Status || 'active'),
    onTrack: onTrack,
    createdAt: created.toISOString(),
    deposits: (deposits || []).map(function (d) {
      var dd = toDate_(d.Date);
      return { id: String(d.ID), date: dd ? dd.toISOString() : '', amount: Number(d.Amount) || 0, source: String(d.Source || 'manual'), note: String(d.Note || '') };
    }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })
  };
}

function goalRow_(id) {
  return findBy_(SHEET.GOALS, 'ID', id);
}

function saveGoal(p) {
  var name = String(p.name || '').trim();
  var target = Math.round(Number(p.target) || 0);
  if (!name) throw new Error('Nama goal wajib diisi.');
  if (target <= 0) throw new Error('Target harus lebih dari 0.');
  var data = {
    Name: name,
    Target: target,
    Deadline: p.deadline ? toDate_(p.deadline) : '',
    Description: String(p.description || ''),
    Color: String(p.color || '#2E55B0'),
    Icon: String(p.icon || 'target'),
    LinkedAccount: String(p.linkedAccount || ''),
    Status: 'active'
  };
  if (p.id) {
    var r = goalRow_(p.id);
    if (!r) throw new Error('Goal tidak ditemukan.');
    update_(SHEET.GOALS, r._row, data);
    return { id: p.id };
  }
  var id = newId_();
  data.ID = id;
  data.Current = 0;
  data.CreatedAt = new Date();
  append_(SHEET.GOALS, data);
  var start = Math.round(Number(p.current) || 0);
  if (start > 0) addDeposit({ goalId: id, amount: start, note: 'Saldo awal', source: 'initial' });
  return { id: id };
}

function deleteGoal(id) {
  var r = goalRow_(id);
  if (!r) throw new Error('Goal tidak ditemukan.');
  update_(SHEET.GOALS, r._row, { Status: 'archived' });
  return { id: id };
}

function addDeposit(p) {
  var r = goalRow_(p.goalId);
  if (!r) throw new Error('Goal tidak ditemukan.');
  var amount = Math.round(Number(p.amount) || 0);
  if (!amount) throw new Error('Nominal setoran wajib diisi.');
  append_(SHEET.DEPOSITS, {
    ID: newId_(), GoalID: String(p.goalId), Date: toDate_(p.date) || new Date(), Amount: amount,
    Source: p.source || 'manual', TxnID: p.txnId || '', Note: p.note || ''
  });
  var current = Math.max(0, (Number(r.Current) || 0) + amount);
  update_(SHEET.GOALS, r._row, { Current: current });
  return { id: p.goalId, current: current };
}

function autoGoalDeposit_(txn) {
  var to = String(txn.toAccount || '').toLowerCase();
  if (!to) return;
  var goals = rows_(SHEET.GOALS).filter(function (g) {
    var st = String(g.Status || 'active');
    return st !== 'archived' && String(g.LinkedAccount || '').toLowerCase() === to && (Number(g.Current) || 0) < (Number(g.Target) || 0);
  });
  if (!goals.length) return;
  addDeposit({ goalId: goals[0].ID, amount: txn.amount, date: txn.date, source: 'auto', txnId: txn.id, note: 'Transfer ke ' + txn.toAccount });
}


// ============================================================
// Insights.gs — Ringkasan untuk Beranda, Transaksi, Insight,
// Alokasi bulanan, dan email review mingguan
// ============================================================

function monthBounds_(ym) {
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth();
  var mm = String(ym || '').match(/^(\d{4})-(\d{1,2})$/);
  if (mm) { y = Number(mm[1]); m = Number(mm[2]) - 1; }
  return { y: y, m: m, start: new Date(y, m, 1), end: new Date(y, m + 1, 1), daysIn: new Date(y, m + 1, 0).getDate() };
}

function sum_(arr) {
  return arr.reduce(function (s, t) { return s + (Number(t.amount) || 0); }, 0);
}

function inRange_(t, a, b) { return t.date >= a && t.date < b; }

function isOut_(t) { return t.status === STATUS.OK && t.type === TYPE.OUT; }
function isIn_(t) { return t.status === STATUS.OK && t.type === TYPE.IN; }

function groupOfCategory_(name) {
  var c = categoryByName_(name);
  if (c) return c.group;
  var key = keyForCategoryName_(name);
  var def = defaultCategory_(key);
  return def ? def.group : GROUP.WANT;
}

function budgetBase_(incomeMonth) {
  var s = settings_();
  var base = incomeMonth > 0 ? incomeMonth : Number(s.expectedIncome) || 0;
  var budget = Number(s.monthlyBudget) > 0 ? Number(s.monthlyBudget) : Math.round(base * ((Number(s.allocNeed) || 0) + (Number(s.allocWant) || 0)) / 100);
  return { base: base, budget: budget };
}

// Jatah per kategori. Pakai kolom Budget kalau diisi; kalau kosong, dibagi
// dari jatah kelompoknya sesuai pola belanja 60 hari terakhir.
function categoryBudgets_(all, base) {
  var s = settings_();
  var groupAmount = {};
  groupAmount[GROUP.NEED] = Math.round(base * (Number(s.allocNeed) || 0) / 100);
  groupAmount[GROUP.WANT] = Math.round(base * (Number(s.allocWant) || 0) / 100);

  var since = new Date(Date.now() - 60 * 86400000);
  var spend = {}, first = null;
  all.forEach(function (t) {
    if (isOut_(t) && t.date >= since) {
      spend[t.category] = (spend[t.category] || 0) + t.amount;
      if (!first || t.date < first) first = t.date;
    }
  });
  // Berapa bulan data yang benar-benar ada (pengguna baru mungkin baru punya 2 minggu)
  var months = first ? Math.min(2, Math.max(0.5, (Date.now() - first.getTime()) / (30 * 86400000))) : 2;

  var out = {};
  [GROUP.NEED, GROUP.WANT].forEach(function (g) {
    var cats = categories_().filter(function (c) { return c.active && c.group === g; });
    var fixed = cats.filter(function (c) { return c.budget > 0; });
    var fixedSum = fixed.reduce(function (s2, c) { return s2 + c.budget; }, 0);
    var flex = cats.filter(function (c) { return !(c.budget > 0) && spend[c.name] > 0; });
    var flexSpend = flex.reduce(function (s2, c) { return s2 + spend[c.name]; }, 0);
    var remaining = Math.max(groupAmount[g] - fixedSum, 0);
    fixed.forEach(function (c) { out[c.name] = { budget: c.budget, group: g, fixed: true }; });
    flex.forEach(function (c) {
      var share = flexSpend > 0 ? remaining * spend[c.name] / flexSpend : 0;
      // Jangan beri jatah jauh di atas kebiasaan: maks 1,5× rata-rata bulanan (min Rp50rb)
      var cap = Math.max(spend[c.name] / months * 1.5, 50000);
      var b = Math.round(Math.min(share, cap) / 1000) * 1000;
      out[c.name] = { budget: b, group: g, fixed: false };
    });
  });
  return { byCategory: out, groupAmount: groupAmount };
}

function lastSyncIso_() {
  var v = PropertiesService.getScriptProperties().getProperty(SYNC_CONFIG.lastSyncProp);
  return v || '';
}

// ---------------- Beranda ----------------

function homeData(p) {
  var all = txRows_();
  var b = monthBounds_(p && p.month);
  var now = new Date();
  var isCur = now >= b.start && now < b.end;
  var month = all.filter(function (t) { return inRange_(t, b.start, b.end); });
  var spent = sum_(month.filter(isOut_));
  var income = sum_(month.filter(isIn_));

  var day = isCur ? now.getDate() : b.daysIn;
  var pStart = new Date(b.y, b.m - 1, 1);
  var pCut = new Date(b.y, b.m - 1, day + 1);
  var prevSame = sum_(all.filter(function (t) { return isOut_(t) && inRange_(t, pStart, pCut); }));

  var bb = budgetBase_(income);
  var daysLeft = isCur ? b.daysIn - day + 1 : 0;
  var left = bb.budget - spent;

  var cb = categoryBudgets_(all, bb.base).byCategory;
  var byCat = {};
  month.filter(isOut_).forEach(function (t) { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  var cats = Object.keys(byCat).map(function (name) {
    var c = categoryByName_(name);
    var budget = cb[name] ? cb[name].budget : 0;
    var pct = budget > 0 ? Math.round(byCat[name] / budget * 100) : 0;
    return { name: name, key: c ? c.key : keyForCategoryName_(name), color: c ? c.color : '#5F646C', amount: byCat[name], budget: budget, pct: pct, warn: budget > 0 && pct >= 85 };
  }).sort(function (a, c) { return c.amount - a.amount; });

  var savingThisMonth = goals_().reduce(function (s2, g) { return s2 + g.thisMonth; }, 0);

  return {
    month: b.y + '-' + ('0' + (b.m + 1)).slice(-2),
    isCurrent: isCur,
    spent: spent,
    income: income,
    leftover: income - spent,
    prevSame: prevSame,
    delta: prevSame > 0 ? Math.round((spent - prevSame) / prevSame * 100) : null,
    budget: bb.budget,
    left: left,
    daysLeft: daysLeft,
    perDay: daysLeft > 0 ? Math.max(0, Math.round(left / daysLeft)) : 0,
    avgPerDay: Math.round(spent / Math.max(1, day)),
    timePct: isCur ? Math.round(day / b.daysIn * 100) : 100,
    count: month.filter(isOut_).length,
    incomeCount: month.filter(isIn_).length,
    cats: cats,
    recent: all.filter(function (t) { return t.status === STATUS.OK; })
      .sort(function (a, c) { return c.date - a.date; }).slice(0, 6).map(txOut_),
    reviewCount: all.filter(function (t) { return t.status === STATUS.REVIEW; }).length,
    week: weekSummary_(all),
    savingThisMonth: savingThisMonth,
    lastSync: lastSyncIso_()
  };
}

function weekStart_(d) {
  var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}

function weekSummary_(all) {
  var now = new Date();
  var ws = weekStart_(now);
  var span = now - ws;
  var pws = new Date(ws.getTime() - 7 * 86400000);
  var cur = all.filter(function (t) { return isOut_(t) && t.date >= ws && t.date <= now; });
  var prev = all.filter(function (t) { return isOut_(t) && t.date >= pws && t.date < new Date(pws.getTime() + span); });
  var want = {};
  cur.forEach(function (t) { if (groupOfCategory_(t.category) === GROUP.WANT) want[t.category] = (want[t.category] || 0) + t.amount; });
  var topWant = Object.keys(want).sort(function (a, c) { return want[c] - want[a]; })[0] || '';
  var merchants = {};
  cur.forEach(function (t) { var m = t.merchant || t.description; merchants[m] = (merchants[m] || 0) + 1; });
  var fav = Object.keys(merchants).sort(function (a, c) { return merchants[c] - merchants[a]; })[0] || '';
  return {
    start: ws.toISOString(),
    total: sum_(cur),
    prev: sum_(prev),
    count: cur.length,
    topWant: topWant,
    topWantAmount: topWant ? want[topWant] : 0,
    favorite: fav,
    favoriteCount: fav ? merchants[fav] : 0
  };
}

// ---------------- Daftar transaksi ----------------

function txList(p) {
  p = p || {};
  var all = txRows_();
  var filter = p.filter || 'all';
  var q = String(p.q || '').toLowerCase().trim();
  var list = all.filter(function (t) {
    if (filter === 'review' && t.status !== STATUS.REVIEW) return false;
    if (filter === 'expense' && (t.type !== TYPE.OUT || t.status !== STATUS.OK)) return false;
    if (filter === 'income' && (t.type !== TYPE.IN || t.status !== STATUS.OK)) return false;
    if (filter === 'transfer' && t.type !== TYPE.TR) return false;
    if (filter === 'manual' && t.source !== 'manual') return false;
    if (q) {
      var hay = [t.description, t.merchant, t.category, t.account, t.toAccount, t.note].join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }).sort(function (a, c) { return c.date - a.date; });

  var limit = Math.min(Number(p.limit) || 80, 300);
  var offset = Number(p.offset) || 0;
  var wk = weekSummary_(all);
  return {
    items: list.slice(offset, offset + limit).map(txOut_),
    total: list.length,
    reviewCount: all.filter(function (t) { return t.status === STATUS.REVIEW; }).length,
    week: { total: wk.total, count: wk.count, delta: wk.prev > 0 ? Math.round((wk.total - wk.prev) / wk.prev * 100) : null }
  };
}

// ---------------- Insight ----------------

function insightData(p) {
  var all = txRows_();
  var b = monthBounds_(p && p.month);
  var now = new Date();
  var isCur = now >= b.start && now < b.end;
  var month = all.filter(function (t) { return inRange_(t, b.start, b.end); });
  var outs = month.filter(isOut_);
  var spent = sum_(outs);
  var income = sum_(month.filter(isIn_));

  var endDay = isCur ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : new Date(b.y, b.m, b.daysIn);
  var names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var bars = [];
  for (var i = 6; i >= 0; i--) {
    var d0 = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() - i);
    var d1 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + 1);
    bars.push({ label: names[d0.getDay()], date: d0.toISOString(), amount: sum_(all.filter(function (t) { return isOut_(t) && inRange_(t, d0, d1); })) });
  }

  var groups = { need: 0, want: 0, other: 0 };
  var byCat = {};
  var merchants = {};
  outs.forEach(function (t) {
    var g = groupOfCategory_(t.category);
    if (g === GROUP.NEED) groups.need += t.amount;
    else if (g === GROUP.WANT) groups.want += t.amount;
    else groups.other += t.amount;
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    var m = t.merchant || t.description;
    if (!merchants[m]) merchants[m] = { name: m, amount: 0, count: 0 };
    merchants[m].amount += t.amount;
    merchants[m].count += 1;
  });

  var cats = Object.keys(byCat).map(function (name) {
    var c = categoryByName_(name);
    return { name: name, key: c ? c.key : keyForCategoryName_(name), color: c ? c.color : '#5F646C', amount: byCat[name], pct: spent ? Math.round(byCat[name] / spent * 100) : 0 };
  }).sort(function (a, c) { return c.amount - a.amount; });

  var day = isCur ? now.getDate() : b.daysIn;
  var weekTotal = bars.reduce(function (s2, x) { return s2 + x.amount; }, 0);
  return {
    month: b.y + '-' + ('0' + (b.m + 1)).slice(-2),
    spent: spent,
    income: income,
    leftoverPct: income > 0 ? Math.round((income - spent) / income * 100) : null,
    avgPerDay: Math.round(spent / Math.max(1, day)),
    avg7: Math.round(weekTotal / 7),
    bars: bars,
    groups: groups,
    cats: cats,
    merchants: Object.keys(merchants).map(function (k) { return merchants[k]; })
      .sort(function (a, c) { return c.amount - a.amount; }).slice(0, 5)
  };
}

// ---------------- Alokasi bulanan ----------------

function allocationData(p) {
  var s = settings_();
  var all = txRows_();
  var b = monthBounds_(p && p.month);
  var month = all.filter(function (t) { return inRange_(t, b.start, b.end); });
  var income = sum_(month.filter(isIn_));
  var bb = budgetBase_(income);
  var cb = categoryBudgets_(all, bb.base);

  var usedBy = {};
  month.filter(isOut_).forEach(function (t) { usedBy[t.category] = (usedBy[t.category] || 0) + t.amount; });

  function groupItems(g) {
    var names = Object.keys(cb.byCategory).filter(function (n) { return cb.byCategory[n].group === g; });
    Object.keys(usedBy).forEach(function (n) {
      if (names.indexOf(n) === -1 && groupOfCategory_(n) === g) names.push(n);
    });
    return names.map(function (n) {
      var c = categoryByName_(n);
      var budget = cb.byCategory[n] ? cb.byCategory[n].budget : 0;
      var used = usedBy[n] || 0;
      return { name: n, key: c ? c.key : keyForCategoryName_(n), color: c ? c.color : '#5F646C', budget: budget, used: used, pct: budget > 0 ? Math.round(used / budget * 100) : (used > 0 ? 100 : 0), fixed: !!(cb.byCategory[n] && cb.byCategory[n].fixed) };
    }).sort(function (a, c) { return c.budget - a.budget || c.used - a.used; });
  }

  var saveAmount = Math.round(bb.base * (Number(s.allocSave) || 0) / 100);
  var goals = goals_().filter(function (g) { return g.status !== 'done'; });
  var weights = goals.map(function (g) { return g.monthly || 0; });
  var wsum = weights.reduce(function (a, c) { return a + c; }, 0);
  var savingItems = goals.map(function (g, i) {
    var share = wsum > 0 ? weights[i] / wsum : 1 / goals.length;
    var alloc = Math.round(saveAmount * share / 1000) * 1000;
    return { id: g.id, name: g.name, color: g.color, icon: g.icon, budget: alloc, used: g.thisMonth, pct: alloc > 0 ? Math.round(g.thisMonth / alloc * 100) : 0 };
  });

  var need = groupItems(GROUP.NEED), want = groupItems(GROUP.WANT);
  return {
    month: b.y + '-' + ('0' + (b.m + 1)).slice(-2),
    income: income,
    base: bb.base,
    usingExpected: !(income > 0),
    pct: { need: Number(s.allocNeed) || 0, want: Number(s.allocWant) || 0, save: Number(s.allocSave) || 0 },
    groups: [
      { key: 'need', name: 'Kebutuhan', amount: cb.groupAmount[GROUP.NEED], used: need.reduce(function (a, c) { return a + c.used; }, 0), items: need },
      { key: 'want', name: 'Keinginan', amount: cb.groupAmount[GROUP.WANT], used: want.reduce(function (a, c) { return a + c.used; }, 0), items: want },
      { key: 'save', name: 'Tabungan & goals', amount: saveAmount, used: savingItems.reduce(function (a, c) { return a + c.used; }, 0), items: savingItems }
    ]
  };
}

function saveAllocation(p) {
  var need = Math.round(Number(p.need)), want = Math.round(Number(p.want)), save = Math.round(Number(p.save));
  if ([need, want, save].some(function (x) { return !(x >= 0); }) || need + want + save !== 100) {
    throw new Error('Persentase harus berjumlah 100%.');
  }
  setSetting_('allocNeed', need);
  setSetting_('allocWant', want);
  setSetting_('allocSave', save);
  if (p.expectedIncome !== undefined && Number(p.expectedIncome) >= 0) setSetting_('expectedIncome', Math.round(Number(p.expectedIncome)));
  if (p.budgets) {
    Object.keys(p.budgets).forEach(function (name) {
      var c = categoryByName_(name);
      if (c) update_(SHEET.CATEGORIES, c.row, { Budget: Math.max(0, Math.round(Number(p.budgets[name]) || 0)) || '' });
    });
    delete _DB.categories;
  }
  return { ok: true };
}

// ---------------- Email review mingguan ----------------

function rupiah_(n) {
  var v = Math.round(Number(n) || 0);
  return (v < 0 ? '-Rp' : 'Rp') + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function sendWeeklyReview_() {
  var s = settings_();
  if (s.weeklyReviewEnabled === false) return { sent: false, reason: 'disabled' };
  var all = txRows_();
  var wk = weekSummary_(all);
  var home = homeData({});
  var to = Session.getEffectiveUser().getEmail();
  if (!to) return { sent: false, reason: 'no email' };
  var diff = wk.prev > 0 ? Math.round((wk.total - wk.prev) / wk.prev * 100) : null;
  var lines = [
    'Halo ' + (s.nickname || '') + ',',
    '',
    'Minggu ini kamu mengeluarkan ' + rupiah_(wk.total) + ' dari ' + wk.count + ' transaksi' +
      (diff === null ? '.' : ', ' + (diff <= 0 ? 'lebih hemat ' + Math.abs(diff) + '%' : 'lebih boros ' + diff + '%') + ' dari minggu lalu.'),
    wk.topWant ? 'Keinginan terbesar: ' + wk.topWant + ' (' + rupiah_(wk.topWantAmount) + ').' : '',
    home.budget > 0 ? 'Sisa batas bulan ini ' + rupiah_(home.left) + ', jatah aman ' + rupiah_(home.perDay) + ' per hari.' : '',
    home.reviewCount ? home.reviewCount + ' transaksi masih menunggu dicek di aplikasi.' : '',
    '',
    '— catat.id'
  ].filter(function (l, i, arr) { return l !== '' || (arr[i - 1] !== ''); });
  MailApp.sendEmail({ to: to, subject: 'Review mingguan catat.id — ' + rupiah_(wk.total), body: lines.join('\n') });
  return { sent: true };
}


// ============================================================
// Sync.gs — Satu-satunya mesin sinkronisasi Gmail
// Dipanggil oleh pemicu tiap 15 menit dan tombol sinkron di aplikasi.
// ============================================================

function processedMap_() {
  var map = {};
  var t = table_(SHEET.PROCESSED);
  var j = t.idx.EmailID;
  t.rows.forEach(function (r) { if (r[j]) map[String(r[j])] = true; });
  return map;
}

function markProcessed_(id, subject, from, emailDate, parser, status, count, message) {
  append_(SHEET.PROCESSED, {
    EmailID: id, ProcessedAt: new Date(), Subject: String(subject).slice(0, 200), From: String(from).slice(0, 120),
    EmailDate: emailDate || '', Parser: parser || '', Status: status, TransactionCount: count || 0, Message: message || ''
  });
}

function logParser_(parser, emailId, status, message, amount, account) {
  append_(SHEET.PARSER_LOGS, { Timestamp: new Date(), Parser: parser, EmailID: emailId, Status: status, Message: message || '', Amount: amount || '', Account: account || '' });
}

function syncContext_() {
  var s = settings_();
  return { owners: ownerList_(), accountNames: accountNames_(), trackIncome: s.trackIncome !== false };
}

function processMessage_(msg, processed, ctx, stats) {
  var id = msg.getId();
  if (processed[id]) { stats.skipped++; return; }
  processed[id] = true;
  stats.messages++;

  var subject = msg.getSubject() || '';
  var from = msg.getFrom() || '';
  var emailDate = msg.getDate();
  var parser = pickParser_(subject, from);

  if (!parser) { markProcessed_(id, subject, from, emailDate, '', 'SKIPPED', 0, 'Tidak ada parser'); stats.skipped++; return; }
  if (SKIP_SUBJECT_RE.test(subject) || FROM_SKIP_RE.test(from)) {
    markProcessed_(id, subject, from, emailDate, parser.name, 'SKIPPED', 0, 'Bukan email transaksi');
    stats.skipped++;
    return;
  }

  var body = '';
  try { body = msg.getPlainBody() || ''; } catch (e) {}
  if (!body.trim()) { try { body = stripHtml_(msg.getBody()); } catch (e2) {} }

  var pctx = { subject: subject, from: from, emailId: id, emailDate: emailDate, text: normalizeText(body) };
  try {
    var raw = parser.parse(pctx) || [];
    var txns = raw.map(function (t) { return finalizeTxn_(t, ctx, emailDate); }).filter(Boolean);
    txns.forEach(function (t) {
      addTransaction(t);
      stats.saved++;
      if (t.status === STATUS.REVIEW) stats.review++;
      stats.byAccount[t.account] = (stats.byAccount[t.account] || 0) + 1;
    });
    markProcessed_(id, subject, from, emailDate, parser.name, txns.length ? 'PROCESSED' : 'SKIPPED', txns.length, txns.length ? 'Tersimpan' : 'Tidak ada transaksi');
    if (!txns.length) { stats.skipped++; logParser_(parser.name, id, 'SKIPPED', 'Parser cocok tapi tidak ada transaksi: ' + subject.slice(0, 80)); }
  } catch (e) {
    markProcessed_(id, subject, from, emailDate, parser.name, 'ERROR', 0, e.message);
    logParser_(parser.name, id, 'ERROR', e.message);
    stats.errors++;
  }
}

// opts.daysBack: paksa jangkauan hari (dipakai sinkron pertama)
function syncTransactions(opts) {
  opts = opts || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, message: 'Sinkronisasi lain sedang berjalan.' };
  var props = PropertiesService.getScriptProperties();
  var stats = { threads: 0, messages: 0, saved: 0, review: 0, skipped: 0, errors: 0, byAccount: {} };
  try {
    var last = props.getProperty(SYNC_CONFIG.lastSyncProp);
    var after;
    if (opts.daysBack) after = new Date(Date.now() - Number(opts.daysBack) * 86400000);
    else if (last) after = new Date(new Date(last).getTime() - 2 * 86400000);
    else after = new Date(Date.now() - (Number(settings_().initialDaysBack) || 30) * 86400000);

    var query = senderQuery_() + ' after:' + Utilities.formatDate(after, Session.getScriptTimeZone(), 'yyyy/MM/dd') + ' -in:spam -in:trash';
    var processed = processedMap_();
    var ctx = syncContext_();
    var start = 0, done = false, started = Date.now();

    while (!done) {
      var threads = GmailApp.search(query, start, SYNC_CONFIG.searchBatch);
      if (!threads.length) break;
      stats.threads += threads.length;
      for (var i = 0; i < threads.length && !done; i++) {
        var msgs = threads[i].getMessages();
        for (var j = 0; j < msgs.length; j++) {
          if (msgs[j].getDate() < after) continue;
          processMessage_(msgs[j], processed, ctx, stats);
          if (stats.messages >= SYNC_CONFIG.maxMessagesPerRun || Date.now() - started > 4 * 60 * 1000) { done = true; break; }
        }
      }
      if (threads.length < SYNC_CONFIG.searchBatch) break;
      start += threads.length;
    }

    props.setProperty(SYNC_CONFIG.lastSyncProp, new Date().toISOString());
    var message = 'Pesan ' + stats.messages + ', tersimpan ' + stats.saved + ', perlu dicek ' + stats.review + ', error ' + stats.errors + '.';
    if (stats.saved || stats.errors) {
      append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: stats.errors ? 'PARTIAL' : 'SUCCESS', Message: message, ThreadsScanned: stats.threads, MessagesScanned: stats.messages, MessagesParsed: stats.saved, MessagesSkipped: stats.skipped, TransactionsSaved: stats.saved, Errors: stats.errors });
    }
    trimSheet_(SHEET.SYNC_LOGS, SYNC_CONFIG.keepSyncLogRows);
    trimSheet_(SHEET.PARSER_LOGS, SYNC_CONFIG.keepParserLogRows);
    trimSheet_(SHEET.PROCESSED, SYNC_CONFIG.keepProcessedRows);
    stats.ok = true;
    stats.message = message;
    stats.lastSync = new Date().toISOString();
    return stats;
  } catch (e) {
    try { append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: 'ERROR', Message: e.message }); } catch (e2) {}
    return { ok: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}


// ============================================================
// Api.gs — Satu pintu untuk semua panggilan dari aplikasi
// Klien memanggil google.script.run.api(aksi, data)
// ============================================================

var API = {
  bootstrap: function () {
    ensureSetup_();
    var s = settings_();
    var email = '';
    try { email = Session.getEffectiveUser().getEmail(); } catch (e) {}
    return {
      app: APP,
      onboarded: s.onboarded === true,
      nickname: s.nickname || '',
      email: email,
      ownerNames: ownerList_(),
      hasPin: !!PropertiesService.getUserProperties().getProperty('JEJAK_PIN'),
      settings: {
        trackIncome: s.trackIncome !== false,
        weeklyReviewEnabled: s.weeklyReviewEnabled !== false,
        expectedIncome: Number(s.expectedIncome) || 0,
        allocNeed: Number(s.allocNeed) || 0,
        allocWant: Number(s.allocWant) || 0,
        allocSave: Number(s.allocSave) || 0,
        theme: String(s.theme || 'biru')
      },
      accounts: accounts_().map(function (a) { return { name: a.name, mode: a.mode, color: a.color, abbr: a.abbr, kind: a.kind, active: a.active }; }),
      categories: categories_().filter(function (c) { return c.active; }).map(function (c) { return { name: c.name, key: c.key, color: c.color, group: c.group, keywords: c.keywords }; }),
      catalog: SOURCES.map(function (s2) { return { name: s2.name, abbr: s2.abbr, color: s2.color, mode: s2.mode, kind: s2.kind }; }),
      spreadsheetUrl: getSpreadsheet_().getUrl(),
      lastSync: lastSyncIso_(),
      txCount: txRows_().length
    };
  },

  saveOnboarding: function (p) {
    var nick = String(p.nickname || '').trim();
    if (!nick) throw new Error('Nama panggilan wajib diisi.');
    setSetting_('nickname', nick);
    setSetting_('ownerNames', (p.ownerNames || []).map(function (n) { return String(n).trim(); }).filter(Boolean).join('|'));
    if (p.sources) saveSources_(p.sources);
    if (p.expectedIncome !== undefined) setSetting_('expectedIncome', Math.max(0, Math.round(Number(p.expectedIncome) || 0)));
    if (p.alloc) saveAllocation({ need: p.alloc.need, want: p.alloc.want, save: p.alloc.save });
    if (p.trackIncome !== undefined) setSetting_('trackIncome', !!p.trackIncome);
    if (p.weeklyReviewEnabled !== undefined) setSetting_('weeklyReviewEnabled', !!p.weeklyReviewEnabled);
    setSetting_('onboarded', true);
    ensureTriggers_();
    return { ok: true };
  },

  setPin: function (p) {
    var pin = String(p.pin || '');
    if (!/^\d{6}$/.test(pin)) throw new Error('PIN harus 6 angka.');
    PropertiesService.getUserProperties().setProperty('JEJAK_PIN', hashPin_(pin));
    return { ok: true };
  },
  verifyPin: function (p) {
    var saved = PropertiesService.getUserProperties().getProperty('JEJAK_PIN');
    return { ok: !saved || saved === hashPin_(String(p.pin || '')) };
  },
  clearPin: function () {
    PropertiesService.getUserProperties().deleteProperty('JEJAK_PIN');
    return { ok: true };
  },

  sync: function (p) { return syncTransactions({ daysBack: p && p.daysBack }); },

  home: function (p) { return homeData(p); },
  transactions: function (p) { return txList(p); },
  transaction: function (p) {
    var t = findTx_(p.id);
    if (!t) throw new Error('Transaksi tidak ditemukan.');
    var out = txOut_(t);
    out.remembered = !!merchantRule_(t.merchant || t.description);
    var a = accounts_().filter(function (x) { return x.name === t.account; })[0];
    out.accountMode = a ? a.mode : '';
    return out;
  },
  addTransaction: function (p) {
    var id = addTransaction({
      date: p.date, description: p.description, merchant: p.merchant, amount: p.amount,
      type: p.type || TYPE.OUT, account: p.account, toAccount: p.toAccount, category: p.category,
      note: p.note, source: 'manual'
    });
    return { id: id };
  },
  updateTransaction: function (p) { return updateTransaction(p.id, p); },
  deleteTransaction: function (p) { return deleteTransaction(p.id); },

  // Jawaban dari layar "Cek sekilas"
  resolveReview: function (p) {
    var t = findTx_(p.id);
    if (!t) throw new Error('Transaksi tidak ditemukan.');
    if (p.action === 'notx') { deleteTransaction(p.id); return { ok: true }; }
    if (p.action === 'self') {
      if (t.type === TYPE.IN) updateTransaction(p.id, { type: TYPE.TR, account: 'Rekening sendiri', toAccount: t.account, status: STATUS.OK });
      else updateTransaction(p.id, { type: TYPE.TR, toAccount: 'Rekening sendiri', status: STATUS.OK });
      return { ok: true };
    }
    var patch = { status: STATUS.OK };
    if (p.category) { patch.category = p.category; patch.remember = true; }
    if (p.type) patch.type = p.type;
    updateTransaction(p.id, patch);
    if (t.type === TYPE.OUT && (t.merchant || t.description)) touchMerchant_(t.merchant || t.description, p.category || t.category);
    return { ok: true };
  },

  insight: function (p) { return insightData(p); },

  goals: function () { return goals_(); },
  goal: function (p) {
    var g = goals_().filter(function (x) { return x.id === p.id; })[0];
    if (!g) throw new Error('Goal tidak ditemukan.');
    return g;
  },
  saveGoal: function (p) { return saveGoal(p); },
  deleteGoal: function (p) { return deleteGoal(p.id); },
  addDeposit: function (p) { return addDeposit({ goalId: p.goalId, amount: p.amount, note: p.note, source: 'manual' }); },

  allocation: function (p) { return allocationData(p); },
  saveAllocation: function (p) { return saveAllocation(p); },

  saveProfile: function (p) {
    if (p.nickname !== undefined) setSetting_('nickname', String(p.nickname).trim());
    if (p.ownerNames) setSetting_('ownerNames', p.ownerNames.map(function (n) { return String(n).trim(); }).filter(Boolean).join('|'));
    return { ok: true };
  },
  saveSettings: function (p) {
    ['trackIncome', 'weeklyReviewEnabled'].forEach(function (k) { if (p[k] !== undefined) setSetting_(k, !!p[k]); });
    if (p.theme !== undefined) {
      if (['biru', 'hijau', 'ungu', 'terakota', 'grafit'].indexOf(p.theme) === -1) throw new Error('Tema tidak dikenal.');
      setSetting_('theme', p.theme);
    }
    if (p.expectedIncome !== undefined) setSetting_('expectedIncome', Math.max(0, Math.round(Number(p.expectedIncome) || 0)));
    return { ok: true };
  },
  saveSources: function (p) { saveSources_(p.sources || []); return { ok: true }; },
  sources: function () {
    var last = {};
    txRows_().forEach(function (t) {
      if (t.source === 'email' && (!last[t.account] || t.date > last[t.account])) last[t.account] = t.date;
    });
    return accounts_().filter(function (a) { return a.active; }).map(function (a) {
      return { name: a.name, mode: a.mode, color: a.color, abbr: a.abbr, kind: a.kind, lastEmail: last[a.name] ? last[a.name].toISOString() : '' };
    });
  }
};

function hashPin_(pin) {
  var salt = ScriptApp.getScriptId();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin + ':' + salt);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// Semua tanggal diubah jadi string ISO supaya aman dikirim ke browser.
function api(action, payload) {
  try {
    var fn = API[action];
    if (!fn) throw new Error('Aksi tidak dikenal: ' + action);
    var data = fn(payload || {});
    return JSON.parse(JSON.stringify({ ok: true, data: data === undefined ? null : data }));
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}


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
  ScriptApp.newTrigger('jejakWeeklyReview').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(Number(settings_().weeklyReviewHour) || 16).create();
}

function jejakSyncTrigger() {
  syncTransactions({});
}

function jejakWeeklyReview() {
  sendWeeklyReview_();
}


// ============================================================
// Migration.gs — Membersihkan data dari versi lama
// Jalankan lewat menu catat.id → "Bersihkan data lama — pratinjau" dulu.
// ============================================================

function cleanupLegacy(dryRun) {
  var owners = ownerList_();
  var accts = accountNames_();
  var res = { dryRun: !!dryRun, gopaySummary: 0, junkDates: 0, incomingFix: 0, ownTransfer: 0, topupFix: 0, adminFee: 0, ownersSet: owners.length > 0 };
  var del = [], upd = [];
  var feeName = catName_('fee'), transferName = catName_('transfer'), incomeName = catName_('income_other');

  rows_(SHEET.TX).forEach(function (r) {
    var d = toDate_(r.Date);
    var desc = String(r.Description || '');
    var type = normType_(r.Type);

    if (/^ini total pengeluaranmu/i.test(desc)) { del.push(r._row); res.gopaySummary++; return; }
    if (!d || d.getFullYear() < 2020) { del.push(r._row); res.junkDates++; return; }

    var m = desc.match(/transfer dari\s+(.+?)\s+(udah|sudah|telah)\s+masuk/i);
    if (m && type === TYPE.OUT) {
      if (isOwnerText_(m[1], owners)) upd.push([r._row, { Type: TYPE.TR, Account: 'Rekening sendiri', ToAccount: r.Account, Category: transferName }]);
      else upd.push([r._row, { Type: TYPE.IN, Category: incomeName, Merchant: '' }]);
      res.incomingFix++;
      return;
    }
    if (type === TYPE.OUT && owners.length && isOwnerText_(desc + ' ' + (r.Merchant || ''), owners)) {
      var other = detectAccountName_(desc, accts);
      upd.push([r._row, { Type: TYPE.TR, ToAccount: other && other !== r.Account ? other : 'Rekening sendiri', Category: transferName }]);
      res.ownTransfer++;
      return;
    }
    if (/pembelian saldo e-?wallet/i.test(desc) && type === TYPE.IN) {
      upd.push([r._row, { Type: TYPE.TR, ToAccount: detectEwallet_(desc) || 'E-wallet', Category: transferName }]);
      res.topupFix++;
      return;
    }
    if (String(r.Category || '').toLowerCase() === 'admin fee' && feeName.toLowerCase() !== 'admin fee') {
      upd.push([r._row, { Category: feeName }]);
      res.adminFee++;
    }
  });

  if (!dryRun) {
    upd.forEach(function (u) { update_(SHEET.TX, u[0], u[1]); });
    var sh = table_(SHEET.TX).sheet;
    del.sort(function (a, b) { return b - a; }).forEach(function (row) { sh.deleteRow(row); });
    invalidate_(SHEET.TX);
    delete _DB.tx;
  }
  return res;
}

function cleanupSummary_(r) {
  return [
    '• Email rekap bulanan GoPay yang tercatat dobel: ' + r.gopaySummary + ' baris dihapus',
    '• Transaksi bertanggal rusak (sebelum 2020): ' + r.junkDates + ' baris dihapus',
    '• Uang masuk yang tercatat sebagai pengeluaran: ' + r.incomingFix + ' diperbaiki',
    '• Transfer ke rekening sendiri: ' + r.ownTransfer + ' diubah jadi Transfer' + (r.ownersSet ? '' : ' (isi "Nama di rekening" dulu di aplikasi)'),
    '• Top-up e-wallet yang tercatat sebagai pemasukan: ' + r.topupFix + ' diperbaiki',
    '• Kategori "Admin Fee" diseragamkan: ' + r.adminFee
  ].join('\n');
}

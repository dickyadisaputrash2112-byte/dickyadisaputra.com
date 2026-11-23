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

// ============================================================
// Plans.gs — Versi produk (Standard, Pro, Premium) dan kode aktivasi
//
// Standard : riwayat email 90 hari ke belakang, tanpa Goals
// Pro      : riwayat email 1 tahun ke belakang, tanpa Goals
// Premium  : riwayat email 5 tahun ke belakang, Goals & tabungan
// Versi bawaan sebuah template diatur penjual lewat menu catat.id → Masukkan kode versi / upgrade
// (kodenya disimpan di tab tersembunyi "_lisensi" dan ikut tersalin ke pembeli).
// Tanpa kode, aplikasi berjalan sebagai Standard.
// ============================================================

// >>> DIISI PENJUAL: link halaman beli upgrade di Lynk.id / Scalev (kosongkan kalau belum ada)
var UPGRADE_LINKS = {
  pro: '',      // mis. 'https://lynk.id/namatoko/upgrade-pro'
  premium: ''   // mis. 'https://lynk.id/namatoko/upgrade-premium'
};
var UPGRADE_PRICE = 'Rp50rb';

var PLANS = {
  standard: { key: 'standard', name: 'Standard', rank: 1, historyDays: 90, goals: false },
  pro: { key: 'pro', name: 'Pro', rank: 2, historyDays: 365, goals: false },
  premium: { key: 'premium', name: 'Premium', rank: 3, historyDays: 1825, goals: true }
};
var PLAN_PREFIX = { STD: 'standard', PRO: 'pro', PRM: 'premium' };
var LICENSE_SALT = 'lk_ebca9e5136b56b261215e187';
var CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

var LICENSE_SHEET = '_lisensi';

function plan_() {
  var p = PropertiesService.getScriptProperties();
  var k = p.getProperty('CATAT_PLAN');
  if (PLANS[k]) return PLANS[k];
  // Salinan baru: baca kode versi bawaan template dari tab tersembunyi.
  var r = parseCode_(templateCode_());
  if (r) {
    p.setProperty('CATAT_PLAN', r.plan);
    p.setProperty('CATAT_PLAN_CODE', r.code);
    return PLANS[r.plan];
  }
  return PLANS.standard;
}

function templateCode_() {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LICENSE_SHEET);
    return sh ? String(sh.getRange(1, 1).getValue() || '') : '';
  } catch (e) { return ''; }
}

function writeLicenseSheet_(code) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LICENSE_SHEET) || ss.insertSheet(LICENSE_SHEET);
  sh.getRange(1, 1, 1, 2).setValues([[code, 'Jangan diubah. Kode versi catat.id.']]);
  try { sh.hideSheet(); } catch (e) {}
}

function installedAt_() {
  var p = PropertiesService.getScriptProperties();
  var v = p.getProperty('CATAT_INSTALLED_AT');
  if (!v) { v = new Date().toISOString(); p.setProperty('CATAT_INSTALLED_AT', v); }
  return new Date(v);
}

// Batas paling lama riwayat email yang dibaca, dihitung dari tanggal pemasangan.
function historyTarget_() {
  var d = installedAt_();
  var t = new Date(d.getFullYear(), d.getMonth(), d.getDate() - plan_().historyDays);
  return t;
}

function codeChecksum_(prefix, body) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, LICENSE_SALT + '|' + prefix + '|' + body);
  var out = '';
  for (var i = 0; i < 4; i++) out += CODE_ALPHABET.charAt((bytes[i] & 0xff) % 32);
  return out;
}

function parseCode_(code) {
  var c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var m = c.match(/^(STD|PRO|PRM)([A-Z2-9]{4})([A-Z2-9]{4})$/);
  if (!m || codeChecksum_(m[1], m[2]) !== m[3]) return null;
  return { plan: PLAN_PREFIX[m[1]], code: m[1] + '-' + m[2] + '-' + m[3] };
}

function activatePlan_(code) {
  var r = parseCode_(code);
  if (!r) throw new Error('Kode aktivasi tidak dikenali. Periksa lagi huruf dan angkanya.');
  var cur = plan_(), next = PLANS[r.plan];
  if (next.rank < cur.rank) throw new Error('Versi kamu sekarang sudah ' + cur.name + '.');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('CATAT_PLAN', next.key);
  p.setProperty('CATAT_PLAN_CODE', r.code);
  p.setProperty('CATAT_PLAN_AT', new Date().toISOString());
  writeLicenseSheet_(r.code);
  installedAt_();
  return planInfo_();
}

function planInfo_() {
  var pl = plan_();
  var p = PropertiesService.getScriptProperties();
  return {
    key: pl.key, name: pl.name, historyDays: pl.historyDays, goals: pl.goals,
    historyFrom: historyTarget_().toISOString(),
    code: p.getProperty('CATAT_PLAN_CODE') || '',
    upgrade: { pro: UPGRADE_LINKS.pro || '', premium: UPGRADE_LINKS.premium || '', price: UPGRADE_PRICE }
  };
}

function requireGoals_() {
  if (!plan_().goals) throw new Error('Goals & tabungan tersedia di versi Premium.');
}

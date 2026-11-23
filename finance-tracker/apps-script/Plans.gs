// ============================================================
// Plans.gs — Versi produk (Gold, Platinum, Diamond) dan kode aktivasi
//
// Gold     : riwayat email 90 hari ke belakang
// Platinum : riwayat email 1 tahun ke belakang
// Diamond  : riwayat email 5 tahun ke belakang + Goals & tabungan + Alokasi bulanan
//
// Versi bawaan sebuah template diatur penjual lewat menu catat.id → Masukkan kode versi / upgrade
// (kodenya disimpan di tab tersembunyi "_lisensi" dan ikut tersalin ke pembeli).
// Tanpa kode, aplikasi berjalan sebagai Gold.
//
// Jenis kode:
//   PLT-xxxx-xxxx  → Platinum (dari Gold)            · upgrade Rp50rb
//   DMD-xxxx-xxxx  → Diamond  (dari Gold/Platinum)   · upgrade Rp100rb dari Gold
//   DUP-xxxx-xxxx  → Diamond  (hanya dari Platinum)  · upgrade Rp50rb dari Platinum
// ============================================================

// >>> DIISI PENJUAL: link halaman beli upgrade di Lynk.id / Scalev (kosongkan kalau belum ada)
var UPGRADE_LINKS = {
  goldToPlatinum: '',     // mis. 'https://lynk.id/namatoko/upgrade-platinum'
  goldToDiamond: '',      // mis. 'https://lynk.id/namatoko/upgrade-diamond'
  platinumToDiamond: ''   // mis. 'https://lynk.id/namatoko/platinum-ke-diamond'
};
var UPGRADE_PRICES = { goldToPlatinum: 'Rp50rb', goldToDiamond: 'Rp100rb', platinumToDiamond: 'Rp50rb' };

// >>> DIISI PENJUAL: kode yang bocor dan tidak boleh dipakai lagi di salinan baru, mis. ['PLT-AAAA-BBBB']
var REVOKED_CODES = [];

var PLANS = {
  gold: { key: 'gold', name: 'Gold', rank: 1, historyDays: 90, goals: false, alloc: false },
  platinum: { key: 'platinum', name: 'Platinum', rank: 2, historyDays: 365, goals: false, alloc: false },
  diamond: { key: 'diamond', name: 'Diamond', rank: 3, historyDays: 1825, goals: true, alloc: true }
};
var CODE_TYPES = {
  PLT: { plan: 'platinum', from: ['gold'] },
  DMD: { plan: 'diamond', from: ['gold', 'platinum'] },
  DUP: { plan: 'diamond', from: ['platinum'] }
};
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
  return PLANS.gold;
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
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - plan_().historyDays);
}

function codeChecksum_(prefix, body) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, LICENSE_SALT + '|' + prefix + '|' + body);
  var out = '';
  for (var i = 0; i < 4; i++) out += CODE_ALPHABET.charAt((bytes[i] & 0xff) % 32);
  return out;
}

function parseCode_(code) {
  var c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var m = c.match(/^(PLT|DMD|DUP)([A-Z2-9]{4})([A-Z2-9]{4})$/);
  if (!m || codeChecksum_(m[1], m[2]) !== m[3]) return null;
  var full = m[1] + '-' + m[2] + '-' + m[3];
  if (REVOKED_CODES.indexOf(full) > -1) return null;
  return { type: m[1], plan: CODE_TYPES[m[1]].plan, from: CODE_TYPES[m[1]].from, code: full };
}

function activatePlan_(code) {
  var r = parseCode_(code);
  if (!r) throw new Error('Kode tidak dikenali atau sudah tidak berlaku. Periksa lagi huruf dan angkanya.');
  var cur = plan_(), next = PLANS[r.plan];
  if (next.rank <= cur.rank) throw new Error('Versi kamu sekarang sudah ' + cur.name + '.');
  if (r.from.indexOf(cur.key) === -1) {
    throw new Error('Kode ini untuk upgrade dari ' + r.from.map(function (k) { return PLANS[k].name; }).join('/') + '. Versi kamu sekarang ' + cur.name + '.');
  }
  var p = PropertiesService.getScriptProperties();
  p.setProperty('CATAT_PLAN', next.key);
  p.setProperty('CATAT_PLAN_CODE', r.code);
  p.setProperty('CATAT_PLAN_AT', new Date().toISOString());
  writeLicenseSheet_(r.code);
  installedAt_();
  return planInfo_();
}

function upgradeOptions_(key) {
  var o = [];
  if (key === 'gold') {
    o.push({ to: 'platinum', name: 'Platinum', price: UPGRADE_PRICES.goldToPlatinum, link: UPGRADE_LINKS.goldToPlatinum || '' });
    o.push({ to: 'diamond', name: 'Diamond', price: UPGRADE_PRICES.goldToDiamond, link: UPGRADE_LINKS.goldToDiamond || '' });
  } else if (key === 'platinum') {
    o.push({ to: 'diamond', name: 'Diamond', price: UPGRADE_PRICES.platinumToDiamond, link: UPGRADE_LINKS.platinumToDiamond || '' });
  }
  return o;
}

function planInfo_() {
  var pl = plan_();
  var p = PropertiesService.getScriptProperties();
  return {
    key: pl.key, name: pl.name, historyDays: pl.historyDays, goals: pl.goals, alloc: pl.alloc,
    historyFrom: historyTarget_().toISOString(),
    code: p.getProperty('CATAT_PLAN_CODE') || '',
    upgrades: upgradeOptions_(pl.key)
  };
}

function requireGoals_() {
  if (!plan_().goals) throw new Error('Goals & tabungan tersedia di versi Diamond.');
}

function requireAlloc_() {
  if (!plan_().alloc) throw new Error('Alokasi bulanan tersedia di versi Diamond.');
}

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
  if (!ss) throw new Error('Spreadsheet tidak ditemukan. Buka spreadsheet lalu jalankan menu Jejak → Setup.');
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

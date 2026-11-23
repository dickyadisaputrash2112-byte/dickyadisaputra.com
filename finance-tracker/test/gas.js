// Mock Google Apps Script runtime, loads all .gs into one VM context
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const SRC = process.env.GAS_SRC || require('path').join(__dirname, '..', process.env.DIST ? 'dist' : 'apps-script');

function makeSheet(name) {
  const data = []; // array of rows
  const sh = {
    _name: name, _data: data,
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data.reduce((m, r) => Math.max(m, r.length), 0),
    setFrozenRows() {}, setColumnWidth() {}, setHiddenGridlines() {}, hideSheet() {},
    appendRow(row) { data.push(row.slice()); return sh; },
    deleteRow(r) { data.splice(r - 1, 1); },
    deleteRows(r, n) { data.splice(r - 1, n); },
    getRange(r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      const rng = {
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) { const row = data[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] === undefined ? '' : row[c - 1 + j]); out.push(o); }
          return out;
        },
        setValues(v) {
          if (v.length !== nr || v[0].length !== nc) throw new Error('setValues dim mismatch ' + v.length + 'x' + v[0].length + ' vs ' + nr + 'x' + nc);
          for (let i = 0; i < nr; i++) { while (data.length < r + i) data.push([]); const row = data[r - 1 + i]; for (let j = 0; j < nc; j++) row[c - 1 + j] = v[i][j]; }
          return rng;
        },
        setValue(x) { return rng.setValues([[x]]); },
        getValue() { return rng.getValues()[0][0]; },
        clearContent() { for (let i = 0; i < nr; i++) { const row = data[r - 1 + i]; if (row) for (let j = 0; j < nc; j++) row[c - 1 + j] = ''; } return rng; },
        setFontWeight() { return rng; }, setFontSize() { return rng; }, setNumberFormat() { return rng; }
      };
      return rng;
    }
  };
  return sh;
}

function create(opts) {
  opts = opts || {};
  const sheets = {};
  const ss = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = makeSheet(n)),
    getUrl: () => 'https://docs.google.com/spreadsheets/d/TEST/edit',
    getId: () => 'TEST', getSheets: () => Object.values(sheets)
  };
  const store = () => { const m = {}; return { getProperty: k => (k in m ? m[k] : null), setProperty: (k, v) => { m[k] = String(v); }, deleteProperty: k => { delete m[k]; }, getProperties: () => ({ ...m }), _m: m }; };
  const scriptProps = store(), userProps = store();
  const triggers = [];
  const sent = [];
  const tb = () => { const t = { timeBased: () => t, everyMinutes: () => t, onWeekDay: () => t, atHour: () => t, everyHours: () => t, create: () => { triggers.push(t); return t; }, _h: '' , getHandlerFunction: () => t._h }; return t; };
  const ctx = {
    console, Math, Date, JSON, RegExp, String, Number, Array, Object, Error, isFinite, isNaN, parseFloat, parseInt,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss, openById: () => ss,
      getUi: () => ({ alert() {}, createMenu: () => { const m = { addItem: () => m, addSeparator: () => m, addToUi() {} }; return m; }, ButtonSet: { OK: 1, YES_NO: 2 }, Button: { YES: 'YES' }, showModalDialog() {} })
    },
    PropertiesService: { getScriptProperties: () => scriptProps, getUserProperties: () => userProps },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock() {}, releaseLock() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
      formatDate: (d, tz, f) => { const p = n => String(n).padStart(2, '0'); return f.replace('yyyy', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate())).replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes())); },
      getUuid: () => crypto.randomUUID(), sleep() {}
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'tester@example.com' }), getActiveUser: () => ({ getEmail: () => 'tester@example.com' }), getScriptTimeZone: () => 'Asia/Jakarta' },
    GmailApp: { search: (q, start, max) => { ctx._lastQuery = q; return start === 0 ? (opts.threads || []).map(msgs => ({ getMessages: () => msgs })) : []; } },
    MailApp: { sendEmail: o => sent.push(o), getRemainingDailyQuota: () => 100 },
    ScriptApp: {
      WeekDay: { SUNDAY: 'SUNDAY', MONDAY: 'MONDAY', TUESDAY: 'TUESDAY', WEDNESDAY: 'WEDNESDAY', THURSDAY: 'THURSDAY', FRIDAY: 'FRIDAY', SATURDAY: 'SATURDAY' }, getProjectTriggers: () => triggers.slice(), deleteTrigger: t => triggers.splice(triggers.indexOf(t), 1),
      getScriptId: () => 'SCRIPT', getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/X/exec', isEnabled: () => !opts.notDeployed }),
      newTrigger: h => { const t = tb(); t._h = h; return t; }
    },
    HtmlService: {
      createTemplateFromFile: n => ({ evaluate: () => ({ setTitle() { return this; }, addMetaTag() { return this; }, setXFrameOptionsMode() { return this; }, setFaviconUrl() { return this; } }) }),
      createHtmlOutputFromFile: n => ({ getContent: () => fs.readFileSync(path.join(SRC, n + '.html'), 'utf8') }),
      createHtmlOutput: h => ({ setWidth() { return this; }, setHeight() { return this; } }),
      XFrameOptionsMode: { ALLOWALL: 1 }
    },
    Logger: { log() {} },
    ContentService: { createTextOutput: t => ({ getContent: () => t, setMimeType() { return this; } }), MimeType: { JSON: 'json', TEXT: 'text' } },
    _sheets: sheets, _sent: sent, _triggers: triggers, _userProps: userProps, _scriptProps: scriptProps
  };
  vm.createContext(ctx);
  const dir = opts.src || SRC;
  fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort().forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
  return ctx;
}

function msg(id, from, subject, body, date, html) {
  return { getId: () => id, getFrom: () => from, getSubject: () => subject, getDate: () => date, getPlainBody: () => (html ? '' : body), getBody: () => (html ? body : body) };
}
// Kode aktivasi untuk tes (rumus yang sama dengan Plans.gs)
function mkCode(pre, body) {
  const SALT = 'lk_ebca9e5136b56b261215e187', A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return pre + '-' + body + '-' + [...crypto.createHash('sha256').update(SALT + '|' + pre + '|' + body).digest().slice(0, 4)].map(b => A[b % 32]).join('');
}
module.exports = { create, msg, mkCode };

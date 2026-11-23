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
  var salt = PIN_PEPPER + ':' + ScriptApp.getScriptId();
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

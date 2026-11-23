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

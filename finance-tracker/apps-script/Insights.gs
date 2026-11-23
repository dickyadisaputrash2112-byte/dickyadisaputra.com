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

// ---------------- Rekap tahunan ----------------

function yearData(p) {
  var all = txRows_();
  var now = new Date();
  var y = Number(p && p.year) || now.getFullYear();
  var start = new Date(y, 0, 1), end = new Date(y + 1, 0, 1);
  var years = {};
  all.forEach(function (t) { if (t.date) years[t.date.getFullYear()] = true; });
  years[now.getFullYear()] = true;

  var rows = all.filter(function (t) { return inRange_(t, start, end); });
  var outs = rows.filter(isOut_), ins = rows.filter(isIn_);
  var spent = sum_(outs), income = sum_(ins);

  var months = [];
  for (var m = 0; m < 12; m++) months.push({ m: m, spent: 0, income: 0, count: 0 });
  outs.forEach(function (t) { months[t.date.getMonth()].spent += t.amount; months[t.date.getMonth()].count++; });
  ins.forEach(function (t) { months[t.date.getMonth()].income += t.amount; });
  var active = months.filter(function (x) { return x.spent > 0; });
  var top = active.slice().sort(function (a, b) { return b.spent - a.spent; })[0] || null;
  var low = active.slice().sort(function (a, b) { return a.spent - b.spent; })[0] || null;

  var groups = { need: 0, want: 0, other: 0 }, byCat = {}, merchants = {}, byAcct = {}, days = {};
  var biggest = null;
  outs.forEach(function (t) {
    var g = groupOfCategory_(t.category);
    if (g === GROUP.NEED) groups.need += t.amount; else if (g === GROUP.WANT) groups.want += t.amount; else groups.other += t.amount;
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    byAcct[t.account] = (byAcct[t.account] || 0) + t.amount;
    days[ymd_(t.date)] = true;
    var k = t.merchant || t.description;
    if (!merchants[k]) merchants[k] = { name: k, amount: 0, count: 0 };
    merchants[k].amount += t.amount; merchants[k].count++;
    if (!biggest || t.amount > biggest.amount) biggest = t;
  });
  var cats = Object.keys(byCat).map(function (name) {
    var c = categoryByName_(name);
    return { name: name, key: c ? c.key : keyForCategoryName_(name), color: c ? c.color : '#5F646C', amount: byCat[name], pct: spent ? Math.round(byCat[name] / spent * 100) : 0 };
  }).sort(function (a, b) { return b.amount - a.amount; });
  var mlist = Object.keys(merchants).map(function (k) { return merchants[k]; });
  var auto = rows.filter(function (t) { return t.source === 'email'; }).length;

  var saved = 0;
  try {
    rows_(SHEET.DEPOSITS).forEach(function (d) {
      var dd = toDate_(d.Date);
      if (dd && dd >= start && dd < end && d.Source !== 'initial') saved += Number(d.Amount) || 0;
    });
  } catch (e) {}

  var monthsElapsed = y < now.getFullYear() ? 12 : y > now.getFullYear() ? 0 : now.getMonth() + 1;
  return {
    year: y,
    years: Object.keys(years).map(Number).sort(),
    isCurrent: y === now.getFullYear(),
    spent: spent,
    income: income,
    leftover: income - spent,
    savingRate: income > 0 ? Math.round((income - spent) / income * 100) : null,
    avgPerMonth: Math.round(spent / Math.max(1, active.length)),
    monthsElapsed: monthsElapsed,
    months: months,
    topMonth: top, lowMonth: low,
    groups: groups,
    cats: cats.slice(0, 8),
    merchants: mlist.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 5),
    frequent: mlist.slice().sort(function (a, b) { return b.count - a.count; })[0] || null,
    biggest: biggest ? { description: biggest.description, amount: biggest.amount, date: biggest.date, category: biggest.category, account: biggest.account } : null,
    accounts: Object.keys(byAcct).map(function (k) { return { name: k, amount: byAcct[k] }; }).sort(function (a, b) { return b.amount - a.amount; }),
    count: rows.length,
    autoCount: auto,
    manualCount: rows.length - auto,
    minutesSaved: auto,
    spendDays: Object.keys(days).length,
    goalSaved: saved
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

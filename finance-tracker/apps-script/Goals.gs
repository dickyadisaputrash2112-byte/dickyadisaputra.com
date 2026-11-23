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

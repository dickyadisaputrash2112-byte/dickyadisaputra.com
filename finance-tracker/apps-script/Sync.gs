// ============================================================
// Sync.gs — Satu-satunya mesin sinkronisasi Gmail
// Dipanggil oleh pemicu tiap 15 menit dan tombol sinkron di aplikasi.
// ============================================================

function processedMap_() {
  var map = {};
  var t = table_(SHEET.PROCESSED);
  var j = t.idx.EmailID;
  t.rows.forEach(function (r) { if (r[j]) map[String(r[j])] = true; });
  // Email yang sudah jadi transaksi juga dilewati, walaupun catatan ProcessedEmails-nya sudah terpangkas.
  txRows_().forEach(function (x) { if (x.emailId) map[x.emailId] = true; });
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

// Satu jendela pencarian Gmail [from, to). Mengembalikan true kalau selesai, false kalau terpotong batas waktu/jumlah.
function syncWindow_(from, to, run) {
  var tz = Session.getScriptTimeZone();
  var q = senderQuery_() + ' after:' + Utilities.formatDate(new Date(from.getTime() - 86400000), tz, 'yyyy/MM/dd') +
    (to ? ' before:' + Utilities.formatDate(new Date(to.getTime() + 86400000), tz, 'yyyy/MM/dd') : '') + ' -in:spam -in:trash';
  var start = 0;
  while (true) {
    var threads = GmailApp.search(q, start, SYNC_CONFIG.searchBatch);
    if (!threads.length) return true;
    run.stats.threads += threads.length;
    for (var i = 0; i < threads.length; i++) {
      var msgs = threads[i].getMessages();
      for (var j = 0; j < msgs.length; j++) {
        var d = msgs[j].getDate();
        if (d < from || (to && d >= to)) continue;
        processMessage_(msgs[j], run.processed, run.ctx, run.stats);
        if (run.stats.messages >= SYNC_CONFIG.maxMessagesPerRun || Date.now() > run.deadline) return false;
      }
    }
    if (threads.length < SYNC_CONFIG.searchBatch) return true;
    start += threads.length;
  }
}

// Riwayat: mundur per 30 hari sampai batas versi (Standard 90 hari, Pro 1 tahun, Premium 5 tahun
// sebelum tanggal pemasangan), supaya Rekap tahunan terisi.
function backfillState_() {
  var p = PropertiesService.getScriptProperties();
  var target = historyTarget_();
  var cursor = p.getProperty(SYNC_CONFIG.backfillCursorProp);
  return {
    target: target,
    cursor: cursor ? new Date(cursor) : null,
    done: !!(cursor && new Date(cursor) <= target)
  };
}

function backfillStep_(run) {
  var p = PropertiesService.getScriptProperties();
  var st = backfillState_();
  if (!st.cursor) st.cursor = new Date(Date.now() - (Number(settings_().initialDaysBack) || 30) * 86400000);
  while (st.cursor > st.target && Date.now() < run.deadline && run.stats.messages < SYNC_CONFIG.maxMessagesPerRun) {
    var from = new Date(Math.max(st.target.getTime(), st.cursor.getTime() - 30 * 86400000));
    if (!syncWindow_(from, st.cursor, run)) break;
    st.cursor = from;
    p.setProperty(SYNC_CONFIG.backfillCursorProp, st.cursor.toISOString());
  }
  if (!p.getProperty(SYNC_CONFIG.backfillCursorProp)) p.setProperty(SYNC_CONFIG.backfillCursorProp, st.cursor.toISOString());
  run.stats.backfill = backfillInfo_();
}

function backfillInfo_() {
  var st = backfillState_();
  return { target: st.target ? st.target.toISOString() : '', cursor: st.cursor ? st.cursor.toISOString() : '', done: st.done };
}

// opts.daysBack: paksa jangkauan hari (dipakai sinkron pertama)
// opts.historyOnly: hanya lanjutkan pengambilan riwayat
function syncTransactions(opts) {
  opts = opts || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, message: 'Sinkronisasi lain sedang berjalan.' };
  var props = PropertiesService.getScriptProperties();
  var stats = { threads: 0, messages: 0, saved: 0, review: 0, skipped: 0, errors: 0, byAccount: {} };
  var run = { stats: stats, processed: processedMap_(), ctx: syncContext_(), deadline: Date.now() + SYNC_CONFIG.maxRunMs };
  try {
    if (!opts.historyOnly) {
      var last = props.getProperty(SYNC_CONFIG.lastSyncProp);
      var after;
      if (opts.daysBack) after = new Date(Date.now() - Number(opts.daysBack) * 86400000);
      else if (last) after = new Date(new Date(last).getTime() - 2 * 86400000);
      else after = new Date(Date.now() - (Number(settings_().initialDaysBack) || 30) * 86400000);
      var began = new Date();
      // Kalau terpotong, jangan majukan penanda: sisanya diambil di putaran berikutnya.
      if (syncWindow_(after, null, run)) props.setProperty(SYNC_CONFIG.lastSyncProp, began.toISOString());
    }
    // Sinkron pertama (daysBack) dibuat cepat; riwayat diambil di putaran berikutnya.
    // Dari pemicu otomatis: paling sering sejam sekali, maksimal 3 menit, supaya kuota harian Google aman.
    var lastHist = Number(props.getProperty('CATAT_HISTORY_LAST_RUN') || 0);
    if (opts.daysBack || backfillState_().done) stats.backfill = backfillInfo_();
    else if (opts.fromTrigger && Date.now() - lastHist < 55 * 60000) stats.backfill = backfillInfo_();
    else {
      if (opts.fromTrigger) run.deadline = Math.min(run.deadline, Date.now() + 3 * 60000);
      props.setProperty('CATAT_HISTORY_LAST_RUN', String(Date.now()));
      backfillStep_(run);
    }

    var message = 'Pesan ' + stats.messages + ', tersimpan ' + stats.saved + ', perlu dicek ' + stats.review + ', error ' + stats.errors + '.';
    if (stats.saved || stats.errors) {
      append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: stats.errors ? 'PARTIAL' : 'SUCCESS', Message: message, ThreadsScanned: stats.threads, MessagesScanned: stats.messages, MessagesParsed: stats.saved, MessagesSkipped: stats.skipped, TransactionsSaved: stats.saved, Errors: stats.errors });
    }
    trimSheet_(SHEET.SYNC_LOGS, SYNC_CONFIG.keepSyncLogRows);
    trimSheet_(SHEET.PARSER_LOGS, SYNC_CONFIG.keepParserLogRows);
    trimSheet_(SHEET.PROCESSED, SYNC_CONFIG.keepProcessedRows);
    stats.ok = true;
    stats.message = message;
    stats.lastSync = props.getProperty(SYNC_CONFIG.lastSyncProp) || '';
    return stats;
  } catch (e) {
    try { append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: 'ERROR', Message: e.message }); } catch (e2) {}
    return { ok: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

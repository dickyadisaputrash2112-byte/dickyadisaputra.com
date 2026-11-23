// ============================================================
// Sync.gs — Satu-satunya mesin sinkronisasi Gmail
// Dipanggil oleh pemicu tiap 15 menit dan tombol sinkron di aplikasi.
// ============================================================

function processedMap_() {
  var map = {};
  var t = table_(SHEET.PROCESSED);
  var j = t.idx.EmailID;
  t.rows.forEach(function (r) { if (r[j]) map[String(r[j])] = true; });
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

// opts.daysBack: paksa jangkauan hari (dipakai sinkron pertama)
function syncTransactions(opts) {
  opts = opts || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, message: 'Sinkronisasi lain sedang berjalan.' };
  var props = PropertiesService.getScriptProperties();
  var stats = { threads: 0, messages: 0, saved: 0, review: 0, skipped: 0, errors: 0, byAccount: {} };
  try {
    var last = props.getProperty(SYNC_CONFIG.lastSyncProp);
    var after;
    if (opts.daysBack) after = new Date(Date.now() - Number(opts.daysBack) * 86400000);
    else if (last) after = new Date(new Date(last).getTime() - 2 * 86400000);
    else after = new Date(Date.now() - (Number(settings_().initialDaysBack) || 30) * 86400000);

    var query = senderQuery_() + ' after:' + Utilities.formatDate(after, Session.getScriptTimeZone(), 'yyyy/MM/dd') + ' -in:spam -in:trash';
    var processed = processedMap_();
    var ctx = syncContext_();
    var start = 0, done = false, started = Date.now();

    while (!done) {
      var threads = GmailApp.search(query, start, SYNC_CONFIG.searchBatch);
      if (!threads.length) break;
      stats.threads += threads.length;
      for (var i = 0; i < threads.length && !done; i++) {
        var msgs = threads[i].getMessages();
        for (var j = 0; j < msgs.length; j++) {
          if (msgs[j].getDate() < after) continue;
          processMessage_(msgs[j], processed, ctx, stats);
          if (stats.messages >= SYNC_CONFIG.maxMessagesPerRun || Date.now() - started > 4 * 60 * 1000) { done = true; break; }
        }
      }
      if (threads.length < SYNC_CONFIG.searchBatch) break;
      start += threads.length;
    }

    props.setProperty(SYNC_CONFIG.lastSyncProp, new Date().toISOString());
    var message = 'Pesan ' + stats.messages + ', tersimpan ' + stats.saved + ', perlu dicek ' + stats.review + ', error ' + stats.errors + '.';
    if (stats.saved || stats.errors) {
      append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: stats.errors ? 'PARTIAL' : 'SUCCESS', Message: message, ThreadsScanned: stats.threads, MessagesScanned: stats.messages, MessagesParsed: stats.saved, MessagesSkipped: stats.skipped, TransactionsSaved: stats.saved, Errors: stats.errors });
    }
    trimSheet_(SHEET.SYNC_LOGS, SYNC_CONFIG.keepSyncLogRows);
    trimSheet_(SHEET.PARSER_LOGS, SYNC_CONFIG.keepParserLogRows);
    trimSheet_(SHEET.PROCESSED, SYNC_CONFIG.keepProcessedRows);
    stats.ok = true;
    stats.message = message;
    stats.lastSync = new Date().toISOString();
    return stats;
  } catch (e) {
    try { append_(SHEET.SYNC_LOGS, { Timestamp: new Date(), Status: 'ERROR', Message: e.message }); } catch (e2) {}
    return { ok: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

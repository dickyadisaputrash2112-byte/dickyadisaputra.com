// ============================================================
// Migration.gs — Membersihkan data dari versi lama
// Jalankan lewat menu Jejak → "Bersihkan data lama — pratinjau" dulu.
// ============================================================

function cleanupLegacy(dryRun) {
  var owners = ownerList_();
  var accts = accountNames_();
  var res = { dryRun: !!dryRun, gopaySummary: 0, junkDates: 0, incomingFix: 0, ownTransfer: 0, topupFix: 0, adminFee: 0, ownersSet: owners.length > 0 };
  var del = [], upd = [];
  var feeName = catName_('fee'), transferName = catName_('transfer'), incomeName = catName_('income_other');

  rows_(SHEET.TX).forEach(function (r) {
    var d = toDate_(r.Date);
    var desc = String(r.Description || '');
    var type = normType_(r.Type);

    if (/^ini total pengeluaranmu/i.test(desc)) { del.push(r._row); res.gopaySummary++; return; }
    if (!d || d.getFullYear() < 2020) { del.push(r._row); res.junkDates++; return; }

    var m = desc.match(/transfer dari\s+(.+?)\s+(udah|sudah|telah)\s+masuk/i);
    if (m && type === TYPE.OUT) {
      if (isOwnerText_(m[1], owners)) upd.push([r._row, { Type: TYPE.TR, Account: 'Rekening sendiri', ToAccount: r.Account, Category: transferName }]);
      else upd.push([r._row, { Type: TYPE.IN, Category: incomeName, Merchant: '' }]);
      res.incomingFix++;
      return;
    }
    if (type === TYPE.OUT && owners.length && isOwnerText_(desc + ' ' + (r.Merchant || ''), owners)) {
      var other = detectAccountName_(desc, accts);
      upd.push([r._row, { Type: TYPE.TR, ToAccount: other && other !== r.Account ? other : 'Rekening sendiri', Category: transferName }]);
      res.ownTransfer++;
      return;
    }
    if (/pembelian saldo e-?wallet/i.test(desc) && type === TYPE.IN) {
      upd.push([r._row, { Type: TYPE.TR, ToAccount: detectEwallet_(desc) || 'E-wallet', Category: transferName }]);
      res.topupFix++;
      return;
    }
    if (String(r.Category || '').toLowerCase() === 'admin fee' && feeName.toLowerCase() !== 'admin fee') {
      upd.push([r._row, { Category: feeName }]);
      res.adminFee++;
    }
  });

  if (!dryRun) {
    upd.forEach(function (u) { update_(SHEET.TX, u[0], u[1]); });
    var sh = table_(SHEET.TX).sheet;
    del.sort(function (a, b) { return b - a; }).forEach(function (row) { sh.deleteRow(row); });
    invalidate_(SHEET.TX);
    delete _DB.tx;
  }
  return res;
}

function cleanupSummary_(r) {
  return [
    '• Email rekap bulanan GoPay yang tercatat dobel: ' + r.gopaySummary + ' baris dihapus',
    '• Transaksi bertanggal rusak (sebelum 2020): ' + r.junkDates + ' baris dihapus',
    '• Uang masuk yang tercatat sebagai pengeluaran: ' + r.incomingFix + ' diperbaiki',
    '• Transfer ke rekening sendiri: ' + r.ownTransfer + ' diubah jadi Transfer' + (r.ownersSet ? '' : ' (isi "Nama di rekening" dulu di aplikasi)'),
    '• Top-up e-wallet yang tercatat sebagai pemasukan: ' + r.topupFix + ' diperbaiki',
    '• Kategori "Admin Fee" diseragamkan: ' + r.adminFee
  ].join('\n');
}

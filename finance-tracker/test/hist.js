// Uji riwayat: email tersebar Jan–Nov, sinkron pertama 30 hari, lalu riwayat diambil sampai 1 Januari.
const { create, msg } = require('./gas');
const now = new Date();
const msgs = [];
for (let mo = 0; mo <= now.getMonth(); mo++) for (let k = 0; k < 40; k++) {
  const dt = new Date(now.getFullYear(), mo, 1 + (k % 27), 10, k);
  if (dt > now) continue;
  msgs.push(msg('h' + mo + '-' + k, 'Bank Jago <noreply@jago.com>', 'Kamu telah membayar ke Toko ' + k, `Ke\nToko ${k}\nJumlah\nRp${(10000 + k * 1000).toLocaleString('id-ID')}`, dt));
}
msgs.sort((a, b) => b.getDate() - a.getDate());
const g = create({});
// Gmail tiruan yang menghormati after:/before:
g.GmailApp.search = (q, start, max) => {
  const a = q.match(/after:(\d{4})\/(\d{2})\/(\d{2})/), b = q.match(/before:(\d{4})\/(\d{2})\/(\d{2})/);
  const from = a ? new Date(+a[1], a[2] - 1, +a[3]) : new Date(0), to = b ? new Date(+b[1], b[2] - 1, +b[3]) : new Date(8e15);
  const hit = msgs.filter(m => m.getDate() >= from && m.getDate() < to);
  return hit.slice(start, start + max).map(m => ({ getMessages: () => [m] }));
};
g.setupApp(); if (process.env.CAP) g.SYNC_CONFIG.maxMessagesPerRun = Number(process.env.CAP);
let r = g.api('sync', { daysBack: 30 }); console.log(JSON.stringify(r).slice(0,300)); r = r.data;
console.log('first', r.saved, JSON.stringify(r.backfill));
let n = 0;
do { r = g.api('sync', { historyOnly: true }).data; n++; console.log('hist run', n, r.saved, r.backfill.cursor.slice(0, 10), r.backfill.done); } while (!r.backfill.done && n < 20);
const y = g.api('year', {}).data;
console.log('year months with spend:', y.months.filter(m => m.spent).length, 'count', y.count, 'expected', msgs.length);
r = g.api('sync', {}).data; console.log('normal after done: saved', r.saved, 'done', r.backfill.done);
// trigger throttle
r = g.syncTransactions({ fromTrigger: true }); console.log('trigger ok', r.ok);

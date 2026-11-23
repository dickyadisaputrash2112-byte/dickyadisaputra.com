const { create, msg, mkCode } = require('./gas');
const now = new Date();
const d = (daysAgo, h = 12) => { const x = new Date(now); x.setDate(x.getDate() - daysAgo); x.setHours(h, 15, 0, 0); return x; };
const fmt = x => `${x.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][x.getMonth()]} ${x.getFullYear()} ${String(x.getHours()).padStart(2,'0')}:${String(x.getMinutes()).padStart(2,'0')} WIB`;
const M = [
  msg('m1', 'Livin by Mandiri <noreply.livin@bankmandiri.co.id>', 'Pembayaran Berhasil', `Pembayaran Berhasil\nPenerima :\nMIE GACOAN\nJAKARTA\nTanggal\n${fmt(d(1,19))}\nNominal Transaksi\nRp 52.000,00\nSumber Dana\nDICKY ADISAPUTRA`, d(1,19)),
  msg('m2', 'Livin by Mandiri <noreply.livin@bankmandiri.co.id>', 'Top-up Berhasil', `Top-up Berhasil\nPenyedia Jasa\nGoPay\nNominal Top-up\nRp 100.000,00\nBiaya Transaksi\nRp 1.000,00\nTotal Transaksi\nRp 101.000,00\nTanggal ${fmt(d(2))}`, d(2)),
  msg('m3', 'Bank Jago <noreply@jago.com>', 'Kamu menerima uang 💰', `Kamu menerima transfer\nDari\nPT MAJU JAYA\nBCA 1234567\nJumlah\nRp7.500.000\nTanggal Transaksi\n${fmt(d(3,9))}`, d(3,9)),
  msg('m4', 'Bank Jago <noreply@jago.com>', 'Kamu telah membayar ke Kopi Kenangan ☕', `Ke\nKopi Kenangan\nJumlah\nRp27.500\nTanggal Transaksi\n${fmt(d(0,8))}`, d(0,8)),
  msg('m5', 'Bank Jago <noreply@jago.com>', 'Transfer ke DICKY ADISAPUTRA berhasil', `Ke\nDICKY ADISAPUTRA\nBank Syariah Indonesia 7788\nJumlah\nRp1.000.000\nTanggal Transaksi\n${fmt(d(2,10))}`, d(2,10)),
  msg('m6', 'BCA <bca@bca.co.id>', 'Transaksi QRIS Berhasil', `Transaksi QRIS berhasil\nNama Merchant : WARTEG BAHARI\nNominal : IDR 24,000.00\nTanggal: ${fmt(d(0,12))}`, d(0,12)),
  msg('m7', 'GoPay <no-reply@gopay.co.id>', 'Ini total pengeluaranmu di bulan Oktober', `Total pengeluaranmu bulan ini Rp2.000.000`, d(5)),
  msg('m8', 'Gojek <no-reply@gojek.com>', 'Pesanan GoFood kamu', `Rincian pesanan\nDiantarkan jam 13:00 dari 'Ayam Geprek Bensu'\nTotal dibayar Rp45.000`, d(1,13)),
  msg('m9', 'BCA <bca@bca.co.id>', 'Promo spesial 50% cashback', `Diskon hingga 50%`, d(1)),
  msg('m10','Superbank <hello@superbank.id>', 'Transfer masuk', `Transfer dari BUDI SANTOSO udah masuk ke rekening kamu sebesar Rp250.000`, d(4)),
];
const g = create({ threads: [M] });
const call = (a, p) => { const r = g.api(a, p); if (!r.ok) throw new Error(a + ': ' + r.error); return r.data; };
g.onOpen(); console.log('start sheet', g._sheets['Mulai di sini']._data.length); g.setupApp();
call('activate', { code: mkCode('PRM', 'TEST') });
let b = call('bootstrap');
console.log('boot', b.onboarded, b.accounts.length, b.categories.length, b.catalog.length);
call('saveOnboarding', { nickname: 'Dicky', ownerNames: ['DICKY ADISAPUTRA'], sources: ['Mandiri','Jago','BCA','GoPay','Superbank','BSI','Tunai'], expectedIncome: 8000000, alloc: { need: 50, want: 20, save: 30 }, trackIncome: true, weeklyReviewEnabled: true });
call('setPin', { pin: '123456' });
console.log('verify', call('verifyPin', { pin: '123456' }), call('verifyPin', { pin: '000000' }));
const s = call('sync', { daysBack: 30 });
console.log('sync', JSON.stringify(s));
console.log('query', g._lastQuery);
const tx = call('transactions', { filter: 'all', limit: 50 });
tx.items.forEach(t => console.log(' ', t.date.slice(0,16), t.type.padEnd(8), t.status.padEnd(6), String(t.amount).padStart(8), t.account, '→', t.toAccount, '|', t.description, '|', t.category));
console.log('second sync', JSON.stringify(call('sync', {})).slice(0, 120));
const h = call('home', {}); console.log('home', JSON.stringify(h).slice(0, 600));
const rv = call('transactions', { filter: 'review' }); console.log('review count', rv.items.length, rv.reviewCount);
call('resolveReview', { id: rv.items[0].id, action: 'ok', category: 'Makan' });
const one = call('transaction', { id: tx.items.find(t => t.description.includes('Kopi')).id }); console.log('one', JSON.stringify(one));
const up = call('updateTransaction', { id: one.id, category: 'kopi & jajan', remember: true }); console.log('upd', JSON.stringify(up));
call('addTransaction', { amount: 25000, type: 'Expense', description: 'Nasi goreng', merchant: 'Nasi goreng', account: 'Tunai', category: '', date: new Date().toISOString() });
console.log('insight', JSON.stringify(call('insight', {})).slice(0, 500));
const goal = call('saveGoal', { name: 'Dana darurat', target: 20000000, current: 2000000, deadline: new Date(2027, 11, 31).toISOString(), linkedAccount: 'BSI', icon: 'shield', color: '#2E55B0' });
console.log('goal', JSON.stringify(goal).slice(0, 300));
const gl = call('goals', {}); console.log('goals', gl.length, gl[0].current, gl[0].monthly, gl[0].onTrack);
call('addDeposit', { goalId: gl[0].id, amount: 500000, note: 'bonus' });
console.log('goal1', JSON.stringify(call('goal', { id: gl[0].id })).slice(0, 400));
console.log('alloc', JSON.stringify(call('allocation', {})).slice(0, 800));
call('saveAllocation', { need: 60, want: 20, save: 20, expectedIncome: 9000000, budgets: { 'Makan': 1500000 } });
console.log('alloc2 pct', JSON.stringify(call('allocation', {}).pct));
console.log('sources', JSON.stringify(call('sources', {})).slice(0, 300));
call('saveProfile', { nickname: 'Dik', ownerNames: ['DICKY ADISAPUTRA', 'DICKY A'] });
call('saveSettings', { trackIncome: false });
call('saveSources', { sources: ['Mandiri', 'Jago', 'Tunai'] });
console.log('boot2', JSON.stringify(call('bootstrap')).slice(0, 300));
console.log('cleanup', JSON.stringify(g.cleanupLegacy(true)));
g.sendWeeklyReview_(); console.log('mail', g._sent.length, g._sent[0] && g._sent[0].subject);
console.log('del', JSON.stringify(call('deleteTransaction', { id: one.id })));
console.log('triggers', g._triggers.map(t => t._h));
console.log('sheets', Object.keys(g._sheets).map(k => k + ':' + g._sheets[k]._data.length).join(' '));
try { call('updateTransaction', { id: tx.items[0].id, category: 'Ngawur' }); } catch (e) { console.log('validated:', e.message); }
console.log(JSON.stringify(call('allocation', {}).groups.map(g => [g.key, g.items.map(i => i.name + ':' + i.budget + ':' + i.used)])));
console.log('goal thisMonth', call('goals', {})[0].thisMonth);

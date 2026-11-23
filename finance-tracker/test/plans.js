// Uji versi & kode aktivasi
const crypto = require('crypto');
const { create } = require('./gas');
const SALT = 'lk_ebca9e5136b56b261215e187', A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const mk = (pre, body) => pre + '-' + body + '-' + [...crypto.createHash('sha256').update(SALT + '|' + pre + '|' + body).digest().slice(0, 4)].map(b => A[b % 32]).join('');
const g = create({}); g.setupApp();
const call = (a, p) => g.api(a, p);
console.log('default', JSON.stringify(call('bootstrap').data.plan));
console.log('goals locked', JSON.stringify(call('goals', {})));
console.log('bad code', JSON.stringify(call('activate', { code: 'PRO-AAAA-BBBB' })));
console.log('pro', JSON.stringify(call('activate', { code: mk('PRO', 'K7QM').toLowerCase() }).data.plan));
console.log('goals still locked', call('goals', {}).ok);
console.log('history target pro', g.historyTarget_().toISOString().slice(0, 10));
console.log('downgrade', JSON.stringify(call('activate', { code: mk('STD', 'AB2C') })));
console.log('premium', JSON.stringify(call('activate', { code: mk('PRM', 'Z9X8') }).data.plan));
console.log('goals ok', call('goals', {}).ok, call('saveGoal', { name: 'Dana', target: 1000000 }).ok);
console.log('history target premium', g.historyTarget_().toISOString().slice(0, 10));

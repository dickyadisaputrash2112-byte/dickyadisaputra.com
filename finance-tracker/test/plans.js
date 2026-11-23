// Uji versi Gold/Platinum/Diamond & kode aktivasi
const { create, mkCode: mk } = require('./gas');
const g = create({}); g.setupApp();
const call = (a, p) => g.api(a, p);
const msg = r => r.ok ? r.data.plan.name : r.error;
console.log('default', JSON.stringify(call('bootstrap').data.plan));
console.log('goals locked:', call('goals', {}).error, '| alloc locked:', call('allocation', {}).error);
console.log('home budget gold:', call('home', {}).data.budget);
console.log('bad code:', msg(call('activate', { code: 'PLT-AAAA-BBBB' })));
console.log('DUP on gold:', msg(call('activate', { code: mk('DUP', 'AAAA') })));
console.log('PLT on gold:', msg(call('activate', { code: mk('PLT', 'K7QM') })));
console.log('upgrades platinum:', JSON.stringify(call('bootstrap').data.plan.upgrades));
console.log('PLT again:', msg(call('activate', { code: mk('PLT', 'K7QN') })));
console.log('DUP on platinum:', msg(call('activate', { code: mk('DUP', 'Z9X8') })));
console.log('goals ok', call('goals', {}).ok, 'alloc ok', call('allocation', {}).ok);
const g2 = create({}); g2.setupApp();
console.log('DMD on gold:', g2.api('activate', { code: mk('DMD', 'Q2W3') }).data.plan.name);
// Template master: salinan pembeli langsung Platinum / Diamond
for (const [pre, body] of [['PLT', 'MAST'], ['DMD', 'MAST']]) {
  const master = create({}); master.activatePlan_(mk(pre, body));
  const copy = create({}); copy._sheets['_lisensi'] = master._sheets['_lisensi'];
  console.log('template', pre, '→ copy plan:', copy.plan_().name, '| upgrades:', JSON.stringify(copy.planInfo_().upgrades.map(u => u.name + ' ' + u.price)));
}
// Kode bocor dicabut
const g3 = create({}); g3.REVOKED_CODES.push(mk('PLT', 'LEAK')); g3.setupApp();
console.log('revoked:', msg(g3.api('activate', { code: mk('PLT', 'LEAK') })));

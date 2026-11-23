// Menggabungkan kode menjadi 3 file siap tempel di finance-tracker/dist:
//   Code.gs (semua .gs), Index.html (Styles + App di dalamnya), appsscript.json
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'apps-script'), out = path.join(__dirname, '..', 'dist');
fs.mkdirSync(out, { recursive: true });
const order = ['Config', 'Db', 'Parsers', 'Transactions', 'Goals', 'Insights', 'Sync', 'Api', 'Code', 'Migration'];
const all = fs.readdirSync(src).filter(f => f.endsWith('.gs')).map(f => f.slice(0, -3));
const missing = all.filter(n => !order.includes(n));
if (missing.length) throw new Error('Tambahkan ke urutan build: ' + missing.join(', '));
const version = (fs.readFileSync(path.join(src, 'Config.gs'), 'utf8').match(/version:\s*'([^']+)'/) || [])[1];
const head = `// catat.id v${version} — © 2026 Dicky Adisaputra. Hak cipta dilindungi. Dilarang menjual ulang atau membagikan tanpa izin.\n// Satu file. Jangan diubah manual; dibuat oleh finance-tracker/tools/build.js\n`;
fs.writeFileSync(path.join(out, 'Code.gs'), head + order.map(n => fs.readFileSync(path.join(src, n + '.gs'), 'utf8')).join('\n\n'));
let html = fs.readFileSync(path.join(src, 'Index.html'), 'utf8');
html = html.replace(/<\?!= include\('(\w+)'\); \?>/g, (_, n) => fs.readFileSync(path.join(src, n + '.html'), 'utf8'));
if (/<\?/.test(html)) throw new Error('Masih ada scriptlet di Index.html');
fs.writeFileSync(path.join(out, 'Index.html'), `<!-- catat.id v${version} — © 2026 Dicky Adisaputra. Hak cipta dilindungi. -->\n` + html);
fs.copyFileSync(path.join(src, 'appsscript.json'), path.join(out, 'appsscript.json'));
console.log('dist siap: Code.gs, Index.html, appsscript.json (v' + version + ')');

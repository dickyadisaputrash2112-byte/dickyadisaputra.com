const http = require('http'), fs = require('fs');
const { create, msg, mkCode } = require('./gas');
const SRC = require('path').join(__dirname, '..', process.env.DIST ? 'dist' : 'apps-script') + '/';
const now = new Date();
const d = (a, h = 12) => { const x = new Date(now); x.setDate(x.getDate() - a); x.setHours(h, 15, 0, 0); return x; };
const fmt = x => `${x.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][x.getMonth()]} ${x.getFullYear()} ${String(x.getHours()).padStart(2,'0')}:${String(x.getMinutes()).padStart(2,'0')} WIB`;
const M = [];
let i = 0;
const add = (from, subj, body, dt) => M.push(msg('e' + (i++), from, subj, body, dt));
const merchants = [['Kopi Kenangan',27500,'Jago'],['MIE GACOAN',52000,'Mandiri'],['Indomaret',86400,'Mandiri'],['Grab',23000,'Jago'],['Netflix',54000,'Jago'],['PLN Prabayar',200000,'Mandiri'],['Tokopedia',189000,'Jago'],['Warteg Bahari',24000,'Mandiri']];
for (let k = 0; k < 22; k++) { const m = merchants[k % merchants.length]; const dt = d(k, 8 + (k % 10)); 
  if (m[2] === 'Mandiri') add('Livin <noreply.livin@bankmandiri.co.id>', 'Pembayaran Berhasil', `Penerima :\n${m[0]}\nJAKARTA\nTanggal\n${fmt(dt)}\nNominal Transaksi\nRp ${m[1].toLocaleString('id-ID')},00`, dt);
  else add('Bank Jago <noreply@jago.com>', 'Kamu telah membayar ke ' + m[0], `Ke\n${m[0]}\nJumlah\nRp${m[1].toLocaleString('id-ID')}\nTanggal Transaksi\n${fmt(dt)}`, dt); }
add('Bank Jago <noreply@jago.com>', 'Kamu menerima uang', `Kamu menerima transfer\nDari\nPT MAJU JAYA\nJumlah\nRp7.500.000\nTanggal Transaksi\n${fmt(d(20,9))}`, d(20,9));
add('BCA <bca@bca.co.id>', 'Transaksi QRIS Berhasil', `Transaksi QRIS berhasil\nNama Merchant : SATE KHAS SENAYAN\nNominal : IDR 135,000.00\nTanggal: ${fmt(d(0,13))}`, d(0,13));
add('BCA <bca@bca.co.id>', 'Transaksi Berhasil', `Transfer berhasil\nPenerima : ANDI WIJAYA\nNominal : IDR 300,000.00`, d(1,16));
const g = create({ threads: [M] });
g.onOpen();
// Riwayat Jan–Okt supaya rekap tahunan punya isi (tercatat sebagai transaksi email)
if (!process.env.NO_HISTORY) {
  g.ensureSetup_();
  const hist = [['Kopi Kenangan', 27500, 'Jago'], ['Indomaret', 86400, 'Mandiri'], ['Grab', 23000, 'Jago'], ['PLN Prabayar', 200000, 'Mandiri'], ['Tokopedia', 189000, 'Jago'], ['Mie Gacoan', 52000, 'Mandiri']];
  const year = now.getFullYear();
  for (let mo = 0; mo < now.getMonth(); mo++) {
    g.addTransaction({ date: new Date(year, mo, 1, 9), description: 'Transfer masuk · PT MAJU JAYA', amount: 7500000, type: 'Income', account: 'Jago', source: 'email', emailId: 'h-in-' + mo });
    const n = 14 + (mo * 7) % 11;
    for (let k = 0; k < n; k++) {
      const m = hist[(k + mo) % hist.length];
      g.addTransaction({ date: new Date(year, mo, 1 + (k * 2) % 27, 12), description: m[0], merchant: m[0], amount: Math.round(m[1] * (0.8 + ((k * mo) % 7) / 10)), type: 'Expense', account: m[2], source: 'email', emailId: 'h-' + mo + '-' + k });
    }
  }
}
const server = http.createServer((req, res) => {
  if (req.url === '/__code') { res.end(JSON.stringify({ code: mkCode('DMD', 'DEMA'), dup: mkCode('DUP', 'DEMA') })); return; }
  if (req.url === '/__mail') { res.end(JSON.stringify(g._sent[g._sent.length - 1] || {})); return; }
  if (req.url === '/api') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      const { action, payload } = JSON.parse(body);
      const r = g.api(action, payload);
      setTimeout(() => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(r)); }, 60);
    });
    return;
  }
  let html = fs.readFileSync(SRC + 'Index.html', 'utf8');
  html = html.replace(/<\?!= include\('(\w+)'\); \?>/g, (_, n) => fs.readFileSync(SRC + n + '.html', 'utf8'));
  const shim = `<script>window.google={script:{get run(){var s,f;var o={withSuccessHandler:function(x){s=x;return o},withFailureHandler:function(x){f=x;return o},api:function(a,p){fetch('/api',{method:'POST',body:JSON.stringify({action:a,payload:p})}).then(function(r){return r.json()}).then(s).catch(f)}};return o}}};window.__errors=[];window.addEventListener('error',function(e){window.__errors.push(e.message)});</script>`;
  html = html.replace('<body>', '<body>' + shim);
  res.setHeader('content-type', 'text/html'); res.end(html);
});
server.listen(8765, () => console.log('listening'));

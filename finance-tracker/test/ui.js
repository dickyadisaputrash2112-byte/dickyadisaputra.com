const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Jakarta' });
  const errs = [];
  // Di sandbox tes internet ditutup: logo bank diganti gambar contoh supaya tata letaknya bisa dicek.
  // Sumber lain (font Google) diabaikan.
  await p.route('**/s2/favicons**', r => r.fulfill({ path: __dirname + '/fake-logo.png', contentType: 'image/png' }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  const shot = async n => { await p.waitForTimeout(350); await p.screenshot({ path: __dirname + `/shots/${n}.png`, fullPage: true }); };
  const click = async sel => { await p.click(sel); await p.waitForTimeout(250); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(800);
  await shot('01-intro1'); await click('[data-act=introNext]'); await shot('02-intro2'); await click('[data-act=introNext]'); await shot('03-intro3');
  await click('[data-act=introDone]');
  await p.fill('#ob-nick', 'Dicky'); await p.fill('#ob-owner', 'DICKY ADISAPUTRA'); await p.press('#ob-owner', 'Enter');
  await shot('04-ob-name'); await click('[data-act=obNext]');
  for (const s of ['Mandiri', 'Jago', 'BCA']) await click(`[data-act=srcToggle][data-v="${s}"]`);
  await shot('05-ob-src'); await click('[data-act=obNext]');
  await p.fill('#ob-income', '8000000'); await shot('06-ob-income'); await click('[data-act=obNext]');
  for (const k of '123456') await click(`[data-act=pinKey][data-v="${k}"]`);
  await p.waitForTimeout(300);
  for (const k of '123456') await click(`[data-act=pinKey][data-v="${k}"]`);
  await p.waitForTimeout(400); await shot('07-sync-running'); await p.waitForSelector('[data-act=home]', { timeout: 15000 }); await shot('08-sync-done');
  await click('[data-act=home]'); await p.waitForTimeout(800); await shot('09-home');
  await click('.navy-card[data-act=review]'); await p.waitForTimeout(600); await shot('10-review');
  await click('[data-act=reviewCat]'); await click('[data-act=reviewSave]'); await p.waitForTimeout(500); await shot('11-review2');
  await click('[data-act=reviewSelf]'); await p.waitForTimeout(500); await shot('12-review-done'); await click('[data-act=home]'); await p.waitForTimeout(600);
  await click('[data-act=go][data-r=tx]'); await p.waitForTimeout(700); await shot('13-tx');
  await click('[data-act=txFilter][data-v=income]'); await p.waitForTimeout(600); await shot('14-tx-income');
  await click('[data-act=txFilter][data-v=all]'); await p.waitForTimeout(600);
  await click('.trow[data-act=detail]'); await p.waitForTimeout(700); await shot('15-detail');
  await click('[data-act=detCat]:nth-of-type(3)'); await click('[data-act=detSave]'); await p.waitForTimeout(600);
  await click('[data-act=txSearch]'); await p.type('#tx-q', 'kopi'); await p.waitForTimeout(1200); await shot('16-tx-search');
  await click('.fab'); await p.fill('#add-text', 'nasi goreng 25rb tunai'); await p.dispatchEvent('#add-text', 'input'); await shot('17-add');
  await click('#add-save'); await p.waitForTimeout(700);
  await click('[data-act=go][data-r=insight]'); await p.waitForTimeout(800); await shot('18-insight');
  await click('[data-act=openYear]'); await p.waitForTimeout(1000); await shot('18b-year');
  await click('[data-act=back]'); await p.waitForTimeout(500);
  await click('[data-act=go][data-r=me]'); await p.waitForTimeout(800); await shot('19-me');
  await click('.glass[data-r=alloc]'); await p.waitForTimeout(800); await shot('20-alloc');
  await click('[data-act=aeOpen]'); await shot('21-alloc-edit'); await click('[data-act=aeSave]'); await p.waitForTimeout(700);
  // tombol Rencana di menu: Goals & Alokasi
  await click('.seg [data-r=goals]'); await p.waitForTimeout(700); await shot('22-goals-empty');
  await click('[data-act=goalNew]'); await p.fill('#gf-name', 'Dana darurat'); await p.fill('#gf-target', '20000000'); await p.fill('#gf-current', '3000000'); await p.fill('#gf-deadline', '2027-12');
  await click('[data-act=gfAcct][data-v=BCA]'); await shot('23-goal-edit'); await click('[data-act=gfSave]'); await p.waitForTimeout(800); await shot('24-goals');
  await click('[data-act=goal]'); await p.waitForTimeout(700); await click('[data-act=depOpen]'); await p.fill('#dep-amt', '500000'); await click('[data-act=depSave]'); await p.waitForTimeout(800); await shot('25-goal');
  await click('[data-act=back]'); await click('[data-act=go][data-r=me]'); await p.waitForTimeout(600);
  await click('[data-act=go][data-r=akun]'); await p.waitForTimeout(300); await shot('26-akun');
  await click('[data-act=back]'); await click('[data-act=srcEdit]'); await shot('27-sources');
  await click('[data-act=back]');
  // reload → lock screen? sessionStorage persists across reload; clear it
  await p.evaluate(() => sessionStorage.clear()); await p.reload(); await p.waitForTimeout(900); await shot('28-lock');
  for (const k of '123456') await click(`[data-act=pinKey][data-v="${k}"]`);
  await p.waitForTimeout(900); await shot('29-after-unlock');
  // tema + desktop
  await click('[data-act=go][data-r=me]'); await p.waitForTimeout(700);
  await click('[data-act=setTheme][data-v=hijau]'); await p.waitForTimeout(500); await shot('30-theme-hijau');
  await p.setViewportSize({ width: 1440, height: 900 });
  await click('[data-act=go][data-r=home]'); await p.waitForTimeout(900); await shot('31-desk-home');
  await click('[data-act=setTheme]').catch(() => {});
  await click('[data-act=go][data-r=tx]'); await p.waitForTimeout(800); await shot('32-desk-tx');
  await click('[data-act=go][data-r=insight]'); await p.waitForTimeout(800); await shot('33-desk-insight');
  await click('[data-act=openYear]'); await p.waitForTimeout(1000); await shot('38-desk-year');
  await click('[data-act=back]'); await p.waitForTimeout(500);
  await click('[data-act=go][data-r=goals]'); await p.waitForTimeout(800); await shot('36-desk-goals');
  await click('.seg [data-r=alloc]'); await p.waitForTimeout(800); await shot('37-desk-alloc');
  await click('[data-act=go][data-r=me]'); await p.waitForTimeout(800);
  await click('[data-act=setTheme][data-v=biru]'); await p.waitForTimeout(500); await shot('34-desk-me');
  await click('.fab'); await p.fill('#add-text', 'kopi 18rb gopay'); await p.dispatchEvent('#add-text', 'input'); await shot('35-desk-quick');
  await p.keyboard.press('Escape');
  console.log('desk overflow', await p.evaluate(() => document.documentElement.scrollWidth));
  const errors = await p.evaluate(() => window.__errors);
  console.log('errors', JSON.stringify(errs.concat(errors)));
  // horizontal overflow check
  console.log('overflow', await p.evaluate(() => document.documentElement.scrollWidth));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });

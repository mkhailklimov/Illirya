const { chromium } = require('playwright');
const [,, file, w, h, out, s] = process.argv;
(async () => { const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(s||1) });
  await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: +w, height: +h } }); await b.close(); })();

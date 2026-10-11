// Render an HTML page from build/ to PNG with headless Chromium.
//   node render.js <html> <width> <height> <output.png> [scale] [transparent]
// Pass "transparent" as the 6th argument for pieces that must sit on any background.
const { chromium } = require('playwright');
const [,, file, w, h, out, s, bg] = process.argv;
(async () => { const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(s||1) });
  await p.goto(require('url').pathToFileURL(file).href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: +w, height: +h }, omitBackground: bg === 'transparent' }); await b.close(); })();

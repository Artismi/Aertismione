// Le immagini del biglietto (2040 x 1320, il doppio della pagina) da ar-print/biglietto-*.html.
//   node scripts/render-biglietto.mjs [cartella]      (serve Playwright: npx playwright install chromium)
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ar-print'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1020, height: 660 }, deviceScaleFactor: 2 });
for (const lato of ['fronte', 'retro']) {
  await page.goto('file://' + path.join(dir, `biglietto-${lato}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.querySelector('[data-fit]') || window.__fit === true, null, { timeout: 5000 });
  await page.waitForFunction(() => !document.querySelector('[data-blocco]') || window.__blocco === true, null, { timeout: 5000 });
  await page.screenshot({ path: path.join(dir, `biglietto-${lato}.png`) });
  console.log(path.join(dir, `biglietto-${lato}.png`));
}
await browser.close();

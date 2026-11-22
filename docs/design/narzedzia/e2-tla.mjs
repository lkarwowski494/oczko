// e2-tla.mjs — warianty tła kierunku A (P-552): „Dziś” 390 pt × t1–t4 × jasny/ciemny + arkusz zbiorczy (HTML → PNG).
// Użycie: node e2-tla.mjs <dzianina.html> <katalog>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire('/opt/node-tools/');
const { chromium } = require('playwright');
const [file, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('file://' + resolve(file)); await p.evaluate(() => document.fonts.ready);
for (const t of ['t1', 't2', 't3', 't4']) for (const theme of ['light', 'dark']) {
  await p.evaluate(([t, th]) => { const r = document.documentElement; r.dataset.tlo = t; r.dataset.theme = th; }, [t, theme]);
  const path = `${resolve(out)}/dzianina-tlo-${t}-${theme}.png`;
  await p.locator('[data-ekran]').first().screenshot({ path }); console.log(path);
}
await b.close();

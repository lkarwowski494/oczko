// e2-zrzuty.mjs — zrzuty kierunków E2 (M3): ekran „Dziś” 390 pt × jasny/ciemny (+ opcjonalnie AX5) i panel kierunku.
// Użycie: node e2-zrzuty.mjs <plik.html> <katalog> [kroje,po,przecinku] [--ax5] [--szarosc]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const require = createRequire(import.meta.url.startsWith('file:') ? '/opt/node-tools/' : import.meta.url);
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const [file, out, fonts = ''] = args.filter((a) => !a.startsWith('--'));
const ax5 = args.includes('--ax5'), szarosc = args.includes('--szarosc');
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('file://' + resolve(file));
await p.evaluate(() => document.fonts.ready);
const loaded = await p.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
for (const f of fonts.split(',').filter(Boolean)) if (!loaded.includes(f)) { console.error(`BRAK KROJU: ${f}`); process.exit(1); }
if (szarosc) await p.addStyleTag({ content: 'html{filter:grayscale(1)}' });
const nazwa = basename(file, '.html');
for (const theme of ['light', 'dark']) for (const duzy of ax5 ? [false, true] : [false]) {
  await p.evaluate(([t, big]) => { const r = document.documentElement; r.dataset.theme = t; r.style.setProperty('--dt-tytul', big ? '1.8' : '1'); r.style.setProperty('--dt-tresc', big ? '3.1' : '1'); }, [theme, duzy]);
  for (const el of await p.locator('[data-ekran]').all()) {
    const path = `${out}/${nazwa}-${await el.getAttribute('data-ekran')}-390-${theme}${duzy ? '-ax5' : ''}${szarosc ? '-szarosc' : ''}.png`;
    await el.screenshot({ path }); console.log(path);
  }
}
await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
const panel = p.locator('.panel').first();
if (await panel.count()) { const path = `${out}/${nazwa}-panel.png`; await panel.screenshot({ path }); console.log(path); }
await b.close();

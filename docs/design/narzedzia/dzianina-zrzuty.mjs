// dzianina-zrzuty.mjs — zrzuty wzorcowe systemu „Dzianina” (P-546: ekrany TO BE × jasny/ciemny × domyślny/AX5 × 390 pt)
// oraz arkusz najdłuższego języka (DE, jasny, domyślny i AX5: dzis, licznik).
// Użycie: node dzianina-zrzuty.mjs <ekrany.html> <katalog-wyjścia> [--szerokosc=390] [--ekrany=oferty,oferty-czeka] (filtr: tylko te ekrany, bez arkusza DE)
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire('/opt/node-tools/');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const [file, out] = args.filter((a) => !a.startsWith('--'));
const tylko = (args.find((a) => a.startsWith('--ekrany=')) || '').split('=')[1]?.split(',');
const w = Number((args.find((a) => a.startsWith('--szerokosc=')) || '=390').split('=')[1]);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('file://' + resolve(file)); await p.evaluate(() => document.fonts.ready);
const loaded = await p.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
for (const f of ['Bree Serif', 'Source Sans 3']) if (!loaded.includes(f)) { console.error(`BRAK KROJU: ${f}`); process.exit(1); }
const ustaw = (t, big) => p.evaluate(([t, big, w]) => { const r = document.documentElement; r.dataset.theme = t; r.style.setProperty('--w', w + 'px');
  r.style.setProperty('--dt-tytul', big ? '1.8' : '1'); r.style.setProperty('--dt-tresc', big ? '3.1' : '1'); document.body.classList.toggle('duzy', big); }, [t, big, w]);
for (const theme of ['light', 'dark']) for (const big of [false, true]) {
  await ustaw(theme, big);
  for (const el of await p.locator('[data-ekran]').all()) {
    if (tylko && !tylko.includes(await el.getAttribute('data-ekran'))) continue;
    const path = `${out}/${await el.getAttribute('data-ekran')}-${w}-${theme === 'light' ? 'jasny' : 'ciemny'}${big ? '-ax5' : ''}.png`;
    await el.screenshot({ path }); console.log(path);
  }
}
if (tylko) { await b.close(); process.exit(0); }
await p.evaluate(() => document.querySelectorAll('[data-de]').forEach((e) => { e.textContent = e.dataset.de; }));
for (const big of [false, true]) {
  await ustaw('light', big);
  for (const n of ['dzis', 'licznik']) { const path = `${out}/de-${n}-${w}-jasny${big ? '-ax5' : ''}.png`; await p.locator(`[data-ekran="${n}"]`).screenshot({ path }); console.log(path); }
}
await b.close();

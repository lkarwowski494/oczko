// zrzuty-fix7.mjs — wzorce fixu NZ-P217-04: node docs/design/narzedzia/zrzuty-fix7.mjs <plik.html> <katalog> [prefiks] [stan,stan]
// Stany telefonu w pionie: 320/390/430 × jasny/ciemny × domyślny/AX5 → <prefiks>-<stan>-<szer>-<motyw>[-ax5].png.
// Stany o stałym rozmiarze (klasy tel-poziomo, ipad, ipad-poziomo albo styl width:375px) — wymiar natywny → <prefiks>-<stan>-<SxW>-<motyw>[-ax5].png.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [plik, wyj, prefiks = basename(plik, '.html'), tylko = ''] = process.argv.slice(2);
mkdirSync(wyj, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 1300 }, deviceScaleFactor: 2 });
await p.goto('file://' + resolve(plik));
await p.evaluate(() => document.fonts.ready);
const wybrane = tylko.split(',').filter(Boolean);
const ustaw = (t, w, ax5) => p.evaluate(([t, w, big]) => { const r = document.documentElement; r.dataset.theme = t; r.style.setProperty('--w', w + 'px'); r.style.setProperty('--dt-tytul', big ? '1.8' : '1'); r.style.setProperty('--dt-tresc', big ? '3.1' : '1'); }, [t, w, ax5]);
let n = 0;
for (const theme of ['light', 'dark']) for (const ax5 of [false, true]) for (const width of [320, 390, 430]) {
  await ustaw(theme, width, ax5);
  for (const el of await p.locator('[data-ekran]').all()) {
    const nazwa = await el.getAttribute('data-ekran');
    if (wybrane.length && !wybrane.includes(nazwa)) continue;
    const staly = await el.evaluate((e) => /tel-poziomo|ipad/.test(e.className) || /width:\s*375px/.test(e.getAttribute('style') ?? ''));
    if (staly && width !== 390) continue;
    const r = await el.boundingBox();
    const rozmiar = staly ? `${Math.round(r.width)}x${await el.evaluate((e) => parseInt(getComputedStyle(e).minHeight))}` : width;
    await el.screenshot({ path: `${wyj}/${prefiks}-${nazwa}-${rozmiar}-${theme}${ax5 ? '-ax5' : ''}.png` });
    n++;
  }
}
await b.close();
console.log(`${n} zrzutów → ${wyj}`);

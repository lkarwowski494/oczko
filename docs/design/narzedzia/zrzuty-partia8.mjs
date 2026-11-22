// zrzuty-partia8.mjs — wzorce makiet partii 8 (rola 04, 2026-11-01). Użycie:
//   node docs/design/narzedzia/zrzuty-partia8.mjs <partia8.html> <katalog-wyjścia> [--podglad]
// Wyjątek nazwany (rola 04, 2026-11-01): szerokości 320 i 390 pt (nie 430) × jasny/ciemny × tekst domyślny/AX5 = 8 plików na stan,
// żeby nie powiększać wzorców o ~100 plików bez nowej informacji (430 pt różni się od 390 tylko szerokością kolumny).
// --podglad: tylko 390 jasny domyślny + arkusz zbiorczy (do oglądania). Nazwy: partia8-<stan>-<szer>-<jasny|ciemny>[-duzy].png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const [plik, wyj, ...flagi] = process.argv.slice(2);
mkdirSync(wyj, { recursive: true });
const podglad = flagi.includes('--podglad');
const b = await chromium.launch();
const s = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: podglad ? 1 : 2 });
await s.goto('file://' + resolve(plik));
await s.evaluate(() => document.fonts.ready);
const zaladowane = await s.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
for (const f of ['Libre Franklin', 'Source Sans 3']) if (!zaladowane.includes(f)) { console.error('BRAK KROJU: ' + f); process.exit(1); }
const zestawy = podglad ? [[390, 'light', false]] : [320, 390].flatMap((w) => ['light', 'dark'].flatMap((t) => [[w, t, false], [w, t, true]]));
let n = 0;
for (const [w, t, duzy] of zestawy) {
  await s.evaluate(([w, t, duzy]) => {
    const r = document.documentElement; r.dataset.theme = t;
    r.style.setProperty('--w', w + 'px');
    r.style.setProperty('--dt-tytul', duzy ? '1.8' : '1'); r.style.setProperty('--dt-tresc', duzy ? '3.1' : '1');
  }, [w, t, duzy]);
  for (const el of await s.locator('[data-ekran]').all()) {
    const nazwa = await el.getAttribute('data-ekran');
    await el.screenshot({ path: `${wyj}/partia8-${nazwa}-${w}-${t === 'light' ? 'jasny' : 'ciemny'}${duzy ? '-duzy' : ''}.png` });
    n++;
  }
}
await b.close();
console.log(n + ' plików');

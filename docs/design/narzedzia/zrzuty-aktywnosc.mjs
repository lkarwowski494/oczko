// zrzuty-aktywnosc.mjs — użycie: node zrzuty-aktywnosc.mjs <aktywnosc.html> <katalog-wyjścia>
// Ekran blokady i Dynamic Island: 320/393/430 pt × jasny/ciemny × tekst domyślny/duży (×1,35);
// zegarek: 41 i 46 mm; Smart Stack (rozmiar mały, HIG): 40 mm 152×69,5, 46 mm 194×80,5, 49 mm 198×81,5, CarPlay 170×78 i 240×100;
// oba × tekst domyślny/duży (zawsze ciemny). Uruchamiać z katalogu z playwright (render-i-krytyka).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const [file, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve(file));
await page.evaluate(() => document.fonts.ready);
const loaded = await page.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
if (!loaded.includes('Libre Franklin')) { console.error('BRAK KROJU: Libre Franklin'); process.exit(1); }
const ustaw = (o) => page.evaluate((o) => { const r = document.documentElement; r.dataset.theme = o.t; r.dataset.duzy = String(o.v['--dt'] !== '1'); for (const [k, v] of Object.entries(o.v)) r.style.setProperty(k, v); }, o);
const zrzut = async (sel, nazwa) => { for (const el of await page.locator(sel).all()) { const n = await el.getAttribute('data-ekran'); const p = `${out}/${basename(file, '.html')}-${n}-${nazwa}.png`; await el.screenshot({ path: p }); console.log(p); } };
for (const w of [320, 393, 430]) for (const t of ['light', 'dark']) for (const duzy of [false, true]) {
  await ustaw({ t, v: { '--w': w + 'px', '--dt': duzy ? '1.35' : '1' } });
  await zrzut('[data-ekran^="blokada"], [data-ekran^="wyspa"]', `${w}-${t === 'light' ? 'jasny' : 'ciemny'}${duzy ? '-duzy' : ''}`);
}
for (const [mm, zw, zh] of [[41, 176, 215], [46, 208, 248]]) for (const duzy of [false, true]) {
  await ustaw({ t: 'dark', v: { '--zw': zw + 'px', '--zh': zh + 'px', '--dt': duzy ? '1.35' : '1' } });
  await zrzut('[data-ekran^="zegarek"]:not([data-ekran^="zegarek-smart-stack"])', `${mm}mm${duzy ? '-duzy' : ''}`);
}
for (const [nazwa, sw, sh] of [['40mm', 152, 69.5], ['46mm', 194, 80.5], ['49mm', 198, 81.5], ['carplay-170', 170, 78], ['carplay-240', 240, 100]]) for (const duzy of [false, true]) {
  await ustaw({ t: 'dark', v: { '--sw': sw + 'px', '--sh': sh + 'px', '--dt': duzy ? '1.35' : '1' } });
  await zrzut('[data-ekran^="zegarek-smart-stack"]', `${nazwa}${duzy ? '-duzy' : ''}`);
}
await browser.close();

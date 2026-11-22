// przewodnik-zrzuty.mjs — zrzuty makiety przewodnika (rola 04, sesja O, 2026-11-10): ekrany × jasny/ciemny × domyślny/AX5 × szerokość, pl (i en z --en).
// Użycie: node przewodnik-zrzuty.mjs <przewodnik.html> <katalog-wyjścia> [--szerokosc=390] [--en] [--arkusz]
// Wzór: dzianina-zrzuty.mjs (AX5 jako uproszczenie tabeli HIG: tytuły ×1,8, treść ×3,1). Z --arkusz: jeden arkusz zbiorczy do oglądania.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire('/opt/node-tools/');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const [file, out] = args.filter((a) => !a.startsWith('--'));
const w = Number((args.find((a) => a.startsWith('--szerokosc=')) || '=390').split('=')[1]);
const en = args.includes('--en');
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(resolve(file)).href + (en ? '?lang=en' : '')); await p.evaluate(() => document.fonts.ready);
const loaded = await p.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
for (const f of ['Bree Serif', 'Source Sans 3']) if (!loaded.includes(f)) { console.error(`BRAK KROJU: ${f}`); process.exit(1); }
const ustaw = (t, big) => p.evaluate(([t, big, w]) => { const r = document.documentElement; r.dataset.theme = t; r.style.setProperty('--w', w + 'px');
  r.style.setProperty('--dt-tytul', big ? '1.8' : '1'); r.style.setProperty('--dt-tresc', big ? '3.1' : '1'); document.body.classList.toggle('duzy', big); }, [t, big, w]);
const warianty = en ? [['light', false]] : [['light', false], ['dark', false], ['light', true], ['dark', true]];
for (const [theme, big] of warianty) {
  await ustaw(theme, big);
  for (const el of await p.locator('[data-ekran]').all()) {
    const path = `${out}/${await el.getAttribute('data-ekran')}-${w}-${theme === 'light' ? 'jasny' : 'ciemny'}${big ? '-ax5' : ''}${en ? '-en' : ''}.png`;
    await el.screenshot({ path }); console.log(path);
  }
}
if (args.includes('--arkusz')) {
  await ustaw('light', false);
  await p.addStyleTag({ content: 'body{gap:12px;padding:12px}' });
  await p.screenshot({ path: `${out}/arkusz-${w}-jasny${en ? '-en' : ''}.png`, fullPage: true });
}
await b.close();

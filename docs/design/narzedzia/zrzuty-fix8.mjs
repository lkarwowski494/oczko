// zrzuty-fix8.mjs — makiety fix-8 na ekranach o wysokości urządzenia (licznik przy AX5, arkusz przy klawiaturze).
// Użycie: node docs/design/narzedzia/zrzuty-fix8.mjs <fix8.html> <katalog-wyjścia> [--szarosc]
// Wymiary: 320×568 (iPhone SE 1. gen., „Powiększenie ekranu”), 390×844, 430×932. Wysokość klawiatury dziesiętnej
// to przybliżenie (216 pt bez wskaźnika Home, 260 pt z nim) [DO USTALENIA: pomiar w CI]. Wypisuje pomiar `uloz()` jako JSON.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const [plik, wyj, ...flagi] = process.argv.slice(2);
mkdirSync(wyj, { recursive: true });
const b = await chromium.launch();
const s = await b.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await s.goto('file://' + resolve(plik));
await s.evaluate(() => document.fonts.ready);
if (flagi.includes('--szarosc')) await s.addStyleTag({ content: 'html{filter:grayscale(1)}' });
const pomiar = {};
for (const [w, h, kl] of [[320, 568, 216], [390, 844, 260], [430, 932, 260]]) {
  for (const motyw of ['light', 'dark']) {
    for (const duzy of [false, true]) {
      const wynik = await s.evaluate(([w, h, kl, motyw, duzy]) => {
        const r = document.documentElement;
        r.dataset.theme = motyw;
        if (duzy) r.dataset.duzy = ''; else delete r.dataset.duzy;
        r.style.setProperty('--w', w + 'px'); r.style.setProperty('--h', h + 'px'); r.style.setProperty('--kl', kl + 'px');
        r.style.setProperty('--dt-tytul', duzy ? '1.8' : '1'); r.style.setProperty('--dt-tresc', duzy ? '3.1' : '1');
        return window.uloz();
      }, [w, h, kl, motyw, duzy]);
      if (motyw === 'light') pomiar[`${w}${duzy ? '-ax5' : ''}`] = wynik;
      for (const el of await s.locator('[data-ekran]').all()) {
        const nazwa = await el.getAttribute('data-ekran');
        await el.screenshot({ path: `${wyj}/${basename(plik, '.html')}-${nazwa}-${w}-${motyw}${duzy ? '-ax5' : ''}.png` });
      }
    }
  }
}
await b.close();
writeFileSync(`${wyj}/pomiar.json`, JSON.stringify(pomiar, null, 1));
console.log(JSON.stringify(pomiar, null, 1));

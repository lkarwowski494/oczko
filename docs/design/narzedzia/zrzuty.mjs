// zrzuty.mjs — użycie: node zrzuty.mjs <plik.html> <katalog-wyjścia> [kroje,oddzielone,przecinkami]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
const [file, out, fonts = ''] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve(file));
await page.evaluate(() => document.fonts.ready);
// document.fonts.check() zwraca true także dla kroju, którego nie zadeklarowano, więc sprawdzamy listę załadowanych.
const loaded = await page.evaluate(() => [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family.replace(/["']/g, '')));
for (const f of fonts.split(',').filter(Boolean)) {
  if (!loaded.includes(f)) {
    console.error(`BRAK KROJU: ${f} (sprawdź @font-face i pliki w docs/design/fonty/)`);
    process.exit(1);
  }
}
for (const width of [320, 390, 430]) {
  for (const theme of ['light', 'dark']) {
    for (const ax5 of [false, true]) {
      await page.evaluate(([t, w, big]) => {
        const r = document.documentElement;
        r.dataset.theme = t;
        r.style.setProperty('--w', w + 'px');
        r.style.setProperty('--dt-tytul', big ? '1.8' : '1');
        r.style.setProperty('--dt-tresc', big ? '3.1' : '1');
      }, [theme, width, ax5]);
      for (const el of await page.locator('[data-ekran]').all()) {
        const name = await el.getAttribute('data-ekran');
        const path = `${out}/${basename(file, '.html')}-${name}-${width}-${theme}${ax5 ? '-ax5' : ''}.png`;
        await el.screenshot({ path });
        console.log(path);
      }
    }
  }
}
await browser.close();

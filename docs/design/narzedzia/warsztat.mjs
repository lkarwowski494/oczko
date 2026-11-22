// warsztat.mjs — użycie: node warsztat.mjs <plik.html> [szerokość=390] [jednostka=4] [--rozmycie]
// Kod 1 przy błędach: tekst < 11 px, cienka odmiana (≤ 300) w tekście < 20 px, wiersz akapitu > 90 znaków na ekranie ≥ 600 px.
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function ocen(p, { jednostka = 4 } = {}) {
  const bledy = [], ostrzezenia = [], info = [];
  const szeroki = p.szerokosc >= 600;
  for (const t of p.teksty) {
    if (t.rozmiar < 11) bledy.push(`${t.opis}: tekst ${t.rozmiar} px < 11 px (minimum iOS 11 pt)`);
    if (t.waga <= 300 && t.rozmiar < 20) bledy.push(`${t.opis}: cienka odmiana ${t.waga} przy ${t.rozmiar} px`);
    if (!t.akapit) continue;
    if (t.interlinia < 1.2 || t.interlinia > 1.45) ostrzezenia.push(`${t.opis}: interlinia ${t.interlinia.toFixed(2)} poza 1,20–1,45`);
    if (t.znakowWiersza > 90) (szeroki ? bledy : ostrzezenia).push(`${t.opis}: ${Math.round(t.znakowWiersza)} znaków w wierszu, więcej niż 90 znaków`);
    else if (szeroki && t.znakowWiersza && t.znakowWiersza < 45) ostrzezenia.push(`${t.opis}: ${Math.round(t.znakowWiersza)} znaków w wierszu, mniej niż 45`);
  }
  const poza = [...new Set(p.odstepy.filter((v) => v > 0 && Math.abs(v / jednostka - Math.round(v / jednostka)) > 0.01))].sort((a, b) => a - b);
  if (poza.length) ostrzezenia.push(`odstępy poza jednostką ${jednostka} px: ${poza.join(', ')}`);
  const rozmiary = [...new Set(p.teksty.map((t) => t.rozmiar))].sort((a, b) => a - b);
  const kolory = new Set(p.teksty.map((t) => t.kolor));
  info.push(`wielkości tekstu (px): ${rozmiary.join(', ')}; kolory tekstu: ${kolory.size}`);
  if (rozmiary.length > 5) ostrzezenia.push(`${rozmiary.length} wielkości tekstu: sprawdź hierarchię (punkt wyjścia NN/g: 3)`);
  if (kolory.size > 4) ostrzezenia.push(`${kolory.size} kolorów tekstu: sprawdź warianty kontrastu (NN/g: najwyżej 3)`);
  return { bledy, ostrzezenia, info };
}

async function main() {
  const [plik, ...reszta] = process.argv.slice(2);
  if (!plik) { console.error('Użycie: node warsztat.mjs <plik.html> [szerokość=390] [jednostka=4] [--rozmycie]'); process.exit(2); }
  const liczby = reszta.filter((x) => /^\d+$/.test(x)).map(Number);
  const [szerokosc = 390, jednostka = 4] = liczby;
  const { chromium } = await import('playwright');
  const b = await chromium.launch();
  const s = await b.newPage({ viewport: { width: szerokosc, height: 900 } });
  await s.goto(pathToFileURL(resolve(plik)).href);
  const pomiar = await s.evaluate(() => {
    const teksty = [], odstepy = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || !r.width) continue;
      for (const w of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'rowGap', 'columnGap']) {
        const v = parseFloat(cs[w]); if (v > 0) odstepy.push(Math.round(v * 100) / 100);
      }
      const wlasny = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!wlasny) continue;
      const rozmiar = parseFloat(cs.fontSize), lh = cs.lineHeight === 'normal' ? 1.2 * rozmiar : parseFloat(cs.lineHeight);
      const wiersze = Math.round(r.height / lh), dlugosc = el.textContent.trim().length;
      teksty.push({ opis: `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} „${wlasny.slice(0, 24)}”`,
        rozmiar, waga: Number(cs.fontWeight), interlinia: lh / rozmiar, kolor: cs.color,
        akapit: ['P', 'LI', 'DD', 'BLOCKQUOTE'].includes(el.tagName) || dlugosc >= 80, znakowWiersza: wiersze >= 2 ? dlugosc / wiersze : 0 });
    }
    return { szerokosc: innerWidth, teksty, odstepy };
  });
  if (reszta.includes('--rozmycie')) {
    await s.addStyleTag({ content: 'html { filter: blur(8px); }' });
    await s.screenshot({ path: resolve(plik).replace(/\.html?$/, '') + `-mruzenie-${szerokosc}.png`, fullPage: true });
  }
  await b.close();
  const w = ocen(pomiar, { jednostka });
  for (const x of w.info) console.log('INFO', x);
  for (const x of w.ostrzezenia) console.log('UWAGA', x);
  for (const x of w.bledy) console.log('BŁĄD', x);
  console.log(w.bledy.length ? `${w.bledy.length} błędów` : 'OK');
  process.exit(w.bledy.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

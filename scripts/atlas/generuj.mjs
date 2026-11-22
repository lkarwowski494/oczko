// Generator rysunków atlasu (prototyp E1, ADR-0022): karty JSON → SVG (jeden plik na wszystkie języki, P-192) + arkusz PNG do oceny.
// Użycie: node --experimental-strip-types --no-warnings scripts/atlas/generuj.mjs [--karty docs/atlas/prototyp/karty] [--wyjscie docs/atlas/prototyp] [--png] [--check]
//   --check: nie zapisuje; kod 1, gdy plik SVG w repo różni się od wygenerowanego (determinizm) albo rysunek ma błędy.
// Kod wyjścia: 0 = wszystkie rysunki poprawne (i aktualne przy --check), 1 = błędy, 2 = użycie.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { siatkaPetli } from './silnik/siatka-petli.ts';
import { walidujKarte } from './silnik/kontrakt.ts';
import { sprawdzKrok } from './silnik/sprawdz.ts';
import { doSvg, paletaZTokenow } from './silnik/svg.ts';

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const katKart = resolve(KORZEN, arg('karty', 'docs/atlas/prototyp/karty'));
const katWyj = resolve(KORZEN, arg('wyjscie', 'docs/atlas/prototyp'));
const sprawdzaj = process.argv.includes('--check');
if (!existsSync(katKart)) { console.error(`Brak katalogu kart: ${katKart}`); process.exit(2); }

const tokeny = JSON.parse(readFileSync(join(KORZEN, 'docs/design/tokeny.json'), 'utf8'));
const palety = { jasny: paletaZTokenow(tokeny, 'jasny'), ciemny: paletaZTokenow(tokeny, 'ciemny') };
let bledy = 0;
const rysunki = [];
for (const plik of readdirSync(katKart).filter((f) => f.endsWith('.json')).sort()) {
  const karta = JSON.parse(readFileSync(join(katKart, plik), 'utf8'));
  const b = walidujKarte(karta, { sprawdzKrok: sprawdzKrok(Object.values(palety)) }); // schemat, semantyka i rysunek każdego kroku (ADR-0023)
  for (const e of b) console.log(`BŁĄD ${plik} [${e.kod}] ${e.sciezka}: ${e.szczegol}`);
  bledy += b.length;
  if (b.some((e) => !e.kod.startsWith('rysunek:'))) continue;
  for (const krok of karta.kroki ?? []) {
    const rys = siatkaPetli(karta, krok);
    const nazwa = `${karta.id}.${krok.faza}`;
    const svg = doSvg(rys, palety.jasny);
    const cel = join(katWyj, `${nazwa}.svg`);
    if (sprawdzaj) {
      if (!existsSync(cel) || readFileSync(cel, 'utf8') !== svg) { console.log(`NIEAKTUALNY ${cel}`); bledy++; }
    } else {
      mkdirSync(katWyj, { recursive: true });
      writeFileSync(cel, svg);
    }
    rysunki.push({ nazwa, rys, bajty: Buffer.byteLength(svg), skrzyzowania: rys.skrzyzowania.length, czesci: rys.czesci.length });
  }
}
for (const r of rysunki) console.log(`${r.nazwa}: ${r.czesci} części, ${r.skrzyzowania} skrzyżowań, ${r.bajty} B`);

if (process.argv.includes('--png') && !sprawdzaj) {
  const skala = 4;
  const html = (motyw) => {
    const p = palety[motyw];
    const komorki = rysunki.map((r) => `<div style="display:inline-block;margin:8px;vertical-align:top">${doSvg(r.rys, p).replace(/width="([\d.]+)" height="([\d.]+)"/, (_, w, h) => `width="${w * skala}" height="${h * skala}"`)}</div>`);
    return `<html><body style="margin:0;padding:8px;background:${p.tlo}">${komorki.join('')}</body></html>`;
  };
  const { chromium } = createRequire(import.meta.url)('playwright');
  const b = await chromium.launch();
  const s = await b.newPage({ viewport: { width: 1600, height: 600 } });
  for (const motyw of Object.keys(palety)) {
    await s.setContent(html(motyw));
    await s.screenshot({ path: join(katWyj, `arkusz-${motyw}.png`), fullPage: true });
  }
  await b.close();
  console.log(`PNG: ${join(katWyj, 'arkusz-jasny.png')}, ${join(katWyj, 'arkusz-ciemny.png')}`);
}
console.log(bledy ? `${bledy} błędów` : `OK: ${rysunki.length} rysunków bez błędów`);
process.exit(bledy ? 1 : 0);

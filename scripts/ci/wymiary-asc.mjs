#!/usr/bin/env node
// Kontrola zrzutów sklepu przed wgraniem: wymiary dozwolone przez App Store Connect, brak kanału alfa, najwyżej 10 plików na klasę i język.
// Rola 10-wydanie, KO-032. Źródło wymiarów: App Store Connect Help, „Screenshot specifications”, odczyt 2026-11-10 (surowy HTML przez curl):
// iPhone z Dynamic Island, duży ekran: 1260×2736, 1290×2796, 1320×2868 (pion; poziom odwrotnie); iPad 13″: 2064×2752, 2048×2732 (pion; poziom odwrotnie);
// „You must include at least one screenshot and can upload up to 10 screenshots per device size”; „Images can’t include alpha channels or transparencies.”
// Nasze klasy: katalog `6.9` (iPhone 17 Pro Max, 1320×2868; bezpieczny nadzbiór — „If screenshots with the accepted sizes aren't provided, scaled screenshots … are used”),
// `6.3` i `ipad-13`. Układ: <katalog>/[warunek-og07/]<klasa>/<język>/NN-<ekran>.png.
// Użycie: node scripts/ci/wymiary-asc.mjs <katalog>   → lista nieprawidłowości, kod 1; bez nich kod 0.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const poziom = (l) => [...l, ...l.map(([w, h]) => [h, w])];
/** Klasa (katalog) → dozwolone wymiary w pikselach [szerokość, wysokość]. */
export const WYMIARY = {
  '6.9': poziom([[1320, 2868], [1290, 2796], [1260, 2736]]),
  '6.3': poziom([[1206, 2622], [1179, 2556]]),
  'ipad-13': poziom([[2064, 2752], [2048, 2732]]),
};
export const MAX_NA_KLASE = 10;
const SYGNATURA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Wymiary i kanał alfa z nagłówka PNG (IHDR; typ koloru 4 i 6 = alfa, tRNS = przezroczystość palety). */
export function pngInfo(buf) {
  if (buf.length < 26 || !buf.subarray(0, 8).equals(SYGNATURA)) throw new Error('to nie jest plik PNG');
  const typ = buf[25];
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), alpha: typ === 4 || typ === 6 || buf.includes(Buffer.from('tRNS')) };
}

function pliki(kat, wynik = []) {
  for (const e of readdirSync(kat, { withFileTypes: true })) {
    const p = join(kat, e.name);
    if (e.isDirectory()) pliki(p, wynik); else if (/\.png$/i.test(e.name)) wynik.push(p);
  }
  return wynik;
}

/** Zwraca listę nieprawidłowości (pusta = zgodne). */
export function kontroluj(katalog) {
  const bledy = []; const licznik = new Map();
  for (const f of pliki(katalog).sort()) {
    const rel = relative(katalog, f).split(sep);
    const i = rel.findIndex((c) => c in WYMIARY);
    if (i < 0 || rel.length < i + 3) { bledy.push(`${rel.join('/')}: nieznana klasa (oczekiwane <klasa>/<język>/plik.png, klasy ${Object.keys(WYMIARY).join(', ')})`); continue; }
    const klasa = rel[i]; const klucz = rel.slice(0, i + 2).join('/');
    licznik.set(klucz, (licznik.get(klucz) ?? 0) + 1);
    let info;
    try { info = pngInfo(readFileSync(f)); } catch (e) { bledy.push(`${rel.join('/')}: ${e.message}`); continue; }
    if (!WYMIARY[klasa].some(([w, h]) => w === info.width && h === info.height)) bledy.push(`${rel.join('/')}: wymiar ${info.width}×${info.height} spoza listy klasy ${klasa}`);
    if (info.alpha) bledy.push(`${rel.join('/')}: kanał alfa albo przezroczystość (App Store Connect odrzuca)`);
    if (statSync(f).size === 0) bledy.push(`${rel.join('/')}: pusty plik`);
  }
  for (const [k, n] of licznik) if (n > MAX_NA_KLASE) bledy.push(`${k}: ${n} plików, najwyżej ${MAX_NA_KLASE} na klasę i język`);
  if (!licznik.size) bledy.push('brak plików PNG w katalogu');
  return bledy;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kat = process.argv[2];
  if (!kat) { console.error('użycie: node scripts/ci/wymiary-asc.mjs <katalog>'); process.exit(2); }
  const bledy = kontroluj(kat);
  for (const b of bledy) console.log(`BŁĄD ${b}`);
  console.log(bledy.length ? `BŁĘDY: ${bledy.length}` : `OK (${pliki(kat).length} plików)`);
  process.exit(bledy.length ? 1 : 0);
}

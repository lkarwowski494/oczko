#!/usr/bin/env node
// Kadry sklepu z Apple Watch (workflow zrzuty-zegarka.yml; rola 10-wydanie, ZW1, KO-197, 2026-11-22). Powód: App Store Connect odmawia „Add for Review” dla wersji 1.0
// (build 1221): „Your binary indicates support for Apple Watch. You must provide an Apple Watch screenshot.” (właściciel, 22.11.2026). Wzorzec: Trening
// (trening:.github/workflows/watch-sim.yml, scripts/ci/watch-screenshots.sh — zrzut `simctl io` z symulatora zegarka).
//
// Wymagania Apple (App Store Connect Help, „Screenshot specifications”, odczyt 2026-11-22, surowy HTML przez curl): Apple Watch „Required for Apple Watch apps”;
// jeden z rozmiarów 422×514 (Ultra 4, Ultra 3), 410×502 (Ultra 2, Ultra), 416×496 (Series 12, 11, 10), 396×484 (Series 9, 8, 7), 368×448 (Series 6, 5, 4, SE 3, 2, SE),
// 312×390 (Series 3, 2, 1); „You must use the same screenshot size for Apple Watch consistently across all localizations for the app”;
// „You must include at least one screenshot and can upload up to 10 screenshots per device size” (.jpeg, .jpg, .png); obrazy bez kanału alfa.
//
// Stan zegarka: aplikacja zegarka czyta przy starcie z UserDefaults kontekst telefonu (`oczko.zegarek.kontekst.v2`, JSON `StanEkranuBlokady`) i język (`oczko.zegarek.jezyk.v1`)
// — targets/watch/Aplikacja.swift, ModelZegarka.init. Skrypt scripts/ci/zegarek-zrzuty.sh podaje je aplikacji w symulatorze, więc KOD APLIKACJI I CELU ZEGARKA SIĘ NIE ZMIENIA
// (kadry pokazują to, co ma build 1221). Dane pokazowe zgodne z kadrami iPhone'a: projekt główny z e2e/zrzuty-sklepu/dane/<klucz>.json, licznik 20 (rząd w robocie 21, ZR3/P-998).
//
// Użycie: node scripts/ci/zegarek-kadry.mjs plan <jezyki|all>                      → lista języków (po przecinku) na stdout; zły język = kod 2
//         node scripts/ci/zegarek-kadry.mjs stany <katalog> <jezyki|all> <RRRR-MM-DD> → <katalog>/<język>-<kadr>.json (stan) i .hex (stan jako szesnastkowy NSData); ostrzeżenia na stderr
//         node scripts/ci/zegarek-kadry.mjs rozne <a.png> <b.png>                     → kod 0: kadry różnią się treścią (poza zegarem systemowym), 1: takie same
//         node scripts/ci/zegarek-kadry.mjs komplet <katalog> <jezyki|all> [rozmiar WxH] → kontrola kompletu (języki × kadry), jednego rozmiaru z listy Apple i braku alfy; błędy = kod 1
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jezyki as rozwiazJezyki } from './zrzuty-jezyki.mjs';
import { pngInfo } from './wymiary-asc.mjs';
import { piksele } from './splaszcz-png.mjs';

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KAT_DANYCH = join(KORZEN, 'e2e/zrzuty-sklepu/dane');

/** Kadry sklepu: kolejność = kolejność w App Store (1 = pierwszy). Nazwy plików `NN-<kadr>.png`. */
/** ZW2 (P-1025): bez kadru `03-zablokowany` — w kadrze blokady tekst jest ucięty („Unlock it in Oczko on your iP…”); powrót, gdy aplikacja skróci tekst albo zmieni układ. */
export const KADRY = ['01-licznik', '02-przypomnienie'];
/** Rozmiary zrzutów Apple Watch dozwolone przez Apple (odczyt 2026-11-22); do wyboru jeden, ten sam we wszystkich lokalizacjach. */
export const WYMIARY_ZEGARKA = [[422, 514], [410, 502], [416, 496], [396, 484], [368, 448], [312, 390]];
/** Domyślny rozmiar: Series 11 / 10 46 mm (symulator „Apple Watch Series 11 (46mm)”). */
export const ROZMIAR_DOMYSLNY = [416, 496];
export const MAX_NA_JEZYK = 10;
/** Licznik projektu głównego w kadrach iPhone'a = 20 (ZR3, P-998), więc rząd w robocie = 21. */
export const LICZNIK = 20;
/** Przypomnienie „co 4 rzędy, 6 razy, od rzędu 9” wyzwala się w rzędzie 21 (czwarte powtórzenie); tekst krótki, bo pas ma najwyżej 2 wiersze. */
export const PRZYPOMNIENIE = { od: 9, co: 4, razy: 6 };
/** Tekst przypomnienia w kadrze: język z własnym tekstem, reszta angielski (jak dane projektu: brak pliku danych = `en` jawnie). */
export const TEKSTY_PRZYPOMNIENIA = { en: 'cable', pl: 'warkocz' };
export const KLUCZ_KONTEKSTU = 'oczko.zegarek.kontekst.v2';
export const KLUCZ_JEZYKA = 'oczko.zegarek.jezyk.v1';

/** Dane pokazowe języka: klucz pliku danych (en | pl | …), nazwa projektu i tekst przypomnienia; `zastepcze` = język bez własnych danych (dane `en`). */
export function daneJezyka(jezyk) {
  const wlasny = existsSync(join(KAT_DANYCH, `${jezyk}.json`));
  const klucz = wlasny ? jezyk : 'en';
  const d = JSON.parse(readFileSync(join(KAT_DANYCH, `${klucz}.json`), 'utf8'));
  const tekst = TEKSTY_PRZYPOMNIENIA[jezyk];
  return { klucz, projekt: String(d.PROJ_GLOWNY), przypomnienie: tekst ?? TEKSTY_PRZYPOMNIENIA.en, zastepcze: !wlasny || tekst === undefined };
}

/** Stan zegarka (wersja 3, targets/watch/Wspolne/Stan.swift): ten sam zbiór kluczy co dekoder Swift — brak klucza (także z wartością null) = błąd dekodowania i ekran „Otwórz Oczko na iPhonie”. */
export function stan({ jezyk, kadr, dzien }) {
  if (!KADRY.includes(kadr)) throw new Error(`nieznany kadr ${kadr}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dzien))) throw new Error('dzień w formacie RRRR-MM-DD');
  const d = daneJezyka(jezyk);
  return {
    wersja: 3, licznikId: 'zrzuty-sklepu-zegarek', nazwa: d.projekt, wartosc: LICZNIK, znaczenie: 'skonczone', glowa: null, ostatniPlusMs: null,
    dzien, dzienDozwolony: true, sesjaStartMs: null, pro: false, proWaznoscDo: null, dniWMiesiacu: [],
    przypomnienia: kadr === '02-przypomnienie' ? [{ ...PRZYPOMNIENIE, tekst: d.przypomnienie }] : [],
    zablokowany: false, // klucz wymagany przez dekoder Swift; żaden kadr sklepu nie pokazuje blokady (P-1025)
  };
}

/** Szesnastkowy zapis bajtów UTF-8 JSON-u: składnia NSData starego formatu plist, `<7b22…>` (argument uruchomienia aplikacji i `defaults write -data`). */
export const naSzesnastkowy = (obiekt) => Buffer.from(JSON.stringify(obiekt), 'utf8').toString('hex');

/** Zapisuje <katalog>/<język>-<kadr>.json i .hex; zwraca ostrzeżenia (języki z danymi zastępczymi). */
export function zapiszStany(katalog, listaJezykow, dzien) {
  mkdirSync(katalog, { recursive: true });
  const ostrzezenia = [];
  for (const j of listaJezykow) {
    const d = daneJezyka(j);
    if (d.zastepcze) ostrzezenia.push(`${j}: dane pokazowe w języku angielskim (projekt „${d.projekt}”) — brak własnych danych lub tekstu przypomnienia`);
    for (const k of KADRY) {
      const s = stan({ jezyk: j, kadr: k, dzien });
      writeFileSync(join(katalog, `${j}-${k}.json`), `${JSON.stringify(s)}\n`);
      writeFileSync(join(katalog, `${j}-${k}.hex`), naSzesnastkowy(s));
    }
  }
  return ostrzezenia;
}

/** Górny pas kadru (zegar systemowy watchOS, zmienia się co minutę) pomijany przy porównaniu kadrów. */
export const POMIJANY_GORNY_PAS = 0.14;
/** Czy dwa kadry (PNG) różnią się treścią: ponad 0,5% pikseli poza górnym pasem z zegarem. Równe = stan nie zmienił ekranu. */
export function rozne(bufA, bufB, prog = 0.005) {
  const a = piksele(bufA); const b = piksele(bufB);
  if (a.szer !== b.szer || a.wys !== b.wys) return true;
  const od = Math.floor(a.wys * POMIJANY_GORNY_PAS); let inne = 0; const n = (a.wys - od) * a.szer;
  for (let y = od; y < a.wys; y++) for (let x = 0; x < a.szer; x++) {
    const i = (y * a.szer + x) * a.bpp; const j = (y * b.szer + x) * b.bpp;
    if (Math.abs(a.surowe[i] - b.surowe[j]) + Math.abs(a.surowe[i + 1] - b.surowe[j + 1]) + Math.abs(a.surowe[i + 2] - b.surowe[j + 2]) > 24) inne++;
  }
  return inne / n > prog;
}

/** Kontrola kompletu: każdy język z listy ma dokładnie kadry z KADRY (nazwy, kolejność), wszystkie PNG mają jeden rozmiar z listy Apple (ten sam w całym zestawie) i bez alfy. */
export function kontroluj(katalog, listaJezykow, rozmiar = null) {
  const bledy = [];
  if (!existsSync(katalog)) return [`brak katalogu ${katalog}`];
  const rozmiary = new Set();
  const jezyki = readdirSync(katalog).filter((n) => statSync(join(katalog, n)).isDirectory());
  for (const j of jezyki) if (!listaJezykow.includes(j)) bledy.push(`${j}: język spoza listy (${listaJezykow.join(',')})`);
  for (const j of listaJezykow) {
    const dir = join(katalog, j);
    if (!existsSync(dir)) { bledy.push(`${j}: brak katalogu języka`); continue; }
    const pliki = readdirSync(dir).filter((n) => /\.png$/i.test(n)).sort();
    const oczekiwane = KADRY.map((k) => `${k}.png`);
    if (pliki.join('|') !== oczekiwane.join('|')) bledy.push(`${j}: pliki [${pliki.join(', ')}] zamiast [${oczekiwane.join(', ')}]`);
    if (pliki.length > MAX_NA_JEZYK) bledy.push(`${j}: ${pliki.length} zrzutów > limit ${MAX_NA_JEZYK} na rozmiar (Apple)`);
    for (const f of pliki) {
      let info;
      try { info = pngInfo(readFileSync(join(dir, f))); } catch (e) { bledy.push(`${j}/${f}: ${e.message}`); continue; }
      rozmiary.add(`${info.width}x${info.height}`);
      if (!WYMIARY_ZEGARKA.some(([w, h]) => w === info.width && h === info.height)) bledy.push(`${j}/${f}: rozmiar ${info.width}×${info.height} spoza listy Apple Watch`);
      if (rozmiar && `${info.width}x${info.height}` !== rozmiar) bledy.push(`${j}/${f}: rozmiar ${info.width}×${info.height}, oczekiwany ${rozmiar}`);
      if (info.alpha) bledy.push(`${j}/${f}: kanał alfa albo przezroczystość (App Store Connect odrzuca)`);
    }
  }
  if (rozmiary.size > 1) bledy.push(`zestaw ma ${rozmiary.size} rozmiarów (${[...rozmiary].join(', ')}); Apple: ten sam rozmiar we wszystkich lokalizacjach`);
  return bledy;
}

function main() {
  const [tryb, a, b, c, d] = process.argv.slice(2);
  try {
    if (tryb === 'plan' && a !== undefined) { console.log(rozwiazJezyki(a).join(',')); return 0; }
    if (tryb === 'stany' && a && b && c) {
      for (const o of zapiszStany(a, rozwiazJezyki(b), c)) console.error(`OSTRZEŻENIE ${o}`);
      return 0;
    }
    if (tryb === 'rozne' && a && b) return rozne(readFileSync(a), readFileSync(b)) ? 0 : 1;
    if (tryb === 'komplet' && a && b) {
      const bledy = kontroluj(a, rozwiazJezyki(b), c || null);
      for (const e of bledy) console.log(`BŁĄD ${e}`);
      console.log(bledy.length ? `${bledy.length} błędów` : `OK: komplet ${rozwiazJezyki(b).length} języków × ${KADRY.length} kadry, jeden rozmiar z listy Apple, bez alfy`);
      return bledy.length ? 1 : 0;
    }
  } catch (e) { console.error(`BŁĄD ARGUMENTU: ${e.message}`); return 2; }
  console.error('użycie: zegarek-kadry.mjs plan <jezyki|all> | stany <katalog> <jezyki|all> <RRRR-MM-DD> | rozne <a.png> <b.png> | komplet <katalog> <jezyki|all> [WxH]');
  return 2;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main());

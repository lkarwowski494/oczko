#!/usr/bin/env node
// Kontrola pikseli kadrów 03 i 04 (rola 08, 10-wydanie-019, KO-043; recenzja AM): w każdym zestawie klasa/język kadr 04 (zakreślenie na wzorze) musi mieć WIĘCEJ żółtych pasów zakreślenia
// niż kadr 03. Dlaczego: licznik `wzor-zakreslenia` z interfejsu liczy pociągnięcia w danych, nie w pikselach — przebieg 43070136577 miał licznik „2” i jeden widoczny pas, a nic tego nie wychwyciło.
// Układ jak komplet-zrzutow.mjs: <katalog>/[warunek-og07/]<klasa>/<język>/{03-wzor,04-zakreslenie}.png. Para bez jednej sceny = pominięcie z komunikatem (brak sceny zgłasza komplet-zrzutow.mjs).
// Wymaga ImageMagicka (`convert`; zadanie „komplet” zrzuty-sklepu.yml instaluje go wcześniej). Plik nieczytelny = BŁĄD z nazwą pliku (nie ciche pominięcie).
// Użycie: node scripts/ci/kontrola-zakreslen.mjs <katalog_surowych>  → kod 1 przy jakimkolwiek BŁĘDZIE; inaczej 0.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SCENA_PRZED = '03-wzor.png';
export const SCENA_PO = '04-zakreslenie.png';
/** Szerokość, do której zmniejszamy zrzut przed analizą (kierunek: szybkość; pas ma wtedy ≥ ok. 8 wierszy). */
const SZEROKOSC_ANALIZY = 500;
/** Wiersz jest „żółty”, gdy ≥ 20% jego pikseli ma barwę zakreślacza (pociągnięcie 20–80% szerokości ekranu; tekst na pasie zabiera część pikseli). */
const UDZIAL_WIERSZA = 0.2;
/** Pas = co najmniej tyle kolejnych żółtych wierszy (cienka linia, krawędź, artefakt nie jest pasem); przerwy do MAX_PRZERWA wierszy (tekst na pasie) nie dzielą pasa. */
const MIN_WIERSZY_PASA = 3;
const MAX_PRZERWA = 2;

/** Barwa zakreślacza na białej stronie: zmierzone w artefakcie przebiegu 43070136577 (248,232,123; 250,237,152). Tło interfejsu (238,235,230) i przycisk (192,132,37) nie pasują. */
export const jestZolty = (r, g, b) => r >= 230 && g >= 210 && b <= 190 && r - b >= 50;

/** Liczba żółtych pasów w obrazie RGB (3 bajty na piksel, wiersz po wierszu). */
export function liczPasy(rgb, w, h) {
  if (rgb.length !== w * h * 3) throw new Error(`rozmiar bufora ${rgb.length} ≠ ${w}×${h}×3`);
  const prog = Math.ceil(w * UDZIAL_WIERSZA);
  const wiersze = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0, i = y * w * 3; x < w; x++, i += 3) if (jestZolty(rgb[i], rgb[i + 1], rgb[i + 2])) n++;
    if (n >= prog) wiersze.push(y);
  }
  let pasy = 0; let start = -1; let ostatni = -1;
  const zamknij = () => { if (start >= 0 && ostatni - start + 1 >= MIN_WIERSZY_PASA) pasy++; };
  for (const y of wiersze) {
    if (start >= 0 && y - ostatni - 1 <= MAX_PRZERWA) { ostatni = y; continue; }
    zamknij(); start = y; ostatni = y;
  }
  zamknij();
  return pasy;
}

/** Wczytuje PNG przez ImageMagick (zmniejszony, bez alfy); rzuca z komunikatem, gdy się nie da. */
export function wczytajRgb(plik) {
  const wspolne = [plik, '-resize', `${SZEROKOSC_ANALIZY}x>`, '-alpha', 'off', '-depth', '8'];
  const wym = spawnSync('convert', [...wspolne, '-format', '%w %h', 'info:'], { encoding: 'utf8' });
  if (wym.error || wym.status !== 0) throw new Error(`convert nie odczytał wymiarów: ${(wym.error?.message ?? wym.stderr ?? '').trim().slice(0, 200)}`);
  const m = /^(\d+) (\d+)$/.exec(wym.stdout.trim());
  if (!m) throw new Error(`nieoczekiwany wynik wymiarów: ${wym.stdout.slice(0, 80)}`);
  const w = Number(m[1]); const h = Number(m[2]);
  const px = spawnSync('convert', [...wspolne, 'rgb:-'], { maxBuffer: 256 * 1024 * 1024 });
  if (px.error || px.status !== 0) throw new Error(`convert nie odczytał pikseli: ${(px.error?.message ?? String(px.stderr)).trim().slice(0, 200)}`);
  return { rgb: px.stdout, w, h };
}

function znajdz(katalog, wynik = []) {
  if (!existsSync(katalog)) return wynik;
  for (const n of readdirSync(katalog).sort()) {
    const p = join(katalog, n);
    if (statSync(p).isDirectory()) znajdz(p, wynik);
    else if (n === SCENA_PRZED || n === SCENA_PO) wynik.push(p);
  }
  return wynik;
}

/** Sprawdza wszystkie pary 03/04 w katalogu; zwraca linie wyniku i liczbę błędów. */
export function sprawdz(katalog, wczytaj = wczytajRgb) {
  const pary = new Map();
  for (const p of znajdz(katalog)) {
    const rel = relative(katalog, p).split(sep);
    const scena = rel.pop();
    const etykieta = rel.filter((s) => s !== 'warunek-og07').join('/');
    const para = pary.get(etykieta) ?? {};
    para[scena === SCENA_PRZED ? 'przed' : 'po'] = p;
    pary.set(etykieta, para);
  }
  const linie = []; let bledy = 0; let sprawdzone = 0;
  for (const [etykieta, { przed, po }] of [...pary].sort(([a], [b]) => a.localeCompare(b))) {
    if (!przed || !po) { linie.push(`POMINIĘTO ${etykieta}: brak ${przed ? SCENA_PO : SCENA_PRZED} (brak sceny zgłasza komplet-zrzutow.mjs)`); continue; }
    const licz = (plik) => { try { const { rgb, w, h } = wczytaj(plik); return liczPasy(rgb, w, h); } catch (e) { linie.push(`BŁĄD ${plik}: ${e instanceof Error ? e.message : String(e)}`); bledy++; return null; } };
    const a = licz(przed); const b = licz(po);
    if (a === null || b === null) continue;
    sprawdzone++;
    if (b > a) linie.push(`OK ${etykieta}: 03=${a}, 04=${b} pasów zakreślenia`);
    else { linie.push(`BŁĄD ${po}: 04=${b} pasów zakreślenia, 03=${a} — kadr 04 musi mieć więcej niż 03 (licznik w interfejsie nie dowodzi widoczności pociągnięcia)`); bledy++; }
  }
  // AQ (P3, KO-046): zero par = kontrola nic nie sprawdziła, więc to błąd, nie notatka. Sceny 03/04 powstają w każdym przebiegu (bez OG-07 w `warunek-og07/`, który też przeszukujemy).
  if (pary.size === 0) { linie.push(`BŁĄD ${katalog}: brak par 03/04 do sprawdzenia — kontrola nic nie sprawdziła (brak katalogu, pusty zestaw albo sceny 03/04 nie powstały; komplet-zrzutow.mjs wskaże braki)`); bledy++; }
  return { linie, bledy, sprawdzone };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kat] = process.argv.slice(2);
  if (!kat) { console.error('użycie: node scripts/ci/kontrola-zakreslen.mjs <katalog_surowych>'); process.exit(2); }
  const { linie, bledy, sprawdzone } = sprawdz(kat);
  for (const l of linie) console.log(l);
  console.log(bledy ? `Kontrola zakreśleń: ${bledy} błędów` : `Kontrola zakreśleń: OK (${sprawdzone} par)`);
  process.exit(bledy ? 1 : 0);
}

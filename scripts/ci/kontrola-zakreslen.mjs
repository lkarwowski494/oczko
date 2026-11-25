#!/usr/bin/env node
// Kontrola pikseli kadrów 03 i 04 (rola 08, 10-wydanie-019, KO-043; recenzja AM): w każdym zestawie klasa/język kadr 04 (zakreślenie na wzorze) musi mieć WIĘCEJ żółtych pasów zakreślenia
// niż kadr 03. Dlaczego: licznik `wzor-zakreslenia` z interfejsu liczy pociągnięcia w danych, nie w pikselach — przebieg 43070136577 miał licznik „2” i jeden widoczny pas, a nic tego nie wychwyciło.
// Układ jak komplet-zrzutow.mjs: <katalog>/[warunek-og07/]<klasa>/<język>/{03-wzor,04-zakreslenie}.png. Para bez jednej sceny = pominięcie z komunikatem (brak sceny zgłasza komplet-zrzutow.mjs).
// ZR7 (KO-195, P-1016): dodatkowo kadr 04 musi mieć pas 2 NA WIERSZU 13 tekstu strony (polozeniePasa): przebieg 45021511463 przeszedł z „OK (27 par)” mimo pasa 2 poza wierszem w 10 językach (strona PDF przesuwa się
// zależnie od liczby linii podpowiedzi, a pas stoi na stałej wysokości ekranu); sama liczba pasów tego nie widzi. Sprawdzenie dotyczy każdego kadru 04, także bez pary 03.
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
/** Wiersz jest „żółty”, gdy ≥ 15% jego pikseli ma barwę zakreślacza (pociągnięcie 20–80% szerokości ekranu; tekst na pasie zabiera część pikseli — w wierszach z tekstem zostaje 70–110 z 500 px).
 * P-1005 (KO-188): było 0,2 (100 px przy 500 px szerokości). Przy g ≥ 225 wszystkie 4 pary 03<04 i 0 pasów na kadrach 01/02/05–07 dla progu 18–86 px (0,036–0,172); górną granicę wyznacza ipad-13/en (pas wiersza 13: 109, 114, 86 px). 0,15 = 75 px: margines 11 px (0,022 szerokości) do pierwszej porażki, największy w oknie 0,15–0,18. */
const UDZIAL_WIERSZA = 0.15;
/** Pas = co najmniej tyle kolejnych żółtych wierszy (cienka linia, krawędź, artefakt nie jest pasem); przerwy do MAX_PRZERWA wierszy (tekst na pasie) nie dzielą pasa. */
const MIN_WIERSZY_PASA = 3;
const MAX_PRZERWA = 2;

/** Barwa zakreślacza na białej stronie: zmierzone w artefakcie przebiegu 43070136577 (248,232,123; 250,237,152) oraz 44722734741 (pas wiersza 9 na iPadzie: 252,245,194–196 — jaśniejszy, bo bliżej bieli). Tło interfejsu (238,235,230) i przycisk (192,132,37) nie pasują.
 * Kalibracja P-1004 (KO-187): było b ≤ 190 i r−b ≥ 50 (odrzucało pas 252,245,195); jest b ≤ 205 i r−b ≥ 40.
 * Zawężenie P-1005 (KO-188): g ≥ 225 zamiast 210 — beż 240,221,182 elementu strony Dziś (g 219–224) przestaje być „żółty”; pasy zakreślenia mają g 232–248. Ryzyko jawne: nominalny #F6E04A (g = 224) już nie pasuje; w zmierzonych przebiegach pas ma zawsze g ≥ 232. */
export const jestZolty = (r, g, b) => r >= 230 && g >= 225 && b <= 205 && r - b >= 40;

/** Zakresy wierszy [od, do] żółtych pasów w obrazie RGB (3 bajty na piksel, wiersz po wierszu), od góry do dołu. */
export function zakresyPasow(rgb, w, h) {
  if (rgb.length !== w * h * 3) throw new Error(`rozmiar bufora ${rgb.length} ≠ ${w}×${h}×3`);
  const prog = Math.ceil(w * UDZIAL_WIERSZA);
  const wiersze = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0, i = y * w * 3; x < w; x++, i += 3) if (jestZolty(rgb[i], rgb[i + 1], rgb[i + 2])) n++;
    if (n >= prog) wiersze.push(y);
  }
  const pasy = []; let start = -1; let ostatni = -1;
  const zamknij = () => { if (start >= 0 && ostatni - start + 1 >= MIN_WIERSZY_PASA) pasy.push([start, ostatni]); };
  for (const y of wiersze) {
    if (start >= 0 && y - ostatni - 1 <= MAX_PRZERWA) { ostatni = y; continue; }
    zamknij(); start = y; ostatni = y;
  }
  zamknij();
  return pasy;
}

/** Liczba żółtych pasów w obrazie RGB. */
export const liczPasy = (rgb, w, h) => zakresyPasow(rgb, w, h).length;

/* ZR7 (P-1016): położenie pasa 2 względem wiersza 13. Rachunek jak `pasy-pomiar.py` z WR4 (docs/jakosc/werdykt-1221/wr4/), na kadrze zmniejszonym do SZEROKOSC_ANALIZY.
 * Wiersz tekstu = skupisko wierszy pikseli z ≥ MIN_CIEMNYCH ciemnych (średnia RGB < PROG_CIEMNY) w pasie poziomym kadru [CIEMNE_OD, CIEMNE_DO] szerokości (poza paskami narzędzi po bokach);
 * przerwa ≤ MAX_PRZERWA_TEKSTU wierszy nie dzieli wiersza (litery z ogonkami). Pas 1 leży na wierszu 9 (to najbliższy mu wiersz); wiersz 13 = dwa wiersze niżej (Row 9, „Rows 10-12”, Row 13).
 * Kryterium: środek pasa 2 leży od środka wiersza 13 nie dalej niż ODCHYLENIE_MAX · wysokość wiersza. */
/** Średnia RGB poniżej tej wartości = piksel tekstu (czarny tekst strony; pas żółty ma średnią > 200). */
const PROG_CIEMNY = 140;
/** Wiersz pikseli jest „tekstem”, gdy ma co najmniej tyle ciemnych pikseli (przy 500 px szerokości; pojedyncza kreska litery ma 1–2 px). */
const MIN_CIEMNYCH = 3;
/** Zakres poziomy analizy tekstu (ułamek szerokości kadru): pomija przyciski i podpisy przy krawędziach, zostawia kolumnę tekstu strony. */
const CIEMNE_OD = 0.12; const CIEMNE_DO = 0.92;
const MAX_PRZERWA_TEKSTU = 2;
/** Dopuszczalne odchylenie środka pasa od środka wiersza w wysokościach wiersza. Zmierzone w 29 kadrach iPhone (przebiegi 45021511463, 44758366101): poprawne 0,06–0,61 (21 kadrów, w tym iPad en/pl 0,19 i 0,11), błędne 1,20–1,83 (10 kadrów: de/el/fr/nl/ro/ru/uk 1,25, ja 1,20, id/ms 1,83; pomiar na pełnych kadrach 1320×2868 i na wycinkach z testu daje to samo);
 * 0,9 = środek luki (0,61 … 1,20 → margines 0,29 i 0,30). Powyżej 1,0 pas leży już na sąsiednim wierszu albo między wierszami. */
export const ODCHYLENIE_MAX = 0.9;

/** Wiersze tekstu [od, do] w kadrze (od góry do dołu). */
export function wierszeTekstu(rgb, w, h) {
  const x0 = Math.floor(w * CIEMNE_OD); const x1 = Math.ceil(w * CIEMNE_DO);
  const wiersze = []; let biezacy = null;
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = x0, i = (y * w + x0) * 3; x < x1; x++, i += 3) if ((rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3 < PROG_CIEMNY) n++;
    if (n < MIN_CIEMNYCH) continue;
    if (biezacy && y - biezacy[1] - 1 <= MAX_PRZERWA_TEKSTU) biezacy[1] = y; else { biezacy = [y, y]; wiersze.push(biezacy); }
  }
  return wiersze;
}

/** Położenie pasa 2 względem wiersza 13: `{ ok, pas, wiersz, odchylenie, powod }` (odchylenie w wysokościach wiersza; powód przy ok = false). Rzuca, gdy w kadrze nie ma dwóch pasów. */
export function polozeniePasa(rgb, w, h) {
  const pasy = zakresyPasow(rgb, w, h);
  if (pasy.length < 2) throw new Error(`kadr ma ${pasy.length} pas(ów), a położenie pasa 2 wymaga dwóch`);
  const srodek = ([a, b]) => (a + b) / 2;
  const wiersze = wierszeTekstu(rgb, w, h);
  if (wiersze.length === 0) return { ok: false, pas: pasy[1], wiersz: null, odchylenie: null, powod: 'w kadrze nie ma wierszy tekstu strony (analiza położenia niemożliwa)' };
  const odl = (p, wi) => Math.abs(srodek(p) - srodek(wi));
  let k9 = 0;
  for (let i = 1; i < wiersze.length; i++) if (odl(pasy[0], wiersze[i]) < odl(pasy[0], wiersze[k9])) k9 = i;
  const w13 = wiersze[k9 + 2];
  if (!w13) return { ok: false, pas: pasy[1], wiersz: null, odchylenie: null, powod: `pod wierszem 9 (pas 1) jest ${wiersze.length - 1 - k9} wiersz(y) tekstu, a wiersz 13 to drugi z nich` };
  const odchylenie = odl(pasy[1], w13) / (w13[1] - w13[0] + 1);
  return { ok: odchylenie <= ODCHYLENIE_MAX, pas: pasy[1], wiersz: w13, odchylenie, powod: odchylenie <= ODCHYLENIE_MAX ? '' : `środek pasa 2 (y=${srodek(pasy[1])}) leży ${odchylenie.toFixed(2)} wysokości wiersza od środka wiersza 13 (y=${srodek(w13)}; próg ${ODCHYLENIE_MAX})` };
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
  // ZR7 (P-1016): położenie pasa 2 względem wiersza 13 w każdym kadrze 04 (także gdy brak pary 03: to osobna własność kadru).
  for (const [etykieta, { po }] of [...pary].sort(([a], [b]) => a.localeCompare(b))) {
    if (!po) continue;
    try {
      const { rgb, w, h } = wczytaj(po);
      if (liczPasy(rgb, w, h) < 2) continue; // za mało pasów zgłasza kontrola liczby pasów powyżej
      const p = polozeniePasa(rgb, w, h);
      if (p.ok) linie.push(`POŁOŻENIE OK ${etykieta}: pas 2 na wierszu 13 (odchylenie ${p.odchylenie.toFixed(2)} wysokości wiersza, próg ${ODCHYLENIE_MAX})`);
      else { linie.push(`BŁĄD ${po}: pas 2 poza wierszem 13 — ${p.powod}`); bledy++; }
    } catch (e) { linie.push(`BŁĄD ${po}: położenie pasa 2: ${e instanceof Error ? e.message : String(e)}`); bledy++; }
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

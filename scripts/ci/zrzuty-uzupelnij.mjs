#!/usr/bin/env node
// Uzupełnianie przebiegu zrzutów sklepu (zrzuty-sklepu.yml; rola 10-wydanie, 10-wydanie-002, 2026-11-10).
// Po co: przy `[zrzuty-jezyki:all]` przebieg trwa ≈ 10 h; jedna nieudana scena w jednym języku nie może kosztować kolejnych 10 h. Analogia z Treningiem (P-315, Z-… 29.10.2026):
// trening:.github/workflows/store-screenshots.yml:37-44 (wejścia `uzupelnij_z_przebiegu`, `powtorz`), trening:scripts/ci/store-powtorz.mjs:8-20 (usuwanie ekranów do powtórki),
// trening:scripts/ci/store-shards.mjs:36-50 (brakujące ekrany jako waga zadania). Różnica nazwana: Trening kopiuje gotowe pliki w zadaniach macOS; tu zadania macOS robią TYLKO brakujące sceny
// (plan niesie je w macierzy, pole `sceny`), a gotowe zrzuty poprzedniego przebiegu nakłada dopiero zadanie „zbierz” (ubuntu) — maszyny macOS nie pobierają setek MB.
// Układ katalogów (surowe zrzuty z zrzuty-sklepu.sh): `<klasa>/<język>/NN-scena.png` i `warunek-og07/<klasa>/<język>/NN-scena.png` (sceny wzoru 03 i 04 do znacznika [og07-ok]).
// Użycie:
//   node scripts/ci/zrzuty-uzupelnij.mjs powtorz   <katalog_poprzednich> "<lista: język/NN-scena[,…]; en/99-zakup = powtórka zrzutu zakupu>"
//   node scripts/ci/zrzuty-uzupelnij.mjs nalozenie <katalog_poprzednich> <katalog_surowych> <og07: true|false>   (poprzednie uzupełniają braki, nowe nie są nadpisywane)
//   node scripts/ci/zrzuty-uzupelnij.mjs data      <katalog_poprzednich> <dzień RRRR-MM-DD> <języki|all> <urządzenia>   (AQ, KO-046: inna data paska iPada w źródle → zestaw iPada do powtórzenia)
//   node scripts/ci/zrzuty-uzupelnij.mjs znacznik  <katalog_poprzednich|-> <dzień RRRR-MM-DD> <urządzenia> <plik_wyjściowy>   (zrzuty-daty.json do artefaktu surowych zrzutów)
// Błąd wejścia = kod 2.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KLASY, WARUNKOWE, ZAWSZE } from './komplet-zrzutow.mjs';

/** Zegar APLIKACJI w kadrach (treść, np. „wtorek, 10 listopada”). Stała, bo fikstura (00-przygotuj.yaml: sesje 3, 5 i 9 XI) jest bezwzględna względem „dziś”: ruchomy zegar zepsułby Historię, kalendarz i „This week”.
 *  Ustala ją plan (zrzuty-jezyki.mjs) i niesie w macierzy do każdego zadania zrzutów; scripts/ci/zrzuty-sklepu.sh nie ma własnej kopii (AQ, KO-046). */
export const ZRZUTY_TERAZ = '2026-11-10T09:41:00';
/** Plik w artefakcie `sklep-zrzuty-surowe`: jakich dat dotyczy zestaw. `dzienIpada` = data MASZYNY, którą pasek iPada pokazuje na zrzutach (simctl nie przyjmuje ISO, więc daty paska nie ustawimy). */
export const PLIK_DAT = 'zrzuty-daty.json';
export const SCENY = [...ZAWSZE, ...WARUNKOWE].sort();
export const ZAKUP = '99-zakup';
export const KATALOG_WARUNKOWY = 'warunek-og07';
const WPIS = /^([A-Za-z]{2,3}(?:-[A-Za-z0-9]+)?)\/(\d{2}-[a-z]+)$/;

/** Lista „język/scena[,…]” → { pary: [{ jezyk, scena }], zakup }. Zły wpis albo nieznana scena = błąd (zasada: nie cicho pomijać). `en/99-zakup` to zrzut zakupu (tylko po angielsku), nie plik kompletu. */
export function parsujPowtorz(lista) {
  const pary = []; let zakup = false;
  for (const w of String(lista ?? '').split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = WPIS.exec(w);
    if (!m) throw new Error(`zły wpis w powtorz: „${w}” (wzór: język/NN-scena, np. ja/04-zakreslenie; zakup: en/99-zakup)`);
    const [, jezyk, scena] = m;
    if (scena === ZAKUP) { if (jezyk !== 'en') throw new Error(`zakup (99-zakup) robimy tylko po angielsku: „${w}”`); zakup = true; continue; }
    if (!SCENY.includes(scena)) throw new Error(`nieznana scena w powtorz: „${w}” (dozwolone: ${SCENY.join(', ')})`);
    pary.push({ jezyk, scena });
  }
  return { pary, zakup };
}

const niepusty = (f) => existsSync(f) && statSync(f).isFile() && statSync(f).size > 0;
/** Scena gotowa = niepusty plik w katalogu klasy albo (sceny wzoru) w katalogu warunkowym OG-07. */
export function gotowa(katalog, klasa, jezyk, scena) {
  return niepusty(join(katalog, klasa, jezyk, `${scena}.png`)) || niepusty(join(katalog, KATALOG_WARUNKOWY, klasa, jezyk, `${scena}.png`));
}
/** Sceny języka, których w poprzednim przebiegu nie ma (kolejność jak w SCENY). */
export function brakujace(katalog, urzadzenie, jezyk) {
  return SCENY.filter((s) => !gotowa(katalog, KLASY[urzadzenie], jezyk, s));
}

/** Usuwa z katalogu poprzednich wskazane pary (we wszystkich klasach i w katalogu warunkowym), więc plan liczy je jako brakujące; zwraca usunięte ścieżki względne. */
export function powtorz(katalog, lista) {
  const { pary } = parsujPowtorz(lista);
  const usuniete = [];
  if (!pary.length || !existsSync(katalog)) return usuniete;
  for (const { jezyk, scena } of pary) {
    for (const k of readdirSync(katalog)) {
      const klasy = k === KATALOG_WARUNKOWY ? readdirSync(join(katalog, k)).map((c) => join(k, c)) : [k];
      for (const kl of klasy) {
        const f = join(katalog, kl, jezyk, `${scena}.png`);
        if (existsSync(f)) { unlinkSync(f); usuniete.push(relative(katalog, f)); }
      }
    }
  }
  return usuniete;
}

/** Dzień przebiegu w formie RRRR-MM-DD (prawdziwa data kalendarzowa) albo błąd. */
export function sprawdzDzien(d) {
  const t = String(d ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t) || new Date(`${t}T00:00:00Z`).toISOString().slice(0, 10) !== t) throw new Error(`zły dzień przebiegu: „${t}” (wzór RRRR-MM-DD, prawdziwa data)`);
  return t;
}
/** Znacznik dat przebiegu źródłowego; brak katalogu, pliku albo zły JSON = null (data nieznana). */
export function czytajDaty(katalog) {
  try {
    const d = JSON.parse(readFileSync(join(katalog, PLIK_DAT), 'utf8'));
    return d && typeof d === 'object' && (d.dzienIpada === null || typeof d.dzienIpada === 'string') ? { teraz: String(d.teraz ?? ''), dzienIpada: d.dzienIpada } : null;
  } catch { return null; }
}
function jezykiKlasy(katalog, klasa) {
  const w = new Set();
  for (const baza of [join(katalog, klasa), join(katalog, KATALOG_WARUNKOWY, klasa)]) {
    if (!existsSync(baza)) continue;
    for (const j of readdirSync(baza)) if (readdirSync(join(baza, j)).some((f) => f.endsWith('.png'))) w.add(j);
  }
  return w;
}
/** Spójność dat paska iPada (AQ, KO-046): wszystkie sceny iPada kompletu mają jedną datę paska. Gdy przebieg robi iPada, a źródło ma zrzuty iPada z inną albo nieznaną datą paska,
 *  usuwa z `poprzednie` CAŁY zestaw iPada (plan policzy go jako brakujący i zrobi od nowa). Zestaw iPada języka spoza listy przebiegu = błąd (nie zostałby powtórzony: zniknąłby z kompletu).
 *  Zwraca `{ usuniete: [języki], komunikat }`; iPhone (brak daty na pasku) nietknięty. */
export function dataIpada(katalog, dzien, urzadzenia, jezyki) {
  const d = sprawdzDzien(dzien);
  const wynik = { usuniete: [], komunikat: 'iPad: data paska bez zmian, zestaw ze źródła zostaje' };
  if (!urzadzenia.includes('ipad')) return { ...wynik, komunikat: 'iPad: poza przebiegiem, zrzuty ze źródła zostają' };
  const jezykiZrodla = jezykiKlasy(katalog, KLASY.ipad);
  if (!jezykiZrodla.size) return { ...wynik, komunikat: 'iPad: źródło bez zrzutów iPada' };
  const daty = czytajDaty(katalog);
  if (daty?.dzienIpada === d) return wynik;
  if (!jezyki.includes('all')) {
    const obce = [...jezykiZrodla].filter((j) => !jezyki.includes(j));
    if (obce.length) throw new Error(`zrzuty iPada ze źródła (język: ${obce.join(', ')}) mają inną albo nieznaną datę paska niż ten przebieg (${d}) i muszą być zrobione od nowa, ale języka nie ma na liście przebiegu — dodaj go do jezyki (albo wpisz all)`);
  }
  for (const k of [join(katalog, KLASY.ipad), join(katalog, KATALOG_WARUNKOWY, KLASY.ipad)]) rmSync(k, { recursive: true, force: true });
  const skad = daty ? `data paska iPada w źródle ${daty.dzienIpada ?? '(brak)'}` : 'źródło bez znacznika dat (sprzed zmiany AQ)';
  return { usuniete: [...jezykiZrodla].sort(), komunikat: `iPad: ${skad}, w przebiegu ${d} — zestaw iPada ze źródła usunięty z uzupełnienia (języki: ${[...jezykiZrodla].sort().join(', ')}) i zostanie zrobiony od nowa, żeby wszystkie sceny miały jedną datę na pasku` };
}
/** Zawartość `zrzuty-daty.json` nowego kompletu: iPad w przebiegu → jego dzień; bez iPada zostaje data ze źródła (zrzuty iPada ze źródła zostały) albo null. */
export function znacznik(zrodlo, dzien, urzadzenia) {
  const d = sprawdzDzien(dzien);
  return { teraz: ZRZUTY_TERAZ, dzienIpada: urzadzenia.includes('ipad') ? d : (zrodlo ? czytajDaty(zrodlo)?.dzienIpada ?? null : null) };
}

function pliki(kat) {
  const w = [];
  for (const e of existsSync(kat) ? readdirSync(kat, { withFileTypes: true }) : []) {
    const p = join(kat, e.name);
    if (e.isDirectory()) w.push(...pliki(p)); else if (e.name.endsWith('.png')) w.push(p);
  }
  return w;
}
/** Nakłada poprzednie zrzuty na surowe z bieżącego przebiegu: brakujące pliki są kopiowane, istniejące (nowe) nie są nadpisywane, puste pomijane.
 *  og07=true: sceny wzoru z katalogu warunkowego poprzedniego przebiegu trafiają do kompletu (`<klasa>/<język>/`), jak przy znaczniku [og07-ok]. Zwraca liczbę skopiowanych plików. */
export function nalozenie(poprzednie, surowe, og07) {
  let n = 0;
  for (const f of pliki(poprzednie)) {
    if (!niepusty(f)) continue;
    let rel = relative(poprzednie, f);
    if (og07 && rel.split(/[\\/]/)[0] === KATALOG_WARUNKOWY) rel = rel.split(/[\\/]/).slice(1).join('/');
    const cel = join(surowe, rel);
    const kolega = rel.split(/[\\/]/)[0] === KATALOG_WARUNKOWY ? null : join(surowe, KATALOG_WARUNKOWY, rel); // nowy przebieg (og07=false) zrobił scenę wzoru w katalogu warunkowym
    if (existsSync(cel) || (kolega && existsSync(kolega))) continue;
    mkdirSync(dirname(cel), { recursive: true }); copyFileSync(f, cel); n++;
  }
  return n;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, a, b, c] = process.argv.slice(2);
  try {
    if (cmd === 'powtorz') {
      const u = powtorz(a, b);
      console.log(u.length ? `Do powtórzenia (usunięte z uzupełnienia): ${u.join(', ')}` : 'powtorz: nic do usunięcia');
    } else if (cmd === 'nalozenie') {
      console.log(`Uzupełnienie: ${nalozenie(a, b, c === 'true')} plików z poprzedniego przebiegu (nie robione od nowa)`);
    } else if (cmd === 'data') {
      const [dzien, jezyki, urz] = [b, c, process.argv[6]];
      console.log(dataIpada(a, dzien, String(urz ?? '').split(',').filter(Boolean), String(jezyki ?? '').split(',').map((x) => x.trim()).filter(Boolean)).komunikat);
    } else if (cmd === 'znacznik') {
      const [urz, wyjscie] = [c, process.argv[6]];
      if (!wyjscie) throw new Error('użycie: znacznik <poprzednie|-> <dzień> <urządzenia> <plik>');
      writeFileSync(wyjscie, `${JSON.stringify(znacznik(a === '-' ? null : a, b, String(urz).split(',').filter(Boolean)))}\n`);
      console.log(`Znacznik dat: ${wyjscie}`);
    } else throw new Error('użycie w nagłówku pliku');
  } catch (e) { console.error(`BŁĄD: ${e.message}`); process.exit(2); }
}

#!/usr/bin/env node
// Badanie fraz do słów kluczowych (P-501; reguła Treningu: frazy z badania App Store w kraju, nie z przekładu — docs/45-widocznosc-w-sklepie.md Treningu, „Metoda i kontrola”).
// Źródło: wyszukiwarka sklepu (iTunes Search API, https://itunes.apple.com/search, entity=software, limit=25) w storefroncie kraju lokalizacji, dla zapytań ze słownika terminów
// (licznik rzędów, robótka, szydełkować, robić na drutach — wyrazy zalecane w języku). Z nazw wyników liczone są słowa (df = w ilu różnych aplikacjach). Do pliku trafiają TYLKO słowa i liczby
// (df ≥ 3), bez nazw aplikacji i firm (P-121/P-466); słowa jednej aplikacji (nazwy własne) odpadają progiem df. Surowe wyniki nie są zapisywane.
// Pliki: docs/wydanie/metadane/frazy-badanie.json (24 lokalizacje generowane; pięć z pól stałych nie potrzebuje badania). Wyniki są sygnałem, nie liczbą wyszukań (brak płatnych narzędzi).
// Użycie: node scripts/wydanie/frazy-badanie.mjs [--tylko cs,sk] [--wyjscie plik.json]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KORZEN = fileURLToPath(new URL('../..', import.meta.url));
/** Lokalizacja ASC → kod kraju storefrontu iTunes (24 lokalizacje generowane; pl, ja, no, de-DE, fr-FR mają pola stałe z badania E1). */
export const KRAJE = { cs: 'cz', sk: 'sk', hr: 'hr', sl: 'si', uk: 'ua', ru: 'ru', hu: 'hu', ro: 'ro', it: 'it', 'es-ES': 'es', 'es-MX': 'mx', 'pt-PT': 'pt', 'pt-BR': 'br', 'nl-NL': 'nl', sv: 'se', da: 'dk', fi: 'fi', tr: 'tr', el: 'gr', id: 'id', ms: 'my', vi: 'vn', ko: 'kr', 'zh-Hant': 'tw' };
const JEZYK = { 'es-ES': 'es', 'es-MX': 'es-419', 'pt-PT': 'pt', 'nl-NL': 'nl', 'zh-Hant': 'zh-Hant' };
const POJECIA = ['licznik', 'robotka', 'szydelkowac', 'dziergac_na_drutach'];
/** Słowa ogólne sklepu, nie niosą frazy (lista minimalna; reszta słów funkcyjnych zostaje — model dostaje je jako surowe dane). */
const OGOLNE = ['app', 'apps', 'free', 'lite', 'pro', 'the', 'and', 'for', 'with', 'ios', 'iphone', 'ipad', 'apple', 'watch'];

export const wczytajSlownik = (root = KORZEN) => JSON.parse(readFileSync(join(root, 'docs/lokalizacja/slownik-terminow.json'), 'utf8'));

/** Zapytania dla lokalizacji: zalecane wyrazy pojęć ze słownika terminów (bez nawiasów, bez „nie zbadano”). */
export function zapytania(loc, slownik) {
  const kod = JEZYK[loc] ?? loc, w = [];
  for (const id of POJECIA) {
    const t = slownik.pojecia.find((p) => p.id === id)?.jezyki?.[kod];
    if (!t || t.nie_zbadano || !t.zalecany) continue;
    const q = String(t.zalecany).replace(/[（(][^）)]*[）)]/g, '').split(/\s*[/;]\s*/)[0].trim();
    if (q && !w.includes(q)) w.push(q);
  }
  return w;
}

const HAN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu;
function tokeny(nazwa) {
  const n = String(nazwa).normalize('NFC').toLowerCase(), t = new Set();
  for (const run of n.match(HAN) ?? []) for (let d = 2; d <= 3; d++) for (let i = 0; i + d <= [...run].length; i++) t.add([...run].slice(i, i + d).join(''));
  for (const w of n.replace(HAN, ' ').split(/[^\p{L}\p{N}\p{M}]+/u)) if ([...w].length >= 3 && !/^\p{N}+$/u.test(w)) t.add(w);
  return t;
}
/** Wyniki wyszukiwarki → [{ s, df }]: słowo z nazw, df = liczba RÓŻNYCH aplikacji (trackId), df ≥ minDf, bez zakazanych i ogólnych; malejąco po df. */
export function agreguj(wyniki, { zakazane = [], minDf = 2, max = 40 } = {}) {
  const wyklucz = new Set([...zakazane, ...OGOLNE].map((x) => x.toLowerCase())), df = new Map(), widziane = new Set();
  for (const r of wyniki) {
    if (widziane.has(r.trackId)) continue; widziane.add(r.trackId);
    for (const t of tokeny(r.trackName)) if (!wyklucz.has(t)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return [...df].filter(([, n]) => n >= minDf).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([s, n]) => ({ s, df: n }));
}

async function pobierz(fetchFn, spij, kraj, q, log) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=${kraj}&entity=software&limit=25`;
  for (let p = 0; p < 5; p++) {
    const r = await fetchFn(url);
    if (r.ok) return (await r.json()).results ?? [];
    if (![403, 429, 500, 502, 503].includes(r.status)) throw new Error(`HTTP ${r.status}`);
    log(`  ${kraj} „${q}”: HTTP ${r.status}, ponowienie ${p + 1}`); await spij(5000 * 2 ** p);
  }
  throw new Error(`${kraj} „${q}”: wyczerpano ponowienia`);
}

export async function main(argv, { fetchFn = globalThis.fetch, spij = (ms) => new Promise((r) => setTimeout(r, ms)), log = console.log, root = KORZEN, data = new Date().toISOString().slice(0, 10) } = {}) {
  const i = argv.indexOf('--tylko'), tylko = i >= 0 ? argv[i + 1].split(',') : Object.keys(KRAJE), j = argv.indexOf('--wyjscie');
  const plik = resolve(root, j >= 0 ? argv[j + 1] : 'docs/wydanie/metadane/frazy-badanie.json'), slownik = wczytajSlownik(root);
  const wynik = existsSync(plik) && i >= 0 ? JSON.parse(readFileSync(plik, 'utf8')) : { _opis: 'Słowa z nazw wyników wyszukiwarki App Store w kraju lokalizacji (df = liczba różnych aplikacji, ≥ 3); bez nazw aplikacji (P-121/P-466). Wejście do słów kluczowych (P-501); sygnał, nie liczba wyszukań.', odczyt: data, zrodlo: 'iTunes Search API (itunes.apple.com/search, entity=software, limit=25)', lokalizacje: {} };
  wynik.odczyt = data;
  for (const loc of tylko) {
    if (!KRAJE[loc]) { log(`pominięto ${loc}: brak kraju`); continue; }
    const q = zapytania(loc, slownik), wyniki = [];
    for (const z of q) { wyniki.push(...await pobierz(fetchFn, spij, KRAJE[loc], z, log)); await spij(2500); }
    const ids = new Set(wyniki.map((x) => x.trackId));
    wynik.lokalizacje[loc] = { kraj: KRAJE[loc], zapytania: q, aplikacji: ids.size, slowa: agreguj(wyniki, { minDf: 3 }) };
    log(`${loc}: ${ids.size} aplikacji, ${wynik.lokalizacje[loc].slowa.length} słów`);
  }
  writeFileSync(plik, JSON.stringify(wynik, null, 1) + '\n');
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = await main(process.argv.slice(2));

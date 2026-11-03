#!/usr/bin/env node
// Nakłada przekład cząstkowy (fala po zmianie źródła) z docs/lokalizacja/przeklad-api/<kod>.json na src/i18n/slowniki/<kod>.json.
//   DELTA=<plik z listą baz kluczy> node scripts/i18n/przeklad-zastosuj-delta.mjs <kod…>
// Dla każdej bazy z DELTA: stare formy w słowniku zastępuje formami z propozycji. Pary (język, baza) z `przetlumaczone_czesciowo`
// w docs/lokalizacja/oczekujace.json (zweryfikowane wcześniej) zostają nietknięte. Kolejność kluczy jak w en.json (baza), kategorie CLDR po kolei.
import { readFileSync, writeFileSync } from 'node:fs';
import { splaszcz, rozplaszcz, zbierz } from './przeklad-api.mjs';

const [, , ...kody] = process.argv;
if (!process.env.DELTA || !kody.length) { console.log('Użycie: DELTA=<plik.json> przeklad-zastosuj-delta.mjs <kod…>'); process.exit(2); }
const delta = new Set(JSON.parse(readFileSync(process.env.DELTA, 'utf8')));
const chronione = JSON.parse(readFileSync('docs/lokalizacja/oczekujace.json', 'utf8')).przetlumaczone_czesciowo ?? {};
const KAT = /_(zero|one|two|few|many|other)$/, RANGA = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 };
const baza = (k) => k.replace(KAT, '');
const kolejnosc = new Map(zbierz().map((p, i) => [p.klucz, i]));
for (const k of kody) {
  const sl = `src/i18n/slowniki/${k}.json`, aktualny = splaszcz(JSON.parse(readFileSync(sl, 'utf8')));
  const prop = JSON.parse(readFileSync(`docs/lokalizacja/przeklad-api/${k}.json`, 'utf8')).slownik;
  const wynik = {};
  for (const [x, v] of Object.entries(aktualny)) if (!delta.has(baza(x)) || (chronione[baza(x)] ?? []).includes(k)) wynik[x] = v;
  let nowe = 0;
  for (const [x, v] of Object.entries(prop)) if (delta.has(baza(x)) && !(chronione[baza(x)] ?? []).includes(k)) { wynik[x] = v; nowe++; }
  const klucz = (x) => [kolejnosc.get(baza(x)) ?? 1e9, RANGA[x.match(KAT)?.[1]] ?? 0, x];
  const posortowane = Object.fromEntries(Object.entries(wynik).sort(([a], [b]) => { const A = klucz(a), B = klucz(b); return A[0] - B[0] || A[1] - B[1] || (A[2] < B[2] ? -1 : A[2] > B[2] ? 1 : 0); }));
  writeFileSync(sl, JSON.stringify(rozplaszcz(posortowane), null, 2) + '\n');
  console.log(`${k}: ${nowe} kluczy nałożonych, ${Object.keys(posortowane).length} razem`);
}

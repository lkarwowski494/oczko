#!/usr/bin/env node
// Nakłada przekład cząstkowy fali (wynik workflowu: raport-przekladu/<kod>.json, pole `slownik`) na src/i18n/slowniki/<kod>.json.
//   node scripts/i18n/przeklad-zastosuj-delta.mjs [--raport raport-przekladu] [--zakres docs/lokalizacja/oczekujace.json] <kod…>
// Dla każdej bazy z zakresu: stare formy w słowniku zastępuje formami z raportu. Pary (język, baza) z `przetlumaczone_czesciowo`
// (zweryfikowane wcześniej) zostają nietknięte. Kolejność kluczy jak w en.json (baza), kategorie CLDR po kolei.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splaszcz, rozplaszcz, zbierz } from './przeklad-api.mjs';

const KAT = /_(zero|one|two|few|many|other)$/, RANGA = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 };
const baza = (k) => k.replace(KAT, '');

/** Czysta funkcja: płaski słownik języka + płaska propozycja → { wynik (posortowany), nowe }. */
export function nalozDelta(aktualny, prop, delta, chronione, kod, kolejnosc) {
  const chron = (b) => (chronione[b] ?? []).includes(kod), wynik = {};
  for (const [x, v] of Object.entries(aktualny)) if (!delta.has(baza(x)) || chron(baza(x))) wynik[x] = v;
  let nowe = 0;
  for (const [x, v] of Object.entries(prop)) if (delta.has(baza(x)) && !chron(baza(x))) { wynik[x] = v; nowe++; }
  const klucz = (x) => [kolejnosc.get(baza(x)) ?? 1e9, RANGA[x.match(KAT)?.[1]] ?? 0, x];
  const posortowane = Object.entries(wynik).sort(([a], [b]) => { const A = klucz(a), B = klucz(b); return A[0] - B[0] || A[1] - B[1] || (A[2] < B[2] ? -1 : A[2] > B[2] ? 1 : 0); });
  return { wynik: Object.fromEntries(posortowane), nowe };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const a = process.argv.slice(2), opt = { '--raport': 'raport-przekladu', '--zakres': 'docs/lokalizacja/oczekujace.json' }, kody = [];
  for (let i = 0; i < a.length; i++) a[i] in opt ? (opt[a[i]] = a[++i]) : kody.push(a[i]);
  if (!kody.length) { console.log('Użycie: przeklad-zastosuj-delta.mjs [--raport katalog] [--zakres plik] <kod…>'); process.exit(2); }
  const oczek = JSON.parse(readFileSync(opt['--zakres'], 'utf8')), delta = new Set(oczek.klucze), chronione = oczek.przetlumaczone_czesciowo ?? {};
  const kolejnosc = new Map(zbierz().map((p, i) => [p.klucz, i]));
  for (const k of kody) {
    const sl = `src/i18n/slowniki/${k}.json`;
    const { wynik, nowe } = nalozDelta(splaszcz(JSON.parse(readFileSync(sl, 'utf8'))), JSON.parse(readFileSync(`${opt['--raport']}/${k}.json`, 'utf8')).slownik, delta, chronione, k, kolejnosc);
    writeFileSync(sl, JSON.stringify(rozplaszcz(wynik), null, 2) + '\n');
    console.log(`${k}: ${nowe} kluczy nałożonych, ${Object.keys(wynik).length} razem`);
  }
}

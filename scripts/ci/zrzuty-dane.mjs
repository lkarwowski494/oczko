#!/usr/bin/env node
// Dane fikcyjne zrzutów sklepu per język (10-wydanie-013, sesja AH, 2026-11-11; wzór: trening:scripts/ci/store-screenshots.sh:17,60 — pliki danych per język, `all` z listy plików).
// Pliki: e2e/zrzuty-sklepu/dane/<klucz>.json (region, godziny24, PROJ_*, NOTATKA). Język bez własnego pliku dostaje dane `en` JAWNIE: komunikat na stderr i kod 3 (nie ciche pominięcie);
// skrypt zrzutów zamienia kod 3 na ostrzeżenie CI, a decyzja jest zapisana w docs/wydanie/zrzuty-ramki.md.
// Użycie: node scripts/ci/zrzuty-dane.mjs klucz <język>   → klucz danych (en | pl | …) na stdout; kod 3 przy powrocie do en
//         node scripts/ci/zrzuty-dane.mjs env <klucz>     → KLUCZ=WARTOŚĆ po linii (zmienne scenariuszy: -e) + DANE_KLUCZ=<klucz>
//         node scripts/ci/zrzuty-dane.mjs pole <klucz> <pole>  → wartość jednego pola (region, godziny24)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KAT = join(dirname(fileURLToPath(import.meta.url)), '../../e2e/zrzuty-sklepu/dane');
const plik = (k) => join(KAT, `${k}.json`);
const [tryb, a, b] = process.argv.slice(2);
if (tryb === 'klucz' && a) {
  if (existsSync(plik(a))) { console.log(a); process.exit(0); }
  console.error(`brak danych języka ${a}: dane en (zestaw ${a} ma angielskie dane w kadrze; dodaj e2e/zrzuty-sklepu/dane/${a}.json)`);
  console.log('en'); process.exit(3);
}
if ((tryb === 'env' || tryb === 'pole') && a && existsSync(plik(a))) {
  const d = JSON.parse(readFileSync(plik(a), 'utf8'));
  if (tryb === 'pole') { console.log(String(d[b] ?? '')); process.exit(0); }
  for (const [k, w] of Object.entries(d)) if (/^[A-Z_0-9]+$/.test(k)) console.log(`${k}=${w}`);
  console.log(`DANE_KLUCZ=${a}`); process.exit(0);
}
console.error('użycie: node scripts/ci/zrzuty-dane.mjs klucz <język> | env <klucz> | pole <klucz> <pole>'); process.exit(2);

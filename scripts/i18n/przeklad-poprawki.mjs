#!/usr/bin/env node
// Nakłada przyjęte poprawki z drugiego przeglądu na propozycje przekładu: node scripts/i18n/przeklad-poprawki.mjs <kod> <plik-poprawek.json>
// Plik: { "klucz.płaski": "nowy tekst" }. Klucz musi istnieć w propozycji; parametry {{…}} muszą być te same co przed poprawką.
import { readFileSync, writeFileSync } from 'node:fs';
const [, , kod, plik] = process.argv, sciezka = `docs/lokalizacja/przeklad-api/${kod}.json`;
const r = JSON.parse(readFileSync(sciezka, 'utf8')), p = JSON.parse(readFileSync(plik, 'utf8')), par = (s) => (s.match(/\{\{[^}]*\}\}/g) ?? []).sort().join();
let blad = 0;
for (const [k, v] of Object.entries(p)) {
  if (!(k in r.slownik)) { console.log(`BŁĄD ${k}: brak klucza`); blad++; continue; }
  if (par(v) !== par(r.slownik[k])) { console.log(`BŁĄD ${k}: parametry [${par(v)}] ≠ [${par(r.slownik[k])}]`); blad++; continue; }
  r.slownik[k] = v;
}
if (!blad) writeFileSync(sciezka, JSON.stringify(r, null, 1) + '\n');
console.log(blad ? `odrzucono całość (${blad} błędów)` : `naniesiono ${Object.keys(p).length} poprawek w ${sciezka}`);
process.exitCode = blad ? 1 : 0;

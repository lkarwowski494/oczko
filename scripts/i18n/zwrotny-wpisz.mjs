#!/usr/bin/env node
// Wpis kontroli (a) treści krytycznej (P-498) do docs/lokalizacja/przeglad-krytyczne.json — PO porównaniu sensu przez rolę 06 (nigdy z góry: --rozbiezne jest wymagane jawnie).
// Użycie: node scripts/i18n/zwrotny-wpisz.mjs <katalog raportu zwrotny> --kto "…" --data RRRR-MM-DD --rozbiezne '["bg:probka.uwaga_4in"]' | plik.json  [--jezyki bg,cs]
//   Każda pozycja raportu dostaje wpis `a` {kto, data, metoda: przeklad-zwrotny-pl, wynik: zgodny|rozbieżny, sha}; „rozbieżny” tylko dla par z --rozbiezne („język:klucz”).
//   Pominięte (kod 1, bez wpisu): brak przekładu zwrotnego, tekst języka zmieniony po przebiegu (sha ≠ bieżący skrót), błąd języka w raporcie. Istniejące wpisy innych języków i pola pliku zostają.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skrotKlucza } from '../sprawdz-i18n.mjs';
import { wczytaj } from './zwrotny-porownaj.mjs';

const KORZEN = fileURLToPath(new URL('../..', import.meta.url));

export function main(argv, log = console.log) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (o[argv[i].slice(2)] = argv[++i]) : o._.push(argv[i]);
  if (!o._[0] || !o.kto || !/^\d{4}-\d{2}-\d{2}$/.test(o.data ?? '') || o.rozbiezne === undefined) { log('BŁĄD: wymagane: <katalog raportu> --kto "…" --data RRRR-MM-DD --rozbiezne \'[…]\' (lista „język:klucz”, może być [] — jawnie, po porównaniu)'); return 2; }
  let rozb; try { rozb = new Set(JSON.parse(existsSync(o.rozbiezne) ? readFileSync(o.rozbiezne, 'utf8') : o.rozbiezne)); } catch (e) { log(`BŁĄD: --rozbiezne: ${e.message}`); return 2; }
  const przegladPlik = resolve(o.przeglad ?? join(KORZEN, 'docs/lokalizacja/przeglad-krytyczne.json'));
  const przeglad = JSON.parse(readFileSync(przegladPlik, 'utf8')); przeglad.jezyki ??= {};
  const { raporty } = wczytaj(resolve(o._[0]), { slowniki: o.slowniki && resolve(o.slowniki), jezyki: o.jezyki?.split(',') });
  let wpisano = 0, pominieto = 0;
  const pomin = (j, k, powod) => { log(`${j} ${k}: pominięto — ${powod}`); pominieto++; };
  for (const r of raporty) {
    if (r.blad) { log(`${r.jezyk}: pominięto — błąd języka w raporcie: ${r.blad}`); pominieto += r.przeklady.length; continue; }
    for (const p of r.przeklady) {
      if (p.pl === null || p.pl === undefined) { pomin(r.jezyk, p.klucz, 'brak przekładu zwrotnego'); continue; }
      const w = r.slownik[p.klucz];
      if (!w || skrotKlucza(w) !== p.sha) { pomin(r.jezyk, p.klucz, 'tekst zmieniony po przebiegu (sha ≠ bieżący skrót)'); continue; }
      ((przeglad.jezyki[r.jezyk] ??= {})[p.klucz] ??= {}).a = { kto: o.kto, data: o.data, metoda: 'przeklad-zwrotny-pl', wynik: rozb.has(`${r.jezyk}:${p.klucz}`) ? 'rozbieżny' : 'zgodny', sha: p.sha };
      wpisano++;
    }
  }
  writeFileSync(przegladPlik, JSON.stringify(przeglad, null, 2) + '\n');
  log(`wpisano ${wpisano}, pominięto ${pominieto}, rozbieżnych ${[...rozb].length}`);
  return pominieto ? 1 : 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = main(process.argv.slice(2));

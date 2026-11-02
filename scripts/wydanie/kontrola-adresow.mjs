#!/usr/bin/env node
// 07-jakosc-008 (BR-DAN-012/S3, D4 z P-325): adres „Rate Oczko” w buildzie wydania musi mieć prawdziwy identyfikator aplikacji w App Store,
// nie zaślepkę id0000000000. Woła go scripts/wydanie/kontrola-ipa.sh; test: tests/wydanie/adresy-zaslepka.test.ts.
// Użycie: node scripts/wydanie/kontrola-adresow.mjs [src/kompozycja/adresy.ts]   (kod 0 dobrze, 1 zaślepka albo brak adresu)
// Apple ID aplikacji wpisuje rola 10 po odczytaniu go z API App Store Connect (krok A5), razem z ADRESY.recenzja.
import { readFileSync } from 'node:fs';

const plik = process.argv[2] ?? 'src/kompozycja/adresy.ts';
const zrodlo = readFileSync(plik, 'utf8');
const m = /apps\.apple\.com\/app\/id(\d+)\?action=write-review/.exec(zrodlo);
if (!m) {
  console.error(`::error::kontrola adresów: w ${plik} brak adresu recenzji apps.apple.com/app/id<cyfry>?action=write-review`);
  process.exit(1);
}
if (/^0+$/.test(m[1])) {
  console.error(`::error::kontrola adresów: adres „Rate Oczko” ma zaślepkę id${m[1]} (${plik}); wpisz identyfikator aplikacji z App Store Connect`);
  process.exit(1);
}
console.log(`kontrola adresów: identyfikator App Store id${m[1]} (nie zaślepka)`);

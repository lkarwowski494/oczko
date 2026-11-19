#!/usr/bin/env node
// JAK-15 (P-237): build wydania bez śladów trybu testowego. Przeszukuje bajty main.jsbundle (bajtkod Hermesa trzyma napisy jako tekst)
// i kończy się kodem 1 przy którymkolwiek wzorcu. Woła go scripts/wydanie/kontrola-ipa.sh; test: tests/wydanie/slady-testowe.test.ts
// (kontrola negatywna i „lista nadąża za kodem”: każdy testID e2e-…, napis panelu <Text>Test …</Text>, przełącznik EXPO_PUBLIC_* trybu
// testowego i klucz argumentu startu w app/ i src/ ma tu wzorzec).
// Źródła wzorców (2026-10-26): src/platforma/tryb-e2e.ts (EXPO_PUBLIC_E2E, EXPO_PUBLIC_WATCH_FAKE, klucze oczkoE2e*), src/platforma/sklep.ts
// (EXPO_PUBLIC_STORE_FAKE), atrapa iCloud (EXPO_PUBLIC_ICLOUD_FAKE, P-230; plik icloud-atrapa.ts w partii 7), rola 12 (EXPO_PUBLIC_WYMUS_AWARIE),
// i18n pseudo (EXPO_PUBLIC_PSEUDO), panele E2E bez t(): app/oferty.tsx („Test store”), app/ustawienia.tsx („Test files”), app/projekt/[id].tsx
// („Test photo”), testID e2e-* (app/, src/kompozycja). Nazwy EXPO_PUBLIC_* Expo wstawia do bundla jako wartości, więc w wydaniu ich nie ma.
// Użycie: node scripts/wydanie/slady-testowe.mjs <main.jsbundle> [--oczekiwane] | --wzorce   (kod 0 czysto, 1 ślady, 2 zły argument)
// --oczekiwane (P-240): build E2E, ślady są wymagane — wypis jako informacja, bez adnotacji ::error:: w GitHub Actions; kod wyjścia bez zmian.
import { readFileSync, existsSync } from 'node:fs';

export const WZORCE = [
  'Test store', 'Test files', 'Test photo', 'Test pattern', // napisy paneli E2E („Test pattern”: panel wzoru, 08 partia 6)
  'e2e-', // identyfikatory (testID) i pliki trybu E2E
  'oczkoE2e', // klucze argumentów startu (tryb-e2e.ts)
  'EXPO_PUBLIC_E2E', 'EXPO_PUBLIC_ZRZUTY', 'EXPO_PUBLIC_STORE_FAKE', 'EXPO_PUBLIC_WATCH_FAKE', 'EXPO_PUBLIC_ICLOUD_FAKE', 'EXPO_PUBLIC_WYMUS_AWARIE', 'EXPO_PUBLIC_PSEUDO',
];

const [arg, ...flagi] = process.argv.slice(2);
const oczekiwane = flagi.includes('--oczekiwane');
if (arg === '--wzorce') { console.log(JSON.stringify(WZORCE)); process.exit(0); }
if (!arg || !existsSync(arg)) { console.error(`BŁĄD ARGUMENTU: brak pliku ${arg ?? ''}`); process.exit(2); }
const bajty = readFileSync(arg);
const trafienia = [];
for (const w of WZORCE) {
  let n = 0, i = -1;
  while ((i = bajty.indexOf(w, i + 1)) >= 0) n++;
  if (n) {
    const j = bajty.indexOf(w);
    const okno = bajty.subarray(Math.max(0, j - 20), j + w.length + 40).toString('latin1').replace(/[^\x20-\x7e]+/g, '·');
    trafienia.push(`${w} (${n}×; np. „${okno}”)`);
  }
}
if (trafienia.length) {
  for (const t of trafienia) console.log(oczekiwane ? `oczekiwany ślad trybu testowego (build E2E): ${t}` : `::error::ślad trybu testowego w buildzie wydania: ${t}`);
  process.exit(1);
}
console.log(`${arg}: bez śladów trybu testowego (${WZORCE.length} wzorców)`);

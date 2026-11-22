// nakladaj-klucze-fix6.mjs — nakłada klucze fixu NZ-08-P5-BD (P-189, P-191) na słowniki en i en.kontekst.
// node docs/design/narzedzia/nakladaj-klucze-fix6.mjs [katalog repo=.] [--sprawdz]; kod 1, gdy klucz już istnieje z inną treścią.
// Wyjątki: tekst en z listy „zastapEn” (zmiana decyzją, sprawdzana stara treść); wpisy kontekstu z listy „zastap” (teksty robocze 08, Z07-05) wolno nadpisać — tekst en zostaje bez zmian.
// Po nałożeniu regeneruje pseudolokalizację (npm run i18n:pseudo) i tabele Teksty.swift celów natywnych (klucz aktywnosc.*; dotyka targets/ — push z nocnym przebiegiem iOS, P-187).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
const arg = process.argv.slice(2);
const sprawdz = arg.includes('--sprawdz');
const repo = arg.find((a) => !a.startsWith('--')) ?? '.';
const latka = JSON.parse(readFileSync(join(repo, 'docs/design/fix6-2026-10-26/klucze.json'), 'utf8'));
const zastap = new Set(latka.zastap ?? []);
const zastapEn = latka.zastapEn ?? {}; // { klucz: { z, na } } — tekst en zmieniony decyzją (P-195 Q4a); tylko gdy obecny = z albo już na
const pliki = { en: join(repo, 'src/i18n/slowniki/en.json'), kontekst: join(repo, 'src/i18n/slowniki/en.kontekst.json') };
const slowniki = {};
let bledy = 0;
for (const [rodzaj, plik] of Object.entries(pliki)) {
  const slownik = JSON.parse(readFileSync(plik, 'utf8'));
  for (const [klucz, tekst] of Object.entries(latka[rodzaj])) {
    const czesci = klucz.split('.');
    let w = slownik;
    for (const c of czesci.slice(0, -1)) w = w[c] ??= {};
    const ost = czesci.at(-1);
    const wolno = rodzaj === 'kontekst' && zastap.has(klucz);
    if (rodzaj === 'kontekst' && zastap.has(klucz) && !(ost in w)) { console.log(`BRAK do zastąpienia: ${klucz}`); bledy++; continue; }
    if (ost in w && w[ost] !== tekst && !wolno) { console.log(`KONFLIKT ${rodzaj} ${klucz}: „${w[ost]}” ≠ „${tekst}”`); bledy++; continue; }
    w[ost] = tekst;
  }
  if (rodzaj === 'en') for (const [klucz, { z, na }] of Object.entries(zastapEn)) {
    const czesci = klucz.split('.'); let w = slownik;
    for (const c of czesci.slice(0, -1)) w = w?.[c];
    const ost = czesci.at(-1);
    if (!w || (w[ost] !== z && w[ost] !== na)) { console.log(`ZASTĄPIENIE ${klucz}: obecny tekst „${w?.[ost]}” ≠ oczekiwany „${z}”`); bledy++; continue; }
    w[ost] = na;
  }
  slowniki[plik] = slownik;
}
for (const w of latka.spec ?? []) {
  const tekst = readFileSync(join(repo, w.plik), 'utf8');
  if (!tekst.includes(w.wiersz) && !tekst.includes(w.przed)) { console.log(`BRAK miejsca w ${w.plik}: ${w.przed}`); bledy++; }
}
if (!sprawdz && !bledy) {
  for (const [plik, slownik] of Object.entries(slowniki)) writeFileSync(plik, JSON.stringify(slownik, null, 2) + '\n');
  // wiersze spec wiązane testem z kluczami (P-143): wstawiane razem z kluczem, idempotentnie
  for (const w of latka.spec ?? []) {
    const plik = join(repo, w.plik), tekst = readFileSync(plik, 'utf8');
    if (!tekst.includes(w.wiersz)) writeFileSync(plik, tekst.replace(w.przed, w.wiersz + w.przed));
  }
  execSync('npm run i18n:pseudo', { cwd: repo, stdio: 'inherit' });
  // nowy klucz `aktywnosc.*` → tabele tekstów celów natywnych (ADR-0017) z generatora w teście teksty-natywne
  if (Object.keys(latka.en).some((k) => k.startsWith('aktywnosc.'))) execSync('npx jest tests/adaptery/teksty-natywne.test.ts', { cwd: repo, stdio: 'inherit', env: { ...process.env, UPDATE_TEKSTY_NATYWNE: '1' } });
}
console.log(bledy ? `${bledy} konfliktów, nic nie zapisano` : `${sprawdz ? 'sprawdzono' : 'nałożono'}: ${Object.keys(latka.en).length} kluczy en, ${Object.keys(latka.kontekst).length} wpisów kontekstu (${zastap.size} zastąpionych)`);
process.exit(bledy ? 1 : 0);

// nakladaj-klucze-fix5.mjs — nakłada klucze fixu NZ-08-P5-Q1 (P-183 4a) na słowniki en i en.kontekst.
// node docs/design/narzedzia/nakladaj-klucze-fix5.mjs [katalog repo=.] [--sprawdz]; kod 1, gdy klucz już istnieje z inną treścią.
// Po nałożeniu regeneruje pseudolokalizację (npm run i18n:pseudo), której test wymaga zgodności z en.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
const arg = process.argv.slice(2);
const sprawdz = arg.includes('--sprawdz');
const repo = arg.find((a) => !a.startsWith('--')) ?? '.';
const latka = JSON.parse(readFileSync(join(repo, 'docs/design/fix5-2026-10-26/klucze.json'), 'utf8'));
const pliki = { en: join(repo, 'src/i18n/slowniki/en.json'), kontekst: join(repo, 'src/i18n/slowniki/en.kontekst.json') };
let bledy = 0;
for (const [rodzaj, plik] of Object.entries(pliki)) {
  const slownik = JSON.parse(readFileSync(plik, 'utf8'));
  for (const [klucz, tekst] of Object.entries(latka[rodzaj])) {
    const czesci = klucz.split('.');
    let w = slownik;
    for (const c of czesci.slice(0, -1)) w = w[c] ??= {};
    const ost = czesci.at(-1);
    if (ost in w && w[ost] !== tekst) { console.log(`KONFLIKT ${rodzaj} ${klucz}: „${w[ost]}” ≠ „${tekst}”`); bledy++; continue; }
    w[ost] = tekst;
  }
  if (!sprawdz && !bledy) writeFileSync(plik, JSON.stringify(slownik, null, 2) + '\n');
}
if (!sprawdz && !bledy) execSync('npm run i18n:pseudo', { cwd: repo, stdio: 'inherit' });
console.log(bledy ? `${bledy} konfliktów, nic nie zapisano` : `${sprawdz ? 'sprawdzono' : 'nałożono'}: ${Object.keys(latka.en).length} kluczy en, ${Object.keys(latka.kontekst).length} wpisów kontekstu`);
process.exit(bledy ? 1 : 0);

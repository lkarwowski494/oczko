#!/usr/bin/env node --experimental-strip-types --no-warnings
// Wektory `projekty.dni` po fali przekładu 2026-11-03 (P-474, P-486): dla każdego słownika poza zweryfikowanymi ręcznie (en, pl, ru, lt, cs — tabela w
// tests/i18n/projekty-dni-wektory-108.test.ts) zapisuje to, co t() pokazuje przy limit = 5 i zostalo ∈ {0, 1, 2, 5} (miesiąc „M”) do tests/i18n/projekty-dni-wektory-108.json.
//   node --experimental-strip-types --no-warnings scripts/i18n/wektory-projekty-dni.mjs [--sprawdz]
// Bez flagi: zapisuje plik. --sprawdz: kod 1, gdy plik nie zgadza się ze słownikami (bez zapisu).
// To BLOKADA regresji po przeglądzie, nie dowód poprawności: zgodność zdania z regułą (forma idzie za {{limit}}, nie {{zostalo}}) oceniał drugi przegląd AI (P-486),
// a przegląd rodzimy (jezyki.md) może poprawić słownik — wtedy regeneruje się ten plik i zmianę widać w diffie. Wybór formy jak w src/i18n/i18n.ts (kategoriaLiczby języka, potem _other).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kategoriaLiczby } from '../../src/i18n/plural.ts';

const KORZEN = fileURLToPath(new URL('../..', import.meta.url)), KAT = join(KORZEN, 'src/i18n/slowniki'), PLIK = join(KORZEN, 'tests/i18n/projekty-dni-wektory-108.json');
const RECZNE = ['en', 'pl', 'ru', 'lt', 'cs'], ZOSTALO = [0, 1, 2, 5];
const plaski = (o, p = '', w = {}) => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? plaski(v, `${p}${k}.`, w) : (w[p + k] = String(v)); return w; };

export function wektory() {
  const wynik = {};
  for (const f of readdirSync(KAT).filter((n) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]+)?\.json$/.test(n)).sort()) {
    const j = f.slice(0, -5); if (RECZNE.includes(j)) continue;
    const s = plaski(JSON.parse(readFileSync(join(KAT, f), 'utf8')));
    const tekst = s[`projekty.dni_${kategoriaLiczby(j, 5)}`] ?? s['projekty.dni_other'] ?? s['projekty.dni'];
    if (tekst === undefined) throw new Error(`${j}: brak projekty.dni`);
    wynik[j] = ZOSTALO.map((z) => tekst.split('{{zostalo}}').join(String(z)).split('{{limit}}').join('5').split('{{miesiac}}').join('M'));
  }
  return wynik;
}
const dane = () => JSON.stringify({ opis: 'Wektory projekty.dni (zostalo ∈ {0, 1, 2, 5}, limit = 5, miesiac = M) po fali przekładu 2026-11-03; generuje scripts/i18n/wektory-projekty-dni.mjs. Blokada regresji po drugim przeglądzie AI (P-486), przed przeglądem rodzimym.', jezyki: wektory() }, null, 1) + '\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--sprawdz')) { const ok = readFileSync(PLIK, 'utf8') === dane(); console.log(ok ? 'wektory zgodne ze słownikami' : 'BŁĄD: wektory niezgodne ze słownikami — uruchom bez --sprawdz'); process.exitCode = ok ? 0 : 1; }
  else { writeFileSync(PLIK, dane()); console.log(`zapisano ${PLIK}`); }
}

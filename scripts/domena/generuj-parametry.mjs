#!/usr/bin/env node
// Generuje src/domena/obliczenia/parametry.ts z docs/tresci/parametry.json (rola 06). Granica ADR-0003: domena nie importuje z docs/,
// więc liczby treści są kopią, jak src/domena/stany.ts dla stany.json; zgodność sprawdza tests/domena/obliczenia/parametry-kopia.test.ts.
// Użycie: node scripts/domena/generuj-parametry.mjs [--sprawdz]   (--sprawdz: kod 1, gdy plik różni się od wygenerowanego)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const zrodlo = JSON.parse(readFileSync(join(root, 'docs/tresci/parametry.json'), 'utf8'));
const cel = join(root, 'src/domena/obliczenia/parametry.ts');
const stala = (n) => {
  const p = zrodlo.jednostki.find((x) => x.parametr === n);
  if (!p || typeof p.wartosc !== 'number') throw new Error(`parametry.json: brak stałej ${n}`);
  return `${p.wartosc}; // ${p.twierdzenie}`;
};
const rozmiary = (lista) => lista.map((d) => `  { mm: ${d.mm}, us: ${d.us === null ? 'null' : JSON.stringify(d.us)} }, // ${d.twierdzenie}`).join('\n');
const tekst = `// WYGENEROWANE z docs/tresci/parametry.json (rola 06): node scripts/domena/generuj-parametry.mjs — nie edytować ręcznie.
// Kopia, bo domena nie importuje z docs/ (ADR-0003, granice.mjs); zgodność: tests/domena/obliczenia/parametry-kopia.test.ts.
export const CAL_W_CM = ${stala('cal_w_cm')}
export const JARD_W_M = ${stala('jard_w_m')}
export const UNCJA_W_G = ${stala('uncja_w_g')}
export const CZTERY_CALE_W_CM = ${stala('cztery_cale_w_cm')}

export type Rozmiar = { mm: number; us: string | null };
export const DRUTY: readonly Rozmiar[] = [
${rozmiary(zrodlo.druty)}
];
export const SZYDELKA: readonly Rozmiar[] = [
${rozmiary(zrodlo.szydelka)}
];
export type KategoriaGrubosci = { kategoria: number; min: number | null; max: number | null }; // próbka na 4 in
export const GRUBOSC: readonly KategoriaGrubosci[] = [
${zrodlo.grubosc.map((g) => `  { kategoria: ${g.kategoria}, min: ${g.proba_4in_min}, max: ${g.proba_4in_max} }, // ${g.twierdzenie_zakres}`).join('\n')}
];
`;
if (process.argv.includes('--sprawdz')) {
  const jest = readFileSync(cel, 'utf8');
  if (jest !== tekst) { console.error('parametry.ts różni się od docs/tresci/parametry.json — uruchom generator'); process.exit(1); }
  console.log('parametry.ts zgodny z parametry.json');
} else {
  writeFileSync(cel, tekst);
  console.log(`zapisano ${cel}`);
}

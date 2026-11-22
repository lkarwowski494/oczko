// Oczekiwane wartości dla kontroli App Store Connect (asc-kontrola.yml, narzędzie studia) — PLIK GENEROWANY z jednego źródła prawdy, nie edytować ręcznie.
// Wzór: scripts/asc/kontrola-oczekiwane.mjs w Treningu (2e4b0f8, P-315): kontrola porównuje z ASC tylko lokalizacje obsługiwane przez App Store Connect
// (LOCALE_MAP w metadane.mjs, bez `sl`) i tylko te, które mają komplet pól. Źródło: docs/wydanie/metadane/*.store.json (scalane jak w metadane.mjs).
// Wyjście: docs/wydanie/asc-kontrola-oczekiwane.json (kod ASC → name, subtitle, keywords).
//   node scripts/asc/kontrola-oczekiwane.mjs           → zapis pliku
//   node scripts/asc/kontrola-oczekiwane.mjs --check   → kod 1, gdy plik w repo różni się od wygenerowanego (test: tests/wydanie/asc-metadane.test.ts)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_MAP, loadStoreFiles, mergeStoreFiles } from './metadane.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT_JSON = 'docs/wydanie/asc-kontrola-oczekiwane.json';

export function oczekiwane({ merged, mapping = LOCALE_MAP }) {
  const lokalizacje = {};
  for (const [loc, asc] of Object.entries(mapping)) {
    if (!asc) continue;
    const m = merged[loc];
    if (!m || typeof m.title !== 'string' || typeof m.subtitle !== 'string' || !m.keywords) continue; // niekompletna lokalizacja — jeszcze bez oczekiwań
    lokalizacje[asc] = { name: m.title, subtitle: m.subtitle, keywords: Array.isArray(m.keywords) ? m.keywords.join(',') : m.keywords };
  }
  return { _opis: 'PLIK GENEROWANY przez scripts/asc/kontrola-oczekiwane.mjs z docs/wydanie/metadane/*.store.json — tylko lokalizacje obsługiwane przez App Store Connect (bez sl) i z kompletem pól. Nie edytować ręcznie.', lokalizacje };
}

export function generuj(dir = join(ROOT, 'docs/wydanie/metadane')) {
  const { merged, errs } = mergeStoreFiles(loadStoreFiles(dir));
  if (errs.length) throw new Error(errs.join('; '));
  return { [OUT_JSON]: JSON.stringify(oczekiwane({ merged }), null, 2) + '\n' };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pliki = generuj(); const check = process.argv.includes('--check'); let zle = 0;
  for (const [f, tresc] of Object.entries(pliki)) {
    if (check) { let jest = null; try { jest = readFileSync(join(ROOT, f), 'utf8'); } catch { /* brak pliku = różnica */ } if (jest !== tresc) { console.error(`${f}: nieaktualny — uruchom node scripts/asc/kontrola-oczekiwane.mjs`); zle++; } }
    else writeFileSync(join(ROOT, f), tresc);
  }
  process.exit(zle ? 1 : 0);
}

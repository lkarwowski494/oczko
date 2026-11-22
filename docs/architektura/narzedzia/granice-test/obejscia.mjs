// obejscia.mjs — fikstury negatywne granice.mjs (fix 05 2026-10-25, Z07-16). Każdy katalog w obejscia/ to małe repo z src/;
// `dobre` musi dać kod 0, każdy inny kod ≠ 0 (z oczekiwanym znacznikiem reguły w wyniku). Kod wyjścia 1, gdy którakolwiek fikstura przechodzi.
import { readdirSync } from 'node:fs'; import { join, dirname } from 'node:path'; import { fileURLToPath } from 'node:url'; import { spawnSync } from 'node:child_process';
const tu = dirname(fileURLToPath(import.meta.url)); const granice = join(tu, '..', 'granice.mjs');
const OCZEKIWANE = {
  dobre: null, pusty: 'PUSTO', domain: 'PUSTO', require: 'DOMENA', 'import-dynamiczny': 'DOMENA', 'import-wyrazenie': 'DOMENA',
  'tunel-konfiguracja': 'DOMENA', 'konfiguracja-importuje': 'KONFIGURACJA', 'sqlite-poza-baza': 'SQLITE', 'ekran-do-danych': 'EKRANY',
  'katalog-ios': 'IOS', 'swift-sqlite': 'SWIFT', alias: 'DOMENA', 'export-z': 'DOMENA',
};
let zle = 0; const katalogi = readdirSync(join(tu, 'obejscia')).sort();
for (const k of katalogi) {
  const r = spawnSync(process.execPath, [granice, join(tu, 'obejscia', k, 'src')], { encoding: 'utf8' });
  const ocz = OCZEKIWANE[k]; const wynik = r.stdout + r.stderr;
  const dobrze = ocz === null ? r.status === 0 : r.status !== 0 && new RegExp(`^${ocz}\\b`, 'm').test(wynik);
  console.log(`${dobrze ? 'OK  ' : 'BŁĄD'} ${k}: kod ${r.status}, oczekiwano ${ocz ?? 'kod 0'} — ${wynik.trim().split('\n')[0]}`);
  if (!dobrze) zle++;
}
if (katalogi.length !== Object.keys(OCZEKIWANE).length) { console.log(`BŁĄD liczba fikstur ${katalogi.length} ≠ ${Object.keys(OCZEKIWANE).length}`); zle++; }
console.log(`fikstury granic: ${katalogi.length - zle} z ${katalogi.length} zgodnych`); process.exit(zle ? 1 : 0);

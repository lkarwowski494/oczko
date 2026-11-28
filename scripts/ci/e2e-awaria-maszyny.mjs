#!/usr/bin/env node
// 07-jakosc-001 (JAK-05; KO-054, P-781): czy porażka scenariusza Maestro to awaria maszyny (sterownik XCTest / symulator), a nie scenariusza.
//   node scripts/ci/e2e-awaria-maszyny.mjs <junit.xml> [<katalog-wynikow>]
//                                                      → kod 0 i przyczyna (jedna linia) na stdout, gdy awaria maszyny;
//                                                        kod 1, gdy porażka scenariusza (np. „Assertion is false”) albo brak dowodu awarii.
// KA1 (KO-228, P-1084, DG3): gdy NIE MA pliku junit, a podano katalog wyników scenariusza (`--test-output-dir`), awarią maszyny jest też: w katalogu (rekurencyjnie)
// jest `xctest_runner_*.log` i nie ma żadnego `commands.json` (sterownik XCTest nie wstał, żaden krok scenariusza nie ruszył; Maestro zgłasza to na konsoli,
// zanim zapisze junit — run 46062593787, scen. 02, IOSDriverTimeoutException). Kod wyjścia scenariusza ≠ 0 zapewnia wywołujący (klasyfikator woła się po porażce).
// Wąsko: brak junit bez logu runnera (np. przerwanie limitem) albo z `commands.json` (scenariusz ruszył) nadal jest porażką scenariusza. Gdy junit jest, decyduje junit.
// Czyta tylko treść elementów <failure> i <error>: nazwa testu ani tagi nie decydują. Wzorce: DeviceUnreachableException z #142, #173, #182
// (raport BB 2026-11-12, 07-jakosc-001) i dwa z Treningu (`.github/workflows/e2e-ios.yml:223`, @2d97581: „iOS driver not ready in time|deviceInfo failed”).
// Używa jakosc-ios.yml (krok „Scenariusze”): awaria maszyny w 1. podejściu → jedno powtórzenie tylko scenariuszy z awarią i niewykonanych (PE1, P-1076).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const WZORCE_AWARII_MASZYNY = [/DeviceUnreachableException/, /iOS driver not ready in time/, /deviceInfo failed/];

const ENCJE = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
const odkoduj = (s) => s.replace(/&(lt|gt|amp|quot|apos);/g, (_, e) => ENCJE[e]);

// 08-programista-003 (recenzja BE, P3): sekcje CDATA i <system-out>/<system-err> usuwane przed szukaniem elementów — surowe „<failure>” w logu
// to nie element junit (sonda K2); treść porażki asercji Maestro („Assertion is false: …”) to porażka scenariusza, nawet gdy cytuje wzorzec (sonda K7).
const bezLogow = (s) => s.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<(system-out|system-err)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g, '');
const PORAZKA_ASERCJI = /^Assertion is false\b/;

/** Przyczyna awarii maszyny (pierwsza niepusta linia treści <failure>/<error> z wzorcem) albo null. */
export function awariaMaszyny(junit) {
  for (const m of bezLogow(junit).matchAll(/<(failure|error)\b[^>]*?(?:\/>|>([\s\S]*?)<\/\1>)/g)) {
    const tresc = odkoduj(m[2] ?? '');
    if (PORAZKA_ASERCJI.test(tresc.trim())) continue;
    if (!WZORCE_AWARII_MASZYNY.some((w) => w.test(tresc))) continue;
    const linia = tresc.split('\n').map((l) => l.trim()).find((l) => WZORCE_AWARII_MASZYNY.some((w) => w.test(l))) ?? tresc.trim().split('\n')[0];
    return linia.slice(0, 300);
  }
  return null;
}

const LOG_RUNNERA = /^xctest_runner_.*\.log$/;
const COMMANDS = /^commands(-.*)?\.json$/; // jak w czas-startu.mjs: Maestro 2.12.1 zapisuje `commands.json`

/** Przyczyna (jedna linia), gdy w katalogu wyników jest log runnera XCTest i brak commands.json; inaczej null. */
export function runnerNieWstal(katalog) {
  let log = null, commands = false;
  const przejdz = (dir) => {
    let wpisy;
    try { wpisy = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const w of wpisy) {
      if (w.isDirectory()) przejdz(`${dir}/${w.name}`);
      else if (COMMANDS.test(w.name)) commands = true;
      else if (LOG_RUNNERA.test(w.name) && log === null) log = w.name;
    }
  };
  przejdz(katalog);
  return log !== null && !commands ? `brak junit; ${log} bez commands.json (sterownik XCTest nie wstał, scenariusz nie ruszył)` : null;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) { // realpath: wywołanie przez dowiązanie (test)
  const [plik, katalog] = process.argv.slice(2);
  if (!plik) process.exit(1);
  const przyczyna = fs.existsSync(plik) ? awariaMaszyny(fs.readFileSync(plik, 'utf8')) : katalog ? runnerNieWstal(katalog) : null;
  if (!przyczyna) process.exit(1);
  console.log(przyczyna);
}

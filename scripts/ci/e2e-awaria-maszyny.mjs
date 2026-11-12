#!/usr/bin/env node
// 07-jakosc-001 (JAK-05; KO-054, P-781): czy porażka scenariusza Maestro to awaria maszyny (sterownik XCTest / symulator), a nie scenariusza.
//   node scripts/ci/e2e-awaria-maszyny.mjs <junit.xml>  → kod 0 i przyczyna (pierwsza linia <failure>/<error>) na stdout, gdy awaria maszyny;
//                                                        kod 1, gdy porażka scenariusza (np. „Assertion is false”) albo brak pliku junit.
// Czyta tylko treść elementów <failure> i <error>: nazwa testu ani tagi nie decydują. Wzorce: DeviceUnreachableException z #142, #173, #182
// (raport BB 2026-11-12, 07-jakosc-001) i dwa z Treningu (`.github/workflows/e2e-ios.yml:223`, @2d97581: „iOS driver not ready in time|deviceInfo failed”).
// Używa jakosc-ios.yml (krok „Scenariusze”): awaria maszyny w 1. podejściu → jedno powtórzenie całego zestawu części od zera.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const WZORCE_AWARII_MASZYNY = [/DeviceUnreachableException/, /iOS driver not ready in time/, /deviceInfo failed/];

const ENCJE = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
const odkoduj = (s) => s.replace(/&(lt|gt|amp|quot|apos);/g, (_, e) => ENCJE[e]);

/** Przyczyna awarii maszyny (pierwsza niepusta linia treści <failure>/<error> z wzorcem) albo null. */
export function awariaMaszyny(junit) {
  for (const m of junit.matchAll(/<(failure|error)\b[^>]*?(?:\/>|>([\s\S]*?)<\/\1>)/g)) {
    const tresc = odkoduj(m[2] ?? '');
    if (!WZORCE_AWARII_MASZYNY.some((w) => w.test(tresc))) continue;
    const linia = tresc.split('\n').map((l) => l.trim()).find((l) => WZORCE_AWARII_MASZYNY.some((w) => w.test(l))) ?? tresc.trim().split('\n')[0];
    return linia.slice(0, 300);
  }
  return null;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) { // realpath: wywołanie przez dowiązanie (test)
  const plik = process.argv[2];
  if (!plik || !fs.existsSync(plik)) process.exit(1);
  const przyczyna = awariaMaszyny(fs.readFileSync(plik, 'utf8'));
  if (!przyczyna) process.exit(1);
  console.log(przyczyna);
}

// Kontrola po prebuild (P-180): `_shared/Stuknij.swift` jest w celu aplikacji (scripts/natywne/czlonkostwo-celu.mjs, krok CI w jakosc-ios.yml).
// Dane: wycinek project.pbxproj (sekcje celów i grup) z `npx expo prebuild --platform ios --no-install --clean` (@bacons/apple-targets 5.0.0, 2026-10-26, Linux) — plugin
// dodaje `_shared/*` do celu aplikacji przez PBXFileSystemSynchronizedBuildFileExceptionSet z `target` = cel aplikacji w grupie celu widżetu.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const KORZEN = join(__dirname, '../..');
const SKRYPT = join(KORZEN, 'scripts/natywne/czlonkostwo-celu.mjs');
const PRAWDZIWY = readFileSync(join(__dirname, 'dane/prebuild-project.pbxproj'), 'utf8');
function kontrola(pbx: string): { kod: number; wyjscie: string } {
  const plik = join(mkdtempSync(join(tmpdir(), 'pbx-')), 'project.pbxproj');
  writeFileSync(plik, pbx);
  try {
    return { kod: 0, wyjscie: execFileSync('node', [SKRYPT, '--pbxproj', plik, '--plik', '_shared/Stuknij.swift'], { encoding: 'utf8' }) };
  } catch (e) {
    const b = e as { status: number; stdout: string };
    return { kod: b.status, wyjscie: b.stdout };
  }
}

test('prawdziwy prebuild: Stuknij.swift w celu aplikacji Oczko → kod 0', () => {
  const w = kontrola(PRAWDZIWY);
  expect(w).toEqual({ kod: 0, wyjscie: expect.stringContaining('_shared/Stuknij.swift w celu Oczko') });
});
test('brak wpisu w wyjątkach celu aplikacji → kod 1', () => {
  const bez = PRAWDZIWY.replace(/\n\t+_shared\/Stuknij\.swift,/, '');
  expect(bez).not.toEqual(PRAWDZIWY);
  expect(kontrola(bez).kod).toBe(1);
});
test('wpis tylko w zbiorze wyjątków innego celu (widżet) → kod 1', () => {
  const inny = PRAWDZIWY.replace('target = 13B07F861A680F5B00A75B9A /* Oczko */;\n\t\t\tmembershipExceptions = (\n\t\t\t\t_shared/Stuknij.swift,',
    'target = XX490B193DCCCAFA48FFC7XX /* OczkoWidget */;\n\t\t\tmembershipExceptions = (\n\t\t\t\t_shared/Stuknij.swift,');
  expect(inny).not.toEqual(PRAWDZIWY);
  expect(kontrola(inny).kod).toBe(1);
});
test('zbiór wyjątków odłączony od grupy synchronizowanej → kod 1', () => {
  const odlaczony = PRAWDZIWY.replace(/\n\t+XX3C49F596644F1073CB7FXX \/\* PBXFileSystemSynchronizedBuildFileExceptionSet \*\/,/, '');
  expect(odlaczony).not.toEqual(PRAWDZIWY);
  expect(kontrola(odlaczony).kod).toBe(1);
});
test('pusty albo obcy plik → kod 1 (pusty zbiór to nie zaliczenie)', () => {
  expect(kontrola('').kod).toBe(1);
});

describe('jakosc-ios.yml (P-180)', () => {
  const wf = parse(readFileSync(join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8'));
  test('krok po prebuild woła kontrolę członkostwa Stuknij.swift w celu aplikacji', () => {
    const kroki = yamlKroki(wf, 'build');
    const prebuild = kroki.findIndex((k) => /expo prebuild/.test(k.run ?? ''));
    const krok = kroki.findIndex((k) => /czlonkostwo-celu\.mjs[^\n]*--plik _shared\/Stuknij\.swift/.test(k.run ?? ''));
    expect(prebuild).toBeGreaterThanOrEqual(0);
    expect(krok).toBeGreaterThan(prebuild);
  });
  test('e2e: pakiet podstawowy jest bramką — continue-on-error tylko dla pozycji iPada (07: F07-15, P-198 Q1a, P-225 Q1a; reguła kroków w e2e-bramka.test.ts)', () => {
    expect(String(wf.jobs.e2e['continue-on-error'])).toBe("${{ matrix.urzadzenie == 'ipad' }}");
  });
});

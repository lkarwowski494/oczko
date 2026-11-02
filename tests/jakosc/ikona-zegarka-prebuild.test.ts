// P-350 (08 poprawki E2, sesja C; wzór: `verify:native` w Treningu, `scripts/verify-native.mjs`, lekcja L-021 / build 1026): po `expo prebuild` cel zegarka
// (`*.watchkitapp`, SDKROOT = watchos) ma w obu konfiguracjach `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`. Bez tego Info.plist zegarka nie ma `CFBundleIconName`
// i App Store Connect odrzuca wysyłkę. `kontrola-ipa.sh` łapie to dopiero w gotowym archiwum (macOS), a strażnik jest tani i działa zaraz po prebuild.
// Dane: `tests/wydanie/dane/project.pbxproj` (wynik `expo prebuild` @bacons/apple-targets 5.0.0, Linux, z zanonimizowanymi identyfikatorami celów).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const KORZEN = join(__dirname, '../..');
const SKRYPT = join(KORZEN, 'scripts/natywne/ikona-zegarka.mjs');
const PRAWDZIWY = readFileSync(join(KORZEN, 'tests/wydanie/dane/project.pbxproj'), 'utf8');
const IKONA = 'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;';

function kontrola(pbx: string): { kod: number; wyjscie: string } {
  const plik = join(mkdtempSync(join(tmpdir(), 'pbx-ikona-')), 'project.pbxproj');
  writeFileSync(plik, pbx);
  try {
    return { kod: 0, wyjscie: execFileSync('node', [SKRYPT, '--pbxproj', plik], { encoding: 'utf8' }) };
  } catch (e) {
    const b = e as { status: number; stdout: string };
    return { kod: b.status, wyjscie: b.stdout };
  }
}
/** Usuwa ustawienie ikony z `ktora`-tej (od 0) konfiguracji celu zegarka (blok buildSettings z SDKROOT = watchos); bez `ktora` ze wszystkich. */
function bezIkonyZegarka(pbx: string, ktora?: number): string {
  let n = -1;
  return pbx.replace(/buildSettings = \{[\s\S]*?\n\t\t\t\};/g, (blok) => {
    if (!/SDKROOT = watchos;/.test(blok)) return blok;
    n += 1;
    return ktora === undefined || n === ktora ? blok.replace(/\n\t+ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;/, '') : blok;
  });
}

test('prawdziwy prebuild: obie konfiguracje celu zegarka mają AppIcon → kod 0 i opis', () => {
  const w = kontrola(PRAWDZIWY);
  expect(w).toEqual({ kod: 0, wyjscie: expect.stringContaining('com.apps4brew.knitting.watchkitapp') });
  expect(w.wyjscie).toMatch(/2 konfiguracje/);
});
test('brak ikony w jednej konfiguracji zegarka (Debug albo Release) → kod 1 i wskazanie przyczyny', () => {
  for (const ktora of [0, 1]) {
    const bez = bezIkonyZegarka(PRAWDZIWY, ktora);
    expect(bez).not.toEqual(PRAWDZIWY);
    const w = kontrola(bez);
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('ASSETCATALOG_COMPILER_APPICON_NAME');
  }
});
test('inna nazwa zestawu ikon niż AppIcon w celu zegarka → kod 1 (actool wpisuje CFBundleIconName tylko z AppIcon)', () => {
  let n = 0;
  const inna = PRAWDZIWY.replace(/buildSettings = \{[\s\S]*?\n\t\t\t\};/g, (blok) => (/SDKROOT = watchos;/.test(blok) && n++ === 0 ? blok.replace(IKONA, 'ASSETCATALOG_COMPILER_APPICON_NAME = Inna;') : blok));
  expect(inna).not.toEqual(PRAWDZIWY);
  expect(kontrola(inna).kod).toBe(1);
});
test('ikona zostaje w celu aplikacji i widżetu, ale nie w zegarku → kod 1 (ustawienie innego celu nie zalicza zegarka)', () => {
  const bez = bezIkonyZegarka(PRAWDZIWY);
  expect(bez.split(IKONA).length).toBe(PRAWDZIWY.split(IKONA).length - 2);
  expect(bez).toContain(IKONA);
  expect(kontrola(bez).kod).toBe(1);
});
test('brak celu zegarka albo pusty plik → kod 1 (pusty zbiór to nie zaliczenie)', () => {
  expect(kontrola('').kod).toBe(1);
  expect(kontrola(PRAWDZIWY.replace(/SDKROOT = watchos;/g, 'SDKROOT = iphoneos;')).kod).toBe(1);
});
test('jedna konfiguracja zegarka zamiast dwóch (Debug i Release) → kod 1', () => {
  let n = 0;
  const jedna = PRAWDZIWY.replace(/SDKROOT = watchos;/g, (m) => (n++ === 0 ? m : 'SDKROOT = iphoneos;'));
  expect(kontrola(jedna).kod).toBe(1);
});

describe('jakosc-ios.yml (P-350)', () => {
  const wf = parse(readFileSync(join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8'));
  test('w jobie build, po expo prebuild i przed podami, krok woła strażnika ikony zegarka na projekcie z prebuild', () => {
    const kroki = yamlKroki(wf, 'build');
    const prebuild = kroki.findIndex((k) => /expo prebuild/.test(k.run ?? ''));
    const krok = kroki.findIndex((k) => /ikona-zegarka\.mjs[^\n]*--pbxproj ios\/\*\.xcodeproj\/project\.pbxproj/.test(k.run ?? ''));
    const pody = kroki.findIndex((k) => /pod install/.test(k.run ?? ''));
    expect(prebuild).toBeGreaterThanOrEqual(0);
    expect(krok).toBeGreaterThan(prebuild);
    expect(krok).toBeLessThan(pody);
    expect(kroki[krok]?.run).toMatch(/set -o pipefail/); // kod skryptu nie ginie w potoku do tee
  });
});

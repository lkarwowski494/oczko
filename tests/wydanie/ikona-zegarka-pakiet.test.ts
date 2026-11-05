// 10-wydanie-002 (zegarek bez CFBundleIconName w .ipa; testflight.yml #6, run 41983086785, build 1061, krok „Kontrola .ipa”).
// Strażnik z P-350 (`ikona-zegarka.mjs`) czyta projekt po prebuild i przechodzi, a zbudowany zegarek i tak nie ma CFBundleIconName — projekt nie dowodzi pakietu.
// Ta kontrola działa na ZBUDOWANYM zegarku (Info.plist po plutil → JSON) i jest uruchamiana w jakosc-ios.yml bez Approve właściciela (środowisko `release`
// jest tylko w testflight.yml), więc tę klasę błędu widać przed wysyłką. Diagnostyka (surowy log actool) wypisuje dowód przyczyny do logu zadania.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, yamlKroki } from '../jakosc/jakosc-ios-pomoc';

const KORZEN = join(__dirname, '../..');
const SKRYPT = join(KORZEN, 'scripts/natywne/ikona-zegarka-pakiet.mjs');

function kontrola(info: unknown | string): { kod: number; wyjscie: string } {
  const plik = join(mkdtempSync(join(tmpdir(), 'zegarek-info-')), 'Info.json');
  writeFileSync(plik, typeof info === 'string' ? info : JSON.stringify(info));
  try {
    return { kod: 0, wyjscie: execFileSync('node', [SKRYPT, '--info', plik], { encoding: 'utf8' }) };
  } catch (e) {
    const b = e as { status: number; stdout: string };
    return { kod: b.status, wyjscie: b.stdout };
  }
}

describe('ikona-zegarka-pakiet.mjs (Info.plist zbudowanego zegarka jako JSON)', () => {
  test('CFBundleIconName = AppIcon → kod 0', () => {
    const w = kontrola({ CFBundleIdentifier: 'com.apps4brew.knitting.watchkitapp', CFBundleIconName: 'AppIcon' });
    expect(w).toEqual({ kod: 0, wyjscie: expect.stringContaining('CFBundleIconName = AppIcon') });
  });
  test('brak CFBundleIconName (stan z testflight.yml #6) → kod 1 i wskazanie przyczyny', () => {
    const w = kontrola({ CFBundleIdentifier: 'com.apps4brew.knitting.watchkitapp', WKCompanionAppBundleIdentifier: 'com.apps4brew.knitting' });
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('CFBundleIconName');
    expect(w.wyjscie).toContain('::error::');
  });
  test('pusta albo inna nazwa niż AppIcon → kod 1', () => {
    expect(kontrola({ CFBundleIconName: '' }).kod).toBe(1);
    expect(kontrola({ CFBundleIconName: 'Inna' }).kod).toBe(1);
  });
  test('nieczytelny plik albo brak argumentu → kod 1 / 2 (pusty wynik to nie zaliczenie)', () => {
    expect(kontrola('to nie jest json').kod).toBe(1);
    expect(() => execFileSync('node', [SKRYPT], { encoding: 'utf8', stdio: 'pipe' })).toThrow(expect.objectContaining({ status: 2 }));
  });
});

describe('jakosc-ios.yml: zadanie zegarek-ikona (10-wydanie-002)', () => {
  const tekst = readFileSync(join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8');
  const kroki = yamlKroki(parse(tekst), 'zegarek-ikona');
  const idx = (re: RegExp) => kroki.findIndex((k) => re.test(k.run ?? ''));

  test('zadanie istnieje i buduje sam cel zegarka na SDK watchos (jak archiwum: urządzenie, Release, bez podpisu)', () => {
    expect(kroki.length).toBeGreaterThan(0);
    const b = idx(/xcodebuild[\s\S]*-target OczkoZegarek[\s\S]*-sdk watchos/);
    expect(b).toBeGreaterThan(idx(/expo prebuild/));
    expect(kroki[b]?.run).toMatch(/-configuration Release/);
    expect(kroki[b]?.run).toMatch(/CODE_SIGNING_ALLOWED=NO/);
    expect(kroki[b]?.run).toMatch(/set -o pipefail/);
    expect(kroki[b]?.run).toMatch(/tee [^\n]*xcodebuild-zegarek\.log/); // surowy log (xcbeautify ukrywa kroki actool)
  });
  test('diagnostyka działa także po błędzie budowy (if: always) i jest przed strażnikiem pakietu', () => {
    const d = kroki.findIndex((k) => /diagnostyka-ikony-zegarka\.sh/.test(k.run ?? ''));
    const s = idx(/ikona-zegarka-pakiet\.mjs/);
    expect(d).toBeGreaterThan(idx(/-target OczkoZegarek/));
    expect(String((kroki[d] as { if?: string }).if)).toMatch(/always\(\)/);
    expect(s).toBeGreaterThan(d);
    expect(kroki[s]?.run).toMatch(/plutil -convert json/);
    expect(kroki[s]?.run).toMatch(/set -o pipefail/);
  });
  test('strażnik ikony projektu (P-350) też działa w tym zadaniu, zaraz po prebuild', () => {
    expect(idx(/ikona-zegarka\.mjs[^\n]*--pbxproj ios\/\*\.xcodeproj\/project\.pbxproj/)).toBeGreaterThan(idx(/expo prebuild/));
  });
});

describe('diagnostyka-ikony-zegarka.sh', () => {
  const sh = readFileSync(join(KORZEN, 'scripts/wydanie/diagnostyka-ikony-zegarka.sh'), 'utf8');
  test('wypisuje dowody przyczyny: actool z surowego logu, wygenerowany plist katalogu zasobów, Info.plist zegarka, ustawienia budowy', () => {
    expect(sh).toMatch(/CompileAssetCatalog/);
    expect(sh).toMatch(/assetcatalog_generated_info\.plist/);
    expect(sh).toMatch(/plutil -p/);
    expect(sh).toMatch(/-showBuildSettings/);
    expect(sh).toMatch(/assetutil --info/);
  });
  test('nigdy nie kończy się błędem sam z siebie (diagnostyka nie maskuje werdyktu strażnika)', () => {
    expect(sh).not.toMatch(/^set -[a-z]*e/m);
    expect(sh).toMatch(/exit 0/);
  });
});

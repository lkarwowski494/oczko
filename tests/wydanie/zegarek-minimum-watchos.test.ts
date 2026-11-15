// KO-061 (BS 2026-11-15, decyzja właściciela „Obniż do watchOS 10”): zegarek właściciela ma watchOS 10.6.2 bez możliwości aktualizacji, a aplikacja zegarka
// z minimum 11.0 nie pojawiała się w „Dostępne aplikacje” (docs/jakosc/zegarek-diagnoza-1161.md). Minimum zegarka = 10.0; iOS 18 bez zmian.
// (a) Jedna wartość we wszystkich miejscach (config celu, kontrola .ipa, stała aplikacji, README, wzorzec projektu), (b) źródła zegarka bez znanych API z watchOS 11 poza osłoną (skan listy znanych nazw; dowodem zgodności API jest kompilacja celu z minimum 10.0, `jakosc-ios.yml`).
// Wzór: Trening `scripts/verify-native.mjs:67` i `tests/watch-availability.test.ts` (analogia, P-087).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MIN_IOS, MIN_WATCHOS } from '../../src/konfiguracja';
import { API_WATCHOS_11, nieoslonieteWatchOS11 } from './watchos-dostepnosc';

const KORZEN = path.join(__dirname, '..', '..');
const czytaj = (p: string): string => fs.readFileSync(path.join(KORZEN, p), 'utf8');
const MINIMUM_ZEGARKA = '10.0';

describe('minimum watchOS 10.0 — jedna wartość w konfiguracji, kontroli .ipa, stałych, README i wzorcu projektu', () => {
  test('cel zegarka: deploymentTarget w expo-target.config.js', () => {
    expect(czytaj('targets/watch/expo-target.config.js').match(/deploymentTarget: '([\d.]+)'/)?.[1]).toBe(MINIMUM_ZEGARKA);
  });
  test('kontrola .ipa: MIN_WATCH w scripts/wydanie/kontrola-ipa.sh', () => {
    expect(czytaj('scripts/wydanie/kontrola-ipa.sh').match(/\bMIN_WATCH=([\d.]+)/)?.[1]).toBe(MINIMUM_ZEGARKA);
  });
  test('stała aplikacji: MIN_WATCHOS w src/konfiguracja.ts', () => {
    expect(MIN_WATCHOS).toBe(MINIMUM_ZEGARKA);
  });
  test('README: „watchOS 10.0 i nowszy”', () => {
    expect(czytaj('README.md')).toContain(`watchOS ${MINIMUM_ZEGARKA} i nowszy`);
  });
  test('wzorzec projektu dla testów (tests/wydanie/dane/project.pbxproj): każde WATCHOS_DEPLOYMENT_TARGET = 10.0, co najmniej Debug i Release', () => {
    const wartosci = [...czytaj('tests/wydanie/dane/project.pbxproj').matchAll(/WATCHOS_DEPLOYMENT_TARGET = ([\d.]+);/g)].map((m) => m[1]);
    expect(wartosci.length).toBeGreaterThanOrEqual(2);
    expect(wartosci).toEqual(wartosci.map(() => MINIMUM_ZEGARKA));
  });
  test('iOS bez zmian: 18.0 w stałej, kontroli .ipa i app.json (decyzja dotyczy tylko zegarka)', () => {
    expect(MIN_IOS).toBe('18.0');
    expect(czytaj('scripts/wydanie/kontrola-ipa.sh').match(/\bMIN_IOS=([\d.]+)/)?.[1]).toBe('18.0');
    expect(JSON.parse(czytaj('app.json')).expo.ios.deploymentTarget).toBe('18.0');
  });
});

describe('skaner osłon watchOS 11 — przykłady', () => {
  test('użycie w if #available(watchOS 11, *) jest osłonięte, także w zagnieżdżonym bloku', () => {
    expect(nieoslonieteWatchOS11('struct M { func f() {\n if #available(watchOS 11, *) { v.handGestureShortcut(.primaryAction) } else { v }\n } }')).toEqual([]);
    expect(nieoslonieteWatchOS11('func f() {\n if #available(watchOS 11, *) {\n  if x {\n   v.handGestureShortcut(.primaryAction)\n  }\n }\n}')).toEqual([]);
  });
  test('deklaracja z @available(watchOS 11, *) osłania całą zawartość', () => {
    expect(nieoslonieteWatchOS11('@available(watchOS 11, *)\nstruct A: View {\n var body: some View { Button("x") {}.handGestureShortcut(.primaryAction) }\n}')).toEqual([]);
  });
  test('użycie bez osłony jest zgłaszane z numerem wiersza', () => {
    expect(nieoslonieteWatchOS11('struct A: View {\n var body: some View {\n  Button("x") {}\n   .handGestureShortcut(.primaryAction)\n }\n}')).toEqual([{ line: 4, api: 'handGestureShortcut' }]);
  });
  test('gałąź else osłoniętego if oraz osłona na watchOS 10 nie są osłoną', () => {
    expect(nieoslonieteWatchOS11('if #available(watchOS 11, *) { a() } else { v.handGestureShortcut(.primaryAction) }')).toEqual([{ line: 1, api: 'handGestureShortcut' }]);
    expect(nieoslonieteWatchOS11('if #available(watchOS 10, *) { v.handGestureShortcut(.primaryAction) }')).toEqual([{ line: 1, api: 'handGestureShortcut' }]);
  });
  test('komentarze i napisy nie są użyciem; osłona kończy się z blokiem', () => {
    expect(nieoslonieteWatchOS11('// handGestureShortcut(.primaryAction)\n/* HandGestureShortcut */ let s = "handGestureShortcut"')).toEqual([]);
    expect(nieoslonieteWatchOS11('if #available(watchOS 11, *) { ok() }\nlet y = v.handGestureShortcut(.primaryAction)')).toEqual([{ line: 2, api: 'handGestureShortcut' }]);
  });
});

// Recenzja BT 08-programista-001 (2026-11-15): lista skanera = tylko API sprawdzone w dokumentacji Apple (JSON developer.apple.com/tutorials/data/documentation/<ścieżka>.json,
// metadata.platforms › watchOS › introducedAt, odczyt BS 2026-11-15). Ścieżka i wersja w tabeli; skaner nie zastępuje kompilacji z minimum 10.0 (jakosc-ios.yml), tylko ją uzupełnia.
const OD_WATCHOS_11: ReadonlyArray<readonly [string, string]> = [
  ['handGestureShortcut', 'swiftui/view/handgestureshortcut(_:isenabled:)'],
  ['HandGestureShortcut', 'swiftui/handgestureshortcut'],
  ['workoutEffortScore', 'healthkit/hkquantitytypeidentifier/workouteffortscore'],
  ['estimatedWorkoutEffortScore', 'healthkit/hkquantitytypeidentifier/estimatedworkouteffortscore'],
  ['onScrollGeometryChange', 'swiftui/view/onscrollgeometrychange(for:of:action:)'],
  ['onScrollVisibilityChange', 'swiftui/view/onscrollvisibilitychange(threshold:_:)'],
  ['ScrollPosition', 'swiftui/scrollposition'],
  ['MeshGradient', 'swiftui/meshgradient'],
  ['matchedTransitionSource', 'swiftui/view/matchedtransitionsource(id:in:)'],
];
// Z innych wersji niż 11.0 (Apple, ten sam odczyt): Previewable watchOS 10.0 (swiftui/previewable()), ControlWidget i RelevanceConfiguration watchOS 26.0 — nie są „od watchOS 11”.
const NIE_OD_WATCHOS_11 = ['Previewable', 'ControlWidget', 'RelevanceConfiguration'] as const;

describe('skaner: lista znanych API z watchOS 11 (dokumentacja Apple, odczyt 2026-11-15)', () => {
  test.each(OD_WATCHOS_11.map(([api, sciezka]) => [api, sciezka] as const))('%s (%s) bez osłony jest wykrywane', (api) => {
    expect(nieoslonieteWatchOS11(`struct V: View {\n var body: some View { Text("x").${api}(1) }\n}`)).toEqual([{ line: 2, api }]);
  });
  test('lista skanera = dokładnie te 9 nazw (zmiana listy wymaga zmiany tabeli z odczytem dokumentacji)', () => {
    expect([...API_WATCHOS_11].sort()).toEqual(OD_WATCHOS_11.map(([api]) => api).sort());
  });
  test.each(NIE_OD_WATCHOS_11.map((api) => [api] as const))('%s nie jest API od watchOS 11 (inna wersja w dokumentacji Apple) — skaner go nie zgłasza', (api) => {
    expect(nieoslonieteWatchOS11(`struct V { let x = ${api}() }`)).toEqual([]);
  });
});

const plikiSwift = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? plikiSwift(path.join(d, e.name)) : e.name.endsWith('.swift') ? [path.join(d, e.name)] : []));

describe('źródła zegarka (targets/watch): skaner znanych API z watchOS 11 (lista wyżej) nie znajduje użyć poza osłoną; bramą zgodności jest kompilacja z minimum 10.0', () => {
  const korzen = path.join(KORZEN, 'targets', 'watch');
  const pliki = plikiSwift(korzen);
  test('są pliki Swift do sprawdzenia (inaczej skan nic nie pilnuje): 14 w targets/watch na 2026-11-15 (git ls-files)', () => {
    expect(pliki.length).toBeGreaterThanOrEqual(14);
    expect(API_WATCHOS_11.length).toBeGreaterThan(0);
  });
  test.each(pliki.map((f) => [path.relative(korzen, f), f] as const))('%s: każde API z watchOS 11 jest osłonięte', (_nazwa, f) => {
    expect(nieoslonieteWatchOS11(fs.readFileSync(f, 'utf8'))).toEqual([]);
  });
});

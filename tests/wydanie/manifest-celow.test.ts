// M1-audytor-generalny-076 (05-architekt-001, 10-wydanie-001; R-158): cele @bacons/apple-targets nie dostają manifestu z app.json, a Apple przyjmuje
// build tylko, gdy każdy pakiet z „required reason API” ma własny PrivacyInfo.xcprivacy. Kontrola repo (Linux) skanuje kod Swift celu i porównuje
// z targets/<cel>/PrivacyInfo.xcprivacy; kontrola-ipa.sh (macOS) wymaga manifestu w gotowym pakiecie zegarka jako BŁĘDU, nie uwagi.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const SKRYPT = join(K, 'scripts/wydanie/manifest-celow.mjs');
const uruchom = (args: string[]) => { const r = spawnSync(process.execPath, [SKRYPT, ...args], { cwd: K, encoding: 'utf8' }); return { kod: r.status, wyjscie: r.stdout + r.stderr }; };
const manifest = (wpisy: [string, string[]][]) => `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n\t<key>NSPrivacyAccessedAPITypes</key>\n\t<array>\n${
  wpisy.map(([k, p]) => `\t\t<dict>\n\t\t\t<key>NSPrivacyAccessedAPIType</key>\n\t\t\t<string>${k}</string>\n\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key>\n\t\t\t<array>${p.map((x) => `<string>${x}</string>`).join('')}</array>\n\t\t</dict>\n`).join('')}\t</array>\n</dict>\n</plist>\n`;
function cele(pliki: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), 'cele-'));
  for (const [p, tresc] of Object.entries(pliki)) { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), tresc); }
  return d;
}
const UD = 'NSPrivacyAccessedAPICategoryUserDefaults', FT = 'NSPrivacyAccessedAPICategoryFileTimestamp';

test('repo: każdy cel z API z listy Apple ma manifest z tą kategorią (widżet i rozszerzenie: własny plik; zegarek: zbiorczy z app.json, P-471)', () => {
  const w = uruchom([]);
  expect(w.wyjscie).toContain('manifesty celów: OK');
  expect(w.kod).toBe(0);
});

// P-471 (build #144, „Multiple commands produce OczkoZegarek.app/PrivacyInfo.xcprivacy”): React Native „Privacy Manifest Aggregation” (privacy_manifest_utils.rb,
// `ensure_reference`) dopisuje manifest aplikacji do fazy zasobów KAŻDEGO celu typu aplikacja, także zegarka, a własny plik w targets/watch kopiuje jeszcze grupa
// synchronizowana Xcode: dwa kopiowania na jedną ścieżkę w pakiecie. Jedno źródło = manifest zbiorczy z `expo.ios.privacyManifests` (jak Trening, docs/35-zegarek-apple.md).
test('P-471: w pakiecie zegarka manifest ma dokładnie jedno źródło (własny plik w folderze celu + kopia z agregacji RN = 1)', () => {
  const w = uruchom(['--kopie', 'watch']);
  expect(w.wyjscie).toContain('kopie PrivacyInfo.xcprivacy w pakiecie celu watch: 1');
  expect(w.kod).toBe(0);
});

test('P-471: założenie agregacji — w wyniku prebuild (dane) manifest ma cel aplikacji, a zegarek nie ma jawnego odwołania w fazie zasobów', () => {
  const pbx = readFileSync(join(K, 'tests/wydanie/dane/project.pbxproj'), 'utf8');
  const faza = (cel: string) => new RegExp(`/\\* ${cel} \\*/ = \\{\\s*isa = PBXNativeTarget;[\\s\\S]*?buildPhases = \\(([\\s\\S]*?)\\);`).exec(pbx)?.[1] ?? '';
  const zasoby = (blok: string) => [...blok.matchAll(/(\w+) \/\* Resources \*\//g)].map((m) => new RegExp(`${m[1]} /\\* Resources \\*/ = \\{[\\s\\S]*?files = \\(([\\s\\S]*?)\\);`).exec(pbx)?.[1] ?? '');
  expect(zasoby(faza('Oczko')).join('')).toContain('PrivacyInfo.xcprivacy in Resources');
  expect(zasoby(faza('OczkoZegarek')).join('')).not.toContain('PrivacyInfo.xcprivacy');
});

test('manifest zegarka (zbiorczy z app.json): UserDefaults CA92.1 (dane tylko zegarka) i FileTimestamp C617.1 (rozmiar dziennika w kontenerze), bez śledzenia i zbierania', () => {
  const m = JSON.parse(readFileSync(join(K, 'app.json'), 'utf8')).expo.ios.privacyManifests;
  expect(m.NSPrivacyTracking).toBe(false);
  expect(m.NSPrivacyCollectedDataTypes).toEqual([]);
  const powody = (kat: string) => m.NSPrivacyAccessedAPITypes.find((t: { NSPrivacyAccessedAPIType: string }) => t.NSPrivacyAccessedAPIType === kat)?.NSPrivacyAccessedAPITypeReasons;
  expect(powody(UD)).toContain('CA92.1');
  expect(powody(FT)).toContain('C617.1');
});

describe('kontrola potrafi paść (cele w katalogu tymczasowym)', () => {
  test('cel z UserDefaults bez manifestu → błąd z miejscem użycia, kod 1', () => {
    const w = uruchom(['--katalog', cele({ 'watch/A.swift': 'let d = UserDefaults.standard\n' })]);
    expect(w.wyjscie).toMatch(/targets\/watch: brak PrivacyInfo\.xcprivacy, a kod używa UserDefaults \(A\.swift:1\)/);
    expect(w.kod).toBe(1);
  });
  test('manifest bez kategorii użytej w kodzie (fstat → FileTimestamp) → błąd', () => {
    const w = uruchom(['--katalog', cele({ 'watch/Wspolne/D.swift': 'var s = stat()\nif fstat(fd, &s) != 0 {}\n', 'watch/PrivacyInfo.xcprivacy': manifest([[UD, ['CA92.1']]]) })]);
    expect(w.wyjscie).toMatch(new RegExp(`manifest bez kategorii ${FT} \\(użycie: Wspolne/D\\.swift:1\\)`));
    expect(w.kod).toBe(1);
  });
  test('powód tylko dla SDK (0A2A.1) albo pusty → błąd', () => {
    expect(uruchom(['--katalog', cele({ 'w/D.swift': 'fstat(fd, &s)\n', 'w/PrivacyInfo.xcprivacy': manifest([[FT, ['0A2A.1']]]) })]).wyjscie).toMatch(/powód 0A2A\.1 spoza listy/);
    expect(uruchom(['--katalog', cele({ 'w/D.swift': 'fstat(fd, &s)\n', 'w/PrivacyInfo.xcprivacy': manifest([[FT, []]]) })]).kod).toBe(1);
  });
  test('wzmianka tylko w komentarzu i cel bez API → bez manifestu OK', () => {
    expect(uruchom(['--katalog', cele({ 'widget/A.swift': '// bez UserDefaults\nlet x = 1\n' })]).kod).toBe(0);
  });
  test('targets/_shared (biblioteka dołącza go do każdego celu) liczy się do każdego celu', () => {
    const w = uruchom(['--katalog', cele({ 'widget/A.swift': 'let x = 1\n', '_shared/B.swift': 'let d = UserDefaults.standard\n' })]);
    expect(w.wyjscie).toMatch(/targets\/widget: brak PrivacyInfo\.xcprivacy, a kod używa UserDefaults \(\.\.\/_shared\/B\.swift:1\)/);
    expect(w.kod).toBe(1);
  });
  describe('P-471: cel typu watch (aplikacja) dostaje manifest z agregacji RN, nie z własnego pliku', () => {
    const KONF = "module.exports = { type: 'watch', name: 'Z' };\n";
    const APP = (kat: [string, string[]][]) => JSON.stringify({ expo: { ios: { privacyManifests: { NSPrivacyAccessedAPITypes: kat.map(([k, p]) => ({ NSPrivacyAccessedAPIType: k, NSPrivacyAccessedAPITypeReasons: p })) } } } });
    const swift = 'let d = UserDefaults.standard\nvar s = stat()\nfstat(fd, &s)\n';
    test('własny *.xcprivacy w folderze celu watch → błąd o dublu (kopiuje go grupa synchronizowana, a agregacja dokłada drugi), kod 1', () => {
      const d = cele({ 'watch/expo-target.config.js': KONF, 'watch/A.swift': swift, 'watch/PrivacyInfo.xcprivacy': manifest([[UD, ['CA92.1']], [FT, ['C617.1']]]), 'app.json': APP([[UD, ['CA92.1']], [FT, ['C617.1']]]) });
      const w = uruchom(['--katalog', join(d, ''), '--app-json', join(d, 'app.json')]);
      expect(w.wyjscie).toMatch(/targets\/watch: własny PrivacyInfo\.xcprivacy dubluje manifest zbiorczy/);
      expect(w.kod).toBe(1);
    });
    test('bez własnego pliku i z kategoriami w app.json → OK; bez kategorii kodu (FileTimestamp) w app.json → błąd z miejscem użycia', () => {
      const ok = cele({ 'watch/expo-target.config.js': KONF, 'watch/A.swift': swift, 'app.json': APP([[UD, ['CA92.1']], [FT, ['C617.1']]]) });
      expect(uruchom(['--katalog', ok, '--app-json', join(ok, 'app.json')]).kod).toBe(0);
      const brak = cele({ 'watch/expo-target.config.js': KONF, 'watch/A.swift': swift, 'app.json': APP([[UD, ['CA92.1']]]) });
      const w = uruchom(['--katalog', brak, '--app-json', join(brak, 'app.json')]);
      expect(w.wyjscie).toMatch(new RegExp(`targets/watch: manifest bez kategorii ${FT} \\(użycie: A\\.swift:2\\)`));
      expect(w.kod).toBe(1);
    });
  });
  test('--pakiet: brak manifestu w pakiecie celu, który go wymaga → kod 1; pełny manifest → 0', () => {
    const d = cele({ 'watch/A.swift': 'let d = UserDefaults.standard\n', 'm.xcprivacy': manifest([[UD, ['CA92.1']]]) });
    expect(uruchom(['--katalog', d, '--pakiet', '-', '--cel', 'watch']).kod).toBe(1);
    expect(uruchom(['--katalog', d, '--pakiet', join(d, 'm.xcprivacy'), '--cel', 'watch']).kod).toBe(0);
  });
});

test('kontrola-ipa.sh: manifest w pakiecie zegarka sprawdzany skryptem manifest-celow.mjs jako BŁĄD wydania (nie uwaga)', () => {
  const sh = readFileSync(join(K, 'scripts/wydanie/kontrola-ipa.sh'), 'utf8');
  expect(sh.split('\n').filter((l) => /uwaga "\$n: brak PrivacyInfo\.xcprivacy/.test(l)).every((l) => l.includes('[ "$p" = "$ZEGAREK" ] ||'))).toBe(true); // dla zegarka nie uwaga
  expect(sh).toMatch(/node scripts\/wydanie\/manifest-celow\.mjs --pakiet [^\n]*--cel watch[^\n]*\|\| bledy=\$\(\(bledy \+ 1\)\)/);
});

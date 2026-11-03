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

test('repo: każdy cel z API z listy Apple ma własny manifest z tą kategorią (zegarek: UserDefaults, fstat)', () => {
  const w = uruchom([]);
  expect(w.wyjscie).toContain('manifesty celów: OK');
  expect(w.kod).toBe(0);
});

test('manifest zegarka: UserDefaults CA92.1 (dane tylko zegarka) i FileTimestamp C617.1 (rozmiar dziennika w kontenerze), bez śledzenia i zbierania', () => {
  const xml = readFileSync(join(K, 'targets/watch/PrivacyInfo.xcprivacy'), 'utf8');
  expect(xml).toMatch(/<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  expect(xml).toMatch(/<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/);
  expect(xml).toMatch(new RegExp(`<string>${UD}</string>\\s*<key>NSPrivacyAccessedAPITypeReasons</key>\\s*<array>\\s*<string>CA92.1</string>\\s*</array>`));
  expect(xml).toMatch(new RegExp(`<string>${FT}</string>\\s*<key>NSPrivacyAccessedAPITypeReasons</key>\\s*<array>\\s*<string>C617.1</string>\\s*</array>`));
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

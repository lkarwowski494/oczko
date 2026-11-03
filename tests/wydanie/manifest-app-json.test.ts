// M1-audytor-generalny-083 (10-wydanie-002, P-453): powody Required Reason API w `app.json` → `ios.privacyManifests`
// są równe kolumnie „Do app.json” inwentarza roli 05 (`docs/architektura/prywatnosc.md`), kategoria po kategorii.
// Dlaczego: inwentarz jest źródłem prawdy 05; rozjazd z app.json to zły powód w manifeście wysłanym do Apple.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const KOD = /[0-9A-F]{4}\.\d/g;

type Wpis = { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] };

function inwentarz(): Map<string, string[]> {
  const linie = readFileSync(join(KORZEN, 'docs/architektura/prywatnosc.md'), 'utf8').split('\n');
  const start = linie.findIndex((l) => l.startsWith('| Kategoria |') && l.includes('Do `app.json`'));
  if (start < 0) throw new Error('brak tabeli inwentarza z kolumną „Do app.json”');
  const wynik = new Map<string, string[]>();
  for (const l of linie.slice(start + 2)) {
    if (!l.startsWith('|')) break;
    const kom = l.split('|').map((k) => k.trim());
    // kom[0] puste; 1 kategoria, 2 zależności, 3 kod aplikacji, 4 do app.json
    const kody = [...new Set(kom[4]?.match(KOD) ?? [])].sort();
    if (kody.length) wynik.set(kom[1], kody);
  }
  return wynik;
}

function appJson(): Map<string, string[]> {
  const a = JSON.parse(readFileSync(join(KORZEN, 'app.json'), 'utf8')) as { expo: { ios: { privacyManifests: { NSPrivacyAccessedAPITypes: Wpis[] } } } };
  return new Map(
    a.expo.ios.privacyManifests.NSPrivacyAccessedAPITypes.map((w) => [
      w.NSPrivacyAccessedAPIType.replace('NSPrivacyAccessedAPICategory', ''),
      [...w.NSPrivacyAccessedAPITypeReasons].sort(),
    ]),
  );
}

describe('M1-083: app.json privacyManifests = inwentarz 05', () => {
  it('tabela inwentarza ma co najmniej kategorie UserDefaults, FileTimestamp, SystemBootTime, DiskSpace', () => {
    expect([...inwentarz().keys()].sort()).toEqual(expect.arrayContaining(['DiskSpace', 'FileTimestamp', 'SystemBootTime', 'UserDefaults']));
  });
  it('te same kategorie i te same powody w app.json', () => {
    const inw = Object.fromEntries(inwentarz());
    const app = Object.fromEntries(appJson());
    expect(app).toEqual(inw);
  });
});

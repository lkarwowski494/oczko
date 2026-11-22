// Kontrole wydania roli 10 (build E2, 2026-10-26): strona `site/` (P-093 (1), P-196), adres strony jako jedna stała
// (`docs/wydanie/adres-strony.json`, P-196: D1 czeka na właściciela) i workflow TestFlight według ADR-0014 i P-196 (D3a–D5a).
// Reguły ogólne workflowów: scripts/jakosc/sprawdz-workflowy.mjs; pliki sekretów: scripts/jakosc/kontrole-repo.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { YAML } from '../jakosc/maestro-runner'; // dist CommonJS (wejście „browser” pakietu yaml to ESM)
import { ADRESY } from '../../src/kompozycja/adresy';

const root = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(root, p), 'utf8');
const STRONY = ['index.html', 'privacy.html', 'support.html'];

describe('site/: strona produktu, polityka prywatności i wsparcie (PL, EN)', () => {
  test.each(STRONY)('%s: obie wersje językowe, bez skryptów, linki wewnętrzne względne', (strona) => {
    const html = czytaj(`site/${strona}`);
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<section lang="pl">');
    expect(html).toMatch(/<section lang="en"[ >]/);
    // Bez skryptów i zasobów z zewnątrz: strona działa pod każdą ścieżką i niczego nie wczytuje.
    expect(html).not.toMatch(/<script|<link[^>]+href="https?:|<img[^>]+src="https?:/i);
    // Adres strony to jedna stała (P-196): linki wewnętrzne względne, bez ścieżki repo zaszytej w HTML.
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      expect(href.startsWith('/') || /apps4brew\.com\/(oczko|Oczko)/.test(href)).toBe(false);
    }
    expect(html).toContain('mailto:support@apps4brew.com');
    expect(html).not.toMatch(/\b(TODO|FIXME|PLACEHOLDER|example\.com|Purlo)\b/i);
  });

  test('polityka: brak zbierania danych, reklam i śledzenia; sekcja o e-mailu z elementami art. 13 RODO', () => {
    const html = czytaj('site/privacy.html');
    for (const fraza of ['nie zbiera', 'reklam', 'śledzenia', 'Administrator', 'PUODO', 'Zgłoś problem']) expect(html).toContain(fraza);
    for (const fraza of ['does not collect', 'advertising', 'tracking', 'Controller', 'PUODO', 'Report a problem']) expect(html).toContain(fraza);
    // P-108: bez listy źródeł; P-121 (5): odbiorcy opisowo — jedyne adresy zewnętrzne to e-mail wsparcia.
    expect(html).not.toMatch(/href="https?:/);
  });
});

describe('adres strony: jedna stała (docs/wydanie/adres-strony.json)', () => {
  const adres = JSON.parse(czytaj('docs/wydanie/adres-strony.json')) as { baza: string; polityka: string; wsparcie: string };

  test('baza to katalog oczko/ na apps4brew.com albo GitHub Pages repo (do publikacji w apps4brew-www), strony istnieją w site/', () => {
    expect(adres.baza).toMatch(/^https:\/\/(apps4brew\.com|lkarwowski494\.github\.io)\/oczko\/$/);
    for (const plik of [adres.polityka, adres.wsparcie]) expect(existsSync(join(root, 'site', plik))).toBe(true);
  });

  test('adres polityki w aplikacji = baza + polityka (zmiana nazwy repo zmienia oba miejsca naraz)', () => {
    expect(ADRESY.polityka).toBe(adres.baza + adres.polityka);
  });
});

describe('testflight.yml według ADR-0014 i P-196', () => {
  const tekst = czytaj('.github/workflows/testflight.yml');
  type Zadanie = { environment?: string; 'runs-on'?: string; needs?: string[] };
  const wf = YAML.parse(tekst) as { on?: object; true?: object; jobs: Record<string, Zadanie> }; // dane z repo
  const on = wf.on ?? wf.true ?? {};
  const build = wf.jobs.build;

  test('tylko ręcznie (workflow_dispatch), bez tagów i pushy', () => {
    expect(Object.keys(on)).toEqual(['workflow_dispatch']);
  });

  test('sekrety tylko w zadaniu ze środowiskiem release (P-316), na macos-26', () => {
    expect(build.environment).toBe('release');
    expect(build['runs-on']).toBe('macos-26');
    for (const [id, job] of Object.entries(wf.jobs)) {
      if (id !== 'build') expect(JSON.stringify(job)).not.toMatch(/secrets\.ASC_/);
    }
  });

  test('wysyłka czeka na zielony „Jakość · iOS” tego commitu (bramka, D5a)', () => {
    expect(build.needs).toContain('bramka');
    expect(tekst).toContain('node scripts/wydanie/testflight.mjs bramka');
  });

  test('numer buildu: run_number × 10 + run_attempt + przesunięcie (D3a), sprawdzany przed wysyłką', () => {
    expect(tekst).toMatch(/GITHUB_RUN_NUMBER \* 10 \+ GITHUB_RUN_ATTEMPT \+ PRZESUNIECIE/);
    expect(tekst).toContain('scripts/wydanie/kontrola-ipa.sh');
  });

  test('kontrola .ipa woła skrypt śladów trybu testowego na main.jsbundle (JAK-15, P-237) i liczy wynik jako BŁĄD', () => {
    expect(czytaj('scripts/wydanie/kontrola-ipa.sh')).toMatch(/node scripts\/wydanie\/slady-testowe\.mjs "\$B" \|\| bledy=\$\(\(bledy \+ 1\)\)/);
  });

  test('podpis ad hoc: każdy pakiet własnym plikiem uprawnień swojego celu (CODE_SIGN_ENTITLEMENTS, P-233), brak pliku = błąd', () => {
    expect(tekst).toContain('node scripts/wydanie/uprawnienia-celow.mjs ios/Oczko.xcodeproj/project.pbxproj');
    expect(tekst).not.toMatch(/grep -i -m1 -e widget/);
    expect(tekst).toMatch(/::error::.*brak pliku uprawnień/);
  });

  test('klucz .p8 dopiero po archiwum, w RUNNER_TEMP z umask 077, usuwany zawsze; logi maskowane; bez .ipa w artefaktach', () => {
    const archiwum = tekst.indexOf('-archivePath "$RUNNER_TEMP/Oczko.xcarchive" archive');
    expect(archiwum).toBeGreaterThan(0);
    expect(tekst.indexOf('AuthKey.p8"')).toBeGreaterThan(archiwum);
    expect(tekst).toContain('umask 077');
    expect(tekst).toMatch(/if: always\(\)\s+run: rm -f "\$RUNNER_TEMP\/AuthKey\.p8"/);
    expect(tekst).toContain('<KEY_ID>');
    expect(tekst).toContain('<ISSUER_ID>');
    expect(tekst).not.toMatch(/path:.*\.(ipa|xcarchive)/);
    expect(tekst).not.toMatch(/set -x/);
  });
});

test('app.json: ITSAppUsesNonExemptEncryption = false i manifest prywatności z kategoriami z inwentarza 05', () => {
  const appJson = JSON.parse(czytaj('app.json')).expo;
  expect(appJson.ios?.infoPlist?.ITSAppUsesNonExemptEncryption).toBe(false);
  const apiTypes = (appJson.ios?.privacyManifests?.NSPrivacyAccessedAPITypes || []).map(
    (x: { NSPrivacyAccessedAPIType: string }) => x.NSPrivacyAccessedAPIType
  );
  expect(apiTypes).toEqual(
    expect.arrayContaining([
      'NSPrivacyAccessedAPICategoryUserDefaults',
      'NSPrivacyAccessedAPICategoryFileTimestamp',
      'NSPrivacyAccessedAPICategorySystemBootTime',
      'NSPrivacyAccessedAPICategoryDiskSpace',
    ])
  );
});

// Zgłoszenia 10 dla 08 (P-206, docs/wydanie/sklep.md §7 (3)); typ pliku `.oczko` według ADR-0004 „Typ pliku `.oczko`”.
// `version` 1.0.0 „przed kandydatem” — nie teraz: wersja ≥ 1.0 wymaga wzorca tests/bazy/v1.db (migracje-wydanych.test.ts, R-074),
// a schemat v1 jeszcze się zmienia (P-217, P-221); pytanie Q-S3-2 do koordynatora.
test('app.json: opis bez starej nazwy i wersji 0.1.0; typ `.oczko` eksportowany i obsługiwany (ADR-0004)', () => {
  const e = JSON.parse(czytaj('app.json')).expo;
  expect(e.description).not.toMatch(/Purlo|0\.1\.0|Offline-First/);
  const plist = e.ios.infoPlist;
  const typ = `${e.ios.bundleIdentifier}.archiwum`;
  expect(plist.UTExportedTypeDeclarations).toEqual([expect.objectContaining({
    UTTypeIdentifier: typ, UTTypeConformsTo: ['public.zip-archive', 'public.data'],
    UTTypeTagSpecification: { 'public.filename-extension': ['oczko'] },
  })]);
  expect(plist.CFBundleDocumentTypes).toEqual([expect.objectContaining({ LSItemContentTypes: [typ], LSHandlerRank: 'Owner' })]);
});

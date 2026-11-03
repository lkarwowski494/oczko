// Konfiguracja Expo i zależności: supportedLocales = słowniki, pliki systemowe, przypięcie wersji.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(__dirname, '..', '..');
const czytaj = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const slowniki = readdirSync(join(root, 'src/i18n/slowniki'))
  .filter((f) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f))
  .map((f) => f.slice(0, -5))
  .sort();

describe('app.json', () => {
  const expo = czytaj('app.json').expo;
  const plugin = (expo.plugins as unknown[]).find((p) => Array.isArray(p) && p[0] === 'expo-localization') as [string, { supportedLocales: { ios: string[]; android: string[] }; supportsRTL: boolean }] | undefined;

  it('plugin expo-localization z supportedLocales równym słownikom (iOS i Android)', () => {
    expect(plugin).toBeDefined();
    expect([...plugin![1].supportedLocales.ios].sort()).toEqual(slowniki);
    expect([...plugin![1].supportedLocales.android].sort()).toEqual(slowniki);
  });
  it('bez RTL (żaden z 35 języków nie jest pismem od prawej)', () => expect(plugin![1].supportsRTL).toBe(false));
  it('CFBundleLocalizations = słowniki (jak w Treningu)', () => {
    expect([...expo.ios.infoPlist.CFBundleLocalizations].sort()).toEqual(slowniki);
  });
  it('CFBundleAllowMixedLocalizations włączone', () => expect(expo.ios.infoPlist.CFBundleAllowMixedLocalizations).toBe(true));
  it('locales: plik systemowy dla każdego słownika, z nazwą pod ikoną i opisem aparatu', () => {
    expect(Object.keys(expo.locales).sort()).toEqual(slowniki);
    for (const [, sciezka] of Object.entries<string>(expo.locales)) {
      expect(existsSync(join(root, sciezka))).toBe(true);
      const p = czytaj(sciezka);
      expect(String(p.ios.CFBundleDisplayName).length).toBeGreaterThan(1); // wartość = słowo marki z nazwy w sklepie: nazwa-pod-ikona-056.test.ts
      expect(String(p.ios.NSCameraUsageDescription).length).toBeGreaterThan(10);
    }
  });
  it('en-XA (pseudo) nigdy w supportedLocales', () => {
    expect(JSON.stringify(plugin![1].supportedLocales)).not.toMatch(/XA/i);
  });
});

describe('zależności i18n (ADR-0017: bez biblioteki i polyfilla, wzór z Treningu)', () => {
  const dep = czytaj('package.json').dependencies as Record<string, string>;
  it('expo-localization przypięty bez ^ i ~ (P-036)', () => expect(dep['expo-localization']).toMatch(/^\d+\.\d+\.\d+$/));
  it.each(['i18next', 'react-i18next', '@formatjs/intl-pluralrules', '@formatjs/intl-locale'])('%s nie jest zależnością', (p) =>
    expect(dep[p]).toBeUndefined());
});

describe('pseudolokalizacja wygenerowana skryptem', () => {
  it('src/i18n/pseudo/en-XA.json zgodny ze skryptem na en.json (npm run i18n:pseudo)', () => {
    const tmp = join(mkdtempSync(join(tmpdir(), 'xa-')), 'xa.json');
    const r = spawnSync(process.execPath, ['scripts/sprawdz-i18n.mjs', 'src/i18n/slowniki', '--zrodlo', 'en', '--oczekujace', 'docs/lokalizacja/oczekujace.json', '--pseudo', tmp], { cwd: root, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, 'src/i18n/pseudo/en-XA.json'), 'utf8')).toBe(readFileSync(tmp, 'utf8'));
  });
  it('plik pseudo nie leży w katalogu słowników', () => {
    expect(slowniki).not.toContain('en-XA');
  });
});

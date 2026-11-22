/* P-300 R1 (ryzyko wytycznej 2.5.4): tryb tła `remote-notification` i `aps-environment` trafiają do builda tylko przy ICLOUD_W_1_0 = true (P-290).
 * Plugin plugins/icloud-tlo.js przycina konfigurację Expo przed prebuildem; flagę czyta z src/konfiguracja.ts (jedno źródło, bez kopii). */
import * as fs from 'fs';
import * as path from 'path';
import { ICLOUD_W_1_0 } from '../../src/konfiguracja';

const KORZEN = path.join(__dirname, '..', '..');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plugin konfiguracji Expo jest modułem CommonJS ładowanym przez expo/config
const plugin = require(path.join(KORZEN, 'plugins/icloud-tlo.js')) as {
  (config: Konfiguracja): Konfiguracja;
  przytnij(config: Konfiguracja, icloud: boolean): Konfiguracja;
  flagaZKodu(korzen: string): boolean;
};
type Konfiguracja = { ios?: { entitlements?: Record<string, unknown>; infoPlist?: Record<string, unknown> }; name?: string };

const baza = (): Konfiguracja => ({
  name: 'Oczko',
  ios: {
    entitlements: {
      'com.apple.security.application-groups': ['group.x'],
      'com.apple.developer.icloud-services': ['CloudKit'],
      'com.apple.developer.icloud-container-identifiers': ['iCloud.x'],
      'aps-environment': 'production',
    },
    infoPlist: { UIBackgroundModes: ['remote-notification'], CFBundleDocumentTypes: [{ a: 1 }] },
  },
});

test('P-300 R1: iCloud poza buildem → bez remote-notification i bez aps-environment, reszta nietknięta', () => {
  const w = plugin.przytnij(baza(), false);
  expect(w.ios?.entitlements).not.toHaveProperty('aps-environment');
  expect(w.ios?.infoPlist).not.toHaveProperty('UIBackgroundModes');
  expect(w.ios?.entitlements).toMatchObject({ 'com.apple.security.application-groups': ['group.x'], 'com.apple.developer.icloud-services': ['CloudKit'] });
  expect(w.ios?.infoPlist).toMatchObject({ CFBundleDocumentTypes: [{ a: 1 }] });
});

test('P-300 R1: iCloud w buildzie → konfiguracja bez zmian', () => {
  expect(plugin.przytnij(baza(), true)).toEqual(baza());
});

test('P-300 R1: inne tryby tła zostają, usuwany tylko remote-notification', () => {
  const k = baza();
  if (k.ios?.infoPlist) k.ios.infoPlist.UIBackgroundModes = ['remote-notification', 'audio'];
  expect(plugin.przytnij(k, false).ios?.infoPlist?.UIBackgroundModes).toEqual(['audio']);
});

test('P-300 R1: flaga z src/konfiguracja.ts czytana przez plugin = stała w kodzie', () => {
  expect(plugin.flagaZKodu(KORZEN)).toBe(ICLOUD_W_1_0);
});

test('P-300 R1: plugin podłączony w app.json, a funkcja wejściowa używa flagi z kodu', () => {
  const app = JSON.parse(fs.readFileSync(path.join(KORZEN, 'app.json'), 'utf8')) as { expo: { plugins: unknown[] } };
  expect(app.expo.plugins).toContain('./plugins/icloud-tlo');
  // wynik pluginu zależy od flagi z kodu (build TestFlight ma ją na true, P-290; App Store na false do zaliczenia ZM-06) — asercja bez przypięcia wartości
  expect(plugin(baza())).toEqual(plugin.przytnij(baza(), ICLOUD_W_1_0));
  expect(plugin(baza()).ios?.entitlements?.['aps-environment'] !== undefined).toBe(ICLOUD_W_1_0);
});

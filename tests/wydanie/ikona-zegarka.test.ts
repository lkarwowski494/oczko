// Kontrola L-021 z Treningu (P-349; lkarwowski494/trening docs/40-lekcje.md L-021): wysyłka buildu odpadła, bo aplikacja zegarka nie miała ikony
// („Missing Icons… CFBundleIconFiles”, brak `CFBundleIconName`). Przyczyna: bez pola `icon:` w konfiguracji celu @bacons/apple-targets nie ustawia
// `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`, więc actool nie wpisuje CFBundleIconName. Tu: pole jest, plik jest, wtyczka robi to, co zakładamy,
// a kontrola-ipa.sh (macOS, przed wysyłką) wymaga CFBundleIconName w gotowym pakiecie zegarka. Walidację Apple na .ipa robi waliduj-ipa.sh (bez_wysylki).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(K, p), 'utf8');

test('cel zegarka ma pole icon: wskazujące istniejący PNG 1024×1024 RGB bez kanału alfa', () => {
  const cfg = czytaj('targets/watch/expo-target.config.js');
  const sciezka = /^\s*icon:\s*'([^']+)'/m.exec(cfg)?.[1];
  expect(sciezka).toBe('../../assets/icon.png');
  const png = readFileSync(join(K, 'targets/watch', sciezka!));
  expect([png.readUInt32BE(16), png.readUInt32BE(20), png[25]]).toEqual([1024, 1024, 2]);
});

test('wtyczka @bacons/apple-targets 5.0.0 ustawia AppIcon dla celu zegarka tylko przy polu icon (zmiana wersji wymaga ponownej kontroli)', () => {
  expect(JSON.parse(czytaj('package.json')).dependencies['@bacons/apple-targets']).toBe('5.0.0');
  const zrodlo = czytaj('node_modules/@bacons/apple-targets/build/configuration-list.js');
  const watch = /function createWatchAppConfigurationList[\s\S]*?\nfunction /.exec(zrodlo)?.[0] ?? '';
  expect(watch).toContain('...(icon && { ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon" })');
});

test('kontrola-ipa.sh wymaga CFBundleIconName w pakiecie zegarka jako BŁĄD wydania', () => {
  const sh = czytaj('scripts/wydanie/kontrola-ipa.sh');
  expect(sh).toMatch(/pb CFBundleIconName "\$ZEGAREK\/Info\.plist"[^\n]*\|\| blad "zegarek: brak CFBundleIconName/);
});

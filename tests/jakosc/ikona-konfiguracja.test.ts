// M1-audytor-generalny-015 (04-studio-projektowe-001, P1): ikona aplikacji i ekran startowy z zatwierdzonego projektu, nie z poprzedniej wersji.
// Kontrakt: wpisy w app.json wskazują pliki o tych samych SHA-256 co odpowiedniki w docs/design/ikona/ (design-spec.md, „Ikona: wpisy konfiguracji
// (dla 08)”), a kolory tła ekranu startowego i ikony Androida to tokeny `papier` z docs/design/tokeny.json (zasada 15: bez nowych kolorów).
// Ekran startowy przez plugin expo-splash-screen jak w Treningu (P-315): w SDK 57 klucz `expo.splash` nie ma już pluginu w @expo/prebuild-config.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const json = (p: string): Record<string, any> => JSON.parse(readFileSync(join(K, p), 'utf8'));
const sha = (p: string) => createHash('sha256').update(readFileSync(join(K, p))).digest('hex');
const projekt = (plik: string) => sha(join('docs/design/ikona', plik));

const expo = json('app.json').expo;
const tokeny = json('docs/design/tokeny.json').kolor;
const splash = (expo.plugins as unknown[]).find((p): p is [string, Record<string, any>] => Array.isArray(p) && p[0] === 'expo-splash-screen');

const wpisy: Record<string, unknown> = {
  icon: expo.icon,
  'ios.icon.light': expo.ios?.icon?.light,
  'ios.icon.dark': expo.ios?.icon?.dark,
  'android.adaptiveIcon.foregroundImage': expo.android?.adaptiveIcon?.foregroundImage,
  'android.adaptiveIcon.monochromeImage': expo.android?.adaptiveIcon?.monochromeImage,
  'plugin expo-splash-screen image': splash?.[1].image,
};

test.each([
  ['icon', 'icon.png'],
  ['ios.icon.light', 'icon.png'],
  ['ios.icon.dark', 'ios-dark.png'],
  ['android.adaptiveIcon.foregroundImage', 'android-foreground.png'],
  ['android.adaptiveIcon.monochromeImage', 'android-monochrome.png'],
  ['plugin expo-splash-screen image', 'splash-icon.png'],
])('app.json %s wskazuje plik o sumie SHA-256 docs/design/ikona/%s', (wpis, plik) => {
  const sciezka = wpisy[wpis];
  if (typeof sciezka !== 'string') throw new Error(`app.json: brak wpisu ${wpis} (oczekiwany plik o sumie docs/design/ikona/${plik})`);
  expect(existsSync(join(K, sciezka))).toBe(true);
  expect(sha(sciezka)).toBe(projekt(plik));
});

test('ekran startowy: plugin expo-splash-screen z tłem = token papier (jasny) i dark.backgroundColor = token papier (ciemny)', () => {
  expect(splash).toBeDefined();
  expect(splash![1].backgroundColor).toBe(tokeny.jasny.papier);
  expect(splash![1].dark?.backgroundColor).toBe(tokeny.ciemny.papier);
});

test('tło ikony Androida = token papier (jasny)', () => {
  expect(expo.android?.adaptiveIcon?.backgroundColor).toBe(tokeny.jasny.papier);
});

test('brak martwego klucza expo.splash (SDK 57 go nie czyta) i plugin expo-splash-screen jest zależnością z app.plugin.js', () => {
  expect(expo.splash).toBeUndefined();
  expect(json('package.json').dependencies['expo-splash-screen']).toBeDefined();
  expect(existsSync(join(K, 'node_modules/expo-splash-screen/app.plugin.js'))).toBe(true);
});

test('primaryColor nie wprowadza koloru spoza tokenów (brak albo token grafit jasny)', () => {
  expect([undefined, tokeny.jasny.grafit]).toContain(expo.primaryColor);
});

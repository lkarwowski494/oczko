// M1-audytor-generalny-015 (04-studio-projektowe-001, P1): ikona aplikacji i ekran startowy z zatwierdzonego projektu, nie z poprzedniej wersji.
// Kontrakt: wpisy w app.json wskazują pliki o tych samych SHA-256 co odpowiedniki w docs/design/ikona/ (design-spec.md, „Ikona: wpisy konfiguracji
// (dla 08)”), a kolory tła ekranu startowego i ikony Androida to tokeny `papier` z docs/design/tokeny.json (zasada 15: bez nowych kolorów).
// Ekran startowy przez plugin expo-splash-screen jak w Treningu (P-315): w SDK 57 klucz `expo.splash` nie ma już pluginu w @expo/prebuild-config.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

const K = join(__dirname, '../..');
const json = (p: string): Record<string, any> => JSON.parse(readFileSync(join(K, p), 'utf8'));
const sha = (p: string) => createHash('sha256').update(readFileSync(join(K, p))).digest('hex');
const projekt = (plik: string) => sha(join('docs/design/ikona', plik));

const idat = (b: Buffer): Buffer[] => {
  const czesci: Buffer[] = [];
  for (let i = 8; i < b.length; i += 12 + b.readUInt32BE(i)) if (b.toString('ascii', i + 4, i + 8) === 'IDAT') czesci.push(b.subarray(i + 8, i + 8 + b.readUInt32BE(i)));
  return czesci;
};

const expo = json('app.json').expo;
const tokeny = json('docs/design/tokeny.json').kolor;
const splash = (expo.plugins as unknown[]).find((p): p is [string, Record<string, any>] => Array.isArray(p) && p[0] === 'expo-splash-screen');

const wpisy: Record<string, unknown> = {
  icon: expo.icon,
  'ios.icon.light': expo.ios?.icon?.light,
  'ios.icon.dark': expo.ios?.icon?.dark,
  'ios.icon.tinted': expo.ios?.icon?.tinted, // P-497: wariant barwiony iOS 18+
  'android.adaptiveIcon.foregroundImage': expo.android?.adaptiveIcon?.foregroundImage,
  'android.adaptiveIcon.monochromeImage': expo.android?.adaptiveIcon?.monochromeImage,
  'plugin expo-splash-screen image': splash?.[1].image,
  'plugin expo-splash-screen dark.image': splash?.[1].dark?.image, // M1-088 (04-studio-projektowe-507, DEC-23 a): ciemny ekran startowy ≥ 3:1
};

test.each([
  ['icon', 'icon.png'],
  ['ios.icon.light', 'icon.png'],
  ['ios.icon.dark', 'ios-dark.png'],
  ['ios.icon.tinted', 'ios-tinted.png'],
  ['android.adaptiveIcon.foregroundImage', 'android-foreground.png'],
  ['android.adaptiveIcon.monochromeImage', 'android-monochrome.png'],
  ['plugin expo-splash-screen image', 'splash-icon.png'],
  ['plugin expo-splash-screen dark.image', 'splash-icon-dark.png'],
])('app.json %s wskazuje plik o sumie SHA-256 docs/design/ikona/%s', (wpis, plik) => {
  const sciezka = wpisy[wpis];
  if (typeof sciezka !== 'string') throw new Error(`app.json: brak wpisu ${wpis} (oczekiwany plik o sumie docs/design/ikona/${plik})`);
  expect(existsSync(join(K, sciezka))).toBe(true);
  expect(sha(sciezka)).toBe(projekt(plik));
});

test('ikona barwiona iOS (P-497; Apple: „Provide your tinted app icon as a grayscale image”): PNG 1024 × 1024, RGBA, każdy piksel widoczny ma R = G = B', () => {
  const b = readFileSync(join(K, expo.ios.icon.tinted));
  expect([b.readUInt32BE(16), b.readUInt32BE(20), b[24], b[25]]).toEqual([1024, 1024, 8, 6]);
  const surowe = inflateSync(Buffer.concat(idat(b)));
  const w = 1024;
  let niszare = 0, widoczne = 0;
  for (let y = 0; y < w; y++) {
    const wiersz = y * (1 + w * 4);
    expect(surowe[wiersz]).toBe(0); // render projektu: filtr 0 (narzedzia/ikona.mjs)
    for (let x = 0; x < w; x++) {
      const i = wiersz + 1 + x * 4;
      if (surowe[i + 3] === 0) continue;
      widoczne++;
      if (surowe[i] !== surowe[i + 1] || surowe[i + 1] !== surowe[i + 2]) niszare++;
    }
  }
  expect(widoczne).toBeGreaterThan(0);
  expect(niszare).toBe(0);
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

test('ikona zegarka (P-407, design-spec „Ikona: wpisy konfiguracji”): cel watch wskazuje plik o sumie SHA-256 docs/design/ikona/watch.png', () => {
  const cfg = readFileSync(join(K, 'targets/watch/expo-target.config.js'), 'utf8');
  const sciezka = /^\s*icon:\s*'([^']+)'/m.exec(cfg)?.[1];
  if (!sciezka) throw new Error('targets/watch/expo-target.config.js: brak pola icon:');
  const plik = join('targets/watch', sciezka);
  expect(existsSync(join(K, plik))).toBe(true);
  expect(sha(plik)).toBe(projekt('watch.png'));
});

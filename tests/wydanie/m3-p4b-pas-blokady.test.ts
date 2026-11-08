// M3 p4b (kawałek C, zadanie 9, P-579, M3-MAK-04): tło pasa przypomnienia na ekranie blokady (rozwinięta Dynamic Island) i na zegarku pochodzi z tokenu
// `kolory.systemCzarny.pasPrzypomnienia`, a nie z `kolory.ciemny.powierzchnia` (wartości dziś równe, #312B27; token jest źródłem). Swift nie kompiluje się na Linuksie,
// więc kontrola czyta config celów (jak barwy-celow-tokeny.test.ts); nazwy barw w katalogu zasobów i Swift bez zmian.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const tokeny = JSON.parse(readFileSync(join(K, 'docs/design/tokeny.json'), 'utf8')) as { kolory: { systemCzarny: Record<string, string>; ciemny: Record<string, string> } };
const pas = tokeny.kolory.systemCzarny.pasPrzypomnienia as string;
const zrodlo = (cel: 'widget' | 'watch') => readFileSync(join(K, 'targets', cel, 'expo-target.config.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
const barwy = (cel: 'widget' | 'watch') => (require(join(K, 'targets', cel, 'expo-target.config.js')) as { colors: Record<string, { light: string; dark: string }> }).colors; // eslint-disable-line @typescript-eslint/no-require-imports

test('token systemCzarny.pasPrzypomnienia istnieje i jest barwą heks', () => {
  expect(pas).toMatch(/^#[0-9A-Fa-f]{6}$/);
});

test('widget: tło pasa w rozwiniętej wyspie (wyspaPowierzchnia) = systemCzarny.pasPrzypomnienia, config nie czyta ciemny.powierzchnia', () => {
  expect(barwy('widget').wyspaPowierzchnia).toEqual({ light: pas, dark: pas });
  expect(zrodlo('widget')).toMatch(/czarny\('pasPrzypomnienia'\)/);
  expect(zrodlo('widget')).not.toMatch(/ciemna\('powierzchnia'\)/);
});

test('zegarek: tło pasa (powierzchnia) = systemCzarny.pasPrzypomnienia, config nie czyta ciemny.powierzchnia', () => {
  expect(barwy('watch').powierzchnia).toEqual({ light: pas, dark: pas });
  expect(zrodlo('watch')).toMatch(/czarny\('pasPrzypomnienia'\)/);
  expect(zrodlo('watch')).not.toMatch(/ciemna\('powierzchnia'\)/);
});

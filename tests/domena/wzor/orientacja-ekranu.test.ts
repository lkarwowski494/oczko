// Orientacja ekranu (P-221 Q3a, ADR-0026; P-259 wariant A): deklarowana w nawigacji (react-native-screens, opcja `orientation` ekranu),
// bez żądania obrotu przy starcie. iPhone: pion poza ekranem wzoru, dowolna na wzorze (F-25, W1a/W3); iPad: dowolna wszędzie (multitasking).
import { orientacjaEkranu } from '../../../src/domena/uklad';

test('iPhone: pion poza wzorem, dowolna na wzorze', () => {
  expect(orientacjaEkranu('inny', false)).toBe('portrait_up');
  expect(orientacjaEkranu('wzor', false)).toBe('all');
});
test('PU-146 · iPad: dowolna orientacja na każdym ekranie', () => {
  expect(orientacjaEkranu('inny', true)).toBe('all');
  expect(orientacjaEkranu('wzor', true)).toBe('all');
});
test('nawigacja deklaruje orientację; bez pakietu, który żąda obrotu przy każdym starcie (P-258)', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const uklad = fs.readFileSync('app/_layout.tsx', 'utf8');
  expect(uklad).toMatch(/orientation: orientacjaEkranu\('inny', /);
  expect(uklad).toMatch(/name="wzor"[^\n]*orientation: orientacjaEkranu\('wzor', /);
  expect(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies).not.toHaveProperty('expo-screen-orientation');
});

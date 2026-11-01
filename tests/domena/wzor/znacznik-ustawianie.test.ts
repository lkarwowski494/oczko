// Ustawianie znacznika na stronie wzoru (07-jakosc-023, F-26; BR-WZR-003 S2–S4; design-spec „Znacznik rzędu na wzorze”).
import { gornaKrawedzNaNastepnejStronie, gornaKrawedzRzedu, krokZnacznika, rzadPoPrzeniesieniu } from '../../../src/domena/znacznik-wzoru';

test('przytrzymanie: pas wyśrodkowany na palcu, przycięty do strony', () => {
  expect(gornaKrawedzRzedu(0.5, 0.02)).toBeCloseTo(0.49, 9);
  expect(gornaKrawedzRzedu(0.001, 0.02)).toBe(0);
  expect(gornaKrawedzRzedu(1, 0.02)).toBeCloseTo(0.98, 9);
});
test('rząd po przeniesieniu pasa: zachowuje rząd znacznika (S3), pierwszy znacznik bierze rząd w robocie (S2), przed schematem wraca na 1', () => {
  expect(rzadPoPrzeniesieniu({ rzad: 6 }, 46)).toBe(6);
  expect(rzadPoPrzeniesieniu(null, 46)).toBe(46);
  expect(rzadPoPrzeniesieniu({ rzad: -1 }, 41)).toBe(1);
  expect(rzadPoPrzeniesieniu({ rzad: 0 }, 41)).toBe(1);
});
test('następna strona: pas przy krawędzi, od której zaczyna się kierunek (↑ od dołu, ↓ od góry)', () => {
  expect(gornaKrawedzNaNastepnejStronie(-1, 0.02)).toBeCloseTo(0.98, 9);
  expect(gornaKrawedzNaNastepnejStronie(1, 0.02)).toBe(0);
});

test('krok VoiceOver: o rząd w kierunku rzędów (w górę: y maleje), rząd +1; przy krawędzi strony null, rząd nie spada poniżej 1', () => {
  const g = { y: 0.4, wysokosc: 0.02, kierunek: -1 as const, rzad: 6 };
  expect(krokZnacznika(g, 1)).toEqual({ y: expect.closeTo(0.38, 9), rzadBazowy: 7 });
  expect(krokZnacznika(g, -1)).toEqual({ y: expect.closeTo(0.42, 9), rzadBazowy: 5 });
  expect(krokZnacznika({ ...g, kierunek: 1 }, 1)).toEqual({ y: expect.closeTo(0.42, 9), rzadBazowy: 7 });
  expect(krokZnacznika({ ...g, y: 0 }, 1)).toBeNull();
  expect(krokZnacznika({ ...g, y: 0.98, kierunek: 1 }, 1)).toBeNull();
  expect(krokZnacznika({ ...g, rzad: 1 }, -1)).toBeNull();
});

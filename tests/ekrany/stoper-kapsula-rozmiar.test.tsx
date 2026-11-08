// P-553 (Dzianina): zamiast „Libre Franklin 700 17 pt” — krój systemowy (bez `fontFamily`), waga 700, `typografia.tresc.pt`, cyfry tabelaryczne; tokeny: mapa-tokenow.md
// (`typografia.przycisk`/`instrukcja` 700 → `tresc` pogrubiona). Kapsuła stopera nie ma osobnej makiety Dzianiny w design-spec — krój liczby w kapsule do decyzji 04 (raport).
// H-1b (P-361, znalezisko sesji E): etykieta kapsuły stopera („0:00”, obok symbolu) miała 28 pt (`typografia.przycisk`), a design-spec.md:528 mówi:
// „Libre Franklin 700 17 pt, cyfry tabelaryczne, skala tekstu najwyżej ×1,6”. Test sprawdza rozmiar, krój i cyfry tabelaryczne, w obu stanach kapsuły.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Stoper } from '../../src/ekrany/Stoper';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());
const T = 1_000_000_000_000;

function pokaz(stan: React.ComponentProps<typeof Stoper>['stan']) {
  render(<Stoper stan={stan} inny={null} t={t} teraz={() => T + 65_000} naStart={jest.fn()} naWstrzymaj={jest.fn()} naWznow={jest.fn()} naZatrzymaj={jest.fn()} naInnyPotwierdz={jest.fn()} naInnyAnuluj={jest.fn()} />);
}
// Czas kapsuły („1:05”) to Text ze stylem; symbol (P2-3) jest osobnym widokiem obok niego.
const etykieta = (tekst: string) => {
  const s = RN.StyleSheet.flatten(screen.getByText(tekst, { includeHiddenElements: true }).props.style);
  return { fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize, fontVariant: s.fontVariant };
};

// M3 p3a (P-586 2a): stoper to czwarta akcja w rzędzie pod liczbą — czas stoi zamiast podpisu „Timer”, w kroju podpisu akcji (systemowy 600, `typografia.mala.pt`, 13 pt) z cyframi
// tabelarycznymi; zastępuje kapsułę 17 pt 700 z paska. Rozmiar czasu: wartość w makiecie `licznik` (`.akcje a`, t-mala) — czas biegnącego stopera nie ma osobnej makiety [DO USTALENIA 04].
test.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s: czas w akcji trwającego stopera to krój podpisu akcji (systemowy 600, 13 pt) z cyframi tabelarycznymi', (_m, schemat) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
  expect(etykieta('1:05')).toMatchObject({ fontFamily: undefined, fontWeight: '600', fontSize: tokeny.typografia.mala.pt, fontVariant: ['tabular-nums'] });
});

test('wstrzymana akcja ma ten sam rozmiar czasu (13 pt)', () => {
  pokaz({ rodzaj: 'wstrzymana', czasMs: 600_000, startGodzina: '19:52' });
  expect(etykieta('10:00').fontSize).toBe(tokeny.typografia.mala.pt);
});

// H-1 (P-361, znalezisko sesji H): design-spec.md:528 — kapsuła stopera ma „skalę tekstu najwyżej ×1,6”, a kod dawał limit tytułowy ×1,8.
const limit = (tekst: string) => screen.getByText(tekst, { includeHiddenElements: true }).props.maxFontSizeMultiplier;
test('akcja trwającego stopera: skala tekstu najwyżej ×1,6 (design-spec.md:528, zostaje z kapsuły)', () => {
  pokaz({ rodzaj: 'trwa', znacznikMs: T, startGodzina: '19:52' });
  expect(limit('1:05')).toBe(1.6);
});

test('akcja wstrzymanego stopera: skala tekstu najwyżej ×1,6', () => {
  pokaz({ rodzaj: 'wstrzymana', czasMs: 600_000, startGodzina: '19:52' });
  expect(limit('10:00')).toBe(1.6);
});

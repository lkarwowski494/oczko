// Scenariusz 30 (NFR-DOS-002, AX5): kluczowa liczba widoczna przy dużym tekście. P-275 (3) wariant (d) z 04 fix-8 (`fix8-2026-10-27.md`,
// „Decyzja A”): przy kategoriach dostępności liczba nad nazwami projektu i części, podpis +1 tylko w etykiecie VoiceOver; zamiast
// przewijania do liczby (P-266 (1), odrzucone w P-275). P-277: krój tytułowy najwyżej ×1,8, „−1” najwyżej ×1,4 (jak makieta; pomiar
// przebiegu 123: RN mnoży każdy tekst przez 3,571 przy AX5 → +1 482 pt, „−1” niewidoczne).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; });

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: mockSkala }) }));
const skala = (fontScale: number) => { mockSkala = fontScale; };
const rysuj = () => render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};

test('AX5 (kategoria dostępności): liczba nad nazwą projektu i części; podpis +1 tylko w etykiecie VoiceOver', () => {
  skala(3.571);
  rysuj();
  const [liczba, projekt, teraz] = kolejnosc(['licznik-wartosc', 'licznik-projekt', 'licznik-teraz-rzad']);
  expect(liczba).toBeGreaterThanOrEqual(0);
  expect(liczba < projekt && projekt < teraz).toBe(true);
  expect(screen.queryByText('tap when row 2 is done')).toBeNull();
  expect(screen.getByRole('button', { name: '+1 row, when row 2 is done' })).toBeTruthy();
});

test('AX1 (1,786) to już kategoria dostępności; XXXL (1,353) jeszcze nie — kolejność z design-spec i podpis +1 widoczny', () => {
  skala(1.786);
  rysuj();
  expect(screen.queryByText('tap when row 2 is done')).toBeNull();
  screen.unmount();
  skala(1.353);
  rysuj();
  const [liczba, projekt] = kolejnosc(['licznik-wartosc', 'licznik-projekt']);
  expect(projekt < liczba).toBe(true);
  expect(screen.getByText('tap when row 2 is done')).toBeTruthy();
});

test('P-277: krój tytułowy (+1, nazwa części, „Now working”) najwyżej ×1,8, „−1” najwyżej ×1,4; liczba bez zmian (×1,3)', () => {
  rysuj();
  expect([MAX_SKALA_TYTULOWA, MAX_SKALA_MINUSA]).toEqual([1.8, 1.4]);
  expect(screen.getByText('+1 row').props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByText('−1').props.maxFontSizeMultiplier).toBe(1.4);
  expect(screen.getByText('Back').props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByTestId('licznik-teraz-rzad').props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByTestId('licznik-wartosc').props.maxFontSizeMultiplier).toBe(1.3);
});

// P-287 (30), przebieg 126: przy AX5 menu ••• (`licznik-menu`) wypadało z paska — link „‹ Projects” rósł ×3,571 i wypychał ikony.
// Makieta fix-8 (`.nav`): grupa ikon nie kurczy się (pola 44 pt, ikona ×1,8), link może się zawijać.
test('pasek przy AX5: ikony ◷ i ••• najwyżej ×1,8, grupa ikon flexShrink 0, link „Projects” kurczy się', () => {
  skala(3.571);
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naProjekty={() => undefined} />);
  expect(screen.getByText('◷', { includeHiddenElements: true }).props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByText('•••', { includeHiddenElements: true }).props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByTestId('licznik-ikony')).toHaveStyle({ flexShrink: 0 });
  expect(screen.getByTestId('licznik-ikony')).toContainElement(screen.getByTestId('licznik-menu'));
  expect(screen.getByTestId('nav-projekty')).toHaveStyle({ flexShrink: 1 });
});

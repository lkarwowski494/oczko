// Scenariusz 30 (NFR-DOS-002, AX5): kluczowa liczba widoczna przy dużym tekście. P-275 (3) wariant (d) z 04 fix-8 (`fix8-2026-10-27.md`,
// „Decyzja A”): przy kategoriach dostępności liczba nad nazwami projektu i części, podpis +1 tylko w etykiecie VoiceOver; zamiast
// przewijania do liczby (P-266 (1), odrzucone w P-275). P-277: krój tytułowy najwyżej ×1,8, „−1” najwyżej ×1,4 (jak makieta; pomiar
// przebiegu 123: RN mnoży każdy tekst przez 3,571 przy AX5 → +1 482 pt, „−1” niewidoczne).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU } from '../../src/ekrany/motyw';
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

// M3 p3a: kolejność AX z makiety `licznik-390-*-ax5` (Dzianina): nazwa projektu i część, pas dzianiny, liczba — zastępuje wariant (d) P-275 „liczba nad nazwami” (system Kreski).
// Zastąpiony jawnie (fix E5, 016, P-613; docs/programista/m3-fix-e5-zastapione-testy.md): od AX3 liczba pod paskiem nawigacji, nad nazwą projektu (`licznik.ax3ax5`).
test('AX5 (kategoria dostępności): liczba i „Now working” nad nazwą projektu; podpis +1 tylko w etykiecie VoiceOver', () => {
  skala(3.571);
  rysuj();
  const [projekt, liczba, teraz] = kolejnosc(['licznik-projekt', 'licznik-wartosc', 'licznik-teraz-rzad']);
  expect(liczba).toBeGreaterThanOrEqual(0);
  expect(liczba < teraz && teraz < projekt).toBe(true);
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
  expect(screen.getByText('Harbor').props.maxFontSizeMultiplier).toBe(1.8); // M3: tytuł to nazwa projektu
  expect(screen.getByTestId('licznik-teraz-rzad').props.maxFontSizeMultiplier).toBe(1.8);
  expect(screen.getByTestId('licznik-wartosc-cyfra-0').props.maxFontSizeMultiplier).toBe(1.3); // komórki `Liczba` niosą skalę; tokeny liczbaLicznika.maxSkala
});

// P-287 (30), przebieg 126: przy AX5 menu ••• (`licznik-menu`) wypadało z paska — link „‹ Projects” rósł ×3,571 i wypychał ikony.
// Makieta fix-8 (`.nav`): grupa ikon nie kurczy się (pola 44 pt, ikona ×1,8), link może się zawijać.
// M1-033 (design-spec „Aneks M2 partia 3a”): ••• to symbol SF; ta sama granica skali ×1,8 liczona w rozmiarze symbolu. M3 p3a: pasek ma tylko „Wstecz” i •••;
// historia, wzór i stoper przeszły do rzędu akcji pod liczbą.
test('pasek przy AX5: ••• najwyżej ×1,8, grupa ikon flexShrink 0, „Back” kurczy się', () => {
  skala(3.571);
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naWstecz={() => undefined} />);
  const ax5 = Math.round(ROZMIAR_SYMBOLU * MAX_SKALA_TYTULOWA);
  expect(MAX_SKALA_TYTULOWA).toBe(1.8);
  expect(screen.getByTestId('symbol-ellipsis', { includeHiddenElements: true }).props.size).toBe(ax5);
  expect(screen.getByTestId('licznik-ikony')).toHaveStyle({ flexShrink: 0 });
  expect(screen.getByTestId('licznik-ikony')).toContainElement(screen.getByTestId('licznik-menu'));
  expect(screen.getByTestId('nav-wstecz')).toHaveStyle({ flexShrink: 1 });
});

// M1-132 (04-studio-projektowe-522, SP-07): przy AX5 liczba 12345 zawijała się na dwa wiersze („1234” / „5”), a jednostka była ucięta. Po M3 (`Liczba`, komórki stałej szerokości):
// liczba zawsze w jednym wierszu komórek, jednostka pod liczbą (makieta `.licz-num small`), liczba cyfr dobiera token kroju (3 → licznika, 4–5 → karty, 6+ → paska wzoru).
test('AX5, liczba pięciocyfrowa: liczba w jednym wierszu komórek, jednostka pod liczbą i widoczna', () => {
  skala(3.571);
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 12345, dziergany: 12346 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  const liczba = screen.getByTestId('licznik-wartosc');
  expect(liczba.props.accessibilityLabel).toBe('12345');
  expect(liczba).toHaveStyle({ flexDirection: 'row' });
  const [wartosc, jednostka] = kolejnosc(['licznik-wartosc', 'licznik-teraz-rzad']);
  expect(wartosc < jednostka).toBe(true);
  expect(screen.getByText('rows')).toBeTruthy();
});

test('M1-132: przy tekście domyślnym liczba też w jednym wierszu, jednostka pod liczbą w tej samej kolumnie', () => {
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 12345, dziergany: 12346 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByTestId('licznik-wartosc')).toHaveStyle({ flexDirection: 'row' });
  expect(screen.getByTestId('licznik-wartosc-wiersz')).toContainElement(screen.getByTestId('licznik-wartosc'));
  expect(screen.getByTestId('licznik-wartosc-wiersz')).toContainElement(screen.getByText('rows'));
});

// M1-132 próg po M3: zamiast `minimumFontScale` (liczba kurczona do szerokości) — schodki tokenów typografii: sześć cyfr mieści się przy 320 pt i AX5, bo kolumna obok dzianiny jest wąska.
test('M1-132: kolejne schodki rozmiaru liczby = tokeny liczbaLicznika (≤3 cyfry), liczbaKarty (4–5), liczbaPaskaWzoru (6+), przy AX5 i przy tekście domyślnym', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tokeny = require('../../docs/design/tokeny.json') as { typografia: { liczbaLicznika: { pt: number }; liczbaKarty: { pt: number }; liczbaPaskaWzoru: { pt: number } } };
  const przypadki: [number, number][] = [[123, tokeny.typografia.liczbaLicznika.pt], [1234, tokeny.typografia.liczbaKarty.pt], [12345, tokeny.typografia.liczbaKarty.pt], [123456, tokeny.typografia.liczbaPaskaWzoru.pt]];
  for (const s of [3.571, 1]) {
    skala(s);
    for (const [n, pt] of przypadki) {
      render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: n, dziergany: n + 1 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
      expect(StyleSheet.flatten(screen.getByTestId('licznik-wartosc-cyfra-0').props.style).fontSize).toBe(pt);
      screen.unmount();
    }
  }
});

// E2-138-A1 (07 raport E2 #138, scen. 30, NFR-DOS-002): przy AX5 w arkuszu formularza tytuł („Enter the row number”) dostawał resztę wiersza między
// Cancel a Save i łamał się literami po 1–3 w wierszu (nagłówek 404 pt), a pole `wpisz-wartosc-pole` wypadało poniżej ekranu. Design-spec „Arkusze”:
// „przy dużym tekście nagłówek łamie tytuł, treść się przewija” (+ makieta `naglowek-arkusza`: flex-wrap, tytuł `flex: 1 1 auto`, w CSS trafia do osobnego wiersza).
// Wdrożenie: od AX1 (`PROG_KATEGORII_DOSTEPNOSCI`) przyciski w jednym wierszu, tytuł w osobnym wierszu pod nimi na pełną szerokość; poniżej AX1 układ bez zmian.
// RNTL nie liczy układu (JAK-13): sprawdzamy strukturę drzewa trasy z `app/` (P-377) — tytuł nie jest rodzeństwem Cancel/Save w jednym wierszu,
// pole jest w przewijanym obszarze pod nagłówkiem; wynik na symulatorze: zrzut `30-ax5-arkusz-wpisz-wartosc` w przebiegu #139.
import React from 'react';
import { act, render, screen, within } from '@testing-library/react-native';
import { StyleSheet, TextInput } from 'react-native';
import { PROG_KATEGORII_DOSTEPNOSCI } from '../../src/ekrany/motyw';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: mockSkala }) }));
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
const mockParametry: { rodzaj: string } = { rodzaj: 'wpisz' };
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParametry, useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

const AX5 = 3.571; // react-native RCTAccessibilityManager.mm `multipliers`, jak w licznik-ax5.test.tsx
const XXXL = 1.353; // ostatni rozmiar poniżej kategorii dostępności

async function otworz(rodzaj: string, fontScale: number) {
  mockSkala = fontScale;
  mockParametry.rodzaj = rodzaj;
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17)]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
}
afterEach(() => { mockSkala = 1; });

const przewijany = () => screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.type.includes('ScrollView'))[0];
const naglowek = () => within(screen.getByTestId('arkusz-naglowek'));
const styl = (el: { props: { style?: unknown } }) => StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

// Arkusze z `formularz`, które trasa otwiera na danych licznika (reszta: ten sam komponent `Arkusz`, test statyczny niżej).
const RODZAJE = ['wpisz', 'nazwa', 'cel', 'powtorzenie', 'znaczenie', 'przypomnienie'] as const;

describe.each(RODZAJE)('E2-138-A1: arkusz „%s” przy AX5', (rodzaj) => {
  test('tytuł w osobnym wierszu pod Cancel i Save: wiersz akcji ma tylko dwa przyciski, tytuł nie dzieli z nimi szerokości', async () => {
    await otworz(rodzaj, AX5);
    const akcje = within(screen.getByTestId('arkusz-akcje'));
    expect(akcje.getByTestId('arkusz-zamknij')).toBeTruthy();
    expect(akcje.getAllByRole('button')).toHaveLength(2); // Cancel i Save/Add (testID zapisu bywa własny, np. `przypomnienie-zapisz`)
    expect(akcje.queryByRole('header')).toBeNull(); // tytuł nie jest w wierszu z przyciskami
    const tytul = naglowek().getByRole('header');
    expect(tytul).toBeTruthy();
    const s = styl(tytul);
    expect(s.alignSelf).toBe('stretch'); // pełna szerokość wiersza, bez flexGrow/flexShrink dzielonego z przyciskami
    expect(s.flexGrow ?? 0).toBe(0);
    expect(s.flexShrink ?? 0).toBe(0);
  });

  test('nagłówek nie jest w przewijanym obszarze, a treść (pole) jest — przewija się pod nagłówkiem', async () => {
    await otworz(rodzaj, AX5);
    const p = przewijany();
    expect(p).toBeTruthy();
    expect(within(p!).queryByTestId('arkusz-naglowek')).toBeNull();
    expect(within(p!).queryByTestId('arkusz-akcje')).toBeNull();
    expect(within(p!).UNSAFE_queryAllByType(TextInput).length + within(p!).queryAllByRole('radio').length).toBeGreaterThan(0); // pole albo wybór (`znaczenie`)
  });

  test('poniżej AX1 (XXXL) układ bez zmian: Cancel, tytuł, Save w jednym nagłówku, bez osobnego wiersza akcji', async () => {
    await otworz(rodzaj, XXXL);
    expect(screen.queryByTestId('arkusz-akcje')).toBeNull();
    const s = styl(naglowek().getByRole('header'));
    expect(s.flexGrow).toBe(1);
    expect(s.flexShrink).toBe(1);
  });
});

test('„Enter the row number”: pole wartości w przewijanym obszarze, nagłówek = tytuł + dwa przyciski (scen. 30, krok 28)', async () => {
  await otworz('wpisz', AX5);
  expect(naglowek().getByText('Enter the row number')).toBeTruthy();
  expect(within(przewijany()!).getByTestId('wpisz-wartosc-pole')).toBeTruthy();
});

test('próg: AX1 (1,786) to już układ dwuwierszowy, tuż poniżej progu jeszcze nie', async () => {
  await otworz('wpisz', PROG_KATEGORII_DOSTEPNOSCI);
  expect(screen.getByTestId('arkusz-akcje')).toBeTruthy();
  screen.unmount();
  await otworz('wpisz', PROG_KATEGORII_DOSTEPNOSCI - 0.01);
  expect(screen.queryByTestId('arkusz-akcje')).toBeNull();
});

test('tytuł nadal z limitem skali ×1,8 (MAX_SKALA_TYTULOWA) i rola nagłówka w obu układach', async () => {
  await otworz('wpisz', AX5);
  expect(naglowek().getByRole('header').props.maxFontSizeMultiplier).toBe(1.8);
});

// Wszystkie arkusze z `formularz` (lista w docs/programista/poprawki-e2-138.md) idą przez ten sam `Arkusz`: nagłówek jest jeden, więc jedna zmiana go obejmuje.
test('każde użycie `formularz={` w src/ i app/ jest propsem komponentu `Arkusz` (brak drugiej implementacji nagłówka)', () => {
  const fs = require('node:fs') as typeof import('node:fs'); // eslint-disable-line @typescript-eslint/no-require-imports
  const path = require('node:path') as typeof import('node:path'); // eslint-disable-line @typescript-eslint/no-require-imports
  const pliki = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(d, e.name)) : /\.tsx$/.test(e.name) ? [path.join(d, e.name)] : []));
  const uzycia = ['src', 'app'].flatMap((d) => pliki(path.join(__dirname, '..', '..', d))).flatMap((f) => {
    const w = fs.readFileSync(f, 'utf8').split('\n');
    return w.flatMap((l, i) => (/\bformularz=\{\{/.test(l) ? [{ f, l: `${w[i - 1] ?? ''} ${l}` }] : [])); // wywołanie bywa łamane: <Arkusz … w poprzednim wierszu
  });
  expect(uzycia.length).toBeGreaterThanOrEqual(19);
  expect(uzycia.filter((u) => !/<Arkusz\b/.test(u.l))).toEqual([]);
});

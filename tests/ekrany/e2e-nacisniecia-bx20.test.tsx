// P-951: BX20 (KO-136, wariant A; BX19 plan): w buildzie E2E (`EXPO_PUBLIC_E2E=1`) licznik PRZYJĘTYCH naciśnięć (onPress) celów scenariuszy 01, 03, 42, 45, 118 (`dzis-plus`, `dzis-kontynuuj`,
// `e2e-zdjecie-testowe`, `e2e-wzor-pdf`, `nav-wstecz`) w panelu `e2e-nacisniecia` (korzeń nawigacji; menu zdjęcia i wzoru to widoki w ekranie, nie modale, więc korzeń jest w hierarchii XCUI także przy otwartym menu). Następna czerwień
// „stuknięcie dotarło, bez skutku” rozdzieli „dotyk nie dotarł do JS” (licznik bez zmiany) od „handler ruszył” (licznik +1). Panel tylko liczy i przepuszcza wywołanie.
// `licznik-plus` (scenariusz 95) ma już panel `e2e-licznik-wejscia` (FX6b); tu go NIE liczymy, żeby nie dokładać pracy do okna pomiaru 31. Strona negatywna: e2e-nacisniecia-bx20-wydanie.test.tsx.
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
import React from 'react';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { KontekstNacisniec, Wstecz } from '../../src/ekrany/Pasek';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { PanelWzoru, PanelZdjecia, PanelNacisniec, opisNacisniec, zerujNacisniecia, zliczNacisniecie } from '../../src/kompozycja/e2e/panele';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
const mockWstecz = jest.fn();
jest.mock('expo-router', () => {
  // Stos z jednym przyciskiem „wstecz” (komponent aplikacji): dowód, że korzeń podaje ekranom hak liczenia.
  const { Wstecz: W } = jest.requireActual<typeof import('../../src/ekrany/Pasek')>('../../src/ekrany/Pasek');
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children, mockReact.createElement(W, { tekst: 'Back', onPress: () => mockWstecz() }));
  Stack.Screen = () => null;
  return { Stack, useFocusEffect: () => undefined };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
      z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  }),
}));
jest.mock('../../src/kompozycja/wstecz-trasa', () => ({ useTytulPoprzedniego: () => null })); // etykieta „wstecz” bez stosu expo-router
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => ({ zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { zerujNacisniecia(); mockWstecz.mockClear(); });

const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
function dzis(stan: PropsDzis['stan'], naPlus = jest.fn(async () => plusOk(43)), naKontynuuj = jest.fn()) {
  render(
    <KontekstNacisniec.Provider value={zliczNacisniecie}>
      <Dzis stan={stan} dane={DANE} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={naPlus} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
        naKontynuuj={naKontynuuj} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naKafel={jest.fn()} />
      <PanelNacisniec />
    </KontekstNacisniec.Provider>,
  );
  return { naPlus, naKontynuuj };
}
const panel = () => String(screen.getByTestId('e2e-nacisniecia').props.children);

describe('opis licznika naciśnięć (czysta funkcja)', () => {
  test('brak naciśnięć: „taps accepted: none”', () => { expect(opisNacisniec(new Map())).toBe('taps accepted: none'); });
  test('kilka celów: w kolejności pierwszego naciśnięcia, z liczbą', () => {
    expect(opisNacisniec(new Map([['dzis-plus', 2], ['nav-wstecz', 1]]))).toBe('taps accepted: dzis-plus 2, nav-wstecz 1');
  });
});

describe('panel `e2e-nacisniecia`', () => {
  test('zaczyna od „none”, każde `zliczNacisniecie(cel)` podnosi licznik tego celu o 1', () => {
    render(<PanelNacisniec />);
    expect(panel()).toBe('taps accepted: none');
    act(() => { zliczNacisniecie('dzis-plus'); zliczNacisniecie('dzis-plus'); zliczNacisniecie('nav-wstecz'); });
    expect(panel()).toBe('taps accepted: dzis-plus 2, nav-wstecz 1');
  });
  test('panel nie przechwytuje dotyku (`pointerEvents="none"`)', () => {
    render(<PanelNacisniec />);
    expect(screen.getByTestId('e2e-nacisniecia').props.pointerEvents).toBe('none');
  });
});

describe('„Dziś” (scenariusze 01, 03, 118): naciśnięcia `dzis-plus` i `dzis-kontynuuj`', () => {
  test('„+1” na karcie: licznik dzis-plus 1, a naPlus nadal wywołane raz', async () => {
    const { naPlus } = dzis(stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }));
    await act(async () => { fireEvent.press(screen.getByTestId('dzis-plus')); });
    expect(panel()).toBe('taps accepted: dzis-plus 1');
    expect(naPlus).toHaveBeenCalledTimes(1);
  });
  test('„+1” przy blokadzie ekranu też jest przyjętym naciśnięciem (onPress ruszył), naPlus nie', async () => {
    const { naPlus } = dzis(stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96, zablokowany: true }));
    await act(async () => { fireEvent.press(screen.getByTestId('dzis-plus')); });
    expect(panel()).toBe('taps accepted: dzis-plus 1');
    expect(naPlus).not.toHaveBeenCalled();
  });
  test('„Kontynuuj”: licznik dzis-kontynuuj 1 i naKontynuuj wywołane', () => {
    const { naKontynuuj } = dzis(stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }));
    fireEvent.press(screen.getByTestId('dzis-kontynuuj'));
    expect(panel()).toBe('taps accepted: dzis-kontynuuj 1');
    expect(naKontynuuj).toHaveBeenCalledTimes(1);
  });
});

describe('„Wstecz” (scenariusz 118, `nav-wstecz`)', () => {
  test('z hakiem: naciśnięcie liczone pod testID przycisku i przepuszczone', () => {
    const wstecz = jest.fn();
    render(<KontekstNacisniec.Provider value={zliczNacisniecie}><Wstecz tekst="Back" onPress={wstecz} /><PanelNacisniec /></KontekstNacisniec.Provider>);
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    expect(wstecz).toHaveBeenCalledTimes(2);
    expect(panel()).toBe('taps accepted: nav-wstecz 2');
  });
  test('z własnym testID licznik nosi ten testID', () => {
    render(<KontekstNacisniec.Provider value={zliczNacisniecie}><Wstecz tekst="Back" onPress={jest.fn()} testID="wzor-wstecz" /><PanelNacisniec /></KontekstNacisniec.Provider>);
    fireEvent.press(screen.getByTestId('wzor-wstecz'));
    expect(panel()).toBe('taps accepted: wzor-wstecz 1');
  });
});

describe('menu zdjęcia i wzoru (scenariusze 42, 45)', () => {
  test('`e2e-zdjecie-testowe`: naciśnięcie liczone, naPlik wywołane', () => {
    const naPlik = jest.fn();
    render(<><PanelZdjecia katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naPlik={naPlik} /><PanelNacisniec /></>);
    expect(panel()).toBe('taps accepted: none');
    fireEvent.press(screen.getByTestId('e2e-zdjecie-testowe'));
    expect(naPlik).toHaveBeenCalledTimes(1);
    expect(panel()).toBe('taps accepted: e2e-zdjecie-testowe 1');
  });
  test('`e2e-wzor-pdf`: naciśnięcie liczone, naDodaj wywołane; inne pozycje panelu wzoru nie są liczone', () => {
    const naDodaj = jest.fn();
    render(<><PanelWzoru katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naDodaj={naDodaj} /><PanelNacisniec /></>);
    fireEvent.press(screen.getByTestId('e2e-wzor-pdf'));
    expect(naDodaj).toHaveBeenCalledTimes(1);
    expect(panel()).toBe('taps accepted: e2e-wzor-pdf 1');
    fireEvent.press(screen.getByTestId('e2e-wzor-pdf-skan'));
    expect(panel()).toBe('taps accepted: e2e-wzor-pdf 1');
  });
});

describe('korzeń nawigacji w buildzie E2E', () => {
  test('ma panel `e2e-nacisniecia` i podaje ekranom hak: „wstecz” w stosie podnosi licznik', async () => {
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    render(<Korzen />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(panel()).toBe('taps accepted: none');
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    expect(mockWstecz).toHaveBeenCalledTimes(1);
    expect(panel()).toBe('taps accepted: nav-wstecz 1');
  });
});

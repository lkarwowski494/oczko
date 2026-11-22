// PU-139 (katalog przypadków użycia, „Wygląd i dostępność”), część przewodnika: trasa `/przewodnik` w motywie ciemnym na prawdziwej bazie — tło ekranu = ciemny `tlo`,
// „Show ›” (tekst i szewron) w ciemnym `akcentTekst`, ptaszek „przeczytane” i strzałki wierszy (w dół / w górę) obecne w ciemnym `tekst2`.
// Pozostałe ekrany: tests/ekrany/pu-139-motyw-ciemny.test.tsx; korzeń: pu-139-motyw-ciemny-korzen.test.tsx. Poza Jest (częściowo): zrzuty i kontrast na urządzeniu (białe pola: PU-343).
import React from 'react';
import * as RN from 'react-native';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { FUNKCJE } from '../../src/domena/przewodnik';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

const C = tokeny.kolory.ciemny;
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark'); });
afterEach(() => jest.restoreAllMocks());

const kolory = (id: string) => screen.getAllByTestId(id, { hidden: true }).map((e) => (e.props.tintColor ?? e.props.color) as string);

describe('PU-139 · przewodnik w motywie ciemnym', () => {
  test('tło ekranu = `tlo`; „Show ›”: tekst i szewron `akcentTekst`; po rozwinięciu wiersza: ptaszek i strzałka w górę w `tekst2`, pozostałe wiersze ze strzałką w dół', async () => {
    const { s, k, j } = await kompozycjaTestowa();
    mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
    render(<EkranPrzewodnika />);
    const ekran = await screen.findByTestId('przewodnik');
    expect(StyleSheet.flatten(ekran.props.style)).toMatchObject({ backgroundColor: C.tlo });
    expect(C.tlo).not.toBe(tokeny.kolory.jasny.tlo);
    // „Show ›” w sześciu krokach: tekst + szewron w kolorze akcentu tekstowego
    expect(screen.getByTestId('przewodnik-krok-1-pokaz')).toHaveTextContent(/Show/);
    expect(screen.getAllByText('Show')[0]).toHaveStyle({ color: C.akcentTekst });
    expect(kolory('symbol-chevron.forward').length).toBeGreaterThanOrEqual(6);
    expect(new Set(kolory('symbol-chevron.forward'))).toEqual(new Set([C.akcentTekst]));
    // strzałki wierszy: zwinięte → w dół
    expect(kolory('symbol-chevron.down').length).toBeGreaterThanOrEqual(FUNKCJE.length);
    expect(new Set(kolory('symbol-chevron.down'))).toEqual(new Set([C.tekst2]));
    expect(screen.queryAllByTestId('symbol-checkmark', { hidden: true })).toHaveLength(0); // nic jeszcze nieprzeczytane
    // rozwinięcie → przeczytane: ptaszek i strzałka w górę
    fireEvent.press(screen.getByTestId('przewodnik-f-cel'));
    expect(await screen.findByTestId('symbol-checkmark', { hidden: true })).toBeTruthy();
    expect(kolory('symbol-checkmark')).toEqual([C.tekst2]);
    expect(kolory('symbol-chevron.up')).toEqual([C.tekst2]);
    expect(kolory('symbol-chevron.forward').length).toBeGreaterThanOrEqual(7); // „Show ›” rozwiniętego wiersza
  });
});

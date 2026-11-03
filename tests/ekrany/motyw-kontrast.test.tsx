// M1-audytor-generalny-032 (źródło 04-studio-projektowe-005, SP-04): wariant „Zwiększ kontrast” (tokeny `jasnyKontrast`, `ciemnyKontrast`)
// jest w tokenach, a `useKolory` wybierał tylko `jasny` albo `ciemny`. Wybór palety dla czterech stanów (motyw × „Zwiększ kontrast”):
// paleta kontrastu = paleta motywu nadpisana wariantem (jak docs/design/narzedzia/tokeny-kontrast.mjs, tabela kontrastu z czterema motywami).
// Sygnał systemu: `AccessibilityInfo.isDarkerSystemColorsEnabled` + zdarzenie `darkerSystemColorsChanged` (iOS; UIAccessibilityDarkerSystemColorsEnabled
// = Ustawienia → Dostępność → „Zwiększ kontrast”; react-native 0.86.3, Libraries/Components/AccessibilityInfo, odczyt 2026-11-03).
import React from 'react';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { useKolory, type Kolory } from '../../src/ekrany/motyw';

const K = tokeny.kolor;
const OCZEKIWANE: Record<string, Kolory> = {
  'jasny': K.jasny,
  'ciemny': K.ciemny,
  'jasny+kontrast': { ...K.jasny, ...K.jasnyKontrast },
  'ciemny+kontrast': { ...K.ciemny, ...K.ciemnyKontrast },
};

let sluchacz: ((v: boolean) => void) | null = null;
function systemowe(schemat: 'light' | 'dark', kontrast: boolean): void {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  jest.spyOn(RN.AccessibilityInfo, 'isDarkerSystemColorsEnabled').mockResolvedValue(kontrast);
  jest.spyOn(RN.AccessibilityInfo, 'addEventListener').mockImplementation(((zdarzenie: string, f: (v: boolean) => void) => {
    if (zdarzenie === 'darkerSystemColorsChanged') sluchacz = f;
    return { remove: () => { sluchacz = null; } };
  }) as never);
}
let wynik: Kolory | null = null;
function Sonda(): React.ReactElement { wynik = useKolory(); return <RN.Text testID="sonda">{wynik.olowek}</RN.Text>; }

afterEach(() => { jest.restoreAllMocks(); wynik = null; }); // odmontowanie (i zdjęcie słuchacza) robi automatyczne sprzątanie RNTL

describe('M1-032: useKolory — paleta dla czterech stanów (motyw × „Zwiększ kontrast”)', () => {
  test.each([
    ['jasny', 'light', false],
    ['ciemny', 'dark', false],
    ['jasny+kontrast', 'light', true],
    ['ciemny+kontrast', 'dark', true],
  ] as const)('%s: cała paleta = tokeny motywu nadpisane wariantem kontrastu', async (nazwa, schemat, kontrast) => {
    systemowe(schemat, kontrast);
    render(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    expect(wynik).toEqual(OCZEKIWANE[nazwa]);
  });

  test('przełączenie „Zwiększ kontrast” w trakcie działania zmienia paletę bez ponownego uruchomienia (zdarzenie systemu)', async () => {
    systemowe('dark', false);
    render(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemny.olowek);
    expect(sluchacz).not.toBeNull();
    await act(async () => { sluchacz?.(true); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemnyKontrast.olowek);
    expect(wynik?.drugiPrzyciskObrys).toBe(K.ciemnyKontrast.drugiPrzyciskObrys);
    await act(async () => { sluchacz?.(false); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemny.olowek);
  });

  test('szare podpisy z przykładu znaleziska: jasny #5E626A, jasny + „Zwiększ kontrast” #44474D', async () => {
    systemowe('light', true);
    render(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    expect(K.jasny.olowek).toBe('#5E626A');
    expect(screen.getByTestId('sonda')).toHaveTextContent('#44474D');
  });
});

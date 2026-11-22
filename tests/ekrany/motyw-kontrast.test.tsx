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

// M3 p1 (P-553): tokeny Dzianiny — `kolory.<motyw>` + wariant `<motyw>Zwiekszony` (podmienia tylko wskazane klucze); stare nazwy ról (papier, grafit, olowek…) są
// aliasami na te tokeny według docs/design/dzianina/mapa-tokenow.md (do usunięcia, gdy partie p2–p8 przejdą na nowe nazwy).
const K = tokeny.kolory;
const OCZEKIWANE: Record<string, Record<string, string>> = {
  'jasny': K.jasny,
  'ciemny': K.ciemny,
  'jasny+kontrast': { ...K.jasny, ...K.jasnyZwiekszony },
  'ciemny+kontrast': { ...K.ciemny, ...K.ciemnyZwiekszony },
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
function Sonda(): React.ReactElement { wynik = useKolory(); return <RN.Text testID="sonda">{wynik.tekst2}</RN.Text>; }

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
    expect(wynik).toMatchObject(OCZEKIWANE[nazwa]!);
    expect(wynik?.olowek).toBe(OCZEKIWANE[nazwa]!.tekst2); // alias z mapy: stary `olowek` = `tekst2` (także w wariancie kontrastu)
    expect(wynik?.papier).toBe(OCZEKIWANE[nazwa]!.tlo);
  });

  test('przełączenie „Zwiększ kontrast” w trakcie działania zmienia paletę bez ponownego uruchomienia (zdarzenie systemu)', async () => {
    systemowe('dark', false);
    render(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemny.tekst2);
    expect(sluchacz).not.toBeNull();
    await act(async () => { sluchacz?.(true); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemnyZwiekszony.tekst2);
    expect(wynik?.drugiPrzyciskObrys).toBe(K.ciemnyZwiekszony.tekst2); // mapa: obrys −1 = tekst2 wariantu zwiększonego
    await act(async () => { sluchacz?.(false); });
    expect(screen.getByTestId('sonda')).toHaveTextContent(K.ciemny.tekst2);
  });

  test('podpisy (tekst2): jasny #5A5048, jasny + „Zwiększ kontrast” #3F3731 (mapa-tokenow.md: olowek → tekst2)', async () => {
    systemowe('light', true);
    render(<Sonda />);
    await act(async () => { await Promise.resolve(); });
    expect(K.jasny.tekst2).toBe('#5A5048');
    expect(screen.getByTestId('sonda')).toHaveTextContent('#3F3731');
  });
});

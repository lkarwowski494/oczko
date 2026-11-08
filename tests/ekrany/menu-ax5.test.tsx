// E2-A1 (07 raport E2 #135, scen. 30, NFR-DOS-002): przy AX5 tytuł arkusza menu ••• (nazwa projektu, np. „Counter from Nov 10 at 7:30 PM”)
// rósł ×3,571 bez limitu, zajmował cały ekran i wypychał akcje (`menu-wpisz-wartosc`) poza widok. Wzorzec P-277/P-287: krój tytułowy najwyżej ×1,8
// (`MAX_SKALA_TYTULOWA`), treść w przewijanym obszarze. RNTL nie liczy układu — sprawdzamy limit skali na każdym tytule arkusza i położenie
// akcji w przewijanym obszarze; widoczność akcji przy AX5 potwierdza dopiero scenariusz 30 na symulatorze (macOS).
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { Arkusz, Przycisk } from '../../src/ekrany/Arkusz';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import tokeny from '../../docs/design/tokeny.json';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; });

let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: mockSkala }) }));
const AX5 = 3.571; // react-native RCTAccessibilityManager.mm `multipliers`, jak w licznik-ax5.test.tsx
const ROZMIAR_TYTULU = tokeny.typografia.tytul.pt; // Dzianina: `typografia.<rola>.pt` zamiast `.rozmiar` (P-553)
const NAZWA = 'Counter from Nov 10 at 7:30 PM';
const wywolania = () => ({ naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn() });

/** Efektywny rozmiar tytułu: RN mnoży fontSize przez min(mnożnik systemu, maxFontSizeMultiplier). */
const efektywnyRozmiar = (skala: number, maks: number | undefined) => ROZMIAR_TYTULU * Math.min(skala, maks ?? Infinity);

test('AX5: tytuł arkusza menu (nazwa projektu) ma limit skali ×1,8, nie ×3,571', () => {
  mockSkala = AX5;
  render(<MenuProjektu stan={{ projekt: NAZWA, zablokowany: false, wartosc: 3 }} t={t} {...wywolania()} />);
  const tytul = screen.getByText(NAZWA);
  expect(tytul.props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(efektywnyRozmiar(AX5, tytul.props.maxFontSizeMultiplier)).toBeLessThanOrEqual(ROZMIAR_TYTULU * 1.8);
});

test('AX5: akcja „menu-wpisz-wartosc” jest w przewijanym obszarze razem z tytułem, a „Cancel” poza nim', () => {
  mockSkala = AX5;
  render(<MenuProjektu stan={{ projekt: NAZWA, zablokowany: false, wartosc: 3 }} t={t} {...wywolania()} />);
  const przewijany = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.type.includes('ScrollView'))[0];
  expect(przewijany).toBeTruthy();
  expect(within(przewijany!).getByTestId('menu-wpisz-wartosc')).toBeTruthy();
  expect(within(przewijany!).queryByTestId('arkusz-zamknij')).toBeNull();
  expect(screen.getByRole('button', { name: 'Enter the row number' })).toBeTruthy();
});

test('wszystkie tytuły arkuszy: decyzji z ✕, decyzji bez ✕ i nagłówek formularza mają limit ×1,8', () => {
  mockSkala = AX5;
  const { unmount } = render(<Arkusz tytul="Tytuł bez ✕"><Przycisk tekst="x" onPress={jest.fn()} /></Arkusz>);
  expect(screen.getByText('Tytuł bez ✕').props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  unmount();
  const z = render(<Arkusz tytul="Tytuł z ✕" zamknij={{ etykieta: 'Close', naZamknij: jest.fn() }}><Przycisk tekst="x" onPress={jest.fn()} /></Arkusz>);
  expect(screen.getByText('Tytuł z ✕').props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  z.unmount();
  render(<Arkusz tytul="Tytuł formularza" formularz={{ t, naZapisz: jest.fn(), naAnuluj: jest.fn() }}><Przycisk tekst="x" onPress={jest.fn()} /></Arkusz>);
  expect(screen.getByText('Tytuł formularza').props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
});

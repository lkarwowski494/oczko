// PU-189 (katalog przypadków użycia, „Kopia, usunięcie, import”): świeża instalacja bez „+1” → „Guide” z „Read: 0 of 42”; „Show” kroku 2 i kroku 4 prowadzi na „Today” (karta „First counter”),
// „Add counter” → „Projects”; bez pustego ekranu. Poziom: trasa `/przewodnik` na prawdziwej bazie (bez licznika) + prawdziwy stan startowy kompozycji licznika wyrenderowany w `Dzis`.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Dzis } from '../../src/ekrany/Dzis';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { atrapaHaptyki, plusOk, tEn } from './pomoc';

const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

// PU-189: świeża baza → „Read: 0 of 42”; „Show” kroków 2 i 4 oraz „Add counter” kierują na „/” (karta „First counter”) i „/projekty”, bez stosu i bez awarii.
test('PU-189: świeży start — „Read: 0 of 42”, „Show” kroku 2 i 4 → „Today” z kartą „First counter”, „Add counter” → „Projects”', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
  const t = await tEn();
  const swiezy = (await k.uslugi.start()).licznik; // stan ekranu z pustej bazy, bez „+1”
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 0 of 42');
  for (const krok of [2, 4]) {
    mockRouter.navigate.mockClear();
    fireEvent.press(screen.getByTestId(`przewodnik-krok-${krok}-pokaz`));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/'));
  }
  fireEvent.press(screen.getByTestId('przewodnik-f-dodaj-licznik'));
  fireEvent.press(await screen.findByTestId('przewodnik-f-dodaj-licznik-pokaz'));
  await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/projekty'));
  expect(mockRouter.push).not.toHaveBeenCalled();
  screen.unmount();
  render(<Dzis stan={swiezy} dane={null} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={jest.fn(async () => plusOk(1))} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
    naKontynuuj={jest.fn()} naWybierzProjekt={jest.fn()} naUstawienia={jest.fn()} naPrzewodnik={jest.fn()} />);
  expect(screen.getByText('First counter')).toBeTruthy();
  expect(screen.getByTestId('dzis-karta')).toBeTruthy();
});

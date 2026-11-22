// PU-147 (katalog przypadków użycia, „iPad”; KO-105): przewodnik na iPadzie — okno 1024 × 1366 pt (regular), świeża baza: postęp „Read: 0 of 42”, krok „Show ›” prowadzi do licznika,
// przeczytane zapisują się lokalnie i NIE przechodzą na inne urządzenie (druga świeża baza, jak świeża instalacja na iPadzie obok iPhone'a, zaczyna od 0).
// Poziom: ekran `/przewodnik` (app/przewodnik.tsx) na prawdziwych usługach kompozycji licznika i bazie testowej (node:sqlite); atrapy tylko routera. Wzór: tests/ekrany/przewodnik.test.tsx, tests/ekrany/pu-ipad-dzis-142.test.tsx.
// Poza Jest (częściowo): gest „‹” wstecz i faktyczne otwarcie licznika na symulatorze iPada — scenariusz 115 (oczekujący); wiersz „Guide” w Ustawieniach z wartością „0 of 42” — tests/ekrany/przewodnik.test.tsx.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FUNKCJE } from '../../src/domena/przewodnik';
import { przeczytanePrzewodnika } from '../../src/przypadki-uzycia/przewodnik';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 1024, height: 1366, scale: 2, fontScale: 1 }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

async function swiezyIPad() {
  const { s, k, j } = await kompozycjaTestowa();
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
  return { s };
}
beforeEach(() => { for (const f of [mockRouter.back, mockRouter.push, mockRouter.navigate, mockRouter.dismissAll, mockRouter.dismissTo]) f.mockClear(); });

test('PU-147 · iPad, świeża baza: „Read: 0 of 42”, krok 2 „Show ›” prowadzi do licznika (Today, bez miejsca pracy), kolumna treści 640 pt', async () => {
  await swiezyIPad();
  render(<EkranPrzewodnika />);
  expect(await screen.findByTestId('przewodnik')).toBeTruthy();
  expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 0 of 42');
  const kolumna = screen.getByTestId('kolumna-tresci');
  expect((Array.isArray(kolumna.props.style) ? Object.assign({}, ...kolumna.props.style) : kolumna.props.style).maxWidth).toBe(640); // iPad regular: czytelna kolumna (P-220)
  fireEvent.press(screen.getByTestId('przewodnik-krok-2-pokaz'));
  await waitFor(() => expect(mockRouter.navigate).toHaveBeenLastCalledWith('/')); // bez licznika w pracy → „Today” z kartą „First counter” (jak przewodnik.test.tsx)
  expect(mockRouter.push).not.toHaveBeenCalled();
});

test('PU-147 · przeczytane liczą się osobno od 0: zapis na jednym urządzeniu nie widać na drugim (druga świeża baza = świeży iPad)', async () => {
  const iphone = await swiezyIPad();
  const { unmount } = render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  fireEvent.press(screen.getByTestId(`przewodnik-f-${FUNKCJE[0].id}`));
  await waitFor(() => expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 1 of 42'));
  expect(await przeczytanePrzewodnika(iphone.s.z)).toEqual({ ok: true, wartosc: [FUNKCJE[0].id] });
  unmount();
  const ipad = await swiezyIPad(); // osobna baza: nic nie zsynchronizowało przeczytanych
  expect(await przeczytanePrzewodnika(ipad.s.z)).toEqual({ ok: true, wartosc: [] });
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  expect(screen.getByTestId('przewodnik-postep')).toHaveTextContent('Read: 0 of 42');
});

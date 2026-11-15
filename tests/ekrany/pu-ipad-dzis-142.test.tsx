// PU-142 (katalog przypadków użycia, „iPad”): iPad (okno 1024 × 1366 pt), świeży start → „Today” z kartą „First counter” i 0 → „+1” karty → 1.
// Poziom: `Aplikacja` na szerokości iPada z prawdziwymi usługami kompozycji licznika (`kompozycjaLicznika`) na pustej bazie testowej (node:sqlite); atrapy tylko portów platformy.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Aplikacja } from '../../src/ekrany/Aplikacja';
import type { EkranAktywny, Sklep } from '../../src/domena/porty';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu, tEn } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 1024, height: 1366, scale: 2, fontScale: 1 }) }));

// PU-142: iPad, świeża baza → „First counter”, 0 → „+1” karty → 1 (prawdziwy zapis w bazie).
test('PU-142: iPad, świeży start — „Today” z kartą „First counter” i 0; „+1” karty → 1', async () => {
  const { k } = await kompozycjaTestowa();
  const t = await tEn();
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as jest.Mocked<Sklep>;
  const ekranAktywny: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
  render(<Aplikacja porty={{ sklep, ekranAktywny, haptyka: atrapaHaptyki() }} uslugi={k.uslugi} cykl={atrapaCyklu().cykl} system={atrapaSystemu()} oglos={jest.fn()} t={t} />);
  expect(await screen.findByTestId('dzis-karta')).toBeTruthy();
  expect(screen.getByText('First counter')).toBeTruthy();
  expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('0');
  fireEvent.press(screen.getByTestId('dzis-plus'));
  await waitFor(() => expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('1'));
  expect((await k.widok())?.wartosc).toBe(1); // zapis w bazie, nie tylko ekran
});

// PU-106, PU-114 i PU-133 (Przewodnik): jeden otwarty wiersz, ponowne otwarcie nie liczy się drugi raz, stan przeczytania przetrwa ponowne otwarcie ekranu na tej samej bazie, etykiety VoiceOver.
// Poziom: komponentowy, trasa `/przewodnik` na prawdziwej bazie (harness jak przewodnik.test.tsx).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { przeczytanePrzewodnika } from '../../src/przypadki-uzycia/przewodnik';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

const mockRouter = { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissAll: jest.fn(), dismissTo: jest.fn(), canDismiss: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;

async function otworz() {
  const { s, k, j } = await kompozycjaTestowa();
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  return { s };
}
const postep = () => screen.getByTestId('przewodnik-postep');

// PU-106: „Set a goal…” → „Vibration” zwija pierwszy wiersz i daje „Read: 2 of 42”; ponowne stuknięcie zwija, a kolejne rozwinięcie nie podnosi licznika (zapis bez duplikatów).
test('PU-106: drugi wiersz zwija pierwszy („Read: 2 of 42”), ponowne stuknięcie zwija, a licznik zostaje 2 także po ponownym rozwinięciu', async () => {
  const { s } = await otworz();
  fireEvent.press(screen.getByTestId('przewodnik-f-cel'));
  expect(await screen.findByTestId('przewodnik-f-cel-opis')).toBeTruthy();
  fireEvent.press(screen.getByTestId('przewodnik-f-wibracje'));
  await waitFor(() => expect(postep()).toHaveTextContent('Read: 2 of 42'));
  expect(screen.queryByTestId('przewodnik-f-cel-opis')).toBeNull();
  expect(screen.getByTestId('przewodnik-f-wibracje-opis')).toBeTruthy();
  fireEvent.press(screen.getByTestId('przewodnik-f-wibracje')); // ponowne stuknięcie zwija
  expect(screen.queryAllByTestId(/^przewodnik-f-.*-opis$/)).toHaveLength(0);
  expect(postep()).toHaveTextContent('Read: 2 of 42');
  fireEvent.press(screen.getByTestId('przewodnik-f-wibracje')); // rozwinięcie już przeczytanego wiersza
  expect(await screen.findByTestId('przewodnik-f-wibracje-opis')).toBeTruthy();
  await new Promise((r) => setTimeout(r, 50));
  expect(postep()).toHaveTextContent('Read: 2 of 42');
  expect(await przeczytanePrzewodnika(s.z)).toEqual({ ok: true, wartosc: ['cel', 'wibracje'] });
});

// PU-114: po ponownym otwarciu ekranu (ta sama baza) „Read: 2 of 42” i etykiety „…, read” tych samych wierszy, reszta „…, not read”.
test('PU-114: stan przeczytania przetrwa ponowne otwarcie — ta sama liczba i te same oznaczenia „read”', async () => {
  const { s } = await otworz();
  fireEvent.press(screen.getByTestId('przewodnik-f-kontynuuj'));
  await waitFor(() => expect(postep()).toHaveTextContent('Read: 1 of 42'));
  fireEvent.press(screen.getByTestId('przewodnik-f-wibracje'));
  await waitFor(() => expect(postep()).toHaveTextContent('Read: 2 of 42'));
  expect(await przeczytanePrzewodnika(s.z)).toEqual({ ok: true, wartosc: ['kontynuuj', 'wibracje'] });
  screen.unmount(); // „zabicie” aplikacji: ekran znika, zostaje baza

  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  await waitFor(() => expect(postep()).toHaveTextContent('Read: 2 of 42'));
  expect(screen.getByTestId('przewodnik-f-kontynuuj').props.accessibilityLabel).toMatch(/, read$/);
  expect(screen.getByTestId('przewodnik-f-wibracje').props.accessibilityLabel).toMatch(/, read$/);
  expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityLabel).toMatch(/, not read$/);
  expect(screen.getAllByTestId(/^przewodnik-f-[a-z-]+$/).filter((e) => /, read$/.test(e.props.accessibilityLabel as string))).toHaveLength(2);
});

// PU-133 (VoiceOver): nagłówki („Guide”, „First steps”, „Feature library” i wszystkie grupy), krok „Step 1 of 6. …” z „Show: Step 1 of 6”, wiersz „…, not read” ze stanem rozwinięcia i „Back”.
test('PU-133: przewodnik ma nagłówki (w tym 9 grup), etykiety kroków i wierszy z stanem „read/not read” i rozwinięcia oraz „Back”', async () => {
  await otworz();
  const naglowki = screen.getAllByRole('header').map((h) => (h.children as string[]).join(''));
  expect(naglowki).toEqual(expect.arrayContaining(['Guide', 'First steps', 'Feature library']));
  expect(screen.getAllByTestId(/^przewodnik-grupa-/).length).toBe(9);
  expect(naglowki.length).toBeGreaterThanOrEqual(3 + 9);
  const zdanie1 = screen.getByTestId('przewodnik-krok-1').findAll((n) => typeof n.type === 'string' && typeof n.props.accessibilityLabel === 'string' && /^Step 1 of 6\. /.test(n.props.accessibilityLabel as string));
  expect(zdanie1.length).toBeGreaterThan(0);
  expect(zdanie1[0]!.props.accessibilityLabel).toMatch(/tap “\+1” on the “First counter” card/);
  expect(screen.getByTestId('przewodnik-krok-1-pokaz').props.accessibilityLabel).toBe('Show: Step 1 of 6');
  const wiersz = screen.getByTestId('przewodnik-f-cel');
  expect(wiersz.props.accessibilityLabel).toBe('Set a goal for this part, Counter, not read');
  expect(wiersz.props.accessibilityState).toMatchObject({ expanded: false });
  fireEvent.press(wiersz);
  await waitFor(() => expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityLabel).toBe('Set a goal for this part, Counter, read'));
  expect(screen.getByTestId('przewodnik-f-cel').props.accessibilityState).toMatchObject({ expanded: true });
  expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
});

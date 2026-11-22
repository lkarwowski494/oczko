// PU-058, PU-297, PU-299 (katalog przypadków użycia, „Wzory”): trasa „/wzor” (app/wzor.tsx) i „/kosz” na prawdziwej bazie, prawdziwej skrzynce importu i kompozycji
// wzoru (kompozycjaWzoru), prawdziwym t() z en.json. Widok strony PDF to atrapa modułu natywnego (Swift); konwersja PDF to atrapa portu (jest.fn),
// żeby dało się stwierdzić, że po powrocie sieci nic nie jest pobierane. Harness jak w wzor-trasa-czeka-w-liscie.test.tsx.
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ArkuszLinku } from '../../src/ekrany/WzorGrupa';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, ile, katalogTymczasowy, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}), useFocusEffect: (f: () => void) => (require('react') as typeof import('react')).useEffect(f, [f]) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const EkranKosza = (require('../../app/kosz') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const CZEKA = 'Waiting for the internet to save the web page.';

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms);
  const konwersja = { naPdf: jest.fn(), sprawdzPdf: jest.fn() };
  const zw = { ...s.z, konwersja, czasWTle, skrzynka, migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { s, kw, skrzynka, konwersja };
}

// PU-297: ✕ przy stronie czekającej na sieć usuwa wiersz z listy wzorów; po powrocie sieci strona nie jest pobierana ani dodawana.
test('PU-297: „Remove … from the list” → wiersz znika z listy wzorów; po powrocie sieci nic się nie pobiera i nie dodaje wzoru', async () => {
  const { s, kw, skrzynka, konwersja } = await start();
  expect((await kw.czekajNaSiec({ projektId: 'p1', adres: 'https://example.org/wzory/czapka', nazwa: 'Web page' })).ok).toBe(true);
  render(<EkranWzoru />);
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  expect(screen.getByText(CZEKA)).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Remove Web page from the list' })); });
  await waitFor(() => expect(screen.queryByText(CZEKA)).toBeNull());
  expect(screen.queryByTestId('wzor-czeka-siec')).toBeNull();
  await act(async () => { await kw.ponowPoSieci(); }); // sieć wraca: ponowienie skrzynki
  expect(konwersja.naPdf).not.toHaveBeenCalled();
  expect(await skrzynka.pobierz()).toHaveLength(0);
  expect(await ile(s.baza, 'wzor', 'projekt_id = ? AND usunieto_ms IS NULL', ['p1'])).toBe(1);
});

// PU-058: „Delete pattern…” → alert z terminem przywrócenia → wzór znika, widać źródła „Add pattern”, wzór jest w koszu.
test('PU-058: ••• → „Delete pattern…” → alert z „until Nov 21” → „Delete pattern”: brak widoku wzoru, jest „Add pattern”; kosz „Pattern in Sweter · until Nov 21”', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await start();
  const r = render(<EkranWzoru />);
  expect(await screen.findByTestId('wzor-widok')).toBeTruthy();
  fireEvent.press(screen.getByTestId('wzor-menu'));
  fireEvent.press(screen.getByTestId('wzor-usun'));
  const [tytul, opis, przyciski] = alert.mock.calls.at(-1) as [string, string, AlertButton[]];
  expect(tytul).toMatch(/^Delete “.+”\?$/);
  expect(opis).toBe('You can restore it with its highlights and drawings from Recently deleted on the Projects list until Nov 21. Row notes and counters stay.');
  await act(async () => { przyciski.find((b) => b.text === 'Delete pattern')?.onPress?.(); });
  await waitFor(() => expect(screen.queryByTestId('wzor-widok')).toBeNull());
  expect(screen.getByTestId('wzor-dodaj')).toBeTruthy(); // źródła „Add pattern”
  r.unmount();
  render(<EkranKosza />);
  expect(await screen.findByText('Pattern in Sweter · until Nov 21')).toBeTruthy();
  alert.mockRestore();
});

// PU-299: „Paste” wkleja skopiowany adres do pola „Link to the pattern page”; zła treść schowka → zdanie o błędnym linku, bez zapisu.
test('PU-299: „Paste” z adresem w schowku wypełnia pole; „abc” w schowku → „That doesn’t look like a web link…” i brak zapisu', async () => {
  const t = await tEn();
  let schowek: string | null = 'https://example.org/wzory/czapka';
  const naZapisz = jest.fn();
  render(<ArkuszLinku t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} naWklej={async () => schowek} />);
  expect(screen.getByLabelText('Link to the pattern page').props.value).toBe('');
  fireEvent.press(screen.getByRole('button', { name: 'Paste' }));
  await waitFor(() => expect(screen.getByTestId('wzor-link-pole').props.value).toBe('https://example.org/wzory/czapka'));
  fireEvent.press(screen.getByRole('button', { name: 'Save page' }));
  expect(naZapisz).toHaveBeenCalledWith('https://example.org/wzory/czapka');
  schowek = 'abc';
  fireEvent.press(screen.getByRole('button', { name: 'Paste' }));
  await waitFor(() => expect(screen.getByTestId('wzor-link-pole').props.value).toBe('abc'));
  fireEvent.press(screen.getByRole('button', { name: 'Save page' }));
  expect(screen.getByText('That doesn’t look like a web link. Check it and try again.')).toBeTruthy();
  expect(naZapisz).toHaveBeenCalledTimes(1);
});

// Trasa „/wzor” (app/wzor.tsx): strona WWW czekająca na sieć jest widoczna także przy otwartym wzorze — wiersz w liście wzorów ▾ z ✕
// (aneks partii 8, poz. 12 C, P-353 (d); design-spec.md:936, makieta `wzor-przelacznik-czeka`). Prawdziwa baza, prawdziwa skrzynka i kompozycja
// wzoru; widok strony PDF to atrapa modułu natywnego (Swift) na granicy platformy.
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, katalogTymczasowy, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const CZEKA = 'Waiting for the internet to save the web page.';

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), projekt('p2', 'Czapka'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms);
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle, skrzynka, migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { s, kw, skrzynka, h };
}

test('poz. 12 C: jeden wzór + strona czekająca na sieć → ▾ na wzorze, wiersz w liście, ✕ usuwa zlecenie ze skrzynki i znika ▾', async () => {
  const { kw, skrzynka } = await start();
  expect((await kw.czekajNaSiec({ projektId: 'p1', adres: 'https://example.org/wzory/czapka', nazwa: 'Web page' })).ok).toBe(true);
  render(<EkranWzoru />);
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  expect(screen.getByText(CZEKA)).toBeTruthy();
  expect(await skrzynka.pobierz()).toHaveLength(1);
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Remove Web page from the list' })); });
  await waitFor(() => expect(screen.queryByText(CZEKA)).toBeNull());
  expect(await skrzynka.pobierz()).toHaveLength(0);
  expect(kw.stan().czekaSiec).toHaveLength(0);
  expect(screen.queryByTestId('wzor-przelacz')).toBeNull();
});
test('poz. 12 C: strona czekająca na sieć w innym projekcie nie pojawia się na wzorze tego projektu', async () => {
  const { kw } = await start();
  expect((await kw.czekajNaSiec({ projektId: 'p2', adres: 'https://example.org/inny', nazwa: 'Other page' })).ok).toBe(true);
  render(<EkranWzoru />);
  await screen.findByTestId('wzor-zrodlo');
  expect(screen.queryByTestId('wzor-przelacz')).toBeNull();
});
test('poz. 12 C: gdy oczekujący zamienia się we wzór (zlecenie znika, wzór jest w projekcie), lista pokazuje nowy wzór bez ponownego otwarcia ekranu', async () => {
  const { s, kw, h } = await start();
  const wpis = await kw.czekajNaSiec({ projektId: 'p1', adres: 'https://example.org/wzory/czapka', nazwa: 'Web page' });
  expect(wpis.ok).toBe(true);
  render(<EkranWzoru />);
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  fireEvent.press(screen.getByText('Web page')); // zamknięcie menu: wiersz oczekującego nie przełącza
  expect(screen.getByText(CZEKA)).toBeTruthy();
  await wykonaj(s.baza, [wzor('w2', 'p1', h), ["UPDATE wzor SET nazwa = 'Edging' WHERE id = 'w2'", []]]); // import po powrocie sieci tworzy wzór w projekcie…
  await act(async () => { await kw.potwierdzBlad(kw.stan().czekaSiec[0]?.id ?? ''); }); // …a zlecenie znika ze skrzynki (stan wzoru ogłasza zmianę)
  await waitFor(() => expect(screen.queryByText(CZEKA)).toBeNull());
  expect(screen.getByRole('menuitem', { name: 'Edging' })).toBeTruthy();
});

// E2-137-A2 (scenariusz 07, bramka; ścieżka monetyzacji KP-13): okno „Uczciwe zasady” → „See Oczko Pro” → „Not now” zostawiało pustą planszę (zrzut 07-krok59).
// Okno zamienia się na oferty przez `replace` (modal na modal), a oferty zamykały się przez `back()`; docs.expo.dev/versions/latest/sdk/router/ (odczyt 2026-11-02)
// opisuje `back` jako „Goes back in the navigation history” i nie rozstrzyga natywnego stosu po zamianie modalu na modal. Zamknięcie jest więc jawne:
// oferty otwarte z okna kończą na liście projektów (`dismissTo('/projekty')`: pop do listy, a gdy jej nie ma w stosie — zastąpienie bieżącego ekranu listą,
// nigdy pusty stos); oferty otwarte skądkolwiek indziej (licznik, Ustawienia) nadal wracają przez `back()`.
import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { Produkt } from '../../src/domena/porty';
import { tEn } from './pomoc';

const mockRouter = { back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() };
const mockParametry: { skad?: string } = {};
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParametry }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
jest.mock('../../src/przypadki-uzycia/informacje-pro', () => ({ oznaczOknoWidziane: jest.fn(async () => undefined) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranOfert = (require('../../app/oferty') as { default: React.ComponentType }).default;
const EkranUczciweZasady = (require('../../app/uczciwe-zasady') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function aplikacja() {
  const t = await tEn();
  const sklep = { produkty: async (): Promise<Produkt[]> => [], kup: jest.fn(), przywroc: jest.fn() };
  const dostep = { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined, odswiez: jest.fn(async () => undefined) };
  mockAplikacja = { kontener: { j: { t }, z: {}, porty: { sklep }, dostep }, licznik: { poZmianie: jest.fn(async () => undefined) }, preferencje: {} };
}
beforeEach(() => { jest.clearAllMocks(); delete mockParametry.skad; });

test('okno „Uczciwe zasady”: „See Oczko Pro” zamienia okno na oferty i zapamiętuje, skąd przyszły', async () => {
  await aplikacja();
  render(<EkranUczciweZasady />);
  await userEvent.press(screen.getByTestId('uczciwe-zasady-plany-pro'));
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/oferty', params: { skad: 'uczciwe-zasady' } });
});
test('oferty otwarte z okna: „Not now” → jawne wyjście na listę projektów, bez back()', async () => {
  await aplikacja();
  mockParametry.skad = 'uczciwe-zasady';
  render(<EkranOfert />);
  await userEvent.press(await screen.findByTestId('oferty-nie-teraz'));
  await waitFor(() => expect(mockRouter.dismissTo).toHaveBeenCalledWith('/projekty'));
  expect(mockRouter.back).not.toHaveBeenCalled();
});
test('oferty otwarte skądkolwiek indziej (licznik, Ustawienia): „Not now” nadal wraca przez back()', async () => {
  await aplikacja();
  render(<EkranOfert />);
  await userEvent.press(await screen.findByTestId('oferty-nie-teraz'));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
  expect(mockRouter.dismissTo).not.toHaveBeenCalled();
});
test('okno „Uczciwe zasady”: główny przycisk nadal zamyka przez back() (okno otwarte z listy przez push)', async () => {
  await aplikacja();
  render(<EkranUczciweZasady />);
  await userEvent.press(screen.getByTestId('uczciwe-zasady-zamknij'));
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
});

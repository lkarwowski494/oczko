// PU-336 (katalog przypadków użycia, „Tylko iPad”; KO-111, słowa właściciela 16.11.2026): w oknie iPada zwężonym do 375 pt „Pióro” znika z paska,
// a wybrane narzędzie przechodzi na „Zakreślacz”. Prawdziwy ekran `app/wzor.tsx` (prawdziwa baza i kompozycja wzoru, jak m3-fix-e5-wzor-ax5);
// atrapą jest tylko natywny widok PDF (`oczko-wzor`, poza Jest) i szerokość okna. Poza Jest (F: Pencil): kreska pióra, cofnięcie ostatniej kreski, trwałość po restarcie (PencilKit).
import React from 'react';
import * as RN from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, katalogTymczasowy, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

let mockWymiary = { width: 820, height: 1180 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ ...mockWymiary, scale: 2, fontScale: 1 }) }));
const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockReact = React;
const mockRn = { View: RN.View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const wybrane = (id: string): boolean => screen.getByTestId(id).props.accessibilityState?.selected === true;

test('PU-336: iPad (regular) pokazuje „Pióro” w pasku; po zwężeniu okna do 375 pt „Pióro” znika, a wybrane narzędzie to „Zakreślacz”', async () => {
  mockWymiary = { width: 820, height: 1180 };
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };

  const r = render(<EkranWzoru />);
  // iPad: stały pasek z „Pióro”; wybór pióra zaznacza je
  const pioro = await screen.findByTestId('wzor-pioro');
  expect(screen.getByTestId('wzor-zakreslacz')).toBeTruthy();
  fireEvent.press(pioro);
  expect(wybrane('wzor-pioro')).toBe(true);

  // zawężenie okna do 375 pt (compact): „Pióro” znika z paska, wybrane narzędzie → „Zakreślacz”
  mockWymiary = { width: 375, height: 1180 };
  await act(async () => { r.rerender(<EkranWzoru />); });
  expect(screen.queryByTestId('wzor-pioro')).toBeNull();
  expect(screen.getByTestId('wzor-zakreslacz')).toBeTruthy();
  expect(wybrane('wzor-zakreslacz')).toBe(true);
});

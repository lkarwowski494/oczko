// PU-092 („Dane i ustawienia”): wzór na stronie 2 w powiększeniu → „zabicie” aplikacji → „Continue” na „Dziś” → wzór na tej samej stronie i w tym samym powiększeniu.
// Poziom: komponentowy, prawdziwa baza i trasy „/wzor” oraz „Dziś”; widok PDF to atrapa modułu natywnego (jak wzor-trasa-miejsce.test.tsx). Zabicie procesu = brak odznaczenia ekranu wzoru (bez unmount), stan niesie tylko baza.
import React from 'react';
import { View } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, jeden, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false };
jest.mock('expo-router', () => ({
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => ({}), usePathname: () => '/', useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { (require('react') as typeof React).useEffect(f, []); },
}));
let mockDzis: { naKontynuuj(): void } | null = null;
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: (p: { dzis: { naKontynuuj(): void } }) => { mockDzis = p.dzis; return null; } })); // „Continue” na „Dziś” = dzis.naKontynuuj z trasy
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type Zd<T> = (e: { nativeEvent: T }) => void;
type PropsWidoku = { dokument?: { wzorId: string; startStrona: number; startPowiekszenie: number }; onStrona?: Zd<{ strona: number; stron: number }>; onPowiekszenie?: Zd<{ wzorId: string; powiekszenie: number }> };
let mockWidok: PropsWidoku = {};
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Dzis = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

// PU-092: strona 2 (indeks 1) i powiększenie 2,5× z widoku → „Continue” na „Dziś” otwiera /wzor → nowy widok startuje na stronie 2 w 2,5× („Page 2 of 6”).
test('PU-092: wzór na stronie 2 w powiększeniu 2,5× → „Continue” na „Dziś” → ponowne otwarcie startuje na tej samej stronie i powiększeniu', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 4), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = {
    kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } },
    licznik: k, preferencje: { stan: () => ({ wibracje: false }) },
  };
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.dokument).toBeDefined());
  act(() => mockWidok.onStrona?.({ nativeEvent: { strona: 1, stron: 6 } }));
  act(() => mockWidok.onPowiekszenie?.({ nativeEvent: { wzorId: 'w1', powiekszenie: 2.5 } }));
  expect(await screen.findByText('Page 2 of 6')).toBeTruthy();
  await waitFor(async () => expect(JSON.parse((await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatnie_miejsce'")).wartosc)).toMatchObject({ ekran: 'wzor', strona: 1, powiekszenie: 2.5 }));

  // „zabicie” aplikacji: nowe drzewo „Dziś” na tej samej bazie, bez odznaczenia ekranu wzoru
  mockWidok = {};
  mockRouter.push.mockClear(); mockDzis = null;
  render(<Dzis />);
  await waitFor(() => expect(mockDzis).not.toBeNull());
  await act(async () => { mockDzis?.naKontynuuj(); });
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/wzor'));

  render(<EkranWzoru />); // trasa „/wzor” otwarta przez „Continue”
  await waitFor(() => expect(mockWidok.dokument).toBeDefined());
  expect(mockWidok.dokument).toMatchObject({ wzorId: 'w1', startStrona: 1, startPowiekszenie: 2.5 });
});

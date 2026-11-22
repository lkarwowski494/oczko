// 07-jakosc-001 (opcja A): „Kontynuuj ›” i „Dodaj wzór” na „Dziś” czekają na `licznik.miejsce()` przed nawigacją (`app/(zakladki)/index.tsx:61-70`).
// Gdy odczyt miejsca odrzuca (wyjątek) albo wisi, przycisk nie może zostać głuchy: oczekiwana nawigacja do `/licznik` albo widoczny komunikat, nigdy cisza.
// Wiszący odczyt (obietnica bez końca) poza zakresem: odczyt idzie tą samą szeregową kolejką bazy co każdy zapis, więc wiszący blokuje całą aplikację, a nie tylko ten przycisk
// (teoretyczne; próg czasu byłby nową liczbą konfiguracyjną — decyzja poza fix, `docs/jakosc/at-2026-11-12/`).
import React from 'react';
import { Alert } from 'react-native';
import { act, render } from '@testing-library/react-native';
import type { KafelDzis } from '../../src/ekrany/Dzis';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => false, back: jest.fn() };
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter,
  useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react') as typeof React).useEffect(f, []);
  },
}));
let mockDzis: { naKafel(k: KafelDzis): void; naKontynuuj(): void } | null = null;
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: (p: { dzis: { naKafel(k: KafelDzis): void; naKontynuuj(): void } }) => { mockDzis = p.dzis; return null; } }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Start = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockRouter.push.mockClear(); mockRouter.navigate.mockClear(); mockDzis = null;
  render(<Start />);
  await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
  expect(mockDzis).not.toBeNull();
  return k;
}
const cisza = () => mockRouter.push.mock.calls.length + mockRouter.navigate.mock.calls.length === 0 && !(Alert.alert as jest.Mock).mock.calls.length;
const wciaz = () => act(async () => { await new Promise((r) => setTimeout(r, 300)); });

beforeEach(() => { jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => { jest.restoreAllMocks(); });

test('07-jakosc-001: „Kontynuuj ›”, gdy odczyt miejsca odrzuca → licznik albo komunikat, nie cisza', async () => {
  const k = await start();
  k.miejsce = () => Promise.reject(new Error('baza zajęta'));
  await act(async () => { mockDzis?.naKontynuuj(); });
  await wciaz();
  expect(cisza()).toBe(false);
});
test('07-jakosc-001: „Dodaj wzór”, gdy odczyt miejsca odrzuca → licznik albo komunikat, nie cisza', async () => {
  const k = await start();
  k.miejsce = () => Promise.reject(new Error('baza zajęta'));
  await act(async () => { mockDzis?.naKafel('dodaj-wzor'); });
  await wciaz();
  expect(cisza()).toBe(false);
});

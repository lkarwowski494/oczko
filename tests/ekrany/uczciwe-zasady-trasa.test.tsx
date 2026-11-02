// 07-jakosc-022 (BR-ZAK-006 S9, ER-46, O-05): okno „Uczciwe zasady” nigdy nie pojawia się na ekranie licznika; pojawia się dopiero na liście projektów.
// Trasy app/index.tsx i app/projekty.tsx na prawdziwej bazie (07-jakosc-032): dzień z robótką minął, bez Pro, okna jeszcze nie widziano.
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { oznaczOknoWidziane } from '../../src/przypadki-uzycia/informacje-pro';
import { czesc, dzienLimitu, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), canGoBack: () => false, back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react') as typeof React).useEffect(f, []);
  },
}));
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: () => null }));
jest.mock('../../src/ekrany/ListaProjektow', () => ({ ListaProjektow: () => null }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
jest.mock('../../src/kompozycja/projekty', () => ({ stanListy: () => ({}), projektyDoSkrzynki: async () => [] }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranLicznika = (require('../../app/index') as { default: React.ComponentType }).default;
const EkranProjektow = (require('../../app/projekty') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function start(o: { poziom?: string; widziane?: boolean } = {}) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), dzienLimitu('2026-10-20', 'z-stary', 0)]);
  await k.otworz('l1');
  if (o.widziane) await oznaczOknoWidziane(s.z);
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: o.poziom ?? 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockRouter.push.mockClear();
  return { s, k };
}
/** Montuje ekran i czeka na asynchroniczne efekty (odczyt bazy, ewentualne otwarcie okna) wewnątrz act. */
const monta = async (Ekran: React.ComponentType) => { render(<Ekran />); await act(async () => { await new Promise((r) => setTimeout(r, 150)); }); };
const okno = () => mockRouter.push.mock.calls.filter(([c]) => c === '/uczciwe-zasady').length;

test('022: start na liczniku po minionym dniu z robótką (bez Pro, okno niewidziane) nie otwiera okna', async () => {
  await start();
  await monta(EkranLicznika);
  expect(okno()).toBe(0);
});
test('022: ta sama baza, lista projektów → okno otwiera się dokładnie raz', async () => {
  await start();
  await monta(EkranProjektow);
  expect(okno()).toBe(1);
});
test('022: lista projektów nie otwiera okna po jego zobaczeniu ani przy Pro', async () => {
  await start({ widziane: true });
  await monta(EkranProjektow);
  expect(okno()).toBe(0);
  await start({ poziom: 'pro' });
  await monta(EkranProjektow);
  expect(okno()).toBe(0);
});

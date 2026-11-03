// 07-jakosc-006 (F-49, BR-PRJ-011 S1): start aplikacji po zamknięciu na ekranie wzoru otwiera ekran wzoru (licznik zostaje pod spodem); po wyjściu z wzoru — sam licznik.
// Trasa app/index.tsx na prawdziwej bazie (jak uczciwe-zasady-trasa.test.tsx).
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { zapamietajPozycjeWzoru } from '../../src/przypadki-uzycia/wzor-miejsce';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), canGoBack: () => false, back: jest.fn() };
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter,
  useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react') as typeof React).useEffect(f, []);
  },
}));
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/index') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
async function start(ekranWzoru: boolean) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  if (!ekranWzoru) await zapamietajLicznik(s.z, { licznikId: 'l1' }); // wyjście z wzoru
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockRouter.push.mockClear();
}
const monta = async () => { render(<EkranLicznika />); await act(async () => { await new Promise((r) => setTimeout(r, 150)); }); };
const naWzor = () => mockRouter.push.mock.calls.filter(([c]) => c === '/wzor').length;

test('S1: praca skończyła się na wzorze → start otwiera ekran wzoru dokładnie raz', async () => {
  await start(true);
  await monta();
  expect(naWzor()).toBe(1);
});
test('praca skończyła się na liczniku (wyjście z wzoru) → start nie otwiera wzoru', async () => {
  await start(false);
  await monta();
  expect(naWzor()).toBe(0);
});

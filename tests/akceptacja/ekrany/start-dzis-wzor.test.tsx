// 07-e2e (2026-11-08), test przed kodem p2 — TO BE dla tests/ekrany/start-na-wzorze.test.tsx (07-jakosc-006): po ZM-18 i P-563 (4a) zimny start zawsze na „Dziś”,
// także gdy praca skończyła się na wzorze; wzór otwiera dopiero „Kontynuuj ›” (strona i powiększenie zachowane — tests/akceptacja/dane/start-dzis.test.ts).
// Wyrocznia: BR-PRJ-011/S1 po ER-69 (docs/brd/wymagania-projekt*.md: „pierwszym ekranem jest »Dziś« … po »Kontynuuj ›« … wzór … na stronie 3 w powiększeniu 200%”).
// Trasa app/index.tsx na prawdziwej bazie, harness jak start-na-wzorze.test.tsx. 08 zastępuje stary test tym w commicie, który go zazielenia.
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { zapamietajPozycjeWzoru } from '../../../src/przypadki-uzycia/wzor-miejsce';
import { czesc, licznik, plik, projekt, wzor } from '../../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../../dane/pomocnicze/kompozycja-licznika';
import { wlozPlik, wykonaj } from '../../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), canGoBack: () => false, back: jest.fn() };
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter,
  useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react') as typeof React).useEffect(f, []);
  },
}));
jest.mock('../../../src/ekrany/Aplikacja', () => ({ Aplikacja: () => null }));
jest.mock('../../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Start = (require('../../../app/index') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
test('BR-PRJ-011/S1 (ER-69, P-563 4a): praca skończyła się na wzorze → zimny start NIE otwiera wzoru sam (start na „Dziś”)', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockRouter.push.mockClear();
  render(<Start />);
  await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.push.mock.calls.filter(([c]) => c === '/wzor')).toHaveLength(0);
});

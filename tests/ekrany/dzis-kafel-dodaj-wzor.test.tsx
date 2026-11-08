// M3 p3b, P-588: kafel „Dodaj wzór” na „Dziś” prowadzi do menu źródeł bieżącego projektu (trasa „/wzor” z parametrem `zrodla`, licznik pod spodem),
// a bez projektu (nic do dodania wzoru) do zakładki Projekty — nie do miejsca pracy jak „Kontynuuj ›” (stan p2: `docs/programista/m3-p2-stan.md` „Otwarte” 3).
// Przed kodem: czerwone, bo kafel wołał `naKontynuuj` (licznik bez menu źródeł).
import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { KafelDzis } from '../../src/ekrany/Dzis';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
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
let mockDzis: { naKafel(k: KafelDzis): void } | null = null;
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: (p: { dzis: { naKafel(k: KafelDzis): void } }) => { mockDzis = p.dzis; return null; } }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Start = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');

async function start(zProjektem: boolean, zWzorem = false) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  if (zProjektem) await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), ...(zWzorem ? [plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)] : [])]);
  if (zProjektem) await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockRouter.push.mockClear(); mockRouter.navigate.mockClear(); mockDzis = null;
  render(<Start />);
  await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
  expect(mockDzis).not.toBeNull();
}

test('P-588: kafel „Dodaj wzór” z projektem → licznik, a nad nim trasa „/wzor” z menu źródeł (`zrodla`), nie „Kontynuuj ›”', async () => {
  await start(true);
  await act(async () => { mockDzis?.naKafel('dodaj-wzor'); await new Promise((r) => setTimeout(r, 50)); });
  expect(mockRouter.push.mock.calls).toEqual([['/licznik'], [{ pathname: '/wzor', params: { zrodla: '1' } }]]);
});
test('P-588: kafel „Dodaj wzór” w projekcie, który ma już wzór → to samo menu źródeł (nowy wzór, nie otwarcie starego)', async () => {
  await start(true, true);
  await act(async () => { mockDzis?.naKafel('dodaj-wzor'); await new Promise((r) => setTimeout(r, 50)); });
  expect(mockRouter.push.mock.calls).toEqual([['/licznik'], [{ pathname: '/wzor', params: { zrodla: '1' } }]]);
});
test('P-588: kafel „Dodaj wzór” bez projektu → zakładka Projekty, bez trasy „/wzor”', async () => {
  await start(false);
  await act(async () => { mockDzis?.naKafel('dodaj-wzor'); await new Promise((r) => setTimeout(r, 50)); });
  expect(mockRouter.navigate).toHaveBeenCalledWith('/projekty');
  expect(mockRouter.push.mock.calls.filter(([c]) => JSON.stringify(c).includes('wzor'))).toHaveLength(0);
});

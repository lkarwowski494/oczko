// PU-274 (katalog przypadków użycia, „Zakreślanie na wzorze i przyciski na „Dziś””): karta „This week” na „Dziś” z prawdziwej bazy (trasa „/” → wczytajDzis) i prawdziwego ekranu Dzis:
// pracę w poniedziałek i środę oznaczają dni z etykietą „…, crafting day”, wtorek (bez pracy) nie.
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { Dzis } from '../../src/ekrany/Dzis';
import type { DaneDzis, PropsDzis } from '../../src/ekrany/Dzis';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, stanLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
const mockRouter = { push: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => false, back: jest.fn() };
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter, useIsFocused: () => true,
  useFocusEffect: (f: () => void | (() => void)) => { (require('react') as typeof React).useEffect(f, []); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
let mockProps: { dane: DaneDzis | null; dzis: { naKontynuuj(): void } } | null = null;
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: (p: { dane: DaneDzis | null; dzis: { naKontynuuj(): void } }) => { mockProps = p; return null; } }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Start = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;


const PON = Date.UTC(2026, 10, 2, 9); // poniedziałek 2026-11-02 10:00 Europe/Warsaw
const SRO = Date.UTC(2026, 10, 4, 9); // środa 2026-11-04

test('PU-274: praca w poniedziałek i środę → w „This week” dokładnie dwa dni „…, crafting day”: poniedziałek i środa, wtorek bez oznaczenia', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), czesc('c2', 'p1', 'Front', 2), ...licznik('l1', 'c1', 1, { t: PON }), ...licznik('l2', 'c2', 1, { t: SRO, prefiks: 'l2-z' })]);
  s.zegar.ustaw(SRO + 2 * 3_600_000);
  await k.otworz('l2');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  mockProps = null;
  const trasa = render(<Start />);
  await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
  trasa.unmount();
  expect(mockProps).not.toBeNull();
  const p = mockProps as unknown as { dane: DaneDzis; dzis: { naKontynuuj(): void } };
  const wlasciwosci: PropsDzis = {
    stan: stanLicznika({ skonczone: 1, dziergany: 2 }), dane: p.dane, t: j.t, jezyk: 'en-US', oglos: jest.fn(), haptyka: atrapaHaptyki(),
    naPlus: jest.fn(), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: p.dzis.naKontynuuj, naWybierzProjekt: jest.fn(),
  };
  render(<Dzis {...wlasciwosci} />);
  expect(screen.getByText('This week')).toBeTruthy();
  const dziergane = screen.getAllByLabelText(/crafting day/);
  expect(dziergane.map((e) => e.props.accessibilityLabel)).toEqual(['Monday, November 2, crafting day', 'Wednesday, November 4, crafting day']);
  expect(screen.getByLabelText('Tuesday, November 3')).toBeTruthy(); // wtorek: etykieta bez „crafting day”
  expect(p.dane.tydzien.map((d) => d.dziergany)).toEqual([true, false, true, false, false, false, false]); // oznaczenie kreski: poniedziałek i środa
});

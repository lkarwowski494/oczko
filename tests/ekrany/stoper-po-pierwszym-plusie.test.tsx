// P-262 (c), scenariusz 38 (przebieg 119): na świeżej instalacji pierwszy +1 tworzy projekt roboczy, a stoper w pasku (P-191 P1a) zależy od
// `projektId` trasy „/”. Ten był odświeżany tylko przy zmianie `wersja`, której pierwszy +1 nie zmienia → brak `licznik-stoper`.
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import type { Aplikacja as KontekstAplikacji } from '../../src/kompozycja/Kontekst'; // plik do zmiany: app/index.tsx (kompozycja trasy „/”)

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined }));
jest.mock('../../src/ekrany/Aplikacja', () => ({ EkranLicznika: jest.fn(() => null) })); // M3 p2: trasa /licznik rysuje EkranLicznika (dawniej Aplikacja na „/”)
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/przypadki-uzycia/informacje-pro', () => ({ pokazacOknoUczciweZasady: () => Promise.resolve({ ok: true, wartosc: false }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockStan = { projekt: null as string | null, widoki: 0 };
const mockLicznik = {
  przygotuj: () => Promise.resolve({ ok: true, wartosc: { cel: 'licznik' } }), wersja: () => 0, biezacy: () => null, poZegarku: () => () => undefined, poDostepie: () => () => undefined, poScaleniu: () => () => undefined, // 07-jakosc-005; poScaleniu: M3 p2: nowy członek interfejsu kompozycji (app/index.tsx)
  widok: () => { mockStan.widoki += 1; return Promise.resolve(mockStan.projekt ? { projektId: mockStan.projekt } : null); },
  uslugi: { dodajRzad: () => { mockStan.projekt = 'p1'; return Promise.resolve({ ok: true, wartosc: undefined }); } }, dzialania: {},
};
jest.mock('../../src/kompozycja/Kontekst', () => ({
  useAplikacja: () => ({ kontener: { z: {}, dostep: { stan: () => ({ poziom: 'darmowy' }) }, j: { t: (k: string) => k } }, licznik: mockLicznik, preferencje: {} }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EkranLicznika: Aplikacja } = require('../../src/ekrany/Aplikacja') as { EkranLicznika: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
type Props = { stoper: React.ReactNode; uslugi: { dodajRzad(): Promise<unknown> } };
const ostatnie = () => Aplikacja.mock.calls[Aplikacja.mock.calls.length - 1][0] as Props;

test('pierwszy udany +1 bez projektu → projekt odczytany ponownie, stoper w pasku; kolejne +1 już bez odczytu widoku', async () => {
  render(<EkranLicznika />);
  await waitFor(() => expect(mockStan.widoki).toBe(1));
  expect(ostatnie().stoper).toBeNull();
  await act(async () => { await ostatnie().uslugi.dodajRzad(); });
  await waitFor(() => expect(ostatnie().stoper).not.toBeNull());
  const poPierwszym = mockStan.widoki;
  await act(async () => { await ostatnie().uslugi.dodajRzad(); });
  expect(mockStan.widoki).toBe(poPierwszym);
});

// PU-273 (katalog przypadków użycia, „Zakreślanie na wzorze i przyciski na „Dziś””): linia „co dalej” na „Dziś” z prawdziwej bazy (trasa „/” → wczytajDzis) i prawdziwego ekranu Dzis.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

// Uwaga o liczbach: „rząd w robocie” = skończone + 1 (RD-13, src/domena/co-dalej.ts), więc przy 10 skończonych i przypomnieniu od 12 do rzędu zostaje 1, a „This row” jest przy 11 skończonych.
test('PU-273: przy 10 skończonych i przypomnieniu od 12 co 6 ×8 linia „In 1 row: decrease at both ends (1 of 8)” otwiera licznik; po +1 (11) pokazuje „This row: …”', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 10),
    ["INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES ('pr1', 'l1', 12, 6, 8, 'decrease at both ends', 1)", []]]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) }, wzor: { k: {} } }, licznik: k, preferencje: {} };
  const pokazDzis = async (skonczone: number) => {
    mockProps = null;
    const trasa = render(<Start />);
    await act(async () => { await new Promise((r) => setTimeout(r, 150)); });
    trasa.unmount(); // z trasy zostają dane z prawdziwej bazy i wywołania; ekran Dzis rysujemy poniżej z tymi danymi
    expect(mockProps).not.toBeNull();
    const p = mockProps as unknown as { dane: DaneDzis; dzis: { naKontynuuj(): void } };
    const wlasciwosci: PropsDzis = {
      stan: stanLicznika({ skonczone, dziergany: skonczone + 1 }), dane: p.dane, t: j.t, jezyk: 'en-US', oglos: jest.fn(), haptyka: atrapaHaptyki(),
      naPlus: jest.fn(), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: p.dzis.naKontynuuj, naWybierzProjekt: jest.fn(),
    };
    render(<Dzis {...wlasciwosci} />);
  };

  await pokazDzis(10);
  const linia = screen.getByTestId('dzis-co-dalej');
  expect(linia).toHaveTextContent('In 1 row: decrease at both ends (1 of 8)');
  mockRouter.push.mockClear();
  await act(async () => { fireEvent.press(linia); await new Promise((r) => setTimeout(r, 50)); });
  expect(mockRouter.push).toHaveBeenCalledWith('/licznik');
  screen.unmount();

  await k.uslugi.dodajRzad();
  await k.poZmianie();
  await pokazDzis(11);
  await waitFor(() => expect(screen.getByTestId('dzis-co-dalej')).toHaveTextContent('This row: decrease at both ends (1 of 8)'));
});

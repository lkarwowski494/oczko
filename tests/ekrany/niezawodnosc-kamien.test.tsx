// Rola 12 E2 (test oczekujący dla 08): kamień milowy strażnika dopiero po narysowaniu pierwszego ekranu (ADR-0019 „Kamień milowy: … pierwszy ekran
// (mockLicznik albo lista) wyrenderowany”; wzorzec roli 12: „start liczy się jako udany, gdy aplikacja … narysowała pierwszy ekran”).
// Dziś `app/index.tsx` zapisuje kamień w tym samym kroku co `ustawGotowe(true)`, przed renderem licznika: błąd renderu pierwszego ekranu zależny
// od danych (np. po aktualizacji) powtarza się przy każdym starcie, a strażnik ma już zapisany kamień i nigdy nie włączy trybu awaryjnego.
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import type { Aplikacja as KontekstAplikacji } from '../../src/kompozycja/Kontekst'; // plik do zmiany: app/index.tsx (kompozycja startu)

const mockKamien = jest.fn(() => Promise.resolve());
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => mockKamien(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() }; // stały jak w expo-router
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined }));
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: jest.fn() }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/przypadki-uzycia/informacje-pro', () => ({ pokazacOknoUczciweZasady: () => Promise.resolve({ ok: true, wartosc: false }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
// widok: atrapa dodana przez 08 (partia 5, stoper P-191 P1a — trasa „/” czyta projekt bieżącego licznika); sens testu bez zmian.
const mockLicznik = { przygotuj: () => Promise.resolve({ ok: true, wartosc: { cel: 'mockLicznik' } }), wersja: () => 0, biezacy: () => null, poZegarku: () => () => undefined, poDostepie: () => () => undefined, widok: () => Promise.resolve(null) }; // poZegarku: 07-jakosc-005
jest.mock('../../src/kompozycja/Kontekst', () => ({
  useAplikacja: () => ({ kontener: { z: {}, dostep: { stan: () => ({ poziom: 'darmowy' }) }, j: { t: (k: string) => k } }, licznik: mockLicznik, preferencje: {} }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Aplikacja } = require('../../src/ekrany/Aplikacja') as { Aplikacja: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/index') as { default: React.ComponentType }).default;

class Granica extends React.Component<{ children: React.ReactNode }, { blad: boolean }> {
  state = { blad: false };
  static getDerivedStateFromError() { return { blad: true }; }
  render() { return this.state.blad ? null : this.props.children; }
}

beforeEach(() => { mockKamien.mockClear(); Aplikacja.mockReset(); });

test('P-080 ADR-0019: pierwszy ekran rysuje się poprawnie → kamień milowy zapisany [ZIELONY-OK: kontrola, że atrapa ekranu działa]', async () => {
  Aplikacja.mockImplementation(() => null);
  render(<EkranLicznika />);
  await waitFor(() => expect(mockKamien).toHaveBeenCalled());
  expect(Aplikacja).toHaveBeenCalled();
});

test('P-080 ADR-0019: render pierwszego ekranu rzuca wyjątek → kamień milowy NIE zapisany (następny start liczy ten jako nieudany)', async () => {
  const blad = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  Aplikacja.mockImplementation(() => { throw new Error('render licznika: dane w nieoczekiwanym kształcie'); });
  render(<Granica><EkranLicznika /></Granica>);
  await waitFor(() => expect(Aplikacja).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 50));
  blad.mockRestore();
  expect(mockKamien).not.toHaveBeenCalled();
});

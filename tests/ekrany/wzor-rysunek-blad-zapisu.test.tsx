// M1-audytor-generalny-084: trasa wzoru pokazuje komunikat, gdy zapis rysunku albo jego odzysk przy otwarciu się nie udał (wzorzec: sonda reaudytu 08).
import React from 'react';
import { Alert, View } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from './../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from './../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from './../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
const mockReact = React;
const mockRn = { View };
const mockProps: { p: Record<string, unknown> | null } = { p: null };
const mockWyniki: { rysunek: unknown[]; odzysk: unknown } = { rysunek: [], odzysk: { ok: true, wartosc: 0 } };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: (p: Record<string, unknown>) => { mockProps.p = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); } }));
jest.mock('../../src/przypadki-uzycia/wzor', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor'), zapiszRysunek: async () => mockWyniki.rysunek.shift() }));
jest.mock('../../src/przypadki-uzycia/wzor-widok', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor-widok'), odzyskajRysunki: async () => mockWyniki.odzysk }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranWzoru = trasa('../../app/wzor');
/* eslint-enable @typescript-eslint/no-require-imports */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
let alert: jest.SpyInstance;
let haptyka: { zagraj: jest.Mock };
const BLAD = { ok: false, powod: 'brak_miejsca' };

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  await k.otworz('l1');
  haptyka = { zagraj: jest.fn() };
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = {
    kontener: {
      z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      porty: { haptyka, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null, wklej: async () => null } },
    },
    licznik: k, preferencje: preferencje(),
  };
  mockParams = {};
  render(React.createElement(EkranWzoru));
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
async function rysunek(wynik: unknown) {
  mockWyniki.rysunek.push(wynik);
  const onRysunek = mockProps.p?.onRysunek as (e: unknown) => void;
  await act(async () => { onRysunek({ nativeEvent: { wzorId: 'w1', strona: 0, plikTymczasowy: '/tmp/rysunki-wzoru/w1__0__a.pkdrawing' } }); await new Promise((r) => setTimeout(r, 50)); });
}
beforeEach(() => { mockWyniki.rysunek = []; mockWyniki.odzysk = { ok: true, wartosc: 0 }; mockProps.p = null; alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());

// M1-audytor-generalny-084 (08-programista-501): nieudany zapis rysunku nie przechodzi po cichu. Alert błędu zapisu z systemu (M1-006,
// `alertBleduZapisu(t, 'formularz')`: „Couldn’t save your changes”) i haptyka; raz, do następnego udanego zapisu (zapis po każdej przerwie w rysowaniu).
describe('M1-084: komunikat przy nieudanym zapisie rysunku', () => {
  test('onRysunek → { ok: false, brak_miejsca } → alert błędu zapisu i haptyka bladZapisu; kolejny błąd bez drugiego alertu; po udanym zapisie błąd znów alertuje', async () => {
    await start();
    await waitFor(() => expect(mockProps.p).not.toBeNull());
    await rysunek(BLAD);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Couldn’t save your changes');
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
    await rysunek(BLAD);
    expect(alert).toHaveBeenCalledTimes(1);
    await rysunek({ ok: true, wartosc: undefined });
    await rysunek(BLAD);
    expect(alert).toHaveBeenCalledTimes(2);
  });

  test('odzysk przy otwarciu nie zapisał rysunku (wciąż brak miejsca) → alert; wzór i tak się otwiera', async () => {
    mockWyniki.odzysk = BLAD;
    await start();
    await waitFor(() => expect(mockProps.p).not.toBeNull());
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Couldn’t save your changes');
  });
});

// M1-audytor-generalny-085: zapis automatyczny próbki, znacznika wzoru i stopera z wynikiem `{ ok: false, powod: 'zapis' }` daje komunikat
// błędu zapisu z systemu (M1-006, `alertBleduZapisu(t, 'formularz')`: „Couldn’t save your changes”), nie ciszę (wzorzec: sonda reaudytu 08).
import React from 'react';
import { Alert, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, przygotuj, T0, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';
import { StoperLicznika } from '../../src/kompozycja/StoperLicznika';
import { tEn } from './pomoc';

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
const OK = { ok: true, wartosc: undefined };
const mockWyniki: { probka: unknown[]; znacznik: unknown[]; start: unknown[]; wolane: { probka: number; znacznik: number; start: number } } = { probka: [], znacznik: [], start: [], wolane: { probka: 0, znacznik: 0, start: 0 } };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: (p: Record<string, unknown>) => { mockProps.p = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); } }));
jest.mock('../../src/przypadki-uzycia/projekt', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/projekt'), ustawProbke: async () => { mockWyniki.wolane.probka += 1; return mockWyniki.probka.shift() ?? { ok: false, powod: 'zapis' }; } }));
jest.mock('../../src/przypadki-uzycia/wzor', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor'), ustawZnacznik: async () => { mockWyniki.wolane.znacznik += 1; return mockWyniki.znacznik.shift() ?? { ok: false, powod: 'zapis' }; } }));
jest.mock('../../src/przypadki-uzycia/sesja', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/sesja'), startSesji: async () => { mockWyniki.wolane.start += 1; return mockWyniki.start.shift() ?? { ok: false, powod: 'zapis' }; } }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranWzoru = trasa('../../app/wzor');
const EkranProbki = trasa('../../app/probka');
/* eslint-enable @typescript-eslint/no-require-imports */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 5, kierunek: -1 });
const TYTUL = 'Couldn’t save your changes';
let alert: jest.SpyInstance;
let haptyka: { zagraj: jest.Mock };

async function trasaZ(ekran: React.ComponentType, params: Record<string, string>, zWzorem: boolean) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...(zWzorem ? [plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK)] : [])]);
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
  mockParams = params;
  render(React.createElement(ekran));
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
beforeEach(() => {
  mockWyniki.probka = []; mockWyniki.znacznik = []; mockWyniki.start = []; mockWyniki.wolane = { probka: 0, znacznik: 0, start: 0 }; mockProps.p = null;
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => alert.mockRestore());

describe('M1-085: komunikat przy nieudanym zapisie automatycznym', () => {
  test('próbka: ustawProbke → { ok: false, zapis } → alert błędu zapisu i haptyka; drugi błąd bez drugiego alertu; po udanym zapisie błąd znów alertuje', async () => {
    await trasaZ(EkranProbki, { projekt: 'p1' }, false);
    const pole = await screen.findByTestId('probka-oczka');
    const wpisz = (v: string) => act(async () => { fireEvent.changeText(pole, v); await new Promise((r) => setTimeout(r, 50)); });
    await wpisz('22');
    expect(mockWyniki.wolane.probka).toBe(1);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(TYTUL);
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
    await wpisz('23');
    expect(mockWyniki.wolane.probka).toBe(2);
    expect(alert).toHaveBeenCalledTimes(1);
    mockWyniki.probka.push(OK);
    await wpisz('24');
    await wpisz('25');
    expect(mockWyniki.wolane.probka).toBe(4);
    expect(alert).toHaveBeenCalledTimes(2);
  });

  test('znacznik: onZnacznik → ustawZnacznik { ok: false, zapis } → alert błędu zapisu (pojedyncza akcja: każdy błąd)', async () => {
    await trasaZ(EkranWzoru, {}, true);
    await waitFor(() => expect(mockProps.p?.znacznik).toBeTruthy());
    const onZnacznik = mockProps.p?.onZnacznik as (e: unknown) => void;
    await act(async () => { onZnacznik({ nativeEvent: { wzorId: 'w1', strona: 2, y: 0.3, wysokosc: 0.02 } }); await new Promise((r) => setTimeout(r, 50)); });
    expect(mockWyniki.wolane.znacznik).toBe(1);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(TYTUL);
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
  });

  async function stoper() {
    const t = await tEn();
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('pb', 'Scarf')]);
    s.zegar.ustaw(T0);
    const oglos = jest.fn();
    render(<StoperLicznika z={s.z} j={{ t, jezyk: () => 'en', zegar24h: () => true }} projektId="pb" oglos={oglos} poZmianie={async () => undefined} />);
    await waitFor(() => expect(screen.getByTestId('licznik-stoper')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start session timer' })); await new Promise((r) => setTimeout(r, 50)); });
    return oglos;
  }
  test('stoper: Start przy startSesji { ok: false, zapis } → alert błędu zapisu, bez ogłoszenia startu', async () => {
    const oglos = await stoper();
    expect(mockWyniki.wolane.start).toBe(1);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe(TYTUL);
    expect(oglos).not.toHaveBeenCalled();
  });
  test('stoper: powód inny niż zapis (niedozwolone_przejscie) → bez alertu błędu zapisu', async () => {
    mockWyniki.start.push({ ok: false, powod: 'niedozwolone_przejscie' });
    await stoper();
    expect(mockWyniki.wolane.start).toBe(1);
    expect(alert).not.toHaveBeenCalled();
  });
});

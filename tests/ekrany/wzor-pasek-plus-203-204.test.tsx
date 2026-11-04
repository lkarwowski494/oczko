// SYS-01, pasek licznika pod wzorem (trasa `app/wzor.tsx`, prawdziwa baza) — ta sama obsługa wyniku +1 co ekran licznika (`src/ekrany/po-plusie.ts`).
// M1-audytor-generalny-203 (04-studio-projektowe-001, SP-10): wynik `limit` → tekst limitu i odnośnik do Oczko Pro, ogłoszenie limitu z miesiącem;
// `zablokowany` → komunikat blokady; w obu bez fałszywego „Couldn’t save that row…” (wcześniej każdy wynik nie-ok dawał błąd zapisu).
// M1-audytor-generalny-204 (04-studio-projektowe-002, SP-17; BR-LIC-020 S1, S3): udany +1 → haptyka `plus` albo `rzadZInstrukcja` (przy
// włączonych wibracjach) i jedno ogłoszenie VoiceOver jak na liczniku (`licznik.po_dodaniu` / `licznik.wejscie_w_przypomnienie`).
import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { WynikPlus } from '../../src/ekrany/Licznik';
import { preferencje } from '../../src/kompozycja/preferencje';
import { czesc, licznik, plik, projekt, przypomnienie, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
const mockOglos = jest.fn();
jest.mock('../../src/kompozycja/system', () => ({ oglos: (tekst: string) => mockOglos(tekst), systemAplikacji: {} }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const BLAD = 'Couldn’t save that row. It’s still on screen; try again.';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

/** Wzór otwarty przy liczniku z 5 rzędami (albo `n`); `wynik` podmienia zapis +1 (np. limit dni), bez niego +1 idzie przez prawdziwą bazę. */
async function start(o: { wynik?: WynikPlus; wibracje?: boolean; przypomnienie?: boolean; zablokowany?: boolean; n?: number } = {}) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', o.n ?? 5, { zablokowany: o.zablokowany ? 1 : 0 }), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h),
    ...(o.przypomnienie ? [przypomnienie('pr1', 'l1')] : [])]);
  await k.otworz('l1');
  if (o.wynik) jest.spyOn(k.uslugi, 'dodajRzad').mockResolvedValue(o.wynik);
  const haptyka = { zagraj: jest.fn() };
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  const pref = preferencje();
  jest.spyOn(pref, 'stan').mockReturnValue({ ...pref.stan(), wibracje: o.wibracje ?? true });
  mockAplikacja = {
    kontener: {
      z: s.z, j, porty: { haptyka },
      wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } },
    },
    licznik: k, preferencje: pref,
  };
  mockOglos.mockClear();
  mockRouter.push.mockClear();
  render(<EkranWzoru />);
  return { haptyka };
}
async function plus(): Promise<void> {
  const p = await screen.findByTestId('licznik-plus');
  await act(async () => { fireEvent.press(p); await new Promise((r) => setTimeout(r, 80)); });
}

describe('203: limit dni i blokada na pasku pod wzorem', () => {
  test('203: wynik `limit` → „Row 6 wasn’t added”, odnośnik „Oczko Pro removes the limit” do oferty, ogłoszenie limitu z miesiącem, bez błędu zapisu i bez haptyki błędu', async () => {
    const { haptyka } = await start({ wynik: { ok: false, powod: 'limit' } });
    await plus();
    await waitFor(() => expect(screen.getByTestId('limit-pasek')).toBeTruthy());
    expect(screen.getByText('Row 6 wasn’t added')).toBeTruthy();
    expect(screen.queryByTestId('blad-zapisu')).toBeNull();
    expect(screen.queryByText(BLAD)).toBeNull();
    expect(mockOglos.mock.calls).toEqual([[expect.stringMatching(/^Row 6 wasn’t added\. Free crafting days for \S+ are used\. Nothing is lost\.$/)]]);
    expect(haptyka.zagraj).not.toHaveBeenCalledWith('bladZapisu');
    fireEvent.press(screen.getByTestId('limit-oferta-link'));
    expect(screen.getByText('Oczko Pro removes the limit')).toBeTruthy();
    expect(mockRouter.push).toHaveBeenCalledWith('/oferty');
  });

  test('203: zablokowany licznik → komunikat blokady jak na liczniku, bez błędu zapisu, bez ogłoszenia błędu', async () => {
    const { haptyka } = await start({ zablokowany: true });
    await plus();
    await waitFor(() => expect(screen.getByText('Counter is locked. Unlock it at the top.')).toBeTruthy());
    expect(screen.queryByTestId('blad-zapisu')).toBeNull();
    expect(mockOglos).not.toHaveBeenCalledWith(BLAD);
    expect(haptyka.zagraj).not.toHaveBeenCalledWith('bladZapisu');
  });

  test('203 (kontrola M1-004): błąd zapisu nadal daje komunikat błędu zapisu, bez tekstu limitu', async () => {
    await start({ wynik: { ok: false, powod: 'zapis' } });
    await plus();
    await waitFor(() => expect(screen.getByTestId('blad-zapisu')).toBeTruthy());
    expect(screen.queryByTestId('limit-pasek')).toBeNull();
  });
});

describe('204: haptyka i ogłoszenie po +1 na pasku pod wzorem', () => {
  test('204: zwykły rząd → haptyka `plus` i jedno ogłoszenie „6 done. Now row 7.”', async () => {
    const { haptyka } = await start();
    await plus();
    await waitFor(() => expect(mockOglos).toHaveBeenCalled());
    expect(haptyka.zagraj.mock.calls).toEqual([['plus']]);
    expect(mockOglos.mock.calls).toEqual([['6 done. Now row 7.']]);
  });
  test('204: +1 wchodzi w rząd z przypomnieniem → haptyka `rzadZInstrukcja` i ogłoszenie z instrukcją', async () => {
    const { haptyka } = await start({ przypomnienie: true, n: 4 }); // przypomnienie od rzędu 6 co 6: 4 → 5 zrobione, teraz rząd 6
    await plus();
    await waitFor(() => expect(mockOglos).toHaveBeenCalled());
    expect(haptyka.zagraj.mock.calls).toEqual([['rzadZInstrukcja']]);
    expect(mockOglos.mock.calls).toEqual([[expect.stringMatching(/^Row \d+: ujmowanie, \d+ of 5\.$/)]]);
  });
  test('204: wibracje wyłączone → bez haptyki, ogłoszenie zostaje (BR-LIC-020 S3)', async () => {
    const { haptyka } = await start({ wibracje: false });
    await plus();
    await waitFor(() => expect(mockOglos).toHaveBeenCalled());
    expect(haptyka.zagraj).not.toHaveBeenCalled();
    expect(mockOglos.mock.calls).toEqual([['6 done. Now row 7.']]);
  });
});

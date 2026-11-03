// M1-audytor-generalny-004 (źródło 04-studio-projektowe-003, wariant (a)): nieudany zapis +1/−1 daje haptykę `bladZapisu` (przy włączonych
// wibracjach, token 04 `haptyka.bladZapisu`), jedno ogłoszenie VoiceOver z tekstem komunikatu (`licznik.blad_zapisu`) i komunikat w stałym
// miejscu nad przyciskami — poza przewijaną treścią (`ScrollView`), nie na jej końcu pod notatką i kreskami. `limit` i `zablokowany` bez zmian.
// Ta sama haptyka i ogłoszenie na pasku licznika pod wzorem (trasa `app/wzor.tsx`, prawdziwa baza; błąd = `dodajRzad` zwraca `{ ok: false, powod: 'zapis' }`).
import React from 'react';
import { ScrollView, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Licznik, type PropsLicznika, type StanEkranuLicznika, type WynikPlus } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { preferencje } from '../../src/kompozycja/preferencje';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika, zagrane } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
const mockOglos = jest.fn();
jest.mock('../../src/kompozycja/system', () => ({ oglos: (tekst: string) => mockOglos(tekst), systemAplikacji: {} }));
const mockReact = React; // fabryka jest.mock idzie nad importy: odwołania z prefiksem mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const BLAD = 'Couldn’t save that row. It’s still on screen; try again.';
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

function pokaz(stan: StanEkranuLicznika, naPlus: () => Promise<WynikPlus>, naMinus?: PropsLicznika['naMinus']) {
  const w = { ...wywolaniaLicznika(naPlus), ...(naMinus ? { naMinus: jest.fn(naMinus) } : {}) };
  const haptyka = atrapaHaptyki();
  const oglos = jest.fn();
  render(<Licznik stan={stan} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  return { w, haptyka, oglos };
}
/** Komunikat poza przewijaną treścią: żaden `ScrollView` nie zawiera `blad-zapisu`, a liczba (kontrola) jest w środku. */
function pozaScrollView(): void {
  const przewijane = screen.UNSAFE_getAllByType(ScrollView);
  expect(przewijane.length).toBeGreaterThan(0);
  expect(przewijane.some((sv) => sv.findAll((n) => n.props.testID === 'licznik-wartosc').length > 0)).toBe(true);
  for (const sv of przewijane) expect(sv.findAll((n) => n.props.testID === 'blad-zapisu')).toHaveLength(0);
}
/** Stałe miejsce: komunikat nad przyciskami, czyli przed `licznik-minus` w kolejności drzewa. */
function nadPrzyciskami(): void {
  const kolejnosc = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && ['blad-zapisu', 'licznik-minus', 'licznik-plus'].includes(n.props.testID)).map((n) => n.props.testID);
  expect([...new Set(kolejnosc)]).toEqual(['blad-zapisu', 'licznik-minus', 'licznik-plus']);
}

describe('M1-004: ekran licznika', () => {
  // Treść przewijana pełna (notatka, przypomnienie, kreski) — dawniej komunikat stał pod nią, na końcu `ScrollView`.
  const PELNY = stanLicznika({ notatka: 'ujmowanie co 4 rzędy', przypomnienie: { tekst: 'dekolt', ktory: 1, razy: 3, nastepny: 52 }, sesja: { rzedy: 6, od: '14:05' } });

  test('M1-004: nieudany zapis +1 — haptyka `bladZapisu`, jedno ogłoszenie z tekstem komunikatu, komunikat poza ScrollView nad przyciskami', async () => {
    const { haptyka, oglos } = pokaz(PELNY, async () => ({ ok: false, powod: 'zapis' }));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    expect(await screen.findByTestId('blad-zapisu')).toBeTruthy();
    expect(screen.getByText(BLAD)).toBeTruthy();
    expect(zagrane(haptyka, 'bladZapisu')).toBe(1);
    expect(oglos).toHaveBeenCalledTimes(1);
    expect(oglos).toHaveBeenCalledWith(BLAD);
    pozaScrollView();
    nadPrzyciskami();
  });

  test('M1-004: nieudany zapis −1 (brak miejsca) — haptyka `bladZapisu`, jedno ogłoszenie, komunikat poza ScrollView', async () => {
    const { haptyka, oglos } = pokaz(PELNY, async () => ({ ok: false, powod: 'zapis' }), async () => ({ ok: false, powod: 'brak_miejsca' }));
    fireEvent.press(screen.getByTestId('licznik-minus'));
    expect(await screen.findByTestId('blad-zapisu')).toBeTruthy();
    expect(zagrane(haptyka, 'bladZapisu')).toBe(1);
    expect(haptyka.zagraj).toHaveBeenCalledTimes(1);
    expect(oglos).toHaveBeenCalledTimes(1);
    expect(oglos).toHaveBeenCalledWith(BLAD);
    pozaScrollView();
  });

  test('M1-004: wibracje wyłączone — bez haptyki, ogłoszenie zostaje', async () => {
    const { haptyka, oglos } = pokaz(stanLicznika({ wibracje: false }), async () => ({ ok: false, powod: 'zapis' }));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    expect(await screen.findByTestId('blad-zapisu')).toBeTruthy();
    expect(haptyka.zagraj).not.toHaveBeenCalled();
    expect(oglos).toHaveBeenCalledWith(BLAD);
  });

  test('M1-004: powód `zablokowany` z zapisu — dalej komunikat o blokadzie, bez haptyki `bladZapisu` i bez ogłoszenia błędu', async () => {
    const { haptyka, oglos } = pokaz(stanLicznika(), async () => ({ ok: false, powod: 'zablokowany' }));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    expect(await screen.findByText('Counter is locked. Unlock it at the top.')).toBeTruthy();
    expect(zagrane(haptyka, 'bladZapisu')).toBe(0);
    expect(oglos).not.toHaveBeenCalled();
  });
});

describe('M1-004: pasek licznika pod wzorem (trasa /wzor)', () => {
  const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
  async function start(wibracje: boolean) {
    const { s, k, j } = await kompozycjaTestowa();
    const h = wlozPlik(s.magazyn, PDF, 'pdf');
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
    await k.otworz('l1');
    jest.spyOn(k.uslugi, 'dodajRzad').mockResolvedValue({ ok: false, powod: 'zapis' });
    const haptyka = { zagraj: jest.fn() };
    const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
    const pref = preferencje();
    jest.spyOn(pref, 'stan').mockReturnValue({ ...pref.stan(), wibracje });
    mockAplikacja = {
      kontener: {
        z: s.z, j, porty: { haptyka },
        wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } },
      },
      licznik: k, preferencje: pref,
    };
    mockOglos.mockClear();
    render(<EkranWzoru />);
    return { haptyka };
  }

  test('M1-004: nieudany zapis +1 na pasku — haptyka `bladZapisu`, jedno ogłoszenie z tekstem komunikatu, komunikat widoczny', async () => {
    const { haptyka } = await start(true);
    const plus = await screen.findByTestId('licznik-plus');
    await act(async () => { fireEvent.press(plus); await new Promise((r) => setTimeout(r, 50)); });
    await waitFor(() => expect(screen.getByTestId('blad-zapisu')).toBeTruthy());
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
    expect(haptyka.zagraj).toHaveBeenCalledTimes(1);
    expect(mockOglos).toHaveBeenCalledTimes(1);
    expect(mockOglos).toHaveBeenCalledWith(BLAD);
  });

  test('M1-004: wibracje wyłączone — na pasku bez haptyki, ogłoszenie zostaje', async () => {
    const { haptyka } = await start(false);
    const plus = await screen.findByTestId('licznik-plus');
    await act(async () => { fireEvent.press(plus); await new Promise((r) => setTimeout(r, 50)); });
    await waitFor(() => expect(screen.getByTestId('blad-zapisu')).toBeTruthy());
    expect(haptyka.zagraj).not.toHaveBeenCalled();
    expect(mockOglos).toHaveBeenCalledWith(BLAD);
  });
});

// M3 p4 „Dzianina” (design-spec „Lista projektów”, ekrany.html `projekty`, WD-3): miniatura dzianiny w wierszu, ••• wiersza z usunięciem do kosza (30 dni, z datą),
// stopka „Ostatnio usunięte … Pokaż”. Komponent z propsami + trasa na prawdziwej bazie (07-jakosc-032).
import React from 'react';
import { ActionSheetIOS } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ListaProjektow, type StanListyProjektow } from '../../src/ekrany/ListaProjektow';
import { stanListy } from '../../src/kompozycja/projekty';
import type { WidokProjektow, ProjektNaEkranie } from '../../src/przypadki-uzycia/widok-projektow';
import type { Jezyk } from '../../src/kompozycja/licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

let mockSkala = 1; // fontScale: 1 = domyślny, 3,1 = AX5
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const mockAplikacja: { kontener?: unknown; licznik?: unknown; preferencje?: unknown } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true }), useIsFocused: () => true, useFocusEffect: (f: () => (() => void) | void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockSkala = 1; });

const HARBOR = { id: 'p1', nazwa: 'Harbor Sweater', opis: 'Left sleeve · row 47 of 96', dzianina: { gotowe: 47, cel: 96 } };
const stan = (z: Partial<StanListyProjektow> = {}): StanListyProjektow => ({ wToku: [HARBOR], ukonczone: [], zapytanie: '', dni: null, ...z });

describe('ListaProjektow (p4): miniatura, •••, stopka kosza', () => {
  test('wiersz ma miniaturę dzianiny, ukrytą przed VoiceOver (postęp niesie tekst wiersza)', () => {
    render(<ListaProjektow stan={stan()} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    const m = screen.getByTestId('projekty-miniatura', { includeHiddenElements: true });
    expect(m).toBeTruthy();
    expect(m.props.accessibilityElementsHidden).toBe(true);
  });

  test('przy dużym tekście (AX5) miniatura ukryta, wiersz i ••• zostają (tokeny miniatura.dzianina)', () => {
    mockSkala = 3.1;
    render(<ListaProjektow stan={stan()} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naMenuWiersza={jest.fn()} />);
    expect(screen.queryByTestId('projekty-miniatura', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId('projekty-wiersz')).toBeTruthy();
    expect(screen.getByTestId('projekty-wiersz-menu')).toBeTruthy();
  });

  test('••• wiersza: przycisk „More: {nazwa}” woła naMenuWiersza z id; bez propsu nie ma przycisku', () => {
    const naMenuWiersza = jest.fn();
    const r = render(<ListaProjektow stan={stan()} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naMenuWiersza={naMenuWiersza} />);
    fireEvent.press(przycisk('More: Harbor Sweater', 'button'));
    expect(naMenuWiersza).toHaveBeenCalledWith('p1');
    expect(screen.getByTestId('projekty-wiersz-menu')).toBeTruthy();
    r.rerender(<ListaProjektow stan={stan()} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    expect(screen.queryByTestId('projekty-wiersz-menu')).toBeNull();
  });

  test('stopka kosza: „Recently deleted: 3 items, until Nov 23. Show”, cała stopka otwiera kosz (etykieta VoiceOver bez zmian)', () => {
    const naKosz = jest.fn();
    render(<ListaProjektow stan={stan({ kosz: 3, koszDo: 'Nov 23' })} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naKosz={naKosz} />);
    expect(screen.getByText(/3 items, until Nov 23\./)).toBeTruthy();
    expect(screen.getByText('Show')).toBeTruthy();
    fireEvent.press(przycisk('Recently deleted, 3 items', 'button'));
    expect(naKosz).toHaveBeenCalledTimes(1);
  });
});

describe('stanListy (p4): dane miniatury', () => {
  const j: Jezyk = { t: (k, o) => `${k}${o ? JSON.stringify(o) : ''}`, jezyk: () => 'en-US', zegar24h: () => false };
  const p = (z: Partial<ProjektNaEkranie>): ProjektNaEkranie => ({ id: 'x', nazwa: 'X', nienazwany: false, utworzonoMs: 0, ostatniaPracaMs: 0, ukonczonoDzien: null, czasPracyMs: null,
    licznik: { id: 'l', czesc: 'Back', wartosc: 12, cel: 96 }, dniOdPracy: 0, dzis: null, ...z });
  const widok = (z: Partial<WidokProjektow>): WidokProjektow => ({ wToku: [], ukonczone: [], dni: null, kosz: 0, koszDo: null, ...z });
  const opcje = { zapytanie: '', j, terazMs: Date.UTC(2026, 10, 8), strefa: 'UTC' };

  test('w toku: gotowe = wartość licznika, cel = cel części (albo null — brak zostaje brakiem)', () => {
    const s = stanListy(widok({ wToku: [p({}), p({ id: 'y', licznik: { id: 'l2', czesc: 'Body', wartosc: 5, cel: null } })] }), opcje);
    expect(s.wToku[0]?.dzianina).toEqual({ gotowe: 12, cel: 96 });
    expect(s.wToku[1]?.dzianina).toEqual({ gotowe: 5, cel: null });
  });
  test('ukończony: dzianina do linii celu (pełna); projekt bez licznika: bez miniatury danych', () => {
    const s = stanListy(widok({ ukonczone: [p({ ukonczonoDzien: '2026-10-12' }), p({ id: 'z', ukonczonoDzien: '2026-10-12', licznik: null })] }), opcje);
    expect(s.ukonczone[0]?.dzianina).toEqual({ gotowe: 12, cel: 12 });
    expect(s.ukonczone[1]?.dzianina).toBeUndefined();
  });
  test('stopka kosza: data najwcześniejszego terminu jako krótka data regionu', () => {
    expect(stanListy(widok({ kosz: 2, koszDo: '2026-12-03' }), opcje).koszDo).toBe('Dec 3');
    expect(stanListy(widok({ kosz: 0, koszDo: null }), opcje).koszDo).toBeUndefined();
  });
});

describe('trasa /projekty (p4): ••• → usunięcie do kosza (WD-3)', () => {
  async function otworz() {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1, { cel: 96 }), ...licznik('l1', 'c1', 3), projekt('p2', 'Szal', T0 - DOBA), czesc('c2', 'p2', 'Body', 1), ...licznik('l2', 'c2', 4, { t: T0 - DOBA })]);
    s.zegar.ustaw(T0 + 60 * DOBA);
    const jt = await tEn();
    const j: Jezyk = { t: jt, jezyk: () => 'en-US', zegar24h: () => false };
    const poUsunieciu = jest.fn(async () => undefined);
    mockAplikacja.kontener = { z: s.z, j, wzor: { k: {} }, dostep: { stan: () => ({ poziom: 'darmowy' }) }, porty: { haptyka: { zagraj: jest.fn() } } };
    mockAplikacja.licznik = { otworz: jest.fn(), poUsunieciu };
    mockAplikacja.preferencje = { stan: () => ({ wibracje: false }) };
    render(<EkranProjektow />);
    await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
    return { poUsunieciu };
  }
  const arkusz = (wybor: number | null) => jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_o, cb) => { if (wybor !== null) cb(wybor); });

  test('„More: Sweter” otwiera arkusz z tytułem, datą kosza i działaniem destrukcyjnym; „Delete project” przenosi projekt do kosza i pokazuje stopkę', async () => {
    const { poUsunieciu } = await otworz();
    const sheet = arkusz(0);
    expect(screen.queryByTestId('projekty-kosz')).toBeNull();
    fireEvent.press(przycisk('More: Sweter', 'button'));
    const opcje = sheet.mock.calls[0]?.[0];
    expect(opcje?.title).toBe('Delete “Sweter”?');
    expect(opcje?.message).toMatch(/until Jan \d+\./); // T0 + 60 dni + 30 dni kosza
    expect(opcje?.options).toEqual(['Delete project', 'Cancel']);
    expect(opcje?.destructiveButtonIndex).toBe(0);
    expect(opcje?.cancelButtonIndex).toBe(1);
    await waitFor(() => expect(screen.queryByText('Sweter')).toBeNull());
    expect(poUsunieciu).toHaveBeenCalledWith('p1');
    expect(screen.getByText('Szal')).toBeTruthy();
    expect(screen.getByTestId('projekty-kosz')).toBeTruthy();
    expect(screen.getByText(/1 item, until/)).toBeTruthy();
  });

  test('„Cancel” w arkuszu: nic nie jest usuwane', async () => {
    const { poUsunieciu } = await otworz();
    arkusz(1);
    fireEvent.press(przycisk('More: Sweter', 'button'));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText('Sweter')).toBeTruthy();
    expect(poUsunieciu).not.toHaveBeenCalled();
    expect(screen.queryByTestId('projekty-kosz')).toBeNull();
  });
});

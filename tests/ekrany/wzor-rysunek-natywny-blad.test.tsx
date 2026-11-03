// M1-audytor-generalny-084 (DEC-31 a, b): trasa wzoru a błąd zapisu rysunku po stronie natywnej (WidokWzoru.swift `onBladZapisu`) i ostrzeżenie
// o braku miejsca przy otwarciu wzoru. Teksty: alert błędu zapisu z systemu (M1-006, `alertBleduZapisu(t, 'formularz')`) jak w 084 JS; własne
// teksty rysunku projektuje 04 (DEC-28). Gest wstecz przy niezapisanych kreskach wyłączony, „Wstecz” pyta (jak Trening `confirmDiscard`).
import React from 'react';
import { Alert, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from './../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from './../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from './../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';
import { RYSUNEK_MIEJSCE_MIN_MB } from '../../src/konfiguracja';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
const mockOpcje: Record<string, unknown>[] = [];
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return {
    useRouter: () => mockRouter, useLocalSearchParams: () => ({}), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]),
    Stack: Object.assign(() => null, { Screen: (p: { options: Record<string, unknown> }) => { mockOpcje.push(p.options); return null; } }),
  };
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
const mockWyniki: { rysunek: unknown[] } = { rysunek: [] };
// M1-112: funkcja widoku `zapiszRysunki` (zapis na żądanie → liczba oczekujących) przez ref; f null = build bez funkcji (odrzucenie → stan ze zdarzeń).
const mockZapis: { f: (() => Promise<unknown>) | null } = { f: null };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: (p: Record<string, unknown>) => {
  mockProps.p = p;
  mockReact.useImperativeHandle(p.ref as React.Ref<unknown>, () => ({ zapiszRysunki: () => (mockZapis.f ? mockZapis.f() : Promise.reject(new Error('build bez funkcji widoku'))) }), []);
  return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' });
} }));
jest.mock('../../src/przypadki-uzycia/wzor', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor'), zapiszRysunek: async () => mockWyniki.rysunek.shift() ?? { ok: true, wartosc: undefined } }));
// M1-111: wynik odzysku kresek przy otwarciu (domyślnie udany; `{ ok: false }` = odzysk z błędem zapisu).
const mockOdzysk: { w: unknown } = { w: null };
jest.mock('../../src/przypadki-uzycia/wzor-widok', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor-widok'), odzyskajRysunki: async () => mockOdzysk.w ?? { ok: true, wartosc: 0 } }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranWzoru = trasa('../../app/wzor');
/* eslint-enable @typescript-eslint/no-require-imports */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const MB = 1024 * 1024;
let alert: jest.SpyInstance;
let haptyka: { zagraj: jest.Mock };
let ekran: ReturnType<typeof render>;

async function start(o: { wolne?: number; wolneRzuca?: boolean; drugiWzor?: boolean } = {}) {
  const { s, k, j } = await kompozycjaTestowa();
  if (o.wolne !== undefined) s.magazyn.wolne = o.wolne;
  if (o.wolneRzuca) s.magazyn.wolneMiejsce = async () => { throw new Error('odczyt wolnego miejsca'); };
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h),
    ...(o.drugiWzor ? [wzor('w2', 'p1', h), ["UPDATE wzor SET nazwa = 'Edging' WHERE id = 'w2'", []] as [string, unknown[]]] : [])]);
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
  ekran = render(React.createElement(EkranWzoru));
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  await waitFor(() => expect(mockProps.p).not.toBeNull());
}
async function zdarzenie(nazwa: string, nativeEvent: Record<string, unknown>) {
  const f = mockProps.p?.[nazwa] as ((e: unknown) => void) | undefined; // brak obsługi zdarzenia = zdarzenie bez odbiorcy (jak w aplikacji)
  await act(async () => { f?.({ nativeEvent }); await new Promise((r) => setTimeout(r, 50)); });
}
const bladNatywny = (oczekujace = 1) => zdarzenie('onBladZapisu', { wzorId: 'w1', oczekujace });
const rysunek = (oczekujace: number) => zdarzenie('onRysunek', { wzorId: 'w1', strona: 0, plikTymczasowy: '/tmp/rysunki-wzoru/w1__0__a.pkdrawing', oczekujace });
const gest = () => mockOpcje.at(-1)?.gestureEnabled;
async function wstecz() { await act(async () => { fireEvent.press(ekran.getByTestId('nav-wstecz')); await new Promise((r) => setTimeout(r, 10)); }); }

beforeEach(() => { mockOdzysk.w = null; mockZapis.f = null; mockWyniki.rysunek = []; mockProps.p = null; mockOpcje.length = 0; mockRouter.back.mockClear(); alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());

describe('M1-084 (DEC-31 a): błąd zapisu rysunku po stronie natywnej', () => {
  test('onBladZapisu → alert błędu zapisu i haptyka bladZapisu; kolejny błąd bez drugiego alertu; po zapisaniu wszystkiego (oczekujace 0) błąd znów alertuje', async () => {
    await start();
    await bladNatywny();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Couldn’t save highlights and drawings'); // M1-102 (DEC-28 a): kreski tylko w pamięci widoku
    expect(alert.mock.calls[0]?.[1]).toBe('Your device may be out of space. Oczko keeps your latest highlights and drawings only while it’s open. Free some space, then open this pattern again to save them.');
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
    await bladNatywny();
    expect(alert).toHaveBeenCalledTimes(1);
    await rysunek(0);
    await bladNatywny();
    expect(alert).toHaveBeenCalledTimes(2);
  });

  test('niezapisane kreski: „Wstecz” pyta (Cancel zostaje, Back wychodzi bez zapisu), gest wstecz wyłączony', async () => {
    await start();
    await bladNatywny(2);
    alert.mockClear();
    expect(gest()).toBe(false);
    await wstecz();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
    const [tytul, opis, przyciski] = alert.mock.calls[0] as [string, string, { text: string; style?: string; onPress?: () => void }[]];
    expect(tytul).toBe('Leave this pattern?'); // M1-102 (04-studio-projektowe-514, DEC-28 a): pytanie o decyzję, przycisk nazywa skutek
    expect(opis).toBe('Your device may be out of space. Oczko keeps your latest highlights and drawings only while it’s open. Free some space, then open this pattern again to save them.');
    expect(przyciski.map((p) => [p.text, p.style])).toEqual([['Stay', 'cancel'], ['Leave unsaved', 'destructive']]);
    expect(przyciski[0]?.onPress).toBeUndefined(); // zostaje na ekranie
    act(() => przyciski[1]?.onPress?.());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  test('po zapisaniu kolejki (onRysunek z oczekujace 0) „Wstecz” wychodzi od razu, gest wstecz wraca', async () => {
    await start();
    await bladNatywny(1);
    await rysunek(0);
    alert.mockClear();
    expect(gest()).toBe(true);
    await wstecz();
    expect(alert).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  test('onRysunek z oczekujace > 0 (część stron zapisana, reszta czeka) nie zdejmuje ostrzeżenia', async () => {
    await start();
    await bladNatywny(2);
    await rysunek(1);
    alert.mockClear();
    await wstecz();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
  });

  test('bez błędu natywnego „Wstecz” wychodzi bez pytania', async () => {
    await start();
    await rysunek(0);
    await wstecz();
    expect(alert).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});

describe('M1-084 (DEC-31 b): ostrzeżenie o braku miejsca przy otwarciu wzoru', () => {
  test(`wolne miejsce poniżej ${RYSUNEK_MIEJSCE_MIN_MB} MB → jedno ostrzeżenie przy otwarciu`, async () => {
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB - 1 });
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Your device is almost full'); // M1-110 (DEC-28 a): tytuł ostrzeżenia z kluczy 04 zamiast zdania błędu
    await zdarzenie('onStrona', { strona: 1, stron: 2 });
    expect(alert).toHaveBeenCalledTimes(1);
  });

  test(`wolne miejsce równe progowi ${RYSUNEK_MIEJSCE_MIN_MB} MB → bez ostrzeżenia`, async () => {
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB });
    expect(alert).not.toHaveBeenCalled();
  });
});

describe('M1-110 (04-studio-projektowe-515): ostrzeżenie o miejscu i błąd natywny przy otwarciu — najwyżej jeden alert', () => {
  test('ostrzeżenie ma własny tytuł i opis (DEC-28 a: wzor.miejsce_*), nie zdanie błędu wspolne.blad_zapisu_opis', async () => {
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB - 1 });
    expect(alert).toHaveBeenCalledTimes(1);
    const [tytul, opis, przyciski] = alert.mock.calls[0] as [string, string, { text: string }[]];
    expect(tytul).toBe('Your device is almost full');
    expect(opis).toBe('Highlights and drawings you add may not be saved. Free some space before you draw.');
    expect(przyciski.map((p) => p.text)).toEqual(['OK']);
  });
  test('wolne poniżej progu, potem onBladZapisu z kolejki widoku → Alert.alert raz (ostrzeżenie wystarcza do udanego zapisu)', async () => {
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB - 1 });
    expect(alert).toHaveBeenCalledTimes(1);
    await bladNatywny();
    expect(alert).toHaveBeenCalledTimes(1);
    await rysunek(0); // udany zapis zdejmuje blokadę: następny błąd znów alertuje
    await bladNatywny();
    expect(alert).toHaveBeenCalledTimes(2);
  });
});

describe('M1-112 (08-programista-515): „Wstecz” decyduje po zapisie na żądanie w widoku (oczekujace z funkcji widoku)', () => {
  test('kreska przed upływem zegara zapisu, zapis widoku zostawia oczekujace > 0 → „Wstecz” pyta, nie wychodzi', async () => {
    await start();
    const wywolania: number[] = [];
    mockZapis.f = async () => { wywolania.push(1); return 2; };
    await wstecz();
    expect(wywolania).toHaveLength(1);
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Leave this pattern?');
  });

  test('zapis widoku zwraca 0 (kolejka zapisana) → „Wstecz” wychodzi bez pytania, choć wcześniej był błąd zapisu', async () => {
    await start();
    await bladNatywny(1);
    alert.mockClear();
    mockZapis.f = async () => 0;
    await wstecz();
    expect(alert).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  test('zapis przy wyjściu zgłasza onBladZapisu, potem oczekujace 1 → jeden alert (pytanie), bez alertu błędu zapisu', async () => {
    await start();
    mockZapis.f = async () => {
      (mockProps.p?.onBladZapisu as ((e: unknown) => void) | undefined)?.({ nativeEvent: { wzorId: 'w1', oczekujace: 1 } });
      return 1;
    };
    await wstecz();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Leave this pattern?');
  });

  test('funkcja widoku zawodzi albo zwraca nie-liczbę → decyzja ze stanu niezapisanych kresek (zdarzenie onBladZapisu)', async () => {
    await start();
    mockZapis.f = async () => { throw new Error('widok odmontowany'); };
    await wstecz();
    expect(alert).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.back.mockClear();
    await bladNatywny(1);
    alert.mockClear();
    mockZapis.f = async () => null;
    await wstecz();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
  });
});

describe('M1-111 (07-jakosc-513): polityka komunikatów zapisu rysunku — jeden alert', () => {
  test('mało miejsca → jedno ostrzeżenie; udany zapis kresek, dwa razy +1 na pasku wzoru (wczytaj → nowy widok) i przełączenie wzoru → nadal jedno', async () => {
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB - 1, drugiWzor: true });
    expect(alert).toHaveBeenCalledTimes(1);
    await rysunek(0); // udany zapis zdejmuje blokadę alertu rysunku (M1-110) — ostrzeżenie o miejscu i tak jest raz na otwarcie ekranu (DEC-31 b)
    for (let i = 0; i < 2; i++) await act(async () => { fireEvent.press(ekran.getByTestId('licznik-plus')); await new Promise((r) => setTimeout(r, 100)); });
    expect(ekran.getByTestId('licznik-wartosc').props.children).toBe('7');
    expect(alert).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.press(ekran.getByTestId('wzor-przelacz')); });
    await act(async () => { fireEvent.press(ekran.getByRole('menuitem', { name: 'Edging' })); await new Promise((r) => setTimeout(r, 100)); });
    expect(ekran.getByTestId('wzor-zrodlo')).toBeTruthy();
    expect((mockProps.p?.dokument as { wzorId: string } | undefined)?.wzorId).toBe('w2'); // widok natywny dostał drugi wzór (nowy widok trasy)
    expect(alert).toHaveBeenCalledTimes(1);
  });

  test('odzysk kresek z błędem zapisu przy małej ilości miejsca → jeden alert (błąd zapisu), bez ostrzeżenia o miejscu', async () => {
    mockOdzysk.w = { ok: false, powod: 'zapis' };
    await start({ wolne: RYSUNEK_MIEJSCE_MIN_MB * MB - 1 });
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]?.[0]).toBe('Couldn’t save highlights and drawings'); // M1-102: alert błędu zapisu rysunku (odzysk), nie ostrzeżenie o miejscu
    expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
  });

  test('onBladZapisu, potem onRysunek z oczekujace 1 (część stron zapisana) i kolejny onBladZapisu → nadal jeden alert', async () => {
    await start();
    await bladNatywny(2);
    expect(alert).toHaveBeenCalledTimes(1);
    await rysunek(1);
    await bladNatywny(1);
    expect(alert).toHaveBeenCalledTimes(1);
  });

  test('odczyt wolnego miejsca rzuca → bez ostrzeżenia (nie wiadomo ≠ brak miejsca)', async () => {
    await start({ wolneRzuca: true });
    expect(mockProps.p).not.toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });
});

// M1-audytor-generalny-006 (źródło 08-programista-001; Aneks P2 poz. 5, P-368, P-377): nieudany zapis na trasach projektu, wzoru, menu, kosza,
// zapasu i zdjęcia nie kończy się po cichu — alert „Couldn’t save your changes” (`formularz.blad_zapisu`) z wspólnym opisem i haptyka `bladZapisu`;
// menu przy błędzie nie wraca (`router.back()`) bez komunikatu. Trasy z `app/` na prawdziwej bazie; błąd zapisu = jeden przypadek użycia
// podmieniony w module (`jest.requireActual` + funkcja zwracająca `{ ok: false, powod: 'zapis' }`), reszta danych prawdziwa.
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wloczka, wzor, zdjecie } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
const mockReact = React; // fabryka jest.mock idzie nad importy: odwołania z prefiksem mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// Błąd zapisu: tylko te przypadki użycia zwracają `{ ok: false, powod: 'zapis' }`; reszta modułu prawdziwa.
jest.mock('../../src/przypadki-uzycia/projekt', () => ({
  ...jest.requireActual('../../src/przypadki-uzycia/projekt'),
  usunProjekt: async () => ({ ok: false, powod: 'zapis' }), zakonczProjekt: async () => ({ ok: false, powod: 'zapis' }), przywrocProjekt: async () => ({ ok: false, powod: 'zapis' }),
}));
jest.mock('../../src/przypadki-uzycia/licznik', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/licznik'), ustawBlokade: async () => ({ ok: false, powod: 'zapis' }) }));
jest.mock('../../src/przypadki-uzycia/wzor', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor'), zmienNazweWzoru: async () => ({ ok: false, powod: 'zapis' }) }));
jest.mock('../../src/przypadki-uzycia/wzor-widok', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor-widok'), ustawObrot: async () => ({ ok: false, powod: 'zapis' }) }));
jest.mock('../../src/przypadki-uzycia/zapas', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/zapas'), usunWloczke: async () => ({ ok: false, powod: 'zapis' }) }));
jest.mock('../../src/przypadki-uzycia/zdjecia', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/zdjecia'), usunZdjecie: async () => ({ ok: false, powod: 'zapis' }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
const EkranProjektu = trasa('../../app/projekt/[id]');
const EkranWzoru = trasa('../../app/wzor');
const EkranMenu = trasa('../../app/menu');
const EkranKosza = trasa('../../app/kosz');
const EkranWloczki = trasa('../../app/wloczka');
const EkranZdjecia = trasa('../../app/zdjecie');
/* eslint-enable @typescript-eslint/no-require-imports */

const TYTUL = 'Couldn’t save your changes';
const OPIS = 'Your device may be out of space. Nothing was changed. Free some space and try again.';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
let alert: jest.SpyInstance;
let haptyka: { zagraj: jest.Mock };

async function start(ekran: React.ComponentType, params: Record<string, string>, dane: [string, unknown[]][] = [], pliki: (s: Awaited<ReturnType<typeof kompozycjaTestowa>>['s']) => [string, unknown[]][] = () => []) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...dane, ...pliki(s)]);
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
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(React.createElement(ekran));
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
afterEach(() => alert.mockRestore());
/** Potwierdzenie systemowe (alert z przyciskiem destrukcyjnym): stuknięcie w przycisk. */
async function potwierdz(): Promise<void> {
  const przyciski = (alert.mock.calls.at(-1)?.[2] ?? []) as AlertButton[];
  const p = przyciski.find((b) => b.style === 'destructive') ?? przyciski.at(-1);
  await act(async () => { p?.onPress?.(); await new Promise((r) => setTimeout(r, 50)); });
}
async function oczekujBledu(): Promise<void> {
  await waitFor(() => expect(alert).toHaveBeenCalledWith(TYTUL, OPIS, [{ text: 'OK' }]));
  expect(haptyka.zagraj).toHaveBeenCalledWith('bladZapisu');
}

describe('M1-006: projekt', () => {
  test('M1-006: „Delete project” — nieudany zapis daje alert błędu zapisu i haptykę, ekran nie przechodzi do listy', async () => {
    await start(EkranProjektu, { id: 'p1' });
    fireEvent.press(await screen.findByTestId('projekt-menu'));
    fireEvent.press(screen.getByTestId('projekt-usun'));
    await potwierdz();
    await oczekujBledu();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/projekty');
  });
});

describe('M1-006: wzór', () => {
  const zWzorem = (s: Awaited<ReturnType<typeof kompozycjaTestowa>>['s']): [string, unknown[]][] => {
    const h = wlozPlik(s.magazyn, PDF, 'pdf');
    return [plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)];
  };
  test('M1-006: „Rename” — nieudany zapis nazwy daje alert błędu zapisu, arkusz nazwy zostaje', async () => {
    await start(EkranWzoru, {}, [], zWzorem);
    fireEvent.press(await screen.findByTestId('wzor-menu'));
    fireEvent.press(screen.getByTestId('wzor-zmien-nazwe'));
    fireEvent.changeText(screen.getByTestId('wzor-nazwa-pole'), 'Nowa nazwa');
    await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 50)); });
    await oczekujBledu();
    expect(screen.getByTestId('wzor-nazwa-pole')).toBeTruthy();
  });
  test('M1-006: „Rotate” — nieudany zapis obrotu daje alert błędu zapisu', async () => {
    await start(EkranWzoru, {}, [], zWzorem);
    fireEvent.press(await screen.findByTestId('wzor-menu'));
    await act(async () => { fireEvent.press(screen.getByTestId('wzor-obroc')); await new Promise((r) => setTimeout(r, 50)); });
    await oczekujBledu();
  });
});

describe('M1-006: menu •••', () => {
  test('M1-006: „Lock counter” — nieudany zapis daje alert błędu zapisu, menu nie wraca bez komunikatu', async () => {
    await start(EkranMenu, {});
    await act(async () => { fireEvent.press(screen.getByText('Lock counter (ignore taps)')); await new Promise((r) => setTimeout(r, 50)); });
    await oczekujBledu();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
  test('M1-006: „Finish project” — nieudany zapis daje alert błędu zapisu, bez przejścia do karty ukończenia', async () => {
    await start(EkranMenu, {});
    await act(async () => { fireEvent.press(screen.getByTestId('menu-ukoncz')); await new Promise((r) => setTimeout(r, 50)); });
    await oczekujBledu();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
  // M1-094 (04-studio-projektowe-506, DEC-26 a): wcześniej ten test utrwalał defekt — potwierdzenie resetu na zablokowanym liczniku zamykało menu
  // bez słowa (`router.back()`), a liczba zostawała. Teraz pozycja jest wyłączona z podpowiedzią; nadal bez alertu o braku miejsca i bez haptyki błędu.
  test('M1-006 / M1-094: „Reset” na zablokowanym liczniku — pozycja wyłączona z podpowiedzią, bez pytania, bez alertu o braku miejsca, menu zostaje', async () => {
    await start(EkranMenu, {}, [['UPDATE licznik SET zablokowany = 1 WHERE id = ?', ['l1']]]);
    expect(screen.getByTestId('menu-zeruj').props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(screen.getByText('Unlock the counter to reset it.')).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByText('Reset to 0…')); await new Promise((r) => setTimeout(r, 50)); });
    expect(screen.queryByText('Reset to 0')).toBeNull();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    expect(haptyka.zagraj).not.toHaveBeenCalled();
  });
});

describe('M1-006: kosz', () => {
  test('M1-006: „Restore” — nieudane przywrócenie daje alert błędu zapisu', async () => {
    await start(EkranKosza, {}, [projekt('p2', 'Szal', T0, { usunieto: T0 })]);
    await act(async () => { fireEvent.press(await screen.findByTestId('kosz-przywroc')); await new Promise((r) => setTimeout(r, 50)); });
    await oczekujBledu();
  });
});

describe('M1-006: zapas', () => {
  test('M1-006: „Delete yarn” — nieudane usunięcie daje alert błędu zapisu, arkusz nie wraca', async () => {
    await start(EkranWloczki, { id: 'y1' }, [wloczka('y1', 'Merino')]);
    fireEvent.press(await screen.findByTestId('zapas-usun'));
    await potwierdz();
    await oczekujBledu();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});

describe('M1-006: zdjęcie', () => {
  test('M1-006: „Delete photo” — nieudane usunięcie daje alert błędu zapisu', async () => {
    await start(EkranZdjecia, { projekt: 'p1', i: '0' }, [], (s) => {
      const h = wlozPlik(s.magazyn, Buffer.from('jpg'), 'jpg');
      return [plik(h, 'jpg', 3), zdjecie('f1', 'p1', h)];
    });
    fireEvent.press(await screen.findByTestId('zdjecie-usun'));
    await potwierdz();
    await oczekujBledu();
  });
});

// M1-audytor-generalny-141 (08-programista-519, DEC-31 a, ADR-0012; także 04-studio-projektowe-530, HIG Gestures): gest wstecz na ekranie wzoru
// robi to samo co przycisk „Back”. Usunięcie ekranu z zewnątrz (przesunięcie od krawędzi; `usePreventRemove` jak `useOdrzucZmiany`, opcja a)
// najpierw zapisuje kreski na żądanie (`zapiszRysunki`): 0 stron w pamięci → ekran znika bez pytania, > 0 → pytanie `wzor.wyjdz_*`.
// Nowa notatka z tekstem → „Discard changes?” jak przy „Back”. Po decyzji („Leave unsaved”) drugiego pytania nie ma.
// Trasa „/wzor” na prawdziwej bazie; widok strony to atrapa modułu natywnego, gest = zastępnik `expo-router/react-navigation` (`usunEkran()`).
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { nawigacja, usunEkran, wyczyscNawigacje } from '../narzedzia/expo-router-react-navigation';
import { preferencje } from '../../src/kompozycja/preferencje';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
    useRouter: () => mockRouter, useLocalSearchParams: () => ({}), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]),
    Stack: Object.assign(() => null, { Screen: () => null }),
  };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
const mockReact = React;
const mockRn = { View };
const mockProps: { p: Record<string, unknown> | null } = { p: null };
const mockZapis = { f: jest.fn<Promise<unknown>, []>(async () => 0) }; // funkcja widoku `zapiszRysunki`: liczba stron wciąż tylko w pamięci
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: (p: Record<string, unknown>) => {
  mockProps.p = p;
  mockReact.useImperativeHandle(p.ref as React.Ref<unknown>, () => ({ zapiszRysunki: () => mockZapis.f() }), []);
  return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' });
} }));
jest.mock('../../src/przypadki-uzycia/wzor-widok', () => ({ ...jest.requireActual('../../src/przypadki-uzycia/wzor-widok'), odzyskajRysunki: async () => ({ ok: true, wartosc: 0 }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1 });
const GEST = { type: 'POP', payload: { count: 1 } };
let alert: jest.SpyInstance;

async function start() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK)]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = {
    kontener: {
      z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null, wklej: async () => null } },
    },
    licznik: k, preferencje: preferencje(),
  };
  render(<EkranWzoru />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  await waitFor(() => expect(mockProps.p).not.toBeNull());
}
/** Gest wstecz: `true` = usunięcie zatrzymane (callback `usePreventRemove`), `false` = ekran znika od razu. */
async function gest(): Promise<boolean> {
  let zatrzymane = false;
  await act(async () => { zatrzymane = usunEkran(GEST); await new Promise((r) => setTimeout(r, 20)); });
  return zatrzymane;
}
const dialog = () => alert.mock.calls.at(-1) as [string, string, AlertButton[]];
const nacisnij = async (nazwa: string) => act(async () => { dialog()[2].find((b) => b.text === nazwa)?.onPress?.(); await new Promise((r) => setTimeout(r, 20)); });

beforeEach(() => {
  wyczyscNawigacje(); mockProps.p = null; mockZapis.f.mockReset(); mockZapis.f.mockImplementation(async () => 0);
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
  mockRouter.back.mockImplementation(() => { usunEkran({ type: 'GO_BACK' }); }); // jak w aplikacji: router.back() przechodzi przez `beforeRemove`
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => alert.mockRestore());

test('gest przy 2 stronach kresek tylko w pamięci: usunięcie zatrzymane, zapis na żądanie, pytanie „Leave this pattern?”; „Leave unsaved” kończy gest', async () => {
  await start();
  mockZapis.f.mockImplementation(async () => 2);
  expect(await gest()).toBe(true);
  expect(mockZapis.f).toHaveBeenCalledTimes(1);
  expect(nawigacja.dispatch).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledTimes(1);
  expect(dialog()[0]).toBe('Leave this pattern?');
  expect(dialog()[2].map((b) => [b.text, b.style])).toEqual([['Stay', 'cancel'], ['Leave unsaved', 'destructive']]);
  await nacisnij('Leave unsaved');
  expect(nawigacja.dispatch).toHaveBeenCalledTimes(1);
  expect(nawigacja.dispatch).toHaveBeenCalledWith(GEST);
  expect(alert).toHaveBeenCalledTimes(1);
});
test('gest przy 0 stronach w pamięci: najpierw zapis na żądanie, potem ekran znika bez pytania', async () => {
  await start();
  const zatrzymane = await gest();
  expect(mockZapis.f).toHaveBeenCalledTimes(1);
  expect(alert).not.toHaveBeenCalled();
  expect(zatrzymane).toBe(true);
  expect(nawigacja.dispatch).toHaveBeenCalledWith(GEST);
});
test('„Back” (przycisk) przy 2 stronach: jedno pytanie; „Leave unsaved” wychodzi bez drugiego pytania z `beforeRemove`', async () => {
  await start();
  mockZapis.f.mockImplementation(async () => 2);
  await act(async () => { fireEvent.press(screen.getByTestId('nav-wstecz')); await new Promise((r) => setTimeout(r, 20)); });
  expect(alert).toHaveBeenCalledTimes(1);
  await nacisnij('Leave unsaved');
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
  expect(nawigacja.dispatch).toHaveBeenCalledTimes(1); // zatrzymane usunięcie z router.back() dokończone bez pytania
  expect(alert).toHaveBeenCalledTimes(1);
  expect(mockZapis.f).toHaveBeenCalledTimes(1);
});
test('gest przy nowej notatce z tekstem: „Discard changes?” jak przy „Back”; „Discard changes” → zapis kresek → wyjście', async () => {
  await start();
  fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
  fireEvent.changeText(screen.getByTestId('wzor-notatka-pole'), 'zmiana igieł');
  expect(await gest()).toBe(true);
  expect(alert).toHaveBeenCalledTimes(1);
  expect(dialog().slice(0, 2)).toEqual(['Discard changes?', 'Nothing will be added.']);
  expect(nawigacja.dispatch).not.toHaveBeenCalled();
  await nacisnij('Discard changes');
  expect(mockZapis.f).toHaveBeenCalledTimes(1);
  expect(nawigacja.dispatch).toHaveBeenCalledWith(GEST);
});

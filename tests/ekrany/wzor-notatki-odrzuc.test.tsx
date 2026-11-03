// M1-audytor-generalny-121 (04-studio-projektowe-518, opcja a; klasa M1-020, słownik interakcji „Discard changes?”, DEC-28 a): panele notatek na ekranie
// wzoru to własne widoki, nie trasy, więc `useOdrzucZmiany` ich nie obejmuje. Zmieniona treść + „Cancel” albo stuknięcie w tło pyta tymi samymi kluczami
// co arkusze (`wspolne.odrzuc_*`; edycja — `odrzuc_opis_zmiany`, nowa notatka — `odrzuc_opis_nowy`); bez zmian panel zamyka się od razu.
// Trasa „/wzor” (app/wzor.tsx) na prawdziwej bazie; widok strony PDF to atrapa modułu natywnego (jak wzor-trasa-notatki.test.tsx).
import React from 'react';
import { Alert, View, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, notatkaRzedu, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
type PropsWidoku = { notatki?: { id: string; strona: number; y: number; wysokosc: number; etykieta: string; a11y: string }[]; onNotatka?: (e: { nativeEvent: { id: string } }) => void };
let mockWidok: PropsWidoku = {};
let mockZ: Parameters<typeof widokWzoru>[0];
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
// Licznik 45 (rząd w robocie 46), znacznik na rzędzie 6 schematu, strona 1 (druga), y 0,4, w górę (BR-WZR-003 S5).
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1 });

async function start(dodatkowe: ReturnType<typeof notatkaRzedu>[] = []) {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK),
    notatkaRzedu('n1', 'l1', 46, 'ujmowanie co 4 rzędy'), ...dodatkowe]);
  await k.otworz('l1');
  mockZ = s.z;
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  return { s, k };
}
const PANEL = 'Note for row 6';
const dialog = (spy: jest.SpyInstance) => spy.mock.calls.at(-1) as [string, string, AlertButton[]];
const nacisnij = (spy: jest.SpyInstance, nazwa: string) => act(() => { dialog(spy)[2].find((b) => b.text === nazwa)?.onPress?.(); });
/** Tło arkusza notatki: Pressable na całą powierzchnię pod arkuszem (ukryty przed VoiceOver, więc bez nazwy). */
const tlo = () => screen.UNSAFE_root.findAll((n) => typeof n.props.onPress === 'function' && n.props.accessibilityElementsHidden === true && n.props.importantForAccessibility === 'no-hide-descendants')[0];
let alert: jest.SpyInstance;
beforeEach(() => { alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => alert.mockRestore());

async function otworzNotatke() {
  await start();
  render(<EkranWzoru />);
  await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
  act(() => mockWidok.onNotatka?.({ nativeEvent: { id: '46' } }));
  expect(await screen.findByText(PANEL)).toBeTruthy();
}
async function edytuj(tekst: string) {
  await otworzNotatke();
  fireEvent.press(screen.getByText('Edit'));
  fireEvent.changeText(screen.getByTestId('wzor-notatka-edycja'), tekst);
}
function pytanie(opis: string) {
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, tresc, przyciski] = dialog(alert);
  expect([tytul, tresc]).toEqual(['Discard changes?', opis]);
  expect(przyciski.map((b) => [b.text, b.style])).toEqual([['Back to editing', 'cancel'], ['Discard changes', 'destructive']]);
}

describe('arkusz notatki: edycja', () => {
  test('zmiana + Cancel → pytanie „Discard changes?”; „Back to editing” zostawia wpisany tekst', async () => {
    await edytuj('ujmowanie co 6 rzędów');
    fireEvent.press(screen.getByText('Cancel'));
    pytanie('Everything stays as it was.');
    nacisnij(alert, 'Back to editing');
    expect(screen.getByTestId('wzor-notatka-edycja').props.value).toBe('ujmowanie co 6 rzędów');
  });
  test('zmiana + Cancel → „Discard changes” wraca do treści zapisanej, bez zapisu', async () => {
    await edytuj('ujmowanie co 6 rzędów');
    fireEvent.press(screen.getByText('Cancel'));
    nacisnij(alert, 'Discard changes');
    expect(screen.queryByTestId('wzor-notatka-edycja')).toBeNull();
    expect(screen.getByText('ujmowanie co 4 rzędy')).toBeTruthy();
    expect(mockWidok.notatki?.[0]?.etykieta).toBe('Row 6: ujmowanie co 4 rzędy');
  });
  test('zmiana + stuknięcie w tło → pytanie; panel zostaje, dopóki osoba nie wybierze „Discard changes”', async () => {
    await edytuj('ujmowanie co 6 rzędów');
    fireEvent.press(tlo());
    pytanie('Everything stays as it was.');
    expect(screen.getByText(PANEL)).toBeTruthy();
    nacisnij(alert, 'Discard changes');
    expect(screen.queryByText(PANEL)).toBeNull();
  });
  test('Edit bez zmiany: Cancel wraca od razu, tło zamyka od razu — bez pytania', async () => {
    await otworzNotatke();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByTestId('wzor-notatka-edycja')).toBeNull();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.press(tlo());
    expect(screen.queryByText(PANEL)).toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });
});

describe('nowa notatka (znacznik na stronie: „Add note” otwiera pole od razu)', () => {
  async function nowa() {
    await start();
    render(<EkranWzoru />);
    await waitFor(() => expect(mockWidok.notatki).toHaveLength(1));
    fireEvent.press(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByTestId('wzor-notatka-pole')).toBeTruthy();
  }
  test('wpisany tekst + Cancel → pytanie „Nothing will be added.”; „Back to editing” zostawia tekst, „Discard changes” zamyka bez zapisu', async () => {
    await nowa();
    fireEvent.changeText(screen.getByTestId('wzor-notatka-pole'), 'zmiana igieł');
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    pytanie('Nothing will be added.');
    nacisnij(alert, 'Back to editing');
    expect(screen.getByTestId('wzor-notatka-pole').props.value).toBe('zmiana igieł');
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    nacisnij(alert, 'Discard changes');
    expect(screen.queryByTestId('wzor-notatka-pole')).toBeNull();
    expect(mockWidok.notatki).toHaveLength(1);
  });
  test('wpisany tekst + „Back” na wzorze → pytanie „Nothing will be added.”; wyjście dopiero po „Discard changes”', async () => {
    await nowa();
    fireEvent.changeText(screen.getByTestId('wzor-notatka-pole'), 'zmiana igieł');
    mockRouter.back.mockClear();
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    pytanie('Nothing will be added.');
    expect(mockRouter.back).not.toHaveBeenCalled();
    nacisnij(alert, 'Discard changes');
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
  test('puste pole + Cancel → zamknięcie od razu, bez pytania', async () => {
    await nowa();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('wzor-notatka-pole')).toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });
});

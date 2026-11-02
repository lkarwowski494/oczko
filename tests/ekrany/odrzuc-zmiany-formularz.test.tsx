// M1-audytor-generalny-020 (źródło 04-studio-projektowe-004, P1; DEC-28 a): arkusz formularza (`presentation: 'modal'`) zamknięty „Cancel”
// albo przesunięciem w dół gubił wpisany tekst bez pytania. Design-spec, aneks M2 p2 „Discard changes?”: gdy coś zmieniono — pytanie
// `wspolne.odrzuc_tytul` z opisem skutku (`odrzuc_opis_zmiany` dla istniejącej rzeczy, `odrzuc_opis_nowy` dla nowej) i przyciskami
// „Back to editing” (`cancel`) / „Discard changes” (`destructive`); bez zmian — zamknięcie od razu. Wzorzec Treningu `confirmDiscard`.
// Trasa `app/formularz/[rodzaj]` na prawdziwej bazie i prawdziwym t() en; atrapa routera, gest = zastępnik `expo-router/react-navigation`
// (`usunEkran()` jak native stack: przy `usePreventRemove(true)` usunięcie zatrzymane, woła callback).
import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { czesc, licznik, projekt, przypomnienie, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { nawigacja, usunEkran, wyczyscNawigacje } from '../narzedzia/expo-router-react-navigation';
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
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const TYTUL = 'Discard changes?';
const OPIS_ZMIANY = 'Everything stays as it was.';
const OPIS_NOWY = 'Nothing will be added.';

let alert: jest.SpyInstance;
async function otworz(params: Record<string, string>) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter', undefined, { notatka: 'Merino 4 mm' }), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), przypomnienie('pr1', 'l1'), wloczka('y1', 'Merino')]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  mockParams = params;
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  return { s };
}
beforeEach(() => {
  wyczyscNawigacje();
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

/** Przyciski ostatniego pytania: [„Back to editing”, „Discard changes”]. */
function pytanie(): { tytul: string; opis: string | undefined; przyciski: AlertButton[] } {
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, opis, przyciski] = alert.mock.calls[0] as [string, string | undefined, AlertButton[]];
  return { tytul, opis, przyciski };
}
function oczekujPytania(opis: string): AlertButton[] {
  const p = pytanie();
  expect(p.tytul).toBe(TYTUL);
  expect(p.opis).toBe(opis);
  expect(p.przyciski.map((b) => [b.text, b.style])).toEqual([['Back to editing', 'cancel'], ['Discard changes', 'destructive']]);
  return p.przyciski;
}
const anuluj = () => fireEvent.press(screen.getByTestId('arkusz-zamknij'));

describe('M1-020: notatka (istniejąca rzecz) — „Discard changes?” po zmianie', () => {
  test('wpisany tekst → Cancel: pytanie „Discard changes?” / „Everything stays as it was.”, arkusz zostaje', async () => {
    await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm, 2 skeins left');
    anuluj();
    oczekujPytania(OPIS_ZMIANY);
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
  test('„Back to editing” zostawia arkusz z wpisanym tekstem; „Discard changes” zamyka bez zapisu', async () => {
    const { s } = await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm, 2 skeins left');
    anuluj();
    const [wroc, odrzuc] = oczekujPytania(OPIS_ZMIANY);
    act(() => wroc.onPress?.());
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(screen.getByTestId('formularz-notatka').props.value).toBe('Merino 4 mm, 2 skeins left');
    act(() => odrzuc.onPress?.());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    const [r] = await s.baza.all<{ notatka: string }>("SELECT notatka FROM projekt WHERE id = 'p1'");
    expect(r?.notatka).toBe('Merino 4 mm');
  });
  test('przesunięcie arkusza w dół po zmianie: usunięcie zatrzymane, to samo pytanie; „Discard changes” kończy gest', async () => {
    await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm, 2 skeins left');
    const gest = { type: 'POP', payload: { count: 1 } };
    let zatrzymane = false;
    act(() => { zatrzymane = usunEkran(gest); });
    expect(zatrzymane).toBe(true);
    const [, odrzuc] = oczekujPytania(OPIS_ZMIANY);
    expect(nawigacja.dispatch).not.toHaveBeenCalled();
    act(() => odrzuc.onPress?.());
    expect(nawigacja.dispatch).toHaveBeenCalledWith(gest);
  });
  test('[kontrola] bez zmian: Cancel i przesunięcie w dół zamykają od razu, bez pytania', async () => {
    await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    anuluj();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(usunEkran()).toBe(false);
    expect(alert).not.toHaveBeenCalled();
  });
  test('[kontrola] tekst wrócił do zapisanego: zamknięcie bez pytania', async () => {
    await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm!');
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm');
    anuluj();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
  });
  test('[kontrola] po udanym zapisie: wyjście bez pytania (także gdy `router.back()` przechodzi przez blokadę usunięcia)', async () => {
    const { s } = await otworz({ rodzaj: 'notatka', projekt: 'p1' });
    mockRouter.back.mockImplementation(() => { usunEkran({ type: 'GO_BACK' }); });
    fireEvent.changeText(screen.getByTestId('formularz-notatka'), 'Merino 4 mm, 2 skeins left');
    await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 50)); });
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
    const [r] = await s.baza.all<{ notatka: string }>("SELECT notatka FROM projekt WHERE id = 'p1'");
    expect(r?.notatka).toBe('Merino 4 mm, 2 skeins left');
    mockRouter.back.mockReset();
  });
});

describe('M1-020: nowe przypomnienie — „Nothing will be added.”', () => {
  test('wpisana instrukcja → Cancel: pytanie z opisem nowej rzeczy; „Discard changes” zamyka', async () => {
    await otworz({ rodzaj: 'przypomnienie' });
    fireEvent.changeText(screen.getByTestId('przypomnienie-co-robic'), 'decrease at both ends');
    anuluj();
    const [, odrzuc] = oczekujPytania(OPIS_NOWY);
    expect(mockRouter.back).not.toHaveBeenCalled();
    act(() => odrzuc.onPress?.());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
  test('przesunięcie w dół po wpisaniu: pytanie z opisem nowej rzeczy', async () => {
    await otworz({ rodzaj: 'przypomnienie' });
    fireEvent.changeText(screen.getByTestId('przypomnienie-od-rzedu'), '12');
    let zatrzymane = false;
    act(() => { zatrzymane = usunEkran(); });
    expect(zatrzymane).toBe(true);
    oczekujPytania(OPIS_NOWY);
  });
  test('[kontrola] puste pola: Cancel zamyka bez pytania', async () => {
    await otworz({ rodzaj: 'przypomnienie' });
    anuluj();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
  });
});

describe('M1-020: pozostałe arkusze trasy `formularz/[rodzaj]` — zmiana → Cancel pyta, z opisem według rodzaju', () => {
  const zmien = (testID: string, tekst: string) => () => fireEvent.changeText(screen.getByTestId(testID), tekst);
  const stuknij = (testID: string) => () => fireEvent.press(screen.getByTestId(testID));
  const PRZYPADKI: [string, Record<string, string>, () => void, string][] = [
    ['nazwa', { rodzaj: 'nazwa' }, zmien('formularz-nazwa-projektu', 'Kardigan'), OPIS_ZMIANY],
    ['cel', { rodzaj: 'cel' }, () => fireEvent.changeText(screen.getByLabelText('Rows in this part'), '120'), OPIS_ZMIANY],
    ['wpisz', { rodzaj: 'wpisz' }, zmien('wpisz-wartosc-pole', '12'), OPIS_ZMIANY],
    ['powtorzenie', { rodzaj: 'powtorzenie' }, zmien('powtorzenie-dlugosc-pole', '4'), OPIS_ZMIANY],
    ['znaczenie', { rodzaj: 'znaczenie' }, stuknij('wybor-znaczenie-w-trakcie'), OPIS_ZMIANY],
    ['przypomnienie-edycja', { rodzaj: 'przypomnienie-edycja', przypomnienie: 'pr1' }, zmien('przypomnienie-co-robic', 'decrease'), OPIS_ZMIANY],
    ['narzedzie', { rodzaj: 'narzedzie', projekt: 'p1' }, zmien('formularz-rozmiar-mm', '4.5'), OPIS_ZMIANY],
    ['termin', { rodzaj: 'termin', projekt: 'p1' }, () => fireEvent(screen.getByTestId('formularz-termin-data'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2031, 0, 15, 12)), OPIS_ZMIANY],
    ['wloczki', { rodzaj: 'wloczki', projekt: 'p1' }, stuknij('wloczka-wybor-y1'), OPIS_ZMIANY],
    ['nowy-projekt', { rodzaj: 'nowy-projekt' }, zmien('formularz-nazwa-projektu', 'Kardigan'), OPIS_NOWY],
    ['czesc', { rodzaj: 'czesc', projekt: 'p1' }, zmien('formularz-nazwa-czesci', 'Rękaw'), OPIS_NOWY],
    ['licznik', { rodzaj: 'licznik', projekt: 'p1' }, zmien('formularz-nazwa-licznika', 'Warkocz'), OPIS_NOWY],
  ];
  test.each(PRZYPADKI)('%s: zmiana → Cancel pyta, bez zmian zamyka od razu', async (_n, params, zmiana, opis) => {
    await otworz(params);
    expect(usunEkran()).toBe(false); // bez zmian: arkusz zamyka się od razu
    act(() => zmiana());
    anuluj();
    oczekujPytania(opis);
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});

describe('M1-020: arkusze tras `wloczka`, `drut`, `sesja-korekta` — ten sam mechanizm', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
  /* eslint-enable @typescript-eslint/no-require-imports */
  const T_START = Date.UTC(2026, 9, 22, 8);
  async function otworzTrase(plik: string, params: Record<string, string>) {
    const { s, k, j } = await kompozycjaTestowa();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), wloczka('y1', 'Merino'),
      ["INSERT INTO narzedzie (id, rodzaj, rozmiar_mm, opis, zmieniono_ms) VALUES ('n1', 'druty', 4, '', ?)", [T_START]],
      ["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, strefa, dzien) VALUES ('s1', 'p1', 'zakonczona', ?, ?, 'Europe/Warsaw', ?)", [T_START, T_START + 3_600_000, new Date(T_START).toISOString().slice(0, 10)]]]);
    await k.otworz('l1');
    mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: preferencje() };
    mockParams = params;
    const Ekran = trasa(plik);
    render(<Ekran />);
    await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  }
  const zmienPole = (testID: string, tekst: string) => () => fireEvent.changeText(screen.getByTestId(testID), tekst);
  const PRZYPADKI: [string, string, Record<string, string>, () => void, string][] = [
    ['wloczka (edycja)', '../../app/wloczka', { id: 'y1' }, zmienPole('zapas-nazwa', 'Merino DK'), OPIS_ZMIANY],
    ['wloczka (nowa)', '../../app/wloczka', {}, zmienPole('zapas-nazwa', 'Alpaka'), OPIS_NOWY],
    ['drut (edycja)', '../../app/drut', { id: 'n1' }, zmienPole('formularz-rozmiar-mm', '4.5'), OPIS_ZMIANY],
    ['drut (nowy)', '../../app/drut', {}, zmienPole('formularz-rozmiar-mm', '3'), OPIS_NOWY],
    ['sesja-korekta', '../../app/sesja-korekta', { sesja: 's1', projekt: 'p1' }, () => {
      fireEvent.press(screen.getByTestId('formularz-sesja-start'));
      fireEvent(screen.getByTestId('formularz-sesja-start-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(T_START - 1_800_000));
    }, OPIS_ZMIANY],
  ];
  test.each(PRZYPADKI)('%s: bez zmian zamyka od razu; zmiana → Cancel i przesunięcie w dół pytają', async (_n, plik, params, zmiana, opis) => {
    await otworzTrase(plik, params);
    expect(usunEkran()).toBe(false);
    zmiana(); // fireEvent sam owija w act (korekta sesji: najpierw otwarcie koła, potem wybór)
    anuluj();
    oczekujPytania(opis);
    expect(mockRouter.back).not.toHaveBeenCalled();
    alert.mockClear();
    let zatrzymane = false;
    act(() => { zatrzymane = usunEkran(); });
    expect(zatrzymane).toBe(true);
    oczekujPytania(opis);
  });
});

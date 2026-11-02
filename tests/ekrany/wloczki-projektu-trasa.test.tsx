// 07-jakosc-001 (F-37, BR-ZAP-002; P-330 1B): wybór włóczek projektu — arkusz z trasy „/formularz/wloczki” (app/formularz/[rodzaj].tsx) na prawdziwej bazie,
// wiersz „Yarn” w Details ekranu projektu i jego wartość. Testy idą przez trasę i model odczytu, nie przez komponent z podanymi propsami (07-jakosc-032).
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { stanProjektu } from '../../src/kompozycja/projekt';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, projekt, projektWloczka, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: { back: jest.Mock; push: jest.Mock; replace: jest.Mock; dismissTo: jest.Mock } } = { router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mock.router, useLocalSearchParams: () => ({ rodzaj: 'wloczki', projekt: 'p1' }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { widok: async () => null, biezacy: () => null, poZmianie: async () => undefined, otworz: async () => undefined } }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
beforeEach(() => { Object.values(mock.router).forEach((f) => f.mockClear()); });
const baza = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5), wloczka('y1', 'Merino', 3), wloczka('y2', 'Alpaka', 1)];

test('arkusz wyboru: lista zapasu z polami wyboru, zaznaczenie i Save zapisują zbiór projekt_wloczka; odznaczona znika', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [...baza, projektWloczka('p1', 'y2')]);
  mock.kontener = { z: s.z, j };
  render(<EkranFormularza />);
  const merino = await screen.findByLabelText('Merino, 3 skeins in your stash');
  expect(screen.getByLabelText('Alpaka, 1 skein in your stash').props.accessibilityState).toMatchObject({ checked: true }); // już przypisana
  expect(merino.props.accessibilityState).toMatchObject({ checked: false });
  fireEvent.press(merino);
  expect(screen.getByLabelText('Merino, 3 skeins in your stash').props.accessibilityState).toMatchObject({ checked: true });
  fireEvent.press(screen.getByLabelText('Alpaka, 1 skein in your stash')); // odznaczenie
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(mock.router.back).toHaveBeenCalled());
  expect((await s.baza.all<{ wloczka_id: string }>('SELECT wloczka_id FROM projekt_wloczka WHERE projekt_id = ?', ['p1'])).map((x) => x.wloczka_id)).toEqual(['y1']);
});

test('pusty zapas: tekst „No yarn in your stash yet…” i odnośnik „Add yarn” do /wloczka', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, baza.slice(0, 3));
  mock.kontener = { z: s.z, j };
  render(<EkranFormularza />);
  expect(await screen.findByText('No yarn in your stash yet. Add the yarn you’re using first, then choose it here.')).toBeTruthy();
  fireEvent.press(screen.getByText('Add yarn'));
  expect(mock.router.push).toHaveBeenCalledWith('/wloczka');
});

describe('wiersz „Yarn” w Details ekranu projektu', () => {
  const pokaz = async (s: Awaited<ReturnType<typeof przygotuj>>, naWloczka = jest.fn()) => {
    const w = await widokProjektu(s.z, { projektId: 'p1' });
    if (!w.ok) throw new Error(w.powod);
    render(<Projekt stan={stanProjektu(w.wartosc, { j, terazMs: T0, strefa: 'Europe/Warsaw' })} t={j.t} naOtworzCzesc={jest.fn()} naWloczka={naWloczka} />);
    return naWloczka;
  };
  test('brak włóczki → „None”, stuknięcie otwiera wybór', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, baza);
    const nawl = await pokaz(s);
    expect(screen.getByText('Yarn')).toBeTruthy();
    expect(within(screen.getByTestId('projekt-wloczka')).getByText('None')).toBeTruthy();
    fireEvent.press(screen.getByTestId('projekt-wloczka'));
    expect(nawl).toHaveBeenCalledTimes(1);
  });
  test('jedna włóczka → jej nazwa', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...baza, projektWloczka('p1', 'y1')]);
    await pokaz(s);
    expect(within(screen.getByTestId('projekt-wloczka')).getByText('Merino')).toBeTruthy();
  });
  test('dwie włóczki → „2 yarns”', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...baza, projektWloczka('p1', 'y1'), projektWloczka('p1', 'y2')]);
    await pokaz(s);
    expect(within(screen.getByTestId('projekt-wloczka')).getByText('2 yarns')).toBeTruthy();
  });
});

test('po powrocie z „Add yarn” nowa włóczka jest od razu zaznaczona, a wcześniejszy wybór zostaje', () => {
  const { FormularzWloczekProjektu } = jest.requireActual('../../src/ekrany/FormularzeProjektu') as typeof import('../../src/ekrany/FormularzeProjektu');
  const wspolne = { t: j.t, poczatkowe: ['y1'], naZapisz: jest.fn(), naAnuluj: jest.fn(), naDodajWloczke: jest.fn() };
  const r = render(<FormularzWloczekProjektu {...wspolne} zapas={[{ id: 'y1', nazwa: 'Merino', motki: 3 }]} />);
  r.rerender(<FormularzWloczekProjektu {...wspolne} zapas={[{ id: 'y1', nazwa: 'Merino', motki: 3 }, { id: 'y2', nazwa: 'Nowa', motki: 0 }]} />);
  expect(screen.getByLabelText('Nowa, 0 skeins in your stash').props.accessibilityState).toMatchObject({ checked: true });
  expect(screen.getByLabelText('Merino, 3 skeins in your stash').props.accessibilityState).toMatchObject({ checked: true });
});

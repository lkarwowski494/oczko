// 07-jakosc-001 (F-37, BR-ZAP-002; P-330 1B): karta ukończenia przez trasę „/ukonczenie” (app/ukonczenie.tsx) na prawdziwej bazie — cicha linia „Choose yarn”,
// gdy projekt nie ma włóczki, a zapas nie jest pusty; „Edit stash” otwiera arkusz włóczki; „Done” z wpisanym zużyciem zmniejsza zapas.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt, projektWloczka, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: { push: jest.Mock; dismissTo: jest.Mock; back: jest.Mock } } = { router: { push: jest.fn(), dismissTo: jest.fn(), back: jest.fn() } };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ projekt: 'p1' }), useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener }) }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), portOceny: {}, systemAplikacji: {} }));
jest.mock('../../src/przypadki-uzycia/ocena', () => ({ prosbaPoUkonczeniu: jest.fn(async () => undefined) }));
jest.mock('../../src/ekrany/ObrazKarty', () => ({ ObrazKarty: () => null }));
jest.mock('../../src/platforma/zrzut', () => ({ zrzutKarty: jest.fn() }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUkonczenia = (require('../../app/ukonczenie') as { default: React.ComponentType }).default;

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
beforeEach(() => { Object.values(mock.router).forEach((f) => f.mockClear()); });
const baza = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)];
async function otworz(instrukcje: Parameters<typeof wykonaj>[1]) {
  const s = await przygotuj();
  await wykonaj(s.baza, [...baza, ...instrukcje]);
  s.zegar.ustaw(T0 + 3_600_000);
  mock.kontener = { z: s.z, j };
  render(<EkranUkonczenia />);
  await waitFor(() => expect(screen.getByTestId('ukonczenie-karta')).toBeTruthy());
  return s;
}

describe('opcja B: cicha linia „Choose yarn”', () => {
  test('bez włóczki w projekcie i z niepustym zapasem → linia i odnośnik; stuknięcie otwiera wybór włóczek tego projektu', async () => {
    await otworz([wloczka('y1', 'Merino', 3)]);
    expect(screen.getByText('No yarn is chosen for this project, so your stash stays as it is.')).toBeTruthy();
    expect(screen.queryByText('Yarn used')).toBeNull();
    fireEvent.press(screen.getByTestId('ukonczenie-wybierz-wloczke'));
    expect(mock.router.push).toHaveBeenCalledWith({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wloczki', projekt: 'p1' } });
  });
  test('pusty zapas → ani linii, ani odnośnika (nie ma z czego wybierać)', async () => {
    await otworz([]);
    expect(screen.queryByTestId('ukonczenie-wybierz-wloczke')).toBeNull();
    expect(screen.queryByText(/No yarn is chosen/)).toBeNull();
  });
  test('włóczka przypisana → grupa „Yarn used”, bez linii „Choose yarn”', async () => {
    await otworz([wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1')]);
    expect(screen.getByText('Yarn used')).toBeTruthy();
    expect(screen.queryByTestId('ukonczenie-wybierz-wloczke')).toBeNull();
  });
});

describe('„Edit stash” i zapis zużycia', () => {
  test('zużycie ponad zapas → „Edit stash” otwiera arkusz włóczki tej włóczki (/wloczka?id=…)', async () => {
    await otworz([wloczka('y1', 'Merino', 1), projektWloczka('p1', 'y1')]);
    const pole = screen.getByTestId('ukonczenie-zuzycie-y1');
    fireEvent.changeText(pole, '3');
    fireEvent(pole, 'submitEditing');
    fireEvent.press(await screen.findByTestId('ukonczenie-edytuj-zapas-y1'));
    expect(mock.router.push).toHaveBeenCalledWith({ pathname: '/wloczka', params: { id: 'y1' } });
  });
  test('BR-ZAP-002 przez trasę: wpisane zużycie 2 z zapasu 3 → „Done” zapisuje i zapas wynosi 1', async () => {
    const s = await otworz([wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1')]);
    const pole = screen.getByTestId('ukonczenie-zuzycie-y1');
    fireEvent.changeText(pole, '2');
    fireEvent(pole, 'submitEditing');
    fireEvent.press(screen.getByTestId('ukonczenie-gotowe'));
    await waitFor(() => expect(mock.router.dismissTo).toHaveBeenCalledWith('/projekty'));
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki).toBe(1);
  });
});

// PU-287 (katalog przypadków użycia, „Projekt i części”): film w projekcie — „Video link options” → „Change link” → nowy adres → „Save”: wiersz „Video” otwiera nowy adres;
// „Remove link” → alert „Remove video link?” → po potwierdzeniu wraca „Add video link”. Trasa app/projekt/[id] na prawdziwej bazie.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { filmProjektu, usunFilm, ustawFilm } from '../../src/przypadki-uzycia/film';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; router: { push: jest.Mock; back: jest.Mock; replace: jest.Mock; navigate: jest.Mock; canGoBack: () => boolean }; otworzAdres: jest.Mock } =
  { router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true }, otworzAdres: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: { otworzAdres: (u: string) => mock.otworzAdres(u) } }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;


const STARY = 'https://video.example/old-seaming';
const NOWY = 'https://video.example/new-seaming';

test('PU-287: „Change link” zmienia adres wiersza „Video” (otwiera nowy); „Remove link” pyta „Remove video link?”, a po potwierdzeniu wraca „Add video link”', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  await ustawFilm(s.z, { projektId: 'p1', adres: STARY, nazwa: 'Seaming' });
  mock.kontener = { z: s.z, j: { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined,
      zapiszFilm: (projektId: string, f: { adres: string; nazwa: string }) => ustawFilm(s.z, { projektId, ...f }), usunFilm: (projektId: string) => usunFilm(s.z, { projektId }) }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await waitFor(() => screen.getByTestId('wzor-film-wiersz'));

  fireEvent.press(screen.getByTestId('wzor-film-menu'));
  fireEvent.press(screen.getByRole('menuitem', { name: 'Change link' }));
  const pole = await screen.findByTestId('wzor-film-pole');
  expect(pole.props.value).toBe(STARY); // arkusz wypełniony obecnym linkiem
  fireEvent.changeText(pole, NOWY);
  await act(async () => { fireEvent.press(screen.getByText('Save')); await new Promise((r) => setTimeout(r, 150)); });
  expect(await filmProjektu(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: { adres: NOWY } });
  fireEvent.press(await screen.findByRole('link', { name: 'Open video link in browser' }));
  expect(mock.otworzAdres).toHaveBeenCalledWith(NOWY);
  expect(mock.otworzAdres).not.toHaveBeenCalledWith(STARY);

  fireEvent.press(screen.getByTestId('wzor-film-menu'));
  fireEvent.press(screen.getByRole('menuitem', { name: 'Remove link' }));
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert.mock.calls[0]?.[0]).toBe('Remove video link?');
  expect(alert.mock.calls[0]?.[1]).toBe('The link and its name are removed from this project. The video itself isn’t affected.');
  expect(await filmProjektu(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: { adres: NOWY } }); // do potwierdzenia nic nie usunięte
  const usun = alert.mock.calls[0]?.[2]?.find((p) => p.style === 'destructive');
  await act(async () => { usun?.onPress?.(); await new Promise((r) => setTimeout(r, 150)); });
  await waitFor(() => expect(screen.getByTestId('wzor-dodaj-film')).toBeTruthy());
  expect(screen.queryByTestId('wzor-film-wiersz')).toBeNull();
  expect(await filmProjektu(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: null });
  alert.mockRestore();
});

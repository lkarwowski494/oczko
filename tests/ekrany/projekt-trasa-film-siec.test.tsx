// 07-jakosc-017 (F-55, K-17a, BR-WZR-007 S4): trasa „/projekt/[id]” — stuknięcie linku filmu zależy od stanu sieci z portu `Siec` (kontener.porty.siec),
// nie od argumentu E2E: „brak” → alert „No internet connection” i przeglądarka nie jest otwierana; „jest” i „nieznany” → adres się otwiera.
// Link zostaje zapisany w każdym przypadku. Zmiana stanu w trakcie ekranu (zdarzenie portu) działa bez ponownego wejścia na ekran.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Siec, StanSieci } from '../../src/domena/porty';
import { filmProjektu } from '../../src/przypadki-uzycia/film';
import { ustawFilm } from '../../src/przypadki-uzycia/film';
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

const ADRES = 'https://video.example/sleeve-cap';
function fakeSiec(poczatkowy: StanSieci) {
  let stan = poczatkowy;
  const sluchacze = new Set<(s: StanSieci) => void>();
  const siec: Siec = { stan: () => stan, obserwuj: (fn) => { sluchacze.add(fn); return () => { sluchacze.delete(fn); }; } };
  return { siec, ustaw: (s: StanSieci) => { stan = s; for (const f of sluchacze) f(s); }, sluchacze };
}
async function start(siec: Siec) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  await ustawFilm(s.z, { projektId: 'p1', adres: ADRES, nazwa: 'Sleeve cap seaming' });
  mock.kontener = { z: s.z, j: { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec },
    wzor: { k: { stan: () => ({ czekaSiec: [] }) }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await waitFor(() => screen.getByTestId('wzor-film-wiersz'));
  return s;
}
const otworzLink = () => fireEvent.press(screen.getByRole('link', { name: 'Open video link in browser' }));
beforeEach(() => { mock.otworzAdres.mockClear(); });

test('K-17a: stan „brak” z portu → alert „No internet connection”, adres się nie otwiera, link zostaje zapisany', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const s = await start(fakeSiec('brak').siec);
  otworzLink();
  expect(alert).toHaveBeenCalledWith('No internet connection', 'This video needs an internet connection. Oczko keeps only the link.', expect.anything());
  expect(mock.otworzAdres).not.toHaveBeenCalled();
  expect(await filmProjektu(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: { adres: ADRES } });
  alert.mockRestore();
});
test.each<StanSieci>(['jest', 'nieznany'])('K-17a: stan „%s” → adres filmu się otwiera, bez alertu', async (stan) => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await start(fakeSiec(stan).siec);
  otworzLink();
  expect(mock.otworzAdres).toHaveBeenCalledWith(ADRES);
  expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});
test('K-17a: zdarzenie portu w trakcie ekranu (jest → brak) zmienia zachowanie bez ponownego wejścia; po odpięciu ekranu nasłuch jest zwolniony', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const f = fakeSiec('jest');
  await start(f.siec);
  act(() => f.ustaw('brak'));
  otworzLink();
  expect(alert).toHaveBeenCalledWith('No internet connection', expect.any(String), expect.anything());
  expect(mock.otworzAdres).not.toHaveBeenCalled();
  act(() => f.ustaw('jest'));
  otworzLink();
  expect(mock.otworzAdres).toHaveBeenCalledWith(ADRES);
  screen.unmount();
  expect(f.sluchacze.size).toBe(0);
  alert.mockRestore();
});

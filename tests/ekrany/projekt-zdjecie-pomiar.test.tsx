// E2-137-A4 (scen. 17, informacyjny): dodanie zdjęcia z panelu E2E nie kończyło się w 20 s i nic nie było widać. Zmiana tylko z dowodem przyczyny, więc:
// (1) wyjątek w zapisie zdjęcia daje widoczny komunikat zamiast cichej odrzuconej obietnicy; (2) panel `e2e-pomiar-operacji` pokazuje czas przekodowania,
// dodania zdjęcia i wczytania projektu albo „running”, gdy operacja wisi (wtedy scenariusz 17 rozdzieli aplikację od maszyny liczbą).
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie ekranu (require niżej, po ustawieniu)
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mock: { kontener?: unknown; dodajZdjecie: jest.Mock; bezMetadanych: jest.Mock; router: Record<string, jest.Mock> } = {
  dodajZdjecie: jest.fn(), bezMetadanych: jest.fn(),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn() },
};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: { otworzAdres: jest.fn() } }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/obrazy-aplikacji', () => ({ zaleznosciObrazu: () => ({}) }));
jest.mock('../../src/kompozycja/e2e-zdjecie', () => ({ zdjecieTestowe: () => '/tmp/oczko-test-zdjecie.jpg' }));
jest.mock('../../src/kompozycja/zdjecie-bez-metadanych', () => ({ zdjecieBezMetadanych: (...a: unknown[]) => mock.bezMetadanych(...a) }));
jest.mock('../../src/dane/pliki/system', () => ({ ...jest.requireActual<object>('../../src/dane/pliki/system'), usunPlik: jest.fn() }));
jest.mock('../../src/przypadki-uzycia/zdjecia', () => ({ ...jest.requireActual<object>('../../src/przypadki-uzycia/zdjecia'), dodajZdjecie: (...a: unknown[]) => mock.dodajZdjecie(...a) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { zerujPomiarOperacji } = require('../../src/kompozycja/e2e/pomiar-operacji') as typeof import('../../src/kompozycja/e2e/pomiar-operacji');

let t: Awaited<ReturnType<typeof tEn>>;
async function start() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  t = await tEn();
  mock.kontener = { z: s.z, j: { t, jezyk: () => 'en-US', zegar24h: () => false } satisfies Jezyk, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } } };
  render(<EkranProjektu />);
  await waitFor(() => screen.getByTestId('zdjecia-dodaj'));
  return s;
}
const dodajZPanelu = () => { fireEvent.press(screen.getByTestId('zdjecia-dodaj')); fireEvent.press(screen.getByTestId('e2e-zdjecie-testowe')); };
const panel = () => screen.queryByTestId('e2e-pomiar-operacji')?.props.children as string | undefined;

beforeEach(() => {
  zerujPomiarOperacji();
  mock.bezMetadanych.mockReset().mockResolvedValue({ sciezka: '/tmp/czyste.jpg', rozszerzenie: 'jpg' });
  mock.dodajZdjecie.mockReset().mockResolvedValue({ ok: true, wartosc: undefined });
});

test('A4: wyjątek przy zapisie zdjęcia (kolejka bazy rzuca) → widoczny komunikat „nie zapisano”, nie cicha odrzucona obietnica', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mock.dodajZdjecie.mockRejectedValue(new Error('baza zajęta'));
  await start();
  dodajZPanelu();
  await waitFor(() => expect(alert).toHaveBeenCalledWith(t('licznik.blad_zapisu')));
  expect(panel()).toMatch(/^recode \d+ ms · photo \d+ ms \(error\)$/);
  alert.mockRestore();
});
test('A4: dodanie zdjęcia kończy się pomiarem „recode N ms · photo N ms · project N ms” w panelu', async () => {
  await start();
  dodajZPanelu();
  await waitFor(() => expect(panel()).toMatch(/^recode \d+ ms · photo \d+ ms · project \d+ ms$/));
});
test('A4: przekodowanie wisi → panel „recode running · photo running” (zawieszenie, nie wolna maszyna), bez alertu i bez zapisu', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mock.bezMetadanych.mockReturnValue(new Promise(() => undefined));
  await start();
  dodajZPanelu();
  await waitFor(() => expect(panel()).toBe('recode running · photo running'));
  expect(mock.dodajZdjecie).not.toHaveBeenCalled();
  expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});

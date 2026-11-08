// Partia 8c (07-jakosc-028, 027, 031 F-50): trasa „/projekty” (app/projekty.tsx) na prawdziwej bazie (node:sqlite) i prawdziwym t() en — nie komponent z podanymi propsami
// (07-jakosc-032). BR-PRJ-016/S2 (ostatnia część i licznik w miejscu pracy), BR-PRJ-006/S1 (data i czas pracy na liście ukończonych), design-spec „Lista projektów”.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt, sesja } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, GODZ, MIN, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mockAplikacja: { kontener?: unknown; licznik?: unknown } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;

async function otworz(instrukcje: Parameters<typeof wykonaj>[1], teraz = T0 + 60 * DOBA) {
  const s = await przygotuj();
  await wykonaj(s.baza, instrukcje);
  s.zegar.ustaw(teraz);
  const t = await tEn();
  const j: Jezyk = { t, jezyk: () => 'en-US', zegar24h: () => false };
  const otworzLicznik = jest.fn(async () => undefined);
  mockAplikacja.kontener = { z: s.z, j, wzor: { k: {} }, dostep: { stan: () => ({ poziom: 'darmowy' }) } }; // dostep: okno „Uczciwe zasady” na liście projektów (07-jakosc-022, partia 8b)
  mockAplikacja.licznik = { otworz: otworzLicznik };
  render(<EkranProjektow />);
  await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
  return { otworzLicznik };
}

describe('07-jakosc-028 · stuknięcie w projekt otwiera ostatnio używaną część (BR-PRJ-016/S2)', () => {
  test('dwie części; ostatnia zmiana w drugiej → otwiera się jej licznik, nie pierwszej', async () => {
    const { otworzLicznik } = await otworz([
      projekt('p1', 'Sweter'), czesc('c0', 'p1', 'Tył', 0), czesc('c1', 'p1', 'Przód', 1),
      ...licznik('l0', 'c0', 7, { kolejnosc: 0, t: T0 }), ...licznik('l1', 'c1', 3, { kolejnosc: 0, t: T0 + 5 * DOBA }),
    ]);
    fireEvent.press(screen.getByTestId('projekty-wiersz'));
    await waitFor(() => expect(otworzLicznik).toHaveBeenCalledWith('l1'));
  });
  test('bez żadnej zmiany licznika → pierwszy licznik pierwszej części (jak dotąd)', async () => {
    const { otworzLicznik } = await otworz([
      projekt('p1', 'Sweter'), czesc('c0', 'p1', 'Tył', 0), czesc('c1', 'p1', 'Przód', 1),
      ...licznik('l0', 'c0', 0, { kolejnosc: 0 }), ...licznik('l1', 'c1', 0, { kolejnosc: 0 }),
    ]);
    fireEvent.press(screen.getByTestId('projekty-wiersz'));
    await waitFor(() => expect(otworzLicznik).toHaveBeenCalledWith('l0'));
  });
});

describe('07-jakosc-031 F-50 · wiersz w toku: „{część} · row {n} of {cel}”', () => {
  test('z celem: „Left sleeve · row 3 of 96”; bez celu: „Left sleeve · row 3”', async () => {
    await otworz([
      projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Left sleeve', 1, { cel: 96 }), ...licznik('l1', 'c1', 3),
      projekt('p2', 'Szal', T0 - DOBA), czesc('c2', 'p2', 'Body', 1), ...licznik('l2', 'c2', 3, { t: T0 - DOBA }),
    ]);
    expect(screen.getByText('Left sleeve · row 3 of 96')).toBeTruthy();
    expect(screen.getByText('Body · row 3')).toBeTruthy();
    expect(screen.queryByText(/Now knitting row/)).toBeNull();
  });
});

describe('07-jakosc-027 · ukończone z datą i czasem pracy (BR-PRJ-006/S1)', () => {
  const UKONCZONO = T0 + 20 * DOBA; // 2026-11-11, ten sam rok co „teraz”
  test('ukończony z sesjami stopera → „Finished Nov 11 · 1 h 30 min”; etykieta VoiceOver z nazwą', async () => {
    const zamknij = (id: string, ms: number): [string, unknown[]] => ["UPDATE sesja SET stan = 'zakonczona', koniec_ms = start_ms + ? WHERE id = ?", [ms, id]];
    await otworz([
      projekt('p1', 'Sweter', T0, { stan: 'ukonczony', ukonczono: UKONCZONO }), czesc('c1', 'p1', 'Przód', 1), ...licznik('l1', 'c1', 5),
      sesja('s1', 'p1', T0 + GODZ), zamknij('s1', GODZ), sesja('s2', 'p1', T0 + 3 * GODZ), zamknij('s2', 30 * MIN),
    ]);
    expect(screen.getByText('Finished Nov 11 · 1 h 30 min')).toBeTruthy();
    expect(screen.getByLabelText('Sweter, finished Nov 11, 1 h 30 min')).toBeTruthy();
  });
  test('bez stopera → „Finished Nov 11”, nigdy „0 min”; inny rok → z rokiem', async () => {
    await otworz([
      projekt('p1', 'Sweter', T0, { stan: 'ukonczony', ukonczono: UKONCZONO }), czesc('c1', 'p1', 'Przód', 1), ...licznik('l1', 'c1', 5),
      projekt('p2', 'Szal', T0 - 400 * DOBA, { stan: 'ukonczony', ukonczono: T0 - 300 * DOBA }), czesc('c2', 'p2', 'Body', 1), ...licznik('l2', 'c2', 2, { t: T0 - 400 * DOBA }),
    ]);
    expect(screen.getByText('Finished Nov 11')).toBeTruthy();
    expect(screen.getByText('Finished Dec 26, 2025')).toBeTruthy();
    expect(screen.queryByText(/0 min/)).toBeNull();
    expect(screen.getByLabelText('Szal, finished Dec 26, 2025')).toBeTruthy();
  });
});

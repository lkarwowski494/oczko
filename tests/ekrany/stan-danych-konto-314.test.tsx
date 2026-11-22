// PU-314 (katalog przypadków użycia, „Dane i ustawienia”): po zmianie konta iCloud „Data and sync” pokazuje alert „A different iCloud account” z wyborem
// „Sync with this account” / „Don’t sync”; wybór woła sterownik. Logikę stanów (konto_zmienione → aktywna / wylaczona, dane lokalne bez zmian) sprawdza
// tests/dane/icloud-dwa-urzadzenia.test.ts („zmiana konta zatrzymuje wysyłkę…”) i tests/domena/maszyny/synchronizacja-konto.test.ts.
import React from 'react';
import { Alert } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import type { WidokSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranStanuDanych = (require('../../app/stan-danych') as { default: React.ComponentType }).default;

async function start() {
  const t = await tEn();
  const s = await przygotuj();
  const sterownik = {
    widok: (): WidokSynchronizacji => ({ stan: 'konto_zmienione', przyczyna: null, status: null }), obserwuj: () => () => undefined,
    polacz: jest.fn(async () => undefined), nieSynchronizuj: jest.fn(async () => undefined),
  };
  mockAplikacja = {
    kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true }, icloud: { sterownik, widoczny: true, e2e: null, naPartie: () => () => undefined } },
    licznik: { otworz: jest.fn() }, preferencje: {},
  };
  return { sterownik, t };
}

test('PU-314: konto zmienione → alert „A different iCloud account” z dwoma przyciskami; „Don’t sync” i „Sync with this account” wołają sterownik', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { sterownik, t } = await start();
  render(<EkranStanuDanych />);
  await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); // odczyty stanu bazy kończą się przed asercjami
  const [tytul, opis, przyciski] = alert.mock.calls[0]!;
  expect(tytul).toBe('A different iCloud account');
  expect(opis).toBe(t('icloud.konto_zmienione_opis'));
  expect(przyciski?.map((p) => p.text)).toEqual(['Don’t sync', 'Sync with this account']);
  await act(async () => { przyciski?.[0]?.onPress?.(); });
  expect(sterownik.nieSynchronizuj).toHaveBeenCalledTimes(1);
  expect(sterownik.polacz).not.toHaveBeenCalled();
  await act(async () => { przyciski?.[1]?.onPress?.(); });
  expect(sterownik.polacz).toHaveBeenCalledTimes(1);
  alert.mockRestore();
});

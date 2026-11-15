// PU-312 („Dane i ustawienia”): wyłączenie synchronizacji iCloud z ekranu „Data and sync” — alert, stan „iCloud sync is off.”, dane bez zmian, +1 nic nie wysyła.
// Poziom: komponentowy, trasa „/stan-danych” na prawdziwej bazie z prawdziwym sterownikiem synchronizacji i sztucznym serwerem (jak tests/dane/icloud-dwa-urzadzenia.test.ts).
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { sterownikSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { serwerIcloud } from '../dane/pomocnicze/serwer-icloud';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranStanuDanych = (require('../../app/stan-danych') as { default: React.ComponentType }).default;

// PU-312: przełącznik na off → alert „Turn off iCloud sync?” z „Everything stays on this device…”; „Turn off” → „iCloud sync is off.”, licznik bez zmian, +1 nie dodaje wysyłek.
test('PU-312: wyłączenie iCloud → alert z opisem, stan „iCloud sync is off.”, dane bez zmian, +1 nie zwiększa liczby wysłanych rekordów', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const t = await tEn();
  const serwer = serwerIcloud();
  const s = await przygotuj();
  const u = serwer.urzadzenie();
  const st = sterownikSynchronizacji({ ...s.z, synchronizacja: u, magazyn: s.magazyn });
  await st.start();
  const l = await utworzSzybkiLicznik(s.z);
  if (!l.ok) throw new Error(l.powod);
  const id = l.wartosc.licznikId;
  await dodajRzad(s.z, { licznikId: id });
  expect((await st.wlacz()).stan).toBe('aktywna');
  const wartosc = async () => (await s.baza.all<{ wartosc: number }>('SELECT wartosc FROM licznik WHERE id = ?', [id]))[0]!.wartosc;
  mockAplikacja = {
    kontener: { z: s.z, j: { t, jezyk: () => 'en', zegar24h: () => true }, icloud: { sterownik: st, widoczny: true, e2e: null, naPartie: () => () => undefined } },
    licznik: { otworz: jest.fn() }, preferencje: {},
  };
  render(<EkranStanuDanych />);
  await waitFor(() => expect(screen.getByTestId('icloud-przelacznik').props.accessibilityState).toMatchObject({ checked: true }));
  expect(screen.getByText('iCloud sync is on.')).toBeTruthy();
  const przed = await wartosc();

  fireEvent(screen.getByTestId('icloud-przelacznik'), 'valueChange', false);
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, opis, przyciski] = alert.mock.calls[0]!;
  expect(tytul).toBe('Turn off iCloud sync?');
  expect(opis).toMatch(/^Everything stays on this device\./);
  await act(async () => { przyciski?.find((p) => p.text === 'Turn off')?.onPress?.(); });
  await waitFor(() => expect(screen.getByText('iCloud sync is off.')).toBeTruthy());
  expect(await wartosc()).toBe(przed);

  const wyslane = u.wyslano.length;
  await dodajRzad(s.z, { licznikId: id });
  await st.wyslijZaleglosci();
  expect(await wartosc()).toBe(przed + 1); // +1 działa
  expect(u.wyslano.length).toBe(wyslane); // ale nic nie wychodzi do iCloud
  alert.mockRestore();
});

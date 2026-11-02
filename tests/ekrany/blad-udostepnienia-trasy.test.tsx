// M1-audytor-generalny-120 (04-studio-projektowe-517; Aneks P2 poz. 5 wariant C — tytuł nazywa, co się nie udało): „Share” na karcie ukończenia
// i w podglądzie zdjęcia najpierw przygotowuje plik (zrzut karty, kopia zdjęcia bez metadanych). Gdy pliku nie ma, alert mówi o udostępnieniu
// (`wspolne.blad_udostepnienia*`), a nie „Couldn’t save your changes … Nothing was changed” (`formularz.blad_zapisu`), bo nic nie zapisywano.
// Trasy `/ukonczenie` i `/zdjecie` na prawdziwej bazie; podmienione tylko przygotowanie pliku i arkusz systemowy.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, zdjecie } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), dismissTo: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), portOceny: {}, systemAplikacji: {} }));
jest.mock('../../src/przypadki-uzycia/ocena', () => ({ prosbaPoUkonczeniu: jest.fn(async () => undefined) }));
jest.mock('../../src/ekrany/ObrazKarty', () => ({ ObrazKarty: () => null }));
jest.mock('../../src/platforma/zrzut', () => ({ zrzutKarty: jest.fn(async () => { throw new Error('brak miejsca'); }) }));
jest.mock('../../src/kompozycja/zdjecie-bez-metadanych', () => ({ zdjecieBezMetadanych: jest.fn(async () => null) }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn() }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranUkonczenia = (require('../../app/ukonczenie') as { default: React.ComponentType }).default;
const EkranZdjecia = (require('../../app/zdjecie') as { default: React.ComponentType }).default;
const { udostepnijPlik } = require('../../src/platforma/system-plikow-uzytkownika') as { udostepnijPlik: jest.Mock };
/* eslint-enable @typescript-eslint/no-require-imports */

const TYTUL = 'Couldn’t prepare the image';
const OPIS = 'Your device may be out of space. Free some space and try sharing again.';
let j: Jezyk;
let alert: jest.SpyInstance;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
beforeEach(() => { alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); udostepnijPlik.mockClear(); });
afterEach(() => alert.mockRestore());

async function baza(dodatkowe: (s: Awaited<ReturnType<typeof przygotuj>>) => [string, unknown[]][] = () => []) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5), ...dodatkowe(s)]);
  s.zegar.ustaw(T0 + 3_600_000);
  mockAplikacja = { kontener: { z: s.z, j }, licznik: {}, preferencje: {} };
  return s;
}
function oczekujAlertuUdostepnienia() {
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, opis] = alert.mock.calls[0] as [string, string];
  expect([tytul, opis]).toEqual([TYTUL, OPIS]);
  expect(tytul).not.toBe('Couldn’t save your changes');
  expect(opis).not.toMatch(/Nothing was changed/);
  expect(udostepnijPlik).not.toHaveBeenCalled();
}

test('/ukonczenie: zrzut karty się nie udał → alert udostępnienia, nie błąd zapisu formularza', async () => {
  await baza();
  mockParams = { projekt: 'p1' };
  render(<EkranUkonczenia />);
  await waitFor(() => expect(screen.getByTestId('ukonczenie-karta')).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('karta-udostepnij')); await new Promise((r) => setTimeout(r, 50)); });
  oczekujAlertuUdostepnienia();
});
test('/zdjecie: kopia bez metadanych nie powstała → alert udostępnienia, nie błąd zapisu formularza', async () => {
  await baza((s) => {
    const h = wlozPlik(s.magazyn, Buffer.from('jpg'), 'jpg');
    return [plik(h, 'jpg', 3), zdjecie('f1', 'p1', h)];
  });
  mockParams = { projekt: 'p1', i: '0' };
  render(<EkranZdjecia />);
  const przycisk = await screen.findByTestId('zdjecie-udostepnij');
  await act(async () => { fireEvent.press(przycisk); await new Promise((r) => setTimeout(r, 50)); });
  oczekujAlertuUdostepnienia();
});

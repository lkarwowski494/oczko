// M1-audytor-generalny-011 (12-niezawodnosc-001, ADR-0020 (4) „Brak miejsca: komunikat z systemu roli 04; niczego nie usuwamy”): przy pełnym dysku
// ekran awaryjny mówił „Oczko can’t read your data”, a „Save a copy of my data” kończyło się bez komunikatu. Teksty tylko z systemu (zasada 15):
// nagłówek `awaryjny.tytul_petla`, opis `wspolne.blad_zapisu_opis`, alert `alertBleduZapisu`.
import React from 'react';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Paths } from 'expo-file-system';
import { TrybAwaryjny } from '../../src/ekrany/TrybAwaryjny';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { kopiaAwaryjna } from '../../src/kompozycja/kopia-awaryjna';
import { licznosci, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { tEn, tekst } from './pomoc';

const mockA = { zapiszKopie: jest.fn(), zipSurowej: jest.fn(), kopia: Promise.resolve(), sha: jest.fn(), nieudaneStarty: 0, etapPoprzedniegoStartu: null, bledyZKopii: [] };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual('../../src/kompozycja/start-aplikacji'),
  trybAwaryjny: () => mockA,
  sprobujNormalnieTeraz: jest.fn(async () => undefined),
}));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(async () => undefined) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { EkranAwaryjny } = require('../../src/kompozycja/EkranAwaryjny') as typeof import('../../src/kompozycja/EkranAwaryjny');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { powodAwaryjny } = jest.requireActual('../../src/kompozycja/start-aplikacji') as typeof import('../../src/kompozycja/start-aplikacji');

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());
const dzialania = () => ({ naZapiszKopie: jest.fn(), naSprobujNormalnie: jest.fn(), naZglosProblem: jest.fn() });

test('M1-011: migracja z „brak_miejsca” → ekran z powodem brak miejsca, nie „Oczko can’t read your data”', () => {
  const powod = powodAwaryjny('brak_miejsca');
  expect(powod).toBe('brak_miejsca');
  render(<TrybAwaryjny stan={{ powod }} t={t} {...dzialania()} />);
  expect(tekst(screen.getByRole('header'))).not.toBe('Oczko can’t read your data');
  // M1-094 (DEC-26 a, design-spec „Aneks M2 partia 3a”): własny nagłówek i akapit zamiast `awaryjny.tytul_petla` + `wspolne.blad_zapisu_opis`.
  expect(tekst(screen.getByRole('header'))).toBe('Your device is out of space');
  expect(screen.getByText('Nothing was changed. Free some space on this device, then try starting normally.')).toBeTruthy();
  expect(powodAwaryjny('zapis')).toBe('uszkodzony'); // inne powody bez zmian
});

// Przegląd ścieżek wrażliwych (M2, 937b500): ADR-0020 (3) „`VACUUM INTO` zawodzi → ZIP surowej kopii”. Archiwum sprawdza miejsce na bazę i WSZYSTKIE
// pliki magazynu (src/dane/archiwum.ts), a ZIP surowej kopii to tylko `.db`/`-wal`/`-shm` — przy `brak_miejsca` w archiwum ZIP często się mieści.
// Wcześniejsza wersja tego testu wymagała `zipSurowej` niewywołanego, czyli utrwalała utratę drogi ratunkowej; alert dopiero, gdy ZIP też zawiedzie.
test('M1-011: „Save a copy” przy braku miejsca w archiwum → najpierw ZIP surowej kopii; ZIP też się nie zapisał → alert o miejscu', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockA.zipSurowej.mockClear();
  mockA.zapiszKopie.mockResolvedValue('brak_miejsca');
  mockA.zipSurowej.mockResolvedValue(null);
  render(<EkranAwaryjny powod="brak_miejsca" t={t} naNormalnie={jest.fn()} />);
  fireEvent.press(screen.getByRole('button', { name: /copy/i }));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(alert.mock.calls[0]?.[1]).toBe('Your device may be out of space. Nothing was changed. Free some space and try again.');
  expect(mockA.zipSurowej).toHaveBeenCalledTimes(1);
});

test('M1-011: „Save a copy” przy braku miejsca w archiwum, a ZIP surowej kopii się mieści → arkusz udostępniania z ZIP-em, bez alertu', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { udostepnijPlik } = require('../../src/platforma/system-plikow-uzytkownika') as { udostepnijPlik: jest.Mock };
  udostepnijPlik.mockClear();
  mockA.zapiszKopie.mockResolvedValue('brak_miejsca');
  mockA.zipSurowej.mockResolvedValue('/tmp/oczko-surowa.zip');
  render(<EkranAwaryjny powod="brak_miejsca" t={t} naNormalnie={jest.fn()} />);
  fireEvent.press(screen.getByRole('button', { name: /copy/i }));
  await waitFor(() => expect(udostepnijPlik).toHaveBeenCalledWith('/tmp/oczko-surowa.zip'));
  expect(alert).not.toHaveBeenCalled();
});

test('M1-011: „Save a copy” — baza się nie otwiera i ZIP surowej kopii się nie zapisał → alert, nie cisza', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockA.zapiszKopie.mockResolvedValue(null);
  mockA.zipSurowej.mockResolvedValue(null);
  render(<EkranAwaryjny powod="uszkodzony" t={t} naNormalnie={jest.fn()} />);
  fireEvent.press(screen.getByRole('button', { name: /copy/i }));
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(alert.mock.calls[0]?.[1]).toBe('Your device may be out of space. Nothing was changed. Free some space and try again.');
});

test('M1-011: kopia awaryjna przy pełnym dysku zwraca „brak_miejsca”, a baza zostaje bez zmian (liczności, SHA)', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const przed = await licznosci(s.baza);
  const sha = () => createHash('sha256').update(readFileSync(join(s.katalog, 'oczko.db'))).digest('hex');
  const shaPrzed = sha();
  jest.spyOn(Paths, 'availableDiskSpace', 'get').mockReturnValue(0);
  const k = kopiaAwaryjna({ sciezkaBazy: join(s.katalog, 'oczko.db'), pliki: s.magazyn.katalog, zegar: s.zegar, katalogi: s.z.katalogi });
  expect(await k.zapisz()).toBe('brak_miejsca');
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(sha()).toBe(shaPrzed);
});

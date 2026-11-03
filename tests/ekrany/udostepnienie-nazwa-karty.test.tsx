// M1-audytor-generalny-135 (04-studio-projektowe-525, SP-11 — słowa użytkownika): arkusz udostępniania karty ukończenia pokazuje nazwę
// pliku. `captureRef` na iOS zapisuje plik pod losową nazwą (GUID; opcja `fileName` działa tylko na Androidzie), więc plik dostaje nazwę
// projektu: „Harbor.png” (opcja a). Znaki niedozwolone w nazwie pliku są zastępowane; bez nowego tekstu interfejsu.
// Trasa `/ukonczenie` na prawdziwej bazie i prawdziwym dysku; podmienione tylko `captureRef` (plik GUID w katalogu tymczasowym) i arkusz systemowy.
import React from 'react';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { nazwaPlikuUdostepnienia } from '../../src/platforma/zrzut';
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
jest.mock('../../src/ekrany/ObrazKarty', () => ({ ObrazKarty: () => null, rozmiarZrzutu: () => ({ width: 360, height: 450 }) }));
const mockKatalog = { sciezka: '' };
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => {
    const p = `${mockKatalog.sciezka}/06168E56-3A09-4F33-AFC4-34A1B2C3D4E5.png`;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('node:fs') as typeof import('node:fs')).writeFileSync(p, Buffer.from('png'));
    return `file://${p}`;
  }),
}));
const udostepnione: { sciezka: string; istnial: boolean }[] = [];
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({
  udostepnijPlik: jest.fn(async (sciezka: string) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    udostepnione.push({ sciezka, istnial: (require('node:fs') as typeof import('node:fs')).existsSync(sciezka) });
  }),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUkonczenia = (require('../../app/ukonczenie') as { default: React.ComponentType }).default;

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
beforeEach(() => { mockKatalog.sciezka = mkdtempSync(`${tmpdir()}/karta-`); udostepnione.length = 0; });

async function udostepnijKarte(nazwa: string) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', nazwa), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0 + 3_600_000);
  mockAplikacja = { kontener: { z: s.z, j }, licznik: {}, preferencje: {} };
  mockParams = { projekt: 'p1' };
  render(<EkranUkonczenia />);
  await waitFor(() => expect(screen.getByTestId('ukonczenie-karta')).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('karta-udostepnij')); await new Promise((r) => setTimeout(r, 50)); });
  expect(udostepnione).toHaveLength(1);
  return udostepnione[0];
}

test('/ukonczenie: arkusz dostaje plik „<nazwa projektu>.png”, nie GUID; po arkuszu pliku nie ma', async () => {
  const u = await udostepnijKarte('Harbor');
  expect(u.sciezka.split('/').pop()).toBe('Harbor.png');
  expect(u.istnial).toBe(true);
  expect(existsSync(u.sciezka)).toBe(false); // plik tymczasowy usunięty po zamknięciu arkusza (jak dotąd)
});
test('/ukonczenie: znaki niedozwolone w nazwie pliku z nazwy projektu są zastępowane', async () => {
  const u = await udostepnijKarte('Sweter: wzór 1/2');
  expect(u.sciezka.split('/').pop()).toBe('Sweter- wzór 1-2.png');
});
test('nazwaPlikuUdostepnienia: znaki niedozwolone, kropka na początku, długość, pusta nazwa', () => {
  expect(nazwaPlikuUdostepnienia('Harbor')).toBe('Harbor');
  expect(nazwaPlikuUdostepnienia('  a\\b*c?d"e<f>g|h\u0000i  ')).toBe('a-b-c-d-e-f-g-h-i');
  expect(nazwaPlikuUdostepnienia('.ukryty')).toBe('ukryty');
  expect(nazwaPlikuUdostepnienia('x'.repeat(300))).toHaveLength(100);
  expect(nazwaPlikuUdostepnienia('///')).toBe('---');
  expect(nazwaPlikuUdostepnienia(' . ')).toBeNull();
});

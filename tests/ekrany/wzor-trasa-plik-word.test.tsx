// Trasa „/wzor” (app/wzor.tsx), „Choose file”: Word to wyłącznie .docx (07-jakosc-017, F-55, K-17h, ADR-0031 pkt 5) — wybrany .doc kończy alertem
// „can’t add this type of file” i nie trafia do konwersji; .docx i PDF idą jak dotąd. Wybieracz plików i widok natywny to atrapy na granicy platformy.
import React from 'react';
import { View } from 'react-native';
import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import type { Powod } from '../../src/domena/bledy';
import { UTI_WORD } from '../../src/domena/rodzaj-pliku';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { czasWTle, katalogTymczasowy, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({ dodaj: 'plik' }) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
const mockWybor = jest.fn();
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ wybierzPlikWzoru: () => mockWybor() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

async function start(plik: { nazwa: string; typ: string }, powod: Powod = 'bledne_dane') {
  const sciezka = join(katalogTymczasowy('oczko-wybor-'), plik.nazwa);
  writeFileSync(sciezka, Buffer.from('PK\u0003\u0004 word/document.xml'));
  mockWybor.mockResolvedValue({ ...plik, sciezka });
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  await k.otworz('l1');
  const naPdf = jest.fn(async () => ({ ok: false as const, powod }));
  const zw = { ...s.z, konwersja: { naPdf, sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  return { naPdf };
}

test('K-17h: wybrany plik .doc (application/msword) → alert wzor.blad_typ, konwersja nie jest wołana', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { naPdf } = await start({ nazwa: 'stary.doc', typ: 'application/msword' });
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Oczko can’t add this type of file', expect.stringContaining('PDFs, Word documents'), expect.anything()));
  expect(naPdf).not.toHaveBeenCalled();
  alert.mockRestore();
});
test('K-17h: wybrany plik .docx idzie do konwersji jako Word (reguła nie psuje poprawnego Worda)', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { naPdf } = await start({ nazwa: 'nowy.docx', typ: UTI_WORD });
  await waitFor(() => expect(naPdf).toHaveBeenCalledTimes(1));
  alert.mockRestore();
});
test('E2-A3: konwersja Worda przekroczyła czas → alert o czasie (nie cisza jak przy braku sieci); nic nie dodane', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { naPdf } = await start({ nazwa: 'nowy.docx', typ: UTI_WORD }, 'przekroczono_czas');
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Oczko couldn’t finish converting this file', expect.stringContaining('“nowy.docx” took too long to convert'), expect.anything()));
  expect(naPdf).toHaveBeenCalledTimes(1);
  alert.mockRestore();
});

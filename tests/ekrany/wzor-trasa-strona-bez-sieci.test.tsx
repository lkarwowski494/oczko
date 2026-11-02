// Trasa „/wzor” (app/wzor.tsx), „Web page” bez sieci (07-jakosc-017, F-55, K-17b, ADR-0031 pkt 3; BR-WZR-007 S3; design-spec :660 „Strona bez sieci”):
// konwersja zwraca `brak_sieci` → adres trafia do skrzynki jako zlecenie (nie znika, nie powstaje pusty wzór) i ekran wraca do projektu, gdzie widać wiersz
// „czeka na sieć”. Gdy zlecenia nie da się zapisać (brak App Group) → alert zapisu, a wpisany adres zostaje w polu arkusza. Konwersja i widok natywny: atrapy.
import React from 'react';
import { View } from 'react-native';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, ile, katalogTymczasowy, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ dodaj: 'link' }) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockReact = React;
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const ADRES = 'https://example.org/wzory/czapka';

async function start(o: { grupa: boolean }) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Czapka'), czesc('c1', 'p1', 'Główka'), ...licznik('l1', 'c1', 5)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(o.grupa ? grupa : null, () => s.zegar.teraz().ms);
  const naPdf = jest.fn(async () => ({ ok: false as const, powod: 'brak_sieci' as const }));
  const zw = { ...s.z, konwersja: { naPdf, sprawdzPdf: jest.fn() }, czasWTle, skrzynka, migawka: migawkaWKatalogu(o.grupa ? grupa : null, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa: o.grupa ? grupa : null, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  const pole = await screen.findByTestId('wzor-link-pole');
  fireEvent.changeText(pole, ADRES);
  fireEvent.press(screen.getByText('Save page'));
  return { s, kw, skrzynka, naPdf };
}

test('K-17b: strona z linku bez sieci → zlecenie w skrzynce z projektem, brak pustego wzoru, brak alertu, powrót do projektu', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { s, kw, skrzynka, naPdf } = await start({ grupa: true });
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect(naPdf).toHaveBeenCalledWith({ rodzaj: 'adres', adres: ADRES }, expect.anything());
  expect(await skrzynka.pobierz()).toEqual([expect.objectContaining({ rodzaj: 'adres', adres: ADRES, projektId: 'p1', nazwa: 'example.org' })]);
  expect(kw.stan().czekaSiec).toHaveLength(1);
  expect(await ile(s.baza, 'wzor')).toBe(0);
  expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});
test('K-17d: zlecenia nie da się zapisać (brak App Group) → alert zapisu, arkusz linku wraca z wpisanym adresem, nic nie znika, brak powrotu do projektu', async () => {
  mockRouter.back.mockClear();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await start({ grupa: false });
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Couldn’t save that row. It’s still on screen; try again.', undefined, expect.anything()));
  expect((await screen.findByTestId('wzor-link-pole')).props.value).toBe(ADRES);
  expect(mockRouter.back).not.toHaveBeenCalled();
  alert.mockRestore();
});

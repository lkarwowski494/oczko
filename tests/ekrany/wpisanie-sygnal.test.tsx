// 07-jakosc-011 S4 (BR-LIC-009/S4, RD-13-W23, RD-13-W8): po wpisaniu wartości, która wprowadza w rząd z instrukcją, jedna wibracja wzorca „przypomnienie”
// i jedno ogłoszenie VoiceOver (jak po +1); wpisanie mniejszej wartości — bez sygnału. Trasa /formularz/wpisz na prawdziwej bazie.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { oglos } from '../../src/kompozycja/system';
import { czesc, licznik, projekt, przypomnienie } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({ rodzaj: 'wpisz' }) }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

const zagraj = jest.fn();
async function start(o: { wibracje?: boolean } = {}) {
  const { s, k, j } = await kompozycjaTestowa({ wibracje: o.wibracje });
  // licznik 5 rzędów, przypomnienie „od 6, co 6, 5 razy” (pr1: „ujmowanie”)
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), przypomnienie('pr1', 'l1')]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  zagraj.mockClear(); (oglos as jest.Mock).mockClear(); mockRouter.back.mockClear();
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  return { k, j };
}
const wpisz = async (tekst: string) => {
  fireEvent.changeText(screen.getByTestId('wpisz-wartosc-pole'), tekst);
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((r) => setTimeout(r, 120)); });
};

test('S4/W23: wpisanie 17 przy planie od 6 co 6 → jeden sygnał dla rzędu 18 (wibracja „rząd z instrukcją” + jedno ogłoszenie)', async () => {
  const { j } = await start();
  await wpisz('17');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect(zagraj).toHaveBeenCalledTimes(1);
  expect(zagraj).toHaveBeenCalledWith('rzadZInstrukcja');
  expect(oglos).toHaveBeenCalledTimes(1);
  expect(oglos).toHaveBeenCalledWith(j.t('licznik.wejscie_w_przypomnienie', { n: 18, tekst: 'ujmowanie', ktory: 3, razy: 5 }));
});
test('S4/W8: wpisanie mniejszej wartości (2) nie daje sygnału', async () => {
  await start();
  await wpisz('2');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect(zagraj).not.toHaveBeenCalled();
  expect(oglos).not.toHaveBeenCalled();
});
test('S4: wpisanie wartości poza planem (7 → rząd 8) nie daje sygnału', async () => {
  await start();
  await wpisz('7');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect(zagraj).not.toHaveBeenCalled();
  expect(oglos).not.toHaveBeenCalled();
});
test('S4: wibracje wyłączone w ustawieniach → ogłoszenie jest, wibracji nie ma', async () => {
  await start({ wibracje: false });
  await wpisz('17');
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  expect(zagraj).not.toHaveBeenCalled();
  expect(oglos).toHaveBeenCalledTimes(1);
});

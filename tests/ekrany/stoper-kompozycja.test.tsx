// Kontener stopera na liczniku (P-191 P1a–P3a, P-199 Q3c) na prawdziwej bazie node:sqlite: start, pauza, stop z ogłoszeniami po wyniku,
// „Stop and start here” przy sesji w innym projekcie; po każdym przejściu `poZmianie` (stan ekranu blokady i zegarka, przeładowanie licznika).
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StoperLicznika } from '../../src/kompozycja/StoperLicznika';
import { otwartaSesja, startSesji } from '../../src/przypadki-uzycia/sesja';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
/** Port haptyki i preferencje z `useAplikacja()` (M1-107); wibracje włączone. */
const zrodlo = () => ({ kontener: { j: { t }, porty: { haptyka: { zagraj: jest.fn() } } }, preferencje: { stan: () => ({ wibracje: true }) } });
async function pokaz(projektId = 'pb') {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('pa', 'Harbor Sweater'), projekt('pb', 'Scarf')]);
  s.zegar.ustaw(T0);
  const oglos = jest.fn();
  const poZmianie = jest.fn(async () => undefined);
  render(<StoperLicznika z={s.z} j={{ t, jezyk: () => 'en', zegar24h: () => true }} zrodlo={zrodlo()} projektId={projektId} oglos={oglos} poZmianie={poZmianie} />);
  await waitFor(() => expect(screen.getByTestId('licznik-stoper')).toBeTruthy());
  return { s, oglos, poZmianie };
}

test('start → kapsuła i ogłoszenie; pauza → ogłoszenie z czasem; stop → „Session saved”; poZmianie po każdym przejściu', async () => {
  const { s, oglos, poZmianie } = await pokaz();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start session timer' })); });
  await waitFor(() => expect(oglos).toHaveBeenCalledWith('Session timer started.'));
  s.zegar.ustaw(T0 + 5 * MIN);
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-stoper')); });
  await act(async () => { fireEvent.press(screen.getByTestId('stoper-wstrzymaj')); });
  await waitFor(() => expect(oglos).toHaveBeenCalledWith('Session timer paused at 5:00.'));
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-stoper')); });
  await act(async () => { fireEvent.press(screen.getByTestId('stoper-zatrzymaj')); });
  await waitFor(() => expect(oglos).toHaveBeenCalledWith('Session saved: 5 min.'));
  expect(poZmianie).toHaveBeenCalledTimes(3);
  const o = await otwartaSesja(s.z);
  expect(o.ok && o.wartosc).toBeNull();
});

test('P3a: sesja trwa w „Harbor Sweater” → start w „Scarf” pyta; „Stop and start here” przełącza', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('pa', 'Harbor Sweater'), projekt('pb', 'Scarf')]);
  s.zegar.ustaw(T0);
  await startSesji(s.z, { projektId: 'pa' });
  render(<StoperLicznika z={s.z} j={{ t, jezyk: () => 'en', zegar24h: () => true }} zrodlo={zrodlo()} projektId="pb" oglos={jest.fn()} poZmianie={async () => undefined} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start session timer' })).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start session timer' })); });
  await waitFor(() => expect(screen.getByText('The timer is running for Harbor Sweater')).toBeTruthy());
  await act(async () => { fireEvent.press(screen.getByTestId('stoper-inny-potwierdz')); });
  await waitFor(async () => { const o = await otwartaSesja(s.z); expect(o.ok && o.wartosc?.projektId).toBe('pb'); });
});

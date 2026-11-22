// PU-278 (katalog przypadków użycia, „Licznik”): stoper działa w projekcie A, a w B stuknięto „Start session timer” → okno „The timer is running for A” z „One session runs at a time…”;
// „Cancel” niczego nie zmienia, „Stop and start here” kończy sesję A (1 zakończona) i uruchamia stoper w B. Kontener stopera na prawdziwej bazie (node:sqlite).
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StoperLicznika } from '../../src/kompozycja/StoperLicznika';
import { otwartaSesja, sesjeProjektu, startSesji } from '../../src/przypadki-uzycia/sesja';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

test('PU-278: start stopera w B przy działającym w A pyta; „Cancel” nic nie zmienia, „Stop and start here” daje A 1 zakończoną sesję, a B działający stoper', async () => {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('pa', 'Harbor Sweater'), projekt('pb', 'Scarf')]);
  s.zegar.ustaw(T0);
  await startSesji(s.z, { projektId: 'pa' });
  s.zegar.ustaw(T0 + 10 * MIN);
  const poZmianie = jest.fn(async () => undefined);
  render(<StoperLicznika z={s.z} j={{ t, jezyk: () => 'en', zegar24h: () => true }} zrodlo={{ kontener: { j: { t }, porty: { haptyka: { zagraj: jest.fn() } } }, preferencje: { stan: () => ({ wibracje: true }) } }} projektId="pb" oglos={jest.fn()} poZmianie={poZmianie} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start session timer' })).toBeTruthy());
  const stan = async () => {
    const a = await sesjeProjektu(s.z, { projektId: 'pa' });
    const b = await sesjeProjektu(s.z, { projektId: 'pb' });
    const o = await otwartaSesja(s.z);
    return { aZakonczone: a.ok ? a.wartosc.filter((x) => x.stan === 'zakonczona').length : -1, bWszystkie: b.ok ? b.wartosc.length : -1, otwartaW: o.ok ? o.wartosc?.projektId : 'blad' };
  };
  const start = async () => { await act(async () => { fireEvent.press(await screen.findByRole('button', { name: 'Start session timer' })); }); };
  expect(await stan()).toEqual({ aZakonczone: 0, bWszystkie: 0, otwartaW: 'pa' });

  await start();
  expect(await screen.findByText('The timer is running for Harbor Sweater')).toBeTruthy();
  expect(screen.getByText('One session runs at a time. Stop it there and start one for Scarf?')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Cancel')); });
  expect(screen.queryByText('The timer is running for Harbor Sweater')).toBeNull();
  expect(await stan()).toEqual({ aZakonczone: 0, bWszystkie: 0, otwartaW: 'pa' }); // „Cancel”: nic się nie zmieniło

  await start();
  await act(async () => { fireEvent.press(await screen.findByTestId('stoper-inny-potwierdz')); });
  await waitFor(async () => expect(await stan()).toEqual({ aZakonczone: 1, bWszystkie: 1, otwartaW: 'pb' }));
  await waitFor(() => expect(screen.queryByText('The timer is running for Harbor Sweater')).toBeNull());
  expect(screen.getByTestId('licznik-stoper')).toBeTruthy();
});

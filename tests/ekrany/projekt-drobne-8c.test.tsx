// Partia 8c, 07-jakosc-031: F-08 („Goal reached” przy części z osiągniętym celem na ekranie projektu) i F-46 (projekt roboczy: licznik całości bez daty w miejscu
// nazwy części). Dane z prawdziwej bazy (node:sqlite) przez model odczytu i kompozycję, potem ekran; teksty z prawdziwego t() en.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { Licznik } from '../../src/ekrany/Licznik';
import { stanProjektu } from '../../src/kompozycja/projekt';
import { stanEkranu } from '../../src/kompozycja/licznik';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn, wywolaniaLicznika } from './pomoc';

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
const TERAZ = T0 + 2 * DOBA, STREFA = 'Europe/Warsaw';

test('F-08: część z osiągniętym celem ma na ekranie projektu dopisek „Goal reached”, część w toku nie', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [
    projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1, { cel: 5 }), ...licznik('l1', 'c1', 5), czesc('c2', 'p1', 'Front', 2, { cel: 10 }), ...licznik('l2', 'c2', 3),
  ]);
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  if (!w.ok) throw new Error(w.powod);
  render(<Projekt stan={stanProjektu(w.wartosc, { j, terazMs: TERAZ, strefa: STREFA })} t={j.t} naOtworzCzesc={jest.fn()} />);
  expect(screen.getByText('5 of 5 rows')).toBeTruthy();
  expect(screen.getAllByText('Goal reached')).toHaveLength(1); // tylko Back
  expect(screen.getByText('3 of 10 rows')).toBeTruthy();
});

test('F-46: w projekcie roboczym licznik całości nie pokazuje daty jako nazwy części, tylko „Whole piece: N rows”', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [
    projekt('p1', '2026-10-22'), ['UPDATE projekt SET nienazwany = 1 WHERE id = ?', ['p1']], czesc('c1', 'p1', '2026-10-22', 1),
    ...licznik('l1', 'c1', 12, { kolejnosc: 0 }), ...licznik('l2', 'c1', 8, { kolejnosc: 1 }),
  ]);
  const w = await widokLicznika(s.z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  const stan = stanEkranu(w.wartosc, { j, dzis: '2026-10-24', terazMs: TERAZ, strefa: STREFA, baner: null, wibracje: true });
  render(<Licznik stan={stan} t={j.t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText('Whole piece: 20 rows')).toBeTruthy();
  expect(screen.queryByText(/2026-10-22 in total/)).toBeNull();
});

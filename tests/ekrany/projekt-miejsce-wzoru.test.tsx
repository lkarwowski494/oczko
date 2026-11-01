// 07-jakosc-010 (F-18, BR-PRJ-005/S1): ekran projektu pokazuje miejsce we wzorze („Pattern: Page 3, row 48”) z prawdziwego znacznika i wartości licznika
// (baza node:sqlite → widokProjektu → stanProjektu → ekran), a po kolejnym +1 miejsce idzie z licznikiem; bez znacznika wiersza nie ma.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { stanProjektu } from '../../src/kompozycja/projekt';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 2, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 48, wartosc_przy_ustawieniu: 47, kierunek: 1 });

async function pokaz(s: Awaited<ReturnType<typeof przygotuj>>) {
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  if (!w.ok) throw new Error(w.powod);
  return render(<Projekt stan={stanProjektu(w.wartosc, { j, terazMs: T0, strefa: 'Europe/Warsaw' })} t={j.t} naOtworzCzesc={jest.fn()} />);
}
const baza = (znacznik: string) => [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 47), plik('a'.repeat(64), 'pdf', 10), wzor('w1', 'p1', 'a'.repeat(64), znacznik)];

test('znacznik na stronie 3, licznik 47 → „Pattern: Page 3, row 48”; po +1 → „row 49”', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, baza(ZNACZNIK));
  const r = await pokaz(s);
  expect(screen.getByText('Pattern: Page 3, row 48')).toBeTruthy();
  r.unmount();
  expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
  await pokaz(s);
  expect(screen.getByText('Pattern: Page 3, row 49')).toBeTruthy();
});

test('wzór bez znacznika → brak wiersza miejsca (nic zgadniętego)', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, baza('{}'));
  await pokaz(s);
  expect(screen.queryByText(/Pattern:/)).toBeNull();
});

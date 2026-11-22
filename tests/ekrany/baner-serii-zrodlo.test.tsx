// 07-jakosc-014 S5 (BR-LIC-019 „Seria z ekranu blokady po scaleniu”, RD-17-W8): pytanie o serię z ekranu blokady albo zegarka podaje źródło i godzinę serii,
// nie czas scalenia. Stan ekranu z prawdziwej kompozycji na prawdziwej bazie, ekran z prawdziwym t() z en.json.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { czesc, licznik, projekt, ustawGlowe, zdarzenie } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, MIN, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

const START = T0 + 14 * MIN; // 12:14 Europe/Warsaw; aplikacja scala serię dopiero o 12:20
async function stan(zrodlo: string, n = 5): Promise<StanEkranuLicznika> {
  const { s, k } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }),
    ...Array.from({ length: n }, (_, i) => zdarzenie(`s${i + 1}`, 'l1', 'plus', 31 + i, [i ? `s${i}` : 'l1-z30'], START + i * 300, { zrodlo })), ustawGlowe('l1', 30 + n, `s${n}`)]);
  s.zegar.ustaw(START + 6 * MIN);
  await k.otworz('l1');
  return k.dzialania.odswiez!();
}
const pokaz = async (st: StanEkranuLicznika) => {
  const oglos = jest.fn();
  render(<Licznik stan={st} t={await tEn()} oglos={oglos} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  return oglos;
};

test('014/S5: seria z ekranu blokady: „Added 5 rows from the lock screen at 12:14. Undo?” (godzina serii, nie scalenia)', async () => {
  const st = await stan('ekran_blokady');
  expect(st.baner).toMatchObject({ rodzaj: 'seria', n: 5, zrodlo: 'ekran_blokady', godzina: '12:14' });
  const oglos = await pokaz(st);
  expect(screen.getByTestId('baner-serii').props.children).toBe('Added 5 rows from the lock screen at 12:14. Undo?');
  expect(oglos).toHaveBeenCalledTimes(1);
  expect(oglos).toHaveBeenCalledWith('Added 5 rows from the lock screen at 12:14. Undo?');
});
test('014/S5: seria z zegarka: „Added 5 rows on your watch at 12:14. Undo?”', async () => {
  await pokaz(await stan('zegarek'));
  expect(screen.getByTestId('baner-serii').props.children).toBe('Added 5 rows on your watch at 12:14. Undo?');
});
test('014/S5: seria z aplikacji bez zmian: „Added 5 rows in 1 s. Undo?”', async () => {
  await pokaz(await stan('aplikacja'));
  expect(screen.getByTestId('baner-serii').props.children).toBe('Added 5 rows in 1 s. Undo?');
});

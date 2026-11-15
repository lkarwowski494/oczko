// PU-127 (ekran blokady) i PU-335 (zegarek bez telefonu), katalog przypadków użycia: trzy +1 z innego źródła → po otwarciu licznika wartość +3 bez konfliktu,
// baner „Added 3 rows … Undo?” z godziną serii, a „Undo” cofa dokładnie tę serię (wartość sprzed serii, wpis cofnięcia w historii).
// Poziom: komponentowy na prawdziwej bazie (node:sqlite) i prawdziwym t() z en.json; atrapy tylko na granicy platformy (kompozycjaTestowa).
// Baner dla pięciu rzędów: tests/ekrany/baner-serii-zrodlo.test.tsx; cofnięcie 100 rzędów: tests/dane/zapis-licznika.test.ts.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { czesc, licznik, projekt, ustawGlowe, zdarzenie } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, MIN, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn, wywolaniaLicznika } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

const START = T0 + 14 * MIN; // 12:14 Europe/Warsaw; aplikacja scala serię dopiero o 12:20

async function otworzPoSerii(zrodlo: 'ekran_blokady' | 'zegarek') {
  const { s, k } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 30, { t: T0 - 5 * DOBA }),
    ...[1, 2, 3].map((n) => zdarzenie(`s${n}`, 'l1', 'plus', 30 + n, [n > 1 ? `s${n - 1}` : 'l1-z30'], START + (n - 1) * 300, { zrodlo })), ustawGlowe('l1', 33, 's3')]);
  s.zegar.ustaw(START + 6 * MIN);
  await k.otworz('l1');
  const st = await k.dzialania.odswiez!();
  const w = wywolaniaLicznika();
  const rysuj = async (stan: StanEkranuLicznika) => render(<Licznik stan={stan} t={await tEn()} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} />);
  return { s, k, st, rysuj };
}

describe.each([
  ['PU-127', 'ekran_blokady', 'Added 3 rows from the lock screen at 12:14. Undo?'],
  ['PU-335', 'zegarek', 'Added 3 rows on your watch at 12:14. Undo?'],
] as const)('%s: seria 3 × +1 ze źródła „%s”', (pu, zrodlo, baner) => {
  test(`${pu}: po otwarciu licznika wartość 33 bez konfliktu i baner „${baner}”`, async () => {
    const { st, rysuj } = await otworzPoSerii(zrodlo);
    expect(st.skonczone).toBe(33);
    expect(st.baner).toMatchObject({ rodzaj: 'seria', n: 3, zrodlo, godzina: '12:14' });
    await rysuj(st);
    expect(screen.getByTestId('baner-serii').props.children).toBe(baner);
  });

  test(`${pu}: „Undo” cofa serię — wartość 30 sprzed serii i wpis cofnięcia w historii`, async () => {
    const { s, k, st, rysuj } = await otworzPoSerii(zrodlo);
    await rysuj(st);
    expect(screen.getByTestId('baner-serii-cofnij')).toBeTruthy();
    await k.dzialania.naCofnijSerie?.();
    const po = await k.dzialania.odswiez!();
    expect(po.skonczone).toBe(30);
    const wpisy = await s.baza.all("SELECT rodzaj, wartosc_po FROM zdarzenie WHERE licznik_id = 'l1' AND rodzaj = 'cofniecie'");
    expect(wpisy).toEqual([{ rodzaj: 'cofniecie', wartosc_po: 30 }]); // zdarzenia serii zostają, cofnięcie dochodzi jako osobny wpis (dziennik tylko dopisywany)
  });
});

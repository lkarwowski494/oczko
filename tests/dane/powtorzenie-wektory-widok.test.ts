// 07-jakosc-020 (partia 8b): model widoku licznika liczy powtórzenie funkcją domeny (RD-12), nie własnym wzorem.
// Wektory RD-12-W1–W4 (tryb „skończone rzędy”) i RD-12-W7–W9 (tryb licznika, BR-LIC-012, ER-40) przez widokLicznika, a nie tylko przez domenę.
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function widokPowtorzenia(skonczone: number, dlugosc: number, znaczenie: 'skonczone' | 'w_trakcie' = 'skonczone') {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', skonczone),
    ['UPDATE licznik SET dlugosc_powtorzenia = ?, znaczenie = ? WHERE id = ?', [dlugosc, znaczenie, 'l1']]]);
  const w = await widokLicznika(s.z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc.powtorzenie;
}

describe('widokLicznika.powtorzenie = RD-12 (07-jakosc-020)', () => {
  test('RD-12-W1: r = 17, n = 8 → powtórzenie 3, rząd 1', async () => {
    expect(await widokPowtorzenia(17, 8)).toEqual({ numer: 3, rzadW: 1, dlugosc: 8 });
  });
  test('RD-12-W2: r = 8, n = 8 → powtórzenie 1, rząd 8 (koniec powtórzenia)', async () => {
    expect(await widokPowtorzenia(8, 8)).toEqual({ numer: 1, rzadW: 8, dlugosc: 8 });
  });
  test('RD-12-W3: r = 9, n = 8 → powtórzenie 2, rząd 1', async () => {
    expect(await widokPowtorzenia(9, 8)).toEqual({ numer: 2, rzadW: 1, dlugosc: 8 });
  });
  test('RD-12-W4: r = 0, n = 8 → powtórzenie 1, rząd 0 („0 z 8”)', async () => {
    expect(await widokPowtorzenia(0, 8)).toEqual({ numer: 1, rzadW: 0, dlugosc: 8 });
  });
  test('RD-12-W7: 12 skończonych w trybie „rząd w trakcie”, n = 8 → powtórzenie 2, rząd 5', async () => {
    expect(await widokPowtorzenia(12, 8, 'w_trakcie')).toEqual({ numer: 2, rzadW: 5, dlugosc: 8 });
  });
  test('RD-12-W8: 0 skończonych w trybie „rząd w trakcie” → powtórzenie 1, rząd 1', async () => {
    expect(await widokPowtorzenia(0, 8, 'w_trakcie')).toEqual({ numer: 1, rzadW: 1, dlugosc: 8 });
  });
  test('RD-12-W9: 12 skończonych w trybie „skończone rzędy”, n = 8 → powtórzenie 2, rząd 4', async () => {
    expect(await widokPowtorzenia(12, 8, 'skonczone')).toEqual({ numer: 2, rzadW: 4, dlugosc: 8 });
  });
  test('bez długości powtórzenia model nie ma powtórzenia', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
    const w = await widokLicznika(s.z, { licznikId: 'l1' });
    expect(w.ok && w.wartosc.powtorzenie).toBe(null);
  });
});

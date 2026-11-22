// Partia 8b: zdarzenia i stan ekranu licznika przez kompozycję (ścieżka ekranu: k.uslugi.dodajRzad / k.dzialania), na prawdziwej bazie.
import type { ZdarzeniePlus } from '../../src/ekrany/LicznikTypy';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from './pomocnicze/kompozycja-licznika';
import { wykonaj } from './pomocnicze/srodowisko';

describe('07-jakosc-020: koniec powtórzenia nie zależy od trybu wyświetlania', () => {
  test.each(['skonczone', 'w_trakcie'] as const)('+1 na rzędzie 8 przy powtórzeniu co 8 daje zdarzenie koniec-powtorzenia (tryb %s); rząd 7 → 8 nie w połowie', async (znaczenie) => {
    const { s, k } = await kompozycjaTestowa();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 6),
      ['UPDATE licznik SET dlugosc_powtorzenia = 8, znaczenie = ? WHERE id = ?', [znaczenie, 'l1']]]);
    await k.otworz('l1');
    const siodmy = await k.uslugi.dodajRzad();
    const rzad: ZdarzeniePlus[] = ['rzad'];
    expect(siodmy.ok && siodmy.wartosc.zdarzenia).toEqual(rzad);
    const osmy = await k.uslugi.dodajRzad();
    expect(osmy.ok && osmy.wartosc.zdarzenia).toEqual(['rzad', 'koniec-powtorzenia']);
    const dziewiaty = await k.uslugi.dodajRzad();
    expect(dziewiaty.ok && dziewiaty.wartosc.zdarzenia).toEqual(['rzad']);
  });
});

describe('07-jakosc-009: cel dnia daje sygnał przypomnienia (BR-LIC-021 „Koniec powtórzenia i cel dnia”, F-48)', () => {
  async function zCelemDnia() {
    const { s, k } = await kompozycjaTestowa();
    // Cel części 100 rzędów, termin za 10 dni (dziś 2026-10-22, termin 2026-10-31: d = 10) → RD-15: cel na dziś ⌈(100 − Z_przed) / 10⌉.
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0),
      ['UPDATE projekt SET termin_dzien = ? WHERE id = ?', ['2026-10-31', 'p1']], ['UPDATE czesc SET cel_rzedow = 100 WHERE id = ?', ['c1']]]);
    await k.otworz('l1');
    await k.uslugi.start(); // ekran czyta stan przy starcie (z niego bierze punkt odniesienia dla sygnału)
    return { k };
  }
  test('+1 osiągające cel dnia (10 rzędów) daje cel-dnia, rząd 9 i 11 nie', async () => {
    const { k } = await zCelemDnia();
    const zdarzenia: ZdarzeniePlus[][] = [];
    for (let i = 0; i < 11; i++) { const r = await k.uslugi.dodajRzad(); zdarzenia.push(r.ok ? r.wartosc.zdarzenia : []); }
    expect(zdarzenia.map((z) => z.includes('cel-dnia'))).toEqual([false, false, false, false, false, false, false, false, false, true, false]);
    expect(zdarzenia[9]).toEqual(['rzad', 'cel-dnia']);
  });
});

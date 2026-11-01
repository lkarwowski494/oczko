// Partia 8b: zdarzenia i stan ekranu licznika przez kompozycję (ścieżka ekranu: k.uslugi.dodajRzad / k.dzialania), na prawdziwej bazie.
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
    expect(siodmy.ok && siodmy.wartosc.zdarzenia).toEqual(['rzad']);
    const osmy = await k.uslugi.dodajRzad();
    expect(osmy.ok && osmy.wartosc.zdarzenia).toEqual(['rzad', 'koniec-powtorzenia']);
    const dziewiaty = await k.uslugi.dodajRzad();
    expect(dziewiaty.ok && dziewiaty.wartosc.zdarzenia).toEqual(['rzad']);
  });
});

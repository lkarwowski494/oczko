// PU-291 (BX28, luka z zastrzeżeń BX23): strażnik pustej nazwy w przypadku użycia `zmienNazweWzoru` (src/przypadki-uzycia/wzor.ts) ma własny test na poziomie domeny — UI blokuje pustą nazwę
// wcześniej, więc bez tego testu usunięcie strażnika nie zaczerwieniało testów oznaczonych PU-291. Prawdziwa baza (node:sqlite), prawdziwy przypadek użycia.
// Oczekiwany wynik: pusta i białoznakowa nazwa → odmowa `bledne_dane`, wiersz wzoru (nazwa i czas zmiany) bez zmian; poprawna nazwa jest przycięta i zapisana.
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { T0, jeden, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';
import { zmienNazweWzoru } from '../../src/przypadki-uzycia/wzor';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

test('PU-291: pusta, białoznakowa i samotne znaki białe nazwa → bledne_dane, nazwa i zmieniono_ms w bazie bez zmian; „  Front chart ” zapisuje się przycięte', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h), ["UPDATE wzor SET nazwa = 'Sleeve chart', zmieniono_ms = ? WHERE id = 'w1'", [T0]]]);
  const stan = () => jeden(s.baza, "SELECT nazwa, zmieniono_ms FROM wzor WHERE id = 'w1'");
  const przed = await stan();
  expect(przed).toEqual({ nazwa: 'Sleeve chart', zmieniono_ms: T0 });

  s.zegar.przesun(60_000); // gdyby zapis przeszedł, zmieniono_ms by się zmieniło
  for (const pusta of ['', '   ', '\t\n ']) {
    expect(await zmienNazweWzoru(s.z, { wzorId: 'w1', nazwa: pusta })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await stan()).toEqual(przed);
  }

  expect(await zmienNazweWzoru(s.z, { wzorId: 'w1', nazwa: '  Front chart ' })).toEqual({ ok: true, wartosc: undefined });
  expect(await stan()).toEqual({ nazwa: 'Front chart', zmieniono_ms: T0 + 60_000 });
});

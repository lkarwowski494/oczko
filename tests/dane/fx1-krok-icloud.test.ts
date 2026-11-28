// FX1 P2-1 (KO-246, recenzja niezależna FA1): ustawKrok (ZM-24) zmienia lokalną kolumnę `krok`; nie wolno przy tym ruszać `zmieniono_ms` (kolumna jest w wyzwalaczu
// licznik_icloud_u), bo wiersz licznika z nowszym czasem wygrałby LWW i zgubił nazwę zmienioną offline na drugim urządzeniu. Prawdziwy SQLite (node:sqlite).
import { ustawKrok } from '../../src/przypadki-uzycia/licznik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

describe('FX1 P2-1: ustawKrok a iCloud', () => {
  test('zmiana samego kroku nie zmienia zmieniono_ms i nie wysyła wiersza licznika do iCloud (nr_zmiany bez zmian)', async () => {
    const s = await przygotuj();
    s.pro.wartosc = true;
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
    await s.baza.run('UPDATE synchronizacja SET wlaczona = 1, wejscie = 0 WHERE id = 1');
    const przed = await jeden<{ z: number; n: number }>(s.baza, 'SELECT l.zmieniono_ms AS z, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1) AS n FROM licznik l WHERE l.id = ?', ['l1']);
    const kolejkaPrzed = await ile(s.baza, 'zmiana_icloud', "encja = 'licznik'");
    s.zegar.ustaw(przed.z + 60_000);
    expect((await ustawKrok(s.z, { licznikId: 'l1', krok: 2 })).ok).toBe(true);
    const po = await jeden<{ z: number; n: number; k: number }>(s.baza, 'SELECT l.zmieniono_ms AS z, l.krok AS k, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1) AS n FROM licznik l WHERE l.id = ?', ['l1']);
    expect(po.k).toBe(2);
    expect(po.z).toBe(przed.z);
    expect(po.n).toBe(przed.n);
    expect(await ile(s.baza, 'zmiana_icloud', "encja = 'licznik'")).toBe(kolejkaPrzed);
  });
});

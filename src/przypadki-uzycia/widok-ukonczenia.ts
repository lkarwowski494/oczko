// Model karty ukończenia (F-19, F-53, U-9; BR-PRJ-015; ekrany.html `ukonczenie`): dni z robótką = różne dni lokalne zmian +1 projektu (RD-16),
// rzędy = suma liczników rzędów, czas tylko z zakończonych sesji stopera (null bez sesji, BR-PRJ-015/S3), włóczka przypisana do projektu.
import type { Wynik } from '../domena/bledy';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type KartaUkonczenia = {
  nazwa: string; nienazwany: boolean; utworzonoMs: number; startMs: number; ukonczonoMs: number | null;
  dni: number; rzedy: number; czasMs: number | null; czesci: number;
  wloczka: { id: string; nazwa: string; motki: number; zuzyto: number | null }[]; zdjecieSha: string | null; // motki = zapas przed zapisem
  maZapas: boolean; // w zapasie jest choć jedna włóczka (nieusunięta): bez niej karta nie proponuje wyboru włóczki (P-330 1B)
};

export function kartaUkonczenia(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<KartaUkonczenia>> {
  return operacjaZapisu(z, 'kartaUkonczenia', async (tx) => {
    const [p] = await wiersze(tx.all('SELECT nazwa, nienazwany, utworzono_ms, ukonczono_ms FROM projekt WHERE id = ? AND usunieto_ms IS NULL', [w.projektId]), 'kartaUkonczenia');
    if (!p) return blad('bledne_dane');
    const [d] = await wiersze(tx.all(
      `SELECT count(DISTINCT z.dzien) AS dni, min(z.czas_ms) AS start FROM zdarzenie z JOIN licznik l ON l.id = z.licznik_id JOIN czesc c ON c.id = l.czesc_id
        WHERE c.projekt_id = ? AND z.rodzaj = 'plus'`, [w.projektId]), 'kartaUkonczenia');
    const [r] = await wiersze(tx.all(
      `SELECT coalesce(sum(l.wartosc), 0) AS rzedy, count(DISTINCT c.id) AS czesci FROM czesc c LEFT JOIN licznik l ON l.czesc_id = c.id AND l.rodzaj = 'rzedy' AND l.usunieto_ms IS NULL
        WHERE c.projekt_id = ? AND c.usunieto_ms IS NULL`, [w.projektId]), 'kartaUkonczenia');
    const [s] = await wiersze(tx.all(
      "SELECT count(*) AS n, coalesce(sum(max(0, koniec_ms - start_ms - przerwy_ms)), 0) AS ms FROM sesja WHERE projekt_id = ? AND stan = 'zakonczona'", [w.projektId]), 'kartaUkonczenia');
    const wl = await wiersze(tx.all('SELECT w.id, w.nazwa, w.motki, pw.zuzyto_motki FROM projekt_wloczka pw JOIN wloczka w ON w.id = pw.wloczka_id WHERE pw.projekt_id = ? ORDER BY w.nazwa', [w.projektId]), 'kartaUkonczenia');
    const [zd] = await wiersze(tx.all('SELECT plik_sha256 FROM zdjecie WHERE projekt_id = ? ORDER BY utworzono_ms DESC LIMIT 1', [w.projektId]), 'kartaUkonczenia');
    const [zp] = await wiersze(tx.all('SELECT count(*) AS n FROM wloczka WHERE usunieto_ms IS NULL'), 'kartaUkonczenia');
    const utworzono = liczba(p, 'utworzono_ms');
    return {
      ok: true,
      wartosc: {
        nazwa: tekst(p, 'nazwa'), nienazwany: liczba(p, 'nienazwany') === 1, utworzonoMs: utworzono,
        startMs: (d && liczbaLubNull(d, 'start')) ?? utworzono, ukonczonoMs: liczbaLubNull(p, 'ukonczono_ms'),
        dni: d ? liczba(d, 'dni') : 0, rzedy: r ? liczba(r, 'rzedy') : 0, czesci: r ? liczba(r, 'czesci') : 0,
        czasMs: s && liczba(s, 'n') > 0 ? liczba(s, 'ms') : null,
        wloczka: wl.map((x) => ({ id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), motki: liczba(x, 'motki'), zuzyto: liczbaLubNull(x, 'zuzyto_motki') })), zdjecieSha: zd ? tekstLubNull(zd, 'plik_sha256') : null,
        maZapas: zp ? liczba(zp, 'n') > 0 : false,
      },
    };
  });
}

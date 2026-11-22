// Link do filmu projektu (F-55, P-246 S4a; P-218 (4): film poza wzorem) — jeden na projekt, tylko adres http(s) i opcjonalna nazwa.
import type { Wynik } from '../domena/bledy';
import { adresStrony } from '../domena/adres';
import { liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { OK, blad, operacjaZapisu } from './zapis';
import type { ZaleznosciPlikow } from './zaleznosci';

/** Link do filmu projektu (F-55, P-246 S4a; P-218 (4): poza wzorem): jeden na projekt, tylko adres http(s) i opcjonalna nazwa. */
export function ustawFilm(z: Pick<ZaleznosciPlikow, 'baza' | 'zegar'>, w: { projektId: string; adres: string; nazwa: string }): Promise<Wynik<void>> {
  const adres = adresStrony(w.adres);
  if (!adres) return Promise.resolve(blad('bledne_dane'));
  return zapiszFilm(z, w.projektId, adres, w.nazwa.trim() || null);
}
export function usunFilm(z: Pick<ZaleznosciPlikow, 'baza' | 'zegar'>, w: { projektId: string }): Promise<Wynik<void>> {
  return zapiszFilm(z, w.projektId, null, null);
}
function zapiszFilm(z: Pick<ZaleznosciPlikow, 'baza' | 'zegar'>, projektId: string, adres: string | null, nazwa: string | null): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'film', async (tx, teraz) => {
    const [p] = await wiersze(tx.all('SELECT usunieto_ms FROM projekt WHERE id = ?', [projektId]), 'film');
    if (!p) return blad('bledne_dane');
    if (liczbaLubNull(p, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
    await tx.run('UPDATE projekt SET film_adres = ?, film_nazwa = ?, zmieniono_ms = ? WHERE id = ?', [adres, nazwa, teraz, projektId]);
    return OK;
  });
}

/** Film projektu do wiersza „Video” (W8; P-276): brak linku = null; nieznany projekt = `bledne_dane`. */
export async function filmProjektu(z: Pick<ZaleznosciPlikow, 'baza'>, w: { projektId: string }): Promise<Wynik<{ adres: string; nazwa: string | null } | null>> {
  const [p] = await wiersze(z.baza.all('SELECT film_adres, film_nazwa FROM projekt WHERE id = ?', [w.projektId]), 'film');
  if (!p) return blad('bledne_dane');
  const adres = tekstLubNull(p, 'film_adres');
  return { ok: true, wartosc: adres === null ? null : { adres, nazwa: tekstLubNull(p, 'film_nazwa') } };
}
/** Projekty z linkiem do filmu (arkusz skrzynki, P-283 (a): linia „zastąpi” przy pozycji „Video link”). */
export async function projektyZFilmem(z: Pick<ZaleznosciPlikow, 'baza'>): Promise<Wynik<string[]>> {
  const r = await wiersze(z.baza.all('SELECT id FROM projekt WHERE film_adres IS NOT NULL AND usunieto_ms IS NULL ORDER BY id'), 'film');
  return { ok: true, wartosc: r.map((x) => tekst(x, 'id')) };
}

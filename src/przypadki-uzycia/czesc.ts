// Przypadki użycia części i licznika z menu ••• (prototyp.html:129–138): nazwa części, cel części (U-8), przypomnienie (F-06, RD-13),
// długość powtórzenia (F-05, RD-12). Każdy zapis to UPDATE/INSERT jednej rzeczy w kolejce (ADR-0002); walidacja reguł w domenie.
import type { Wynik } from '../domena/bledy';
import { celZPary } from '../domena/cel-pary';
import { planPrzypomnien } from '../domena/przypomnienia';
import { rzedyCzesci } from '../dane/repozytoria/liczniki';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { OK, blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

const calkowita = (n: unknown, min: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min;

export function nazwijCzesc(z: Zaleznosci, w: { czescId: string; nazwa: string }): Promise<Wynik<void>> {
  if (typeof w.nazwa !== 'string' || w.nazwa.trim().length === 0) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'nazwijCzesc', async (tx, teraz) => {
    const r = await tx.run('UPDATE czesc SET nazwa = ?, zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL', [w.nazwa.trim(), teraz, w.czescId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Cel części w rzędach (U-8); `null` usuwa cel. */
export function ustawCel(z: Zaleznosci, w: { czescId: string; cel: number | null }): Promise<Wynik<void>> {
  if (w.cel !== null && !calkowita(w.cel, 1)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawCel', async (tx, teraz) => {
    const r = await tx.run('UPDATE czesc SET cel_rzedow = ?, zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL', [w.cel, teraz, w.czescId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Przypomnienie „od rzędu s, co N, M razy” (F-06); plan sprawdza domena (RD-13: N ≥ 1), s ≥ 1, M ≥ 1 (CHECK schematu). */
export function dodajPrzypomnienie(z: Zaleznosci, w: { licznikId: string; od: number; co: number; razy: number; tekst: string }): Promise<Wynik<{ id: string }>> {
  const plan = planPrzypomnien({ od: w.od, co: w.co, razy: w.razy });
  if (!plan.ok || !calkowita(w.od, 1) || !calkowita(w.razy, 1) || typeof w.tekst !== 'string') return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'dodajPrzypomnienie', async (tx, teraz) => {
    const [l] = await tx.all<{ n: number }>('SELECT count(*) AS n FROM licznik WHERE id = ? AND usunieto_ms IS NULL', [w.licznikId]);
    if (!l || l.n !== 1) return blad('bledne_dane');
    const id = z.id.nowy();
    await tx.run('INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, w.licznikId, w.od, w.co, w.razy, w.tekst.trim(), teraz]);
    return { ok: true, wartosc: { id } };
  });
}
/** Zmiana przypomnienia (F-06, 07-jakosc-011): ten sam wiersz i identyfikator; walidacja jak przy dodawaniu. Licznik i historia nietknięte. */
export function zmienPrzypomnienie(z: Zaleznosci, w: { id: string; od: number; co: number; razy: number; tekst: string }): Promise<Wynik<void>> {
  const plan = planPrzypomnien({ od: w.od, co: w.co, razy: w.razy });
  if (!plan.ok || !calkowita(w.od, 1) || !calkowita(w.razy, 1) || typeof w.tekst !== 'string') return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'zmienPrzypomnienie', async (tx, teraz) => {
    const r = await tx.run('UPDATE przypomnienie SET od_rzedu = ?, co_n = ?, razy = ?, tekst = ?, zmieniono_ms = ? WHERE id = ?', [w.od, w.co, w.razy, w.tekst.trim(), teraz, w.id]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Usunięcie przypomnienia (F-06, 07-jakosc-011): tylko ten wiersz; licznik, historia i inne przypomnienia zostają (znacznik usunięcia dla iCloud ustawia wyzwalacz schematu). */
export function usunPrzypomnienie(z: Zaleznosci, w: { id: string }): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'usunPrzypomnienie', async (tx) => {
    const r = await tx.run('DELETE FROM przypomnienie WHERE id = ?', [w.id]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Długość powtórzenia licznika (F-05, RD-12-W5: ≥ 1) i jego nazwa; `null` wyłącza powtórzenie. */
export function ustawPowtorzenie(z: Zaleznosci, w: { licznikId: string; dlugosc: number | null; nazwa?: string }): Promise<Wynik<void>> {
  if (w.dlugosc !== null && !calkowita(w.dlugosc, 1)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawPowtorzenie', async (tx, teraz) => {
    const r = await tx.run('UPDATE licznik SET dlugosc_powtorzenia = ?, nazwa = coalesce(?, nazwa), zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL',
      [w.dlugosc, w.nazwa?.trim() ?? null, teraz, w.licznikId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
/** Znaczenie liczby (BR-LIC-012, F-09): „skończone rzędy” albo „rząd w trakcie”; wartość i historia bez zmian (zmienia się tylko wyświetlanie). */
export function ustawZnaczenie(z: Zaleznosci, w: { licznikId: string; znaczenie: 'skonczone' | 'w_trakcie' }): Promise<Wynik<void>> {
  if (w.znaczenie !== 'skonczone' && w.znaczenie !== 'w_trakcie') return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawZnaczenie', async (tx, teraz) => {
    const r = await tx.run('UPDATE licznik SET znaczenie = ?, zmieniono_ms = ? WHERE id = ? AND usunieto_ms IS NULL', [w.znaczenie, teraz, w.licznikId]);
    return r.zmiany === 1 ? OK : blad('bledne_dane');
  });
}
export type NastepnaCzesc = { rodzaj: 'licznik'; licznikId: string } | { rodzaj: 'koniec'; czescId: string; czesc: string; projekt: string; celDrugiej: number | null };
/**
 * „Next part” (BR-LIC-011/S1, P-182 Q4a): następna nieusunięta część projektu (wg kolejności) z licznikiem → jej pierwszy licznik;
 * brak → `koniec` z danymi arkusza „What’s next?” (cel drugiej z pary = rzędy tej części, `celZPary`, BR-PRJ-014 S1/S3, P-199 Q2a). Tylko odczyt.
 */
export function nastepnaCzesc(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<NastepnaCzesc>> {
  return operacjaZapisu(z, 'nastepnaCzesc', async (tx): Promise<Wynik<NastepnaCzesc>> => {
    const [c] = await wiersze(tx.all(
      `SELECT c.id, c.nazwa, c.kolejnosc, c.cel_rzedow, c.projekt_id, p.nazwa AS projekt FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id
        WHERE l.id = ? AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL`, [w.licznikId]), 'nastepnaCzesc');
    if (!c) return blad('bledne_dane');
    const [n] = await wiersze(tx.all(
      `SELECT l.id FROM czesc c JOIN licznik l ON l.czesc_id = c.id
        WHERE c.projekt_id = ? AND c.usunieto_ms IS NULL AND l.usunieto_ms IS NULL AND (c.kolejnosc > ? OR (c.kolejnosc = ? AND c.id > ?))
        ORDER BY c.kolejnosc, c.id, l.kolejnosc, l.id LIMIT 1`, [tekst(c, 'projekt_id'), liczba(c, 'kolejnosc'), liczba(c, 'kolejnosc'), tekst(c, 'id')]), 'nastepnaCzesc');
    if (n) return { ok: true, wartosc: { rodzaj: 'licznik', licznikId: tekst(n, 'id') } };
    const czescId = tekst(c, 'id');
    const celDrugiej = celZPary({ cel: null, paraZ: czescId, rzedyPary: await rzedyCzesci(tx, czescId) }); // druga część będzie parą tej
    return { ok: true, wartosc: { rodzaj: 'koniec', czescId, czesc: tekst(c, 'nazwa'), projekt: tekst(c, 'projekt'), celDrugiej } };
  });
}

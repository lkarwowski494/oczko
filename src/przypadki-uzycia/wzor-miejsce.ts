// Pozycja wzoru w `ostatnie_miejsce` (07-jakosc-006, F-49, BR-PRJ-011 S1): strona i powiększenie ostatnio oglądanego wzoru oraz to, czy praca skończyła się na ekranie wzoru
// (start otwiera wtedy wzór). Zapis jednej wartości (`ustawienie`) jak `zapamietajLicznik`/`zapamietajWzor`; stan widoku jest osobny na urządzeniu (BR-PRJ-011 S3, KLUCZE_URZADZENIA).
import type { Wynik } from '../domena/bledy';
import { czytajMiejsce, poprawnaStrona, poprawnePowiekszenie } from '../domena/miejsce';
import { odczytajUstawienie, zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { liczbaLubNull, wiersze } from '../dane/repozytoria/wiersze';
import type { PortBazy } from '../domena/porty';
import { OK, blad, operacjaZapisu } from './zapis';
import { wzorDoZapisu } from './wzor';
import type { Zaleznosci } from './zaleznosci';

export type PozycjaWzoru = { strona: number; powiekszenie: number | null };

/** Wzór należy do projektu licznika (i licznik nie jest w koszu): inaczej zapis pozycji cudzego wzoru byłby po cichu przyjęty. */
async function wzorTegoLicznika(tx: PortBazy, licznikId: string, wzorId: string): Promise<boolean> {
  const [r] = await wiersze(tx.all(
    `SELECT w.projekt_id AS wp, c.projekt_id AS lp FROM wzor w, licznik l JOIN czesc c ON c.id = l.czesc_id
      WHERE w.id = ? AND l.id = ? AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL`, [wzorId, licznikId]), 'wzorTegoLicznika');
  return r !== undefined && r.wp === r.lp;
}

/**
 * Widok natywny zgłasza stronę (`onStrona`) i powiększenie (`onPowiekszenie`) osobno, więc brak pola oznacza „bez zmiany” (ten sam wzór) albo „brak” (inny wzór).
 * Zapis ustawia `ekran: 'wzor'`: jeśli aplikacja zostanie zamknięta na wzorze, start otworzy wzór; wyjście z ekranu wraca do `zapamietajLicznik` (ekran 'licznik').
 */
export function zapamietajPozycjeWzoru(z: Zaleznosci, w: { licznikId: string; wzorId: string; strona?: number; powiekszenie?: number }): Promise<Wynik<void>> {
  if ((w.strona !== undefined && !poprawnaStrona(w.strona)) || (w.powiekszenie !== undefined && !poprawnePowiekszenie(w.powiekszenie))) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'pozycjaWzoru', async (tx, teraz) => {
    if (!(await wzorTegoLicznika(tx, w.licznikId, w.wzorId))) return blad('bledne_dane');
    const stan = await wzorDoZapisu(tx, w.wzorId);
    if (stan) return blad(stan);
    const m = czytajMiejsce(await odczytajUstawienie(tx, 'ostatnie_miejsce'));
    const ten = m?.wzor === w.wzorId;
    const strona = w.strona ?? (ten ? m.strona : undefined);
    const powiekszenie = w.powiekszenie ?? (ten ? m.powiekszenie : undefined);
    await zapiszUstawienie(tx, 'ostatnie_miejsce', { ekran: 'wzor', id: w.licznikId, wzor: w.wzorId, ...(strona !== undefined ? { strona } : {}), ...(powiekszenie !== undefined ? { powiekszenie } : {}) }, teraz);
    return OK;
  });
}

/** Czy start ma otworzyć ekran wzoru: praca skończyła się na wzorze, wzór i licznik istnieją (nie w koszu) i są z tego samego projektu. Nic nie kasuje. */
export function startNaWzorze(z: Zaleznosci): Promise<Wynik<boolean>> {
  return operacjaZapisu(z, 'startNaWzorze', async (tx) => {
    const m = czytajMiejsce(await odczytajUstawienie(tx, 'ostatnie_miejsce'));
    if (m?.ekran !== 'wzor' || !m.wzor) return { ok: true, wartosc: false };
    if (!(await wzorTegoLicznika(tx, m.id, m.wzor))) return { ok: true, wartosc: false };
    const [w] = await wiersze(tx.all('SELECT usunieto_ms FROM wzor WHERE id = ?', [m.wzor]), 'startNaWzorze');
    return { ok: true, wartosc: w !== undefined && liczbaLubNull(w, 'usunieto_ms') === null };
  });
}

/** Pozycja do przywrócenia dla wzoru (null: ten wzór nie jest ostatnio oglądanym albo nie ma zapisanej pozycji). */
export async function pozycjaWzoru(tx: PortBazy, wzorId: string): Promise<PozycjaWzoru | null> {
  const m = czytajMiejsce(await odczytajUstawienie(tx, 'ostatnie_miejsce'));
  if (m?.wzor !== wzorId || (m.strona === undefined && m.powiekszenie === undefined)) return null;
  return { strona: m.strona ?? 0, powiekszenie: m.powiekszenie ?? null };
}

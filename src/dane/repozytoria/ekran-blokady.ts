// Odczyty stanu ekranu blokady i zegarka (moduly.md „Stan Live Activity i zegarka”, ADR-0008 (7), ADR-0009): licznik z dni limitu
// liczy wołający przez repozytorium liczników; tu tylko pola, których nie czyta nikt inny.
import type { PortBazy, PrzypomnienieStanu } from '../../domena/porty';
import { liczba, tekst, wiersze } from './wiersze';

export type LicznikEkranuBlokady = { id: string; wartosc: number; glowa: string | null; znaczenie: 'skonczone' | 'w_trakcie'; zablokowany: boolean; projektId: string };

/** Licznik poza koszem (licznik, część i projekt); usunięty albo nieistniejący → null. */
export async function licznikEkranuBlokady(tx: PortBazy, licznikId: string): Promise<LicznikEkranuBlokady | null> {
  const [w] = await wiersze(tx.all(
    `SELECT l.id, l.wartosc, l.glowa, l.znaczenie, l.zablokowany, c.projekt_id
       FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id
      WHERE l.id = ? AND l.usunieto_ms IS NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL`, [licznikId]), 'licznikEkranuBlokady');
  if (!w) return null;
  const g = w.glowa;
  return { id: tekst(w, 'id'), wartosc: liczba(w, 'wartosc'), glowa: typeof g === 'string' ? g : null, znaczenie: tekst(w, 'znaczenie') === 'w_trakcie' ? 'w_trakcie' : 'skonczone', zablokowany: liczba(w, 'zablokowany') === 1, projektId: tekst(w, 'projekt_id') };
}

/** Początek trwającej sesji projektu przesunięty o przerwy (czas na ekranie = teraz − wynik, ADR-0013); wstrzymana albo brak → null. */
export async function startSesjiEkranu(tx: PortBazy, projektId: string): Promise<number | null> {
  const [w] = await wiersze(tx.all("SELECT start_ms + przerwy_ms AS s FROM sesja WHERE projekt_id = ? AND stan = 'trwa'", [projektId]), 'startSesjiEkranu');
  return w ? liczba(w, 's') : null;
}

/** Plan RD-13 licznika w kolejności „od rzędu”, potem id (stała kolejność ładunku). */
export async function przypomnieniaLicznika(tx: PortBazy, licznikId: string): Promise<PrzypomnienieStanu[]> {
  const w = await wiersze(tx.all('SELECT od_rzedu, co_n, razy, tekst FROM przypomnienie WHERE licznik_id = ? ORDER BY od_rzedu, id', [licznikId]), 'przypomnieniaLicznika');
  return w.map((r) => ({ od: liczba(r, 'od_rzedu'), co: liczba(r, 'co_n'), razy: liczba(r, 'razy'), tekst: tekst(r, 'tekst') }));
}

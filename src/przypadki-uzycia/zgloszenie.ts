// „Zgłoś problem” (F-57, ADR-0018): podgląd treści bez zapisu do bazy.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Treść techniczna dla dewelopera (nie tekst interfejsu): wersja schematu, liczności tabel, ostatnie kody błędów, a pod `js_*` ramki
// „plik:linia:kolumna” (M1-058, DEC-19 a) — bez nazw, notatek i treści (NFR-PRY-001).
import type { Wynik } from '../domena/bledy';
import { OSTATNIE_BLEDY, WERSJA_SCHEMATU } from '../konfiguracja';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { linieBledu } from '../niezawodnosc/ramki-bledu';
import type { Zaleznosci } from './zaleznosci';

export async function przygotujZgloszenie(z: Zaleznosci): Promise<Wynik<{ tresc: string }>> {
  const tabele = (await wiersze(z.baza.all("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"), 'zgloszenie')).map((r) => tekst(r, 'name'));
  const licznosci: string[] = [];
  for (const t of tabele) {
    const [n] = await wiersze(z.baza.all(`SELECT count(*) AS n FROM "${t.replace(/"/g, '""')}"`), 'zgloszenie');
    licznosci.push(`${t}=${n ? liczba(n, 'n') : 0}`);
  }
  const bledy = await wiersze(z.baza.all('SELECT czas_ms, kod, szczegoly FROM blad ORDER BY id DESC LIMIT ?', [OSTATNIE_BLEDY]), 'zgloszenie'); // z `szczegoly` tylko ramki js_* (ramki-bledu.ts)
  const tresc = [
    `schema=${WERSJA_SCHEMATU}`,
    `counts: ${licznosci.join(' ')}`,
    'errors:',
    ...bledy.flatMap((b) => linieBledu({ czasMs: liczba(b, 'czas_ms'), kod: tekst(b, 'kod'), szczegoly: b.szczegoly })),
  ].join('\n');
  return { ok: true, wartosc: { tresc } };
}

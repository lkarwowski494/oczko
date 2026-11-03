// „Zgłoś problem” (F-57, ADR-0018): podgląd treści bez zapisu do bazy.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Treść techniczna dla dewelopera (nie tekst interfejsu): wersja schematu, liczności tabel, ostatnie kody błędów — bez nazw, notatek i treści (NFR-PRY-001).
import type { Wynik } from '../domena/bledy';
import { OSTATNIE_BLEDY, WERSJA_SCHEMATU } from '../konfiguracja';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import type { Zaleznosci } from './zaleznosci';

export async function przygotujZgloszenie(z: Zaleznosci): Promise<Wynik<{ tresc: string }>> {
  const tabele = (await wiersze(z.baza.all("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"), 'zgloszenie')).map((r) => tekst(r, 'name'));
  const licznosci: string[] = [];
  for (const t of tabele) {
    const [n] = await wiersze(z.baza.all(`SELECT count(*) AS n FROM "${t.replace(/"/g, '""')}"`), 'zgloszenie');
    licznosci.push(`${t}=${n ? liczba(n, 'n') : 0}`);
  }
  const bledy = await wiersze(z.baza.all('SELECT czas_ms, kod FROM blad ORDER BY id DESC LIMIT ?', [OSTATNIE_BLEDY]), 'zgloszenie'); // bez `szczegoly`: tylko kod i czas
  const tresc = [
    `schema=${WERSJA_SCHEMATU}`,
    `counts: ${licznosci.join(' ')}`,
    'errors:',
    ...bledy.map((b) => `${new Date(liczba(b, 'czas_ms')).toISOString()} ${tekst(b, 'kod')}`),
  ].join('\n');
  return { ok: true, wartosc: { tresc } };
}

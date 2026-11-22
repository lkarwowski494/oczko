// Migawka projektów w toku dla rozszerzenia „Udostępnij do Oczka” (P-220 R1a/N2, P-243 S1a; moduly.md „Kontrakt partii 6”: MigawkaProjektow.zapisz).
// Woła kompozycja po COMMIT operacji zmieniających listę projektów w toku i przy starcie. Błąd zapisu migawki nie cofa operacji: wpis `blad`
// (`migawka_zapis`), rozszerzenie pokaże stan zastępczy („Choose in Oczko”).
import type { Wynik } from '../domena/bledy';
import type { MigawkaProjektow, ProjektMigawki } from '../domena/porty';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { liczba, liczbaLubNull, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { OK, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type ZaleznosciMigawki = Zaleznosci & { migawka: MigawkaProjektow; jezyk(): string }; // jezyk: język aplikacji (P-190, P-248 D2a)

/** Kolejność jak lista projektów w toku (`listaProjektow`: ostatnia praca malejąco). */
export async function odswiezMigawke(z: ZaleznosciMigawki): Promise<Wynik<void>> {
  const w = await operacjaZapisu(z, 'migawka', async (tx) => {
    const r = await wiersze(tx.all(`SELECT p.id, p.nazwa, p.nienazwany, p.utworzono_ms, p.ostatnia_praca_ms, p.film_adres IS NOT NULL AS film,
        (SELECT count(*) FROM wzor w WHERE w.projekt_id = p.id AND w.usunieto_ms IS NULL) AS wzory
      FROM projekt p WHERE p.stan = 'w_toku' AND p.usunieto_ms IS NULL ORDER BY p.ostatnia_praca_ms DESC, p.id`), 'migawka');
    return { ok: true, wartosc: r.map((x): ProjektMigawki => ({ id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), nienazwany: liczba(x, 'nienazwany') === 1,
      utworzonoMs: liczba(x, 'utworzono_ms'), ostatniaPracaMs: liczbaLubNull(x, 'ostatnia_praca_ms'), wzory: liczba(x, 'wzory'), film: liczba(x, 'film') === 1 })) };
  });
  if (!w.ok) return w;
  try {
    await z.migawka.zapisz(w.wartosc, z.jezyk());
  } catch {
    await zapiszBlad(z.baza, { czasMs: z.zegar.teraz().ms, kod: 'migawka_zapis' });
  }
  return OK;
}

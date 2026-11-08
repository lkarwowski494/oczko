// Miejsce pracy dla „Kontynuuj ›” na „Dziś” (M3 p2, P-569; BR-PRJ-011 S1) — wydzielone z kompozycja/licznik.ts (limit rozmiaru pliku, granice ROZMIAR).
// Bez bieżącego licznika: projekty są → 'lista' (moduly.md:238, :425: miejsce w koszu albo brak klucza → karta „Wybierz projekt ›”), inaczej świeża instalacja;
// z licznikiem: praca skończyła się na wzorze → 'wzor' (07-jakosc-006), inaczej 'licznik'.
import type { Wynik } from '../domena/bledy';
import { liczba, wiersze } from '../dane/repozytoria/wiersze';
import { startNaWzorze } from '../przypadki-uzycia/wzor-miejsce';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';

export type MiejscePracy = 'licznik' | 'wzor' | 'lista';

export async function miejscePracy(z: Zaleznosci, licznikId: string | null): Promise<Wynik<MiejscePracy>> {
  if (!licznikId) {
    const [p] = await wiersze(z.baza.all('SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NULL'), 'przygotuj');
    return { ok: true, wartosc: p && liczba(p, 'n') > 0 ? 'lista' : 'licznik' };
  }
  const n = await startNaWzorze(z);
  return { ok: true, wartosc: n.ok && n.wartosc ? 'wzor' : 'licznik' };
}

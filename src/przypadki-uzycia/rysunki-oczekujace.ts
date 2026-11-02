// M1-084 (08-programista-501): pliki oczekujące rysunków stron z widoku natywnego (katalog `rysunki-wzoru`) — nazwa, odrzucenia trwałe i sprzątanie
// starszych plików strony po udanym zapisie. Wydzielone z wzor.ts (limit rozmiaru pliku, granice ROZMIAR); używają `zapiszRysunek` i `odzyskajRysunki`.
import type { Powod } from '../domena/bledy';
import { czasZmiany, lista, polacz, usunPlik } from '../dane/pliki/system';

/** M1-084: nazwa pliku oczekującego z widoku natywnego `<wzorId>__<strona>__<uuid>.pkdrawing` (WidokWzoru.swift `zapiszTeraz`). */
export const PLIK_OCZEKUJACY = /^(.+)__(\d+)__[^/]+\.pkdrawing$/;
/** M1-084: odrzucenia, których ponowienie nie zmieni (zła strona, brak wzoru, wzór albo projekt w koszu) — tylko wtedy plik oczekujący znika bez zapisu. */
export const ODRZUCENIA_TRWALE: readonly Powod[] = ['bledne_dane', 'niedozwolone_przejscie'];
/** M1-084: po udanym zapisie strony usuwa z tego samego katalogu pliki oczekujące tej strony zmienione wcześniej niż zapisany; błąd sprzątania nie zmienia wyniku. */
export function usunStarszeOczekujace(w: { wzorId: string; strona: number; plikTymczasowy: string }, czas: number): void {
  try {
    const i = w.plikTymczasowy.lastIndexOf('/');
    const katalog = w.plikTymczasowy.slice(0, i);
    for (const nazwa of lista(katalog)) {
      const m = PLIK_OCZEKUJACY.exec(nazwa);
      const sciezka = polacz(katalog, nazwa);
      if (!m || m[1] !== w.wzorId || Number(m[2]) !== w.strona || sciezka === w.plikTymczasowy) continue;
      const c = czasZmiany(sciezka);
      if (c !== null && c < czas) usunPlik(sciezka);
    }
  } catch { /* plik starszy zostaje; odzysk weźmie najnowszy */ }
}

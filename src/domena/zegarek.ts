// Zegarek (ADR-0009, F-12): stan wysyłany telefon → zegarek (`StanZegarka`, złote pliki tests/wspolne/stan-zegarka-*.json)
// i zdarzenia z zegarka (`ZdarzenieWejsciowe`, `zrodlo: 'zegarek'`) jako wejście funkcji `scal` (ADR-0005, NFR-ZEG-001).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). Ciała: zaślepki roli 07 (E3).
import { scalDni, type DzienLimitu } from './limit';
import { STAN_NAZWA_MAKS_ZNAKOW, STAN_PRZYPOMNIENIA_MAKS, STAN_PRZYPOMNIENIE_TEKST_MAKS, WERSJA_STANU } from '../konfiguracja';
import type { PrzypomnienieStanu, StanEkranuBlokady, StanZegarka, ZdarzenieWejsciowe } from './porty';
import type { ZdarzenieLicznika } from './scal';

export type WejscieStanuZegarka = {
  licznik: { id: string; wartosc: number; glowa: string | null; znaczenie: 'skonczone' | 'w_trakcie'; zablokowany: boolean }; // zablokowany: F-03 (wersja 3, N1)
  nazwa: string; // nazwa projektu albo etykieta projektu roboczego w bieżącym języku (P-126 (1b)) — liczy wołający przez t()
  dzis: string; // RRRR-MM-DD (RD-16)
  dzienDozwolony: boolean;
  sesjaStartMs: number | null;
  ostatniPlusMs: number | null; // czas ostatniego +1 w dowolnym projekcie (moduly.md, wersja 2; P-132 (2c)) — przerwa nowego dnia w intencji, ADR-0008 (1)
  dostep: { pro: boolean; wygasa: number | null }; // wygasa null = bez końca (R-031)
  dniLimitu: DzienLimitu[]; // wszystkie wiersze dzien_limitu, dowolna kolejność
  przypomnienia: PrzypomnienieStanu[]; // plan RD-13 licznika
};
/** Ciąg dalszy znaku: znak łączący (w tym selektory wariantu), modyfikator karnacji, ZWJ, znaczniki flag podregionów. */
const CIAG_DALSZY = /^(?:\p{M}|\p{Emoji_Modifier}|\u200D|[\u{E0020}-\u{E007F}])$/u;
/**
 * Najwyżej `n` punktów kodowych bez niepełnego znaku na końcu (P-131 (1)): z `Intl.Segmenter` (gdy jest) całe grafemy; bez niego granica
 * cofnięta przed ZWJ, selektorem wariantu, znakiem łączącym i modyfikatorem karnacji. `zSegmenterem`: tylko dla testu obu ścieżek.
 */
export function utnijZnaki(t: string, n: number, zSegmenterem = true): string {
  const punkty = Array.from(t);
  if (punkty.length <= n) return t;
  const Segmenter = zSegmenterem && 'Segmenter' in Intl ? Intl.Segmenter : undefined;
  if (Segmenter) {
    let wynik = '', ile = 0;
    for (const { segment } of new Segmenter(undefined, { granularity: 'grapheme' }).segment(t)) {
      const d = Array.from(segment).length;
      if (ile + d > n) break;
      wynik += segment; ile += d;
    }
    return wynik;
  }
  let k = n;
  while (k > 0 && (CIAG_DALSZY.test(punkty[k] ?? '') || punkty[k - 1] === '\u200D')) k--;
  return punkty.slice(0, k).join('');
}
const utnij = (t: string, n: number): string => utnijZnaki(t, n);
/**
 * Stan Live Activity i zegarka, wersja 3 (moduly.md „Stan Live Activity i zegarka”, ADR-0009): `dniWMiesiacu` = dni limitu z miesiąca dnia `dzis`,
 * rosnąco (OR po dacie); nazwa i przypomnienia ucięte do limitów z konfiguracji, żeby ładunek był < 4 KB (rejestr Apple 1b).
 */
export function stanEkranuBlokady(w: WejscieStanuZegarka): StanEkranuBlokady {
  const miesiac = w.dzis.slice(0, 7);
  const dniWMiesiacu = scalDni({ a: w.dniLimitu.filter((d) => d.data.startsWith(miesiac)), b: [] }).map((d) => ({ dzien: d.data, pro: d.pro }));
  return {
    wersja: WERSJA_STANU,
    licznikId: w.licznik.id,
    nazwa: utnij(w.nazwa, STAN_NAZWA_MAKS_ZNAKOW),
    wartosc: w.licznik.wartosc,
    znaczenie: w.licznik.znaczenie,
    glowa: w.licznik.glowa,
    ostatniPlusMs: w.ostatniPlusMs,
    dzien: w.dzis,
    dzienDozwolony: w.dzienDozwolony,
    sesjaStartMs: w.sesjaStartMs,
    pro: w.dostep.pro,
    proWaznoscDo: w.dostep.wygasa,
    dniWMiesiacu,
    przypomnienia: w.przypomnienia.slice(0, STAN_PRZYPOMNIENIA_MAKS).map((p) => ({ ...p, tekst: utnij(p.tekst, STAN_PRZYPOMNIENIE_TEKST_MAKS) })),
    zablokowany: w.licznik.zablokowany,
  };
}
/** Zegarek dostaje ten sam ładunek co Live Activity (StanZegarka = StanEkranuBlokady, ADR-0009). */
export const stanZegarka: (w: WejscieStanuZegarka) => StanZegarka = stanEkranuBlokady;
/** Zdarzenie z zegarka albo ekranu blokady → zdarzenie licznika dla `scal` (te same id i rodzice, bez wyróżnienia źródła). */
export function zdarzenieZWejscia(z: ZdarzenieWejsciowe): ZdarzenieLicznika {
  return { id: z.id, licznik: z.licznikId, rodzaj: z.rodzaj, rodzice: [...z.rodzice] };
}

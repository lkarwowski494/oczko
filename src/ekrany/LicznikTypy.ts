// Typy ekranu licznika (stan, wynik +1, propsy) — wydzielone z Licznik.tsx przy limicie rozmiaru pliku (P-268, plan-prac 1.6); bez zmiany zachowania.
import type React from 'react';
import type { KonfliktNaLiczniku } from './IcloudKonflikt';
import type { Haptyka } from '../domena/porty';
import type { Oglos, Tlumacz, WynikEkranu } from './wspolne';

/** Stan limitu dni na liczniku (P-065, design-spec.md:15–19). Decyzję liczy domena (`mozeZaczacDzien`), ekran tylko pokazuje. */
export type LimitNaLiczniku =
  | { rodzaj: 'brak' }                 // Pro albo zostały ≥ 2 dni: na liczniku nic o dniach (BR-ZAK-006/S5, P-046)
  | { rodzaj: 'ostatni-darmowy' }      // cicha linia „1 free crafting day left in {month}” (design-spec.md:18)
  | { rodzaj: 'zawczasu' };            // komunikat zamiast +1 i −1 (design-spec.md:16)

/** Baner pod tytułem (design-spec.md:35); `null` = nic (BR-LIC-019/S4). */
export type BanerLicznika =
  | { rodzaj: 'seria'; n: number; sekundy: number }   // „Added 3 rows in 1 s. Undo?”
  | { rodzaj: 'cofnieto'; n: number; wartosc: number } // „Removed 3 rows. Back to 30.”
  | null;

export type StanEkranuLicznika = {
  projekt: string | null;              // null: pierwszy licznik bez nazwy (BR-LIC-001, NFR-PIE-001)
  czesc: string | null;
  skonczone: number;                   // duża liczba = rzędy skończone (design-spec.md:30)
  dziergany: number;                   // „Now working row N”
  znaczenie: 'skonczone' | 'w_trakcie'; // F-09; zgłoszenie Z07-04 (czy tryb zostaje)
  cel: number | null;                  // „Goal 96 rows · 49 to go” (design-spec.md:24)
  celDnia: { rzedy: number } | null;   // tylko przy terminie (BR-DNI-005/S5)
  przypomnienie: { tekst: string; ktory: number; razy: number; nastepny: number | null } | null; // rząd dziergany z instrukcją
  powtorzenie: { nazwa: string; numer: number; rzadW: number; dlugosc: number } | null;
  notatka: string | null;              // BR-PRJ-002/S1: widoczna przy liczniku
  sesja: { rzedy: number; od: string } | null; // „Marks this session: 14 rows since 19:52” (od: godzina sformatowana)
  zablokowany: boolean;                // F-03 (design-spec.md:34)
  limit: LimitNaLiczniku;
  miesiac: { nazwa: string; wznowienie: string; rzedyDanych: number }; // sformatowane („November”, „December 1”); rzedyDanych do „Your {n} rows …”
  baner: BanerLicznika;
  blizniak: { rzad: number; notatka: string | null; przypomnienie: string | null } | null; // BR-PRJ-014/S2
  wibracje: boolean;                   // ustawienie (BR-LIC-020/S3)
  calosc?: { czesc: string; rzedy: number } | null; // licznik sekcji: „{część} in total: N rows” (BR-LIC-018/S1, partia 5)
  konflikt?: KonfliktNaLiczniku;
};

/** Co zaszło w rzędzie po +1 (haptyka F-48: dwa wzorce; ogłoszenie przy wejściu w rząd z instrukcją). */
export type ZdarzeniePlus = 'rzad' | 'przypomnienie' | 'koniec-powtorzenia' | 'cel-dnia' | 'cel-czesci';
export type WynikPlus = WynikEkranu<{
  skonczone: number;
  dziergany: number;
  zdarzenia: ZdarzeniePlus[];
  wejscieWPrzypomnienie: { rzad: number; tekst: string; ktory: number; razy: number } | null;
}>;

export type PropsLicznika = {
  stan: StanEkranuLicznika;
  t: Tlumacz;
  oglos: Oglos;                        // ogłoszenie dopiero po wyniku ok (R-148)
  haptyka: Haptyka;
  /** Przypadek użycia `dodajRzad` (moduly.md:69–75); wynik po COMMIT; `powod: 'zapis' | 'limit' | 'zablokowany'`. */
  naPlus(): Promise<WynikPlus>;
  naMinus(): Promise<WynikEkranu<{ skonczone: number }>>;
  naOdblokuj(): void;                  // pasek „Counter locked · Unlock”
  naCofnijSerie(): void;               // „Undo 3 rows”
  naOferty(): void;                    // tylko z komunikatu limitu (KP-13)
  naHistorie(): void;
  naMenu(): void;                      // menu ••• projektu
  naNastepnaCzesc(): void;             // BR-LIC-011/S1 (U-11)
  naProjekty?(): void;                 // „Projects” w pasku nawigacji (powrót do listy, F-50)
  naWzor?(): void;                     // ikona „Pattern” — tylko gdy projekt ma ≥ 1 wzór (P-220 W2a, P-046); partia 6
  naProjekt?(): void;                  // nazwa projektu nad tytułem części otwiera ekran projektu (design-spec „Ekran projektu”, partia 5)
  /** Stoper sesji (P-191 P1a): pierwszy z prawej grupy paska, przed Historią; działa przy limicie i blokadzie (P2a). Składa kompozycja. */
  stoper?: React.ReactNode;
  /** Linia „zapomniany stoper” (P-191 P5a) pod kreskami sesji; składa kompozycja. */
  sprawdzStopera?: React.ReactNode;
  naKonflikt?(): void;
};

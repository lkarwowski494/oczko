// Przewodnik po funkcjach (KO-027; spec 04 `docs/design/przewodnik-2026-11-10.md`, P-685–P-689; P-690): struktura treści i logika czysta.
// Teksty w słownikach (`przewodnik.*`); nazwy funkcji i grup to istniejące klucze interfejsu (§7). Źródło struktury: `przewodnik-2026-11-10/tresc.json` (test zgodności).
import type { Klucz } from '../i18n/typy';

/** Trasy „Pokaż” (expo-router); `/projekt/[id]` = projekt ostatniego miejsca pracy. */
export type TrasaPrzewodnika = '/' | '/dni' | '/druty' | '/jezyk' | '/kosz' | '/licznik' | '/miary' | '/probka' | '/projekt/[id]' | '/projekty' | '/stan-danych' | '/ustawienia' | '/wzor' | '/zapas' | '/zglos' | '/zrodla';
export type Nazwa = { readonly klucz: Klucz } | { readonly literal: string };
export interface FunkcjaPrzewodnika { readonly id: string; readonly nazwa: Nazwa; readonly opis: Klucz; readonly trasa: TrasaPrzewodnika | null; readonly zapas?: TrasaPrzewodnika }
export interface GrupaPrzewodnika { readonly id: string; readonly nazwa: Klucz; readonly funkcje: readonly FunkcjaPrzewodnika[] }
export interface KrokPrzewodnika { readonly n: number; readonly tekst: Klucz; readonly trasa: TrasaPrzewodnika; readonly zapas?: TrasaPrzewodnika }

/** „Pierwsze kroki” (§2.2): zawsze widoczne, bez stanu przeczytania. */
export const KROKI: readonly KrokPrzewodnika[] = [
  { n: 1, tekst: 'przewodnik.krok_1', trasa: '/' },
  { n: 2, tekst: 'przewodnik.krok_2', trasa: '/licznik', zapas: '/' },
  { n: 3, tekst: 'przewodnik.krok_3', trasa: '/licznik', zapas: '/' },
  { n: 4, tekst: 'przewodnik.krok_4', trasa: '/wzor', zapas: '/' },
  { n: 5, tekst: 'przewodnik.krok_5', trasa: '/' },
  { n: 6, tekst: 'przewodnik.krok_6', trasa: '/projekty' },
];

/** Biblioteka funkcji (§2.4): 9 grup, 42 funkcje; id = część testID `przewodnik-f-{id}` (§6). */
export const GRUPY: readonly GrupaPrzewodnika[] = [
  { id: 'dzis', nazwa: 'zakladki.dzis', funkcje: [
    { id: 'kontynuuj', nazwa: { klucz: 'dzis.kontynuuj' }, opis: 'przewodnik.f_kontynuuj', trasa: '/' },
    { id: 'tydzien', nazwa: { klucz: 'dzis.ten_tydzien' }, opis: 'przewodnik.f_tydzien', trasa: '/' },
  ] },
  { id: 'licznik', nazwa: 'licznik.tytul_roboczy', funkcje: [
    { id: 'plus', nazwa: { klucz: 'licznik.plus' }, opis: 'przewodnik.f_plus', trasa: '/licznik', zapas: '/' },
    { id: 'historia-licznika', nazwa: { klucz: 'licznik.akcja_historia' }, opis: 'przewodnik.f_historia_licznika', trasa: '/licznik', zapas: '/' },
    { id: 'wpisz', nazwa: { klucz: 'menu.wpisz' }, opis: 'przewodnik.f_wpisz', trasa: '/licznik', zapas: '/' },
    { id: 'blokada', nazwa: { klucz: 'menu.zablokuj' }, opis: 'przewodnik.f_blokada', trasa: '/licznik', zapas: '/' },
    { id: 'znaczenie', nazwa: { klucz: 'menu.znaczenie' }, opis: 'przewodnik.f_znaczenie', trasa: '/licznik', zapas: '/' },
    { id: 'cel', nazwa: { klucz: 'menu.cel' }, opis: 'przewodnik.f_cel', trasa: '/licznik', zapas: '/' },
    { id: 'przypomnienia', nazwa: { klucz: 'przyp.tytul' }, opis: 'przewodnik.f_przypomnienia', trasa: '/licznik', zapas: '/' },
    { id: 'powtorzenie', nazwa: { klucz: 'menu.powtorzenie' }, opis: 'przewodnik.f_powtorzenie', trasa: '/licznik', zapas: '/' },
    { id: 'notatka', nazwa: { klucz: 'licznik.akcja_notatka' }, opis: 'przewodnik.f_notatka', trasa: '/licznik', zapas: '/' },
    { id: 'stoper', nazwa: { klucz: 'licznik.akcja_stoper' }, opis: 'przewodnik.f_stoper', trasa: '/licznik', zapas: '/' },
    { id: 'dodaj-licznik', nazwa: { klucz: 'projekt.dodaj_licznik' }, opis: 'przewodnik.f_dodaj_licznik', trasa: '/projekt/[id]', zapas: '/projekty' },
  ] },
  { id: 'projekty', nazwa: 'zakladki.projekty', funkcje: [
    { id: 'nowy', nazwa: { klucz: 'projekty.nowy' }, opis: 'przewodnik.f_nowy', trasa: '/projekty' },
    { id: 'szukaj', nazwa: { klucz: 'projekty.szukaj' }, opis: 'przewodnik.f_szukaj', trasa: '/projekty' },
    { id: 'taki-sam', nazwa: { klucz: 'projekt.zrob_taka_sama' }, opis: 'przewodnik.f_taki_sam', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'termin', nazwa: { klucz: 'projekt.termin' }, opis: 'przewodnik.f_termin', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'zdjecia', nazwa: { klucz: 'zdjecia.naglowek' }, opis: 'przewodnik.f_zdjecia', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'szczegoly', nazwa: { klucz: 'projekt.szczegoly' }, opis: 'przewodnik.f_szczegoly', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'sesje', nazwa: { klucz: 'projekt.sesje' }, opis: 'przewodnik.f_sesje', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'ukoncz', nazwa: { klucz: 'menu.ukoncz' }, opis: 'przewodnik.f_ukoncz', trasa: '/projekt/[id]', zapas: '/projekty' },
    { id: 'kosz', nazwa: { klucz: 'projekty.kosz' }, opis: 'przewodnik.f_kosz', trasa: '/kosz' },
  ] },
  { id: 'wzor', nazwa: 'projekt.wzor', funkcje: [
    { id: 'dodaj-wzor', nazwa: { klucz: 'wzor.dodaj' }, opis: 'przewodnik.f_dodaj_wzor', trasa: '/wzor', zapas: '/' },
    { id: 'znacznik', nazwa: { klucz: 'wzor.zaznacz_rzad' }, opis: 'przewodnik.f_znacznik', trasa: '/wzor', zapas: '/' },
    { id: 'zakreslacz', nazwa: { klucz: 'wzor.zakreslacz' }, opis: 'przewodnik.f_zakreslacz', trasa: '/wzor', zapas: '/' },
    { id: 'film', nazwa: { klucz: 'wzor.dodaj_film' }, opis: 'przewodnik.f_film', trasa: '/wzor', zapas: '/' },
  ] },
  { id: 'narzedzia', nazwa: 'zakladki.narzedzia', funkcje: [
    { id: 'wloczki', nazwa: { klucz: 'narzedzia.wloczki' }, opis: 'przewodnik.f_wloczki', trasa: '/zapas' },
    { id: 'druty', nazwa: { klucz: 'narzedzia.druty' }, opis: 'przewodnik.f_druty', trasa: '/druty' },
    { id: 'probka', nazwa: { klucz: 'narzedzia.probka' }, opis: 'przewodnik.f_probka', trasa: '/probka' },
  ] },
  { id: 'historia', nazwa: 'zakladki.historia', funkcje: [
    { id: 'kalendarz', nazwa: { klucz: 'zakladki.historia' }, opis: 'przewodnik.f_kalendarz', trasa: '/dni' },
  ] },
  { id: 'ustawienia', nazwa: 'ustawienia.tytul', funkcje: [
    { id: 'wibracje', nazwa: { klucz: 'ustawienia.wibracje' }, opis: 'przewodnik.f_wibracje', trasa: '/ustawienia' },
    { id: 'ekran', nazwa: { klucz: 'ustawienia.ekran_nie_gasnie' }, opis: 'przewodnik.f_ekran', trasa: '/ustawienia' },
    { id: 'jednostki', nazwa: { klucz: 'ustawienia.uklad_miar' }, opis: 'przewodnik.f_jednostki', trasa: '/miary' },
    { id: 'dane', nazwa: { klucz: 'ustawienia.stan_danych' }, opis: 'przewodnik.f_dane', trasa: '/stan-danych' },
    { id: 'eksport', nazwa: { klucz: 'ustawienia.eksport' }, opis: 'przewodnik.f_eksport', trasa: '/ustawienia' },
    { id: 'usun', nazwa: { klucz: 'ustawienia.usun_wszystko' }, opis: 'przewodnik.f_usun', trasa: '/ustawienia' },
    { id: 'jezyk', nazwa: { klucz: 'ustawienia.jezyk' }, opis: 'przewodnik.f_jezyk', trasa: '/jezyk' },
    { id: 'zglos', nazwa: { klucz: 'zglos.tytul' }, opis: 'przewodnik.f_zglos', trasa: '/zglos' },
    { id: 'zrodla', nazwa: { klucz: 'ustawienia.zrodla_wiedzy' }, opis: 'przewodnik.f_zrodla', trasa: '/zrodla' },
  ] },
  { id: 'pro', nazwa: 'oferty.tytul', funkcje: [
    { id: 'pro', nazwa: { klucz: 'oferty.tytul' }, opis: 'przewodnik.f_pro', trasa: '/ustawienia' },
  ] },
  { id: 'poza', nazwa: 'przewodnik.grupa_poza', funkcje: [
    { id: 'zegarek', nazwa: { literal: 'Apple Watch' }, opis: 'przewodnik.f_zegarek', trasa: null },
    { id: 'ekran-blokady', nazwa: { klucz: 'przewodnik.nazwa_ekran_blokady' }, opis: 'przewodnik.f_ekran_blokady', trasa: '/licznik', zapas: '/' },
  ] },
];

export const FUNKCJE: readonly FunkcjaPrzewodnika[] = GRUPY.flatMap((g) => g.funkcje);
const ID_FUNKCJI: ReadonlySet<string> = new Set(FUNKCJE.map((f) => f.id));
/** Klucz opisu funkcji: `przewodnik.f_{id}` (myślnik w id → podkreślnik, §7). */
export const kluczOpisu = (id: string): string => `przewodnik.f_${id.replace(/-/g, '_')}`;

/** Przeczytane z zapisu (`ustawienie.przewodnik_przeczytane`, P-688, P-690): tylko znane id, bez powtórzeń; brak albo zły zapis = []. */
export function przeczytaneZZapisu(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const wynik: string[] = [];
  for (const id of v as unknown[]) if (typeof id === 'string' && ID_FUNKCJI.has(id) && !wynik.includes(id)) wynik.push(id);
  return wynik;
}
/** Pierwsze rozwinięcie funkcji = przeczytana (jak Trening `markGuideSeen`, `lib/guide.ts:78`); nieznane id bez zmiany. */
export const dodajPrzeczytana = (lista: readonly string[], id: string): string[] => (ID_FUNKCJI.has(id) && !lista.includes(id) ? [...lista, id] : [...lista]);
export const postep = (przeczytane: readonly string[]): { n: number; m: number } => ({ n: przeczytane.filter((id) => ID_FUNKCJI.has(id)).length, m: FUNKCJE.length });

/** Zakładki (`app/(zakladki)`): „Pokaż” zamyka stos i przechodzi do zakładki, bez drugiego zestawu zakładek (Trening `app/guide.tsx:21`). */
const ZAKLADKI = ['/', '/projekty', '/dni'] as const;
type Zakladka = (typeof ZAKLADKI)[number];
const jestZakladka = (t: TrasaPrzewodnika): t is Zakladka => (ZAKLADKI as readonly string[]).includes(t);
export type CelPokaz = { rodzaj: 'zakladka'; sciezka: Zakladka } | { rodzaj: 'ekran'; sciezka: Exclude<TrasaPrzewodnika, Zakladka>; id?: string };
/** Ostatnie miejsce pracy: bieżący licznik i jego projekt (null = licznik bez projektu albo brak licznika). */
export interface MiejscePracy { readonly licznikId: string | null; readonly projektId: string | null }

/**
 * Cel „Pokaż” (P-687, P-691): licznik wymaga bieżącego licznika, wzór i projekt — projektu ostatniego miejsca (wzór należy do projektu);
 * bez nich trasa zapasowa z treści 04 (`/` z kartą „Pierwszy licznik”, `/projekty`). Trasa bez zapasu nie zależy od miejsca.
 */
export function celPokaz(c: { trasa: TrasaPrzewodnika; zapas: TrasaPrzewodnika | undefined }, m: MiejscePracy): CelPokaz {
  const brakMiejsca = (c.trasa === '/licznik' && m.licznikId === null) || ((c.trasa === '/wzor' || c.trasa === '/projekt/[id]') && m.projektId === null);
  const trasa = brakMiejsca && c.zapas !== undefined ? c.zapas : c.trasa;
  if (jestZakladka(trasa)) return { rodzaj: 'zakladka', sciezka: trasa };
  if (trasa === '/projekt/[id]') return m.projektId === null ? { rodzaj: 'zakladka', sciezka: '/projekty' } : { rodzaj: 'ekran', sciezka: trasa, id: m.projektId };
  return { rodzaj: 'ekran', sciezka: trasa };
}

// 006 (P-614 (1), design-spec „Fix E5”, zadania-08 „Wstecz”): etykieta „wstecz” = tytuł poprzedniego ekranu w stosie (ten sam klucz i18n co jego duży tytuł);
// tytuł dynamiczny (nazwa projektu, licznika) z rejestru ekranów; nazwa dłuższa niż ok. 1/3 paska albo ekran bez znanego tytułu → systemowe „Back” (null).
// Czysta funkcja, bez expo-router — stan stosu i szerokość okna przychodzą jako argumenty (hak: `wstecz-trasa.ts`).
import type { Klucz } from '../i18n/typy';

/** Trasa stosu (podzbiór stanu nawigacji react-navigation). */
export type TrasaStosu = { readonly key: string; readonly name: string; readonly params?: object; readonly state?: { readonly index?: number; readonly routes: readonly { readonly name: string }[] } };

/** Duże tytuły ekranów stosu (klucze jak w nagłówkach ekranów `src/ekrany/*`). Brak wpisu → „Back”. */
export const KLUCZ_TYTULU_TRASY: Readonly<Record<string, Klucz>> = {
  ustawienia: 'ustawienia.tytul', kosz: 'kosz.tytul', sesje: 'sesje.tytul', miary: 'ustawienia.uklad_miar', jezyk: 'ustawienia.jezyk',
  zrodla: 'ustawienia.zrodla_wiedzy', zapas: 'narzedzia.wloczki', druty: 'narzedzia.druty', probka: 'probka.tytul',
};
/** Zakładki (`app/(zakladki)/_layout.tsx`): trasa → klucz tytułu; grupa bez stanu zagnieżdżonego = pierwsza zakładka („Dziś”). */
export const KLUCZ_ZAKLADKI: Readonly<Record<string, Klucz>> = { index: 'zakladki.dzis', projekty: 'zakladki.projekty', narzedzia: 'zakladki.narzedzia', dni: 'zakladki.historia' };
const GRUPA_ZAKLADEK = '(zakladki)';

/** Klucz rejestru tytułów z danych: nazwa trasy + parametr `id` (np. `projekt/[id]` + id projektu). */
export const kluczTytuluDynamicznego = (trasa: string, id: string): string => `${trasa}#${id}`;

/** Tytuł poprzedniej trasy: klucz i18n albo tekst z rejestru (po nazwie trasy i `id`); null — brak poprzedniej albo tytułu. */
export function tytulPoprzedniej(trasy: readonly TrasaStosu[], kluczBiezacej: string, dynamiczne: ReadonlyMap<string, string>): { klucz: Klucz } | { tekst: string } | null {
  const i = trasy.findIndex((r) => r.key === kluczBiezacej);
  const poprzednia = i > 0 ? trasy[i - 1] : undefined;
  if (!poprzednia) return null;
  const id = poprzednia.params && 'id' in poprzednia.params && typeof poprzednia.params.id === 'string' ? poprzednia.params.id : null;
  const tekst = id === null ? undefined : dynamiczne.get(kluczTytuluDynamicznego(poprzednia.name, id));
  if (tekst !== undefined) return { tekst };
  if (poprzednia.name === GRUPA_ZAKLADEK) {
    const z = poprzednia.state?.routes[poprzednia.state.index ?? 0]?.name ?? 'index';
    const klucz = KLUCZ_ZAKLADKI[z];
    return klucz ? { klucz } : null;
  }
  const klucz = KLUCZ_TYTULU_TRASY[poprzednia.name];
  return klucz ? { klucz } : null;
}

/**
 * Czy nazwa mieści się w ok. 1/3 paska (design-spec „006”: dłuższa → „Back”, jak system). Szerokość tekstu szacowana: znaki × `SZEROKOSC_ZNAKU_EM` × 17 pt
 * (`typografia.tresc`) × skala tekstu (najwyżej ×1,8 jak przycisk „wstecz”); pasek = okno − 2 × 16 pt. [OCENA 08, do potwierdzenia 04: przybliżenie, nie pomiar.]
 */
export const SZEROKOSC_ZNAKU_EM = 0.55;
export function miesciSieWPasku(tekst: string, w: { szerokoscOkna: number; skalaTekstu: number; ptTresci: number; marginesPaska: number; maxSkala: number }): boolean {
  const szerokosc = [...tekst].length * SZEROKOSC_ZNAKU_EM * w.ptTresci * Math.min(w.skalaTekstu, w.maxSkala);
  return szerokosc <= (w.szerokoscOkna - 2 * w.marginesPaska) / 3;
}

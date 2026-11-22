// Ekran nie gaśnie podczas liczenia (BR-LIC-013, F-10; port EkranAktywny, rejestr Expo 7: każdy włączony tag wyłączany).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22). Ciało: zaślepka roli 07 (E3).
import type { EkranAktywny } from '../domena/porty';

/** Tagi: licznik i wzór (BR-LIC-013) oraz „Dziś” z kartą „+1” (P-585) — osobne, nigdy oba naraz (rejestr Expo 7: każdy włączony tag wyłączany). */
export const TAG_LICZNIK = 'oczko-licznik'; // jeden tag ekranu licznika; ten sam przy wyłączeniu
export const TAG_DZIS = 'oczko-dzis';

/** Wejście na ekran (licznik, wzór albo „Dziś”); zwraca funkcję wyjścia. Opcja wyłączona → ani `wlacz`, ani nic do wyłączenia. */
export function wejdzNaEkran(z: { ekran: EkranAktywny }, w: { opcjaWlaczona: boolean }, tag: string): () => void {
  if (!w.opcjaWlaczona) return () => undefined;
  z.ekran.wlacz(tag);
  let wylaczony = false;
  return () => {
    if (wylaczony) return; // podwójne wyjście (np. tło i odmontowanie) nie wyłącza tagu drugi raz
    wylaczony = true;
    z.ekran.wylacz(tag);
  };
}
export const wejdzNaEkranLicznika = (z: { ekran: EkranAktywny }, w: { opcjaWlaczona: boolean }): (() => void) => wejdzNaEkran(z, w, TAG_LICZNIK);

/**
 * P-585: „Dziś” trzyma ekran włączony tylko, gdy karta ma „+1” — limit dni nie zastąpił go komunikatem (`zawczasu`) i jest miejsce pracy
 * (karta „bez miejsca” z „Wybierz projekt ›” nie ma „+1”). Dane spoza stanu licznika `null` = przed odczytem: karta ma „+1” ze stanu licznika.
 */
export const kartaZPlusem = (s: { limit: { rodzaj: string } }, d: { miejsce: string } | null): boolean => s.limit.rodzaj !== 'zawczasu' && d?.miejsce !== 'lista';

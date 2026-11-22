// Sygnały po +1 z ekranu licznika (RD-13 W20–W25, F-48, RD-15): czyste funkcje wydzielone z licznik.ts (limit 20 KB na plik, docs/architektura/narzedzia/granice.mjs).
import { sygnalZmiany } from '../domena/przypomnienia';
import type { ZdarzeniePlus } from '../ekrany/Licznik';
import type { WidokLicznika } from '../przypadki-uzycia/widok-licznika';

/** Sygnał wejścia w rząd z instrukcją przy zmianie skończonych (RD-13-W20–W25, P-161): tylko z `sygnalZmiany`, nigdy ze stanu pasa. */
export function wejscie(w: WidokLicznika, przed: number): { rzad: number; tekst: string; ktory: number; razy: number } | null {
  for (const p of w.plany) {
    const s = sygnalZmiany(przed, w.wartosc, p);
    if (s.ok && s.wartosc.rzadSygnalu !== null) return { rzad: s.wartosc.rzadSygnalu, tekst: p.tekst, ktory: (s.wartosc.rzadSygnalu - p.od) / p.co + 1, razy: p.razy };
  }
  return null;
}
/** Zdarzenia F-48 po +1 (haptyka „rząd ze znaczeniem”): wejście w rząd z instrukcją (sygnał RD-13), koniec powtórzenia, cel dnia, cel części. */
export function zdarzeniaPlus(w: WidokLicznika, sygnal: boolean, celDnia: boolean): ZdarzeniePlus[] {
  const z: ZdarzeniePlus[] = ['rzad'];
  if (sygnal) z.push('przypomnienie');
  if (w.powtorzenie && w.wartosc > 0 && w.wartosc % w.powtorzenie.dlugosc === 0) z.push('koniec-powtorzenia'); // ze skończonych, nie z rzędu pokazanego (tryb licznika zmienia r)
  if (celDnia) z.push('cel-dnia'); // 07-jakosc-009: osiągnięcie celu dnia (RD-15), ten sam wzór co przypomnienie (BR-LIC-021)
  if (w.czesc.cel !== null && w.wartosc === w.czesc.cel) z.push('cel-czesci');
  return z;
}

/** Cel dnia (RD-15) osiągnięty właśnie tym +1: przed był poniżej, po jest na poziomie celu albo wyżej; bez punktu odniesienia (nowy dzień, inny projekt) bez sygnału. */
export function celDniaOsiagniety(przed: { projektId: string; dzien: string; rzedy: number } | null, w: WidokLicznika): boolean {
  if (!przed || w.celDnia === null || w.zrobioneDzis === null) return false;
  return przed.projektId === w.projektId && przed.dzien === w.dzis && przed.rzedy < w.celDnia && w.zrobioneDzis >= w.celDnia;
}

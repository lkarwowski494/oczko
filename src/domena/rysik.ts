// Polityka płótna rysunków na stronie wzoru (ADR-0012; P-218 Q2a; P-220 W5a). Czysta funkcja zamiast testu z prawdziwym rysikiem (P-225, P-226):
// moduł `oczko-wzor` mapuje wynik na PencilKit (`wylaczone` = płótno bez interakcji, `dowolne` = `.anyInput`, `tylkoRysik` = `.pencilOnly`).
export type Narzedzie = 'brak' | 'zakreslacz' | 'pioro' | 'gumka';
export type PolitykaPlotna = 'wylaczone' | 'dowolne' | 'tylkoRysik';

/** Bez narzędzia palec przewija i nic się nie rysuje (BR-WZR-008 S3); przed pierwszym rysikiem iPad działa jak iPhone (palec rysuje w trybie). */
export function politykaPlotna(s: { narzedzie: Narzedzie; tylkoRysik: boolean }): PolitykaPlotna {
  if (s.narzedzie === 'brak') return 'wylaczone';
  return s.tylkoRysik ? 'tylkoRysik' : 'dowolne';
}
/** `tylkoRysik` to stan ekranu, nie ustawienie: włącza go pierwsze dotknięcie rysikiem, kasuje ponowne otwarcie wzoru (moduly.md, `onPierwszyRysik`). */
export function poDotyku(s: { tylkoRysik: boolean }, z: 'palec' | 'rysik' | 'otwarcie'): { tylkoRysik: boolean } {
  if (z === 'otwarcie') return { tylkoRysik: false };
  return { tylkoRysik: s.tylkoRysik || z === 'rysik' };
}
/**
 * Pierwsze dotknięcie rysikiem (`onPierwszyRysik`; P-327 (a), BR-WZR-004 S2, 07-jakosc-026): bez wybranego narzędzia rysik wybiera Pen i od razu pisze (pencilOnly);
 * z wybranym narzędziem zostaje ono. Działa raz — gdy `tylkoRysik` już włączony, a użytkownik odznaczył narzędzie, rysik go nie wybiera na nowo (BR-WZR-008 S3).
 * Widok natywny robi to samo synchronicznie w chwili dotyku (pierwsze pociągnięcie nie czeka na JS), a JS dostaje zdarzenie i zgadza swój stan.
 */
export function poPierwszymRysiku(s: { narzedzie: Narzedzie; tylkoRysik: boolean }): { narzedzie: Narzedzie; tylkoRysik: boolean } {
  if (s.tylkoRysik) return s;
  return { narzedzie: s.narzedzie === 'brak' ? 'pioro' : s.narzedzie, tylkoRysik: true };
}

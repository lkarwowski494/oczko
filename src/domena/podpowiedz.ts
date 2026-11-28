// ZM-25 (U7 forma A, P-1103): kiedy pokazać „{N} min bez +1” na liczniku. Czyste funkcje: czas jako argumenty (znacznik celu, nie zliczanie ticków).
export type WejsciePodpowiedzi = {
  progMin: number | null;            // null = „Podpowiedz, gdy zapomnę +1” wyłączone
  ostatniaZmianaMs: number | null;   // czas ostatniego zdarzenia licznika; brak = liczymy od otwarcia
  otwartoMs: number;                 // chwila wejścia na licznik (po wyjściu i powrocie odliczanie startuje od nowa)
  blokada: boolean;                  // licznik zablokowany, limit dni, pauza stopera: bez podpowiedzi
};
/** Znacznik czasu, od którego pokazać podpowiedź: późniejszy z (ostatnia zmiana, otwarcie) + próg; null = nie ma czego odliczać. */
export function terminPodpowiedzi(w: WejsciePodpowiedzi): number | null {
  if (w.progMin === null || w.blokada) return null;
  return Math.max(w.ostatniaZmianaMs ?? w.otwartoMs, w.otwartoMs) + w.progMin * 60_000;
}

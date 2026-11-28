// U2 (ZM-20, ADR-0035 reguły 1–6, P-1096): rodzic linii ±1 z ekranu blokady albo zegarka przy scaleniu dziennika.
// Czysta funkcja; wyrocznia: wektory PR-01…PR-18 (docs/architektura/wektory-1-0-2.json).

/** Źródła linii, których zdarzenia nie ma jeszcze w bazie, więc rodzica wolno ustalić przy scaleniu. */
const ZRODLA_PRZESUWANE: readonly string[] = ['ekran_blokady', 'zegarek'];

export type LiniaPrzesuniecia = { rodzaj: string; czasMs: number; zrodlo: string; rodzic: string | null };
export type WejsciePrzesuniecia = {
  linia: LiniaPrzesuniecia;
  /** Głowy grafu licznika w bazie (wynik scalenia, z liniami partii). */
  glowy: readonly string[];
  /** Zdarzenia od rodzica (wyłącznie) do głowy (włącznie); null, gdy rodzic nie jest przodkiem głowy. */
  poRodzicu: readonly { rodzaj: string; czasMs: number }[] | null;
  /** Przejście przerwane po DZIENNIK_PRZESUNIECIE_MAKS zdarzeniach. */
  obcieto: boolean;
};
export type DecyzjaPrzesuniecia = {
  decyzja: 'bez_zmian' | 'przesun' | 'rozwidlenie';
  rodzic: string | null;
};

/**
 * `przesun`: rodzic = jedyna głowa; `bez_zmian`: rodzic z linii; `rozwidlenie`: rodzic z linii, scalenie pokaże konflikt (PU-099).
 * Przemienne są ±1 (suma kroków; zejście poniżej 0 przycina scalenie). Nieprzemienne zdarzenia (wpisanie, zerowanie, cofnięcie,
 * rozstrzygnięcie) wolno ominąć tylko, gdy stały się nie później niż stuknięcie (linia i tak szła po nich).
 */
export function przesuniecieRodzica({ linia, glowy, poRodzicu, obcieto }: WejsciePrzesuniecia): DecyzjaPrzesuniecia {
  const bezZmian = { decyzja: 'bez_zmian', rodzic: linia.rodzic } as const;
  if (!ZRODLA_PRZESUWANE.includes(linia.zrodlo) || (linia.rodzaj !== 'plus' && linia.rodzaj !== 'minus')) return bezZmian;
  if (glowy.length === 0) return bezZmian; // licznik bez zdarzeń: linia zaczyna historię
  const glowa = glowy[0];
  if (glowy.length > 1 || glowa === undefined) return { decyzja: 'rozwidlenie', rodzic: linia.rodzic }; // już konflikt: nie zgadujemy, która głowa
  if (linia.rodzic === glowa) return { decyzja: 'bez_zmian', rodzic: glowa };
  if (poRodzicu === null || obcieto) return { decyzja: 'rozwidlenie', rodzic: linia.rodzic };
  const zgodne = poRodzicu.every((e) => e.rodzaj === 'plus' || e.rodzaj === 'minus' || e.czasMs <= linia.czasMs);
  return zgodne ? { decyzja: 'przesun', rodzic: glowa } : { decyzja: 'rozwidlenie', rodzic: linia.rodzic };
}

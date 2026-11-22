// Geometria elementu „dzianina części” (design-spec „Element firmowy: dzianina części”, ADR-0034 pkt 2): czysta funkcja, testowana bez renderera.
// Układ w jednostkach rysunku (0,0 = lewy górny róg): dół = nabranie (stały), góra = cel części (przerywana linia). Wysokość dzianiny = rzędy gotowe / cel (albo okno
// bez celu), jaśniejszy pas u góry = rzędy dziś, igła = bieżący rząd na górnym brzegu dzianiny, ząbek w brzegu = rząd najbliższego przypomnienia.
// Brak zostaje brakiem: wartości ujemne i NaN traktowane jak 0 (nie zgadujemy liczby).

/** Okno skali części bez celu: wysokość według ostatnich 96 rzędów i bez linii celu (design-spec; [DO USTALENIA 08: skala okna] — przyjęte 96 z opisu, do potwierdzenia na urządzeniu). */
export const OKNO_BEZ_CELU = 96;
/** Margines rysunku nad linią celu i pod nabraniem, jako ułamek wysokości (miejsce na ząbek i igłę); wartość rysunkowa, nie dziedzinowa. */
const MARGINES_UL = 0.06;
/** Pas nabranych oczek przy 0 rzędach (001, P-619): 8 jednostek rysunku jak makieta `docs/design/dzianina/ekrany.html:629`; wartość rysunkowa, nie dziedzinowa. */
export const NABRANIE_WYSOKOSC = 8;

export interface WejscieDzianiny {
  readonly gotowe: number;
  readonly cel: number | null;
  readonly dzis: number;
  /** Rząd najbliższego przypomnienia (numer rzędu) albo `null`. */
  readonly przypomnienie: number | null;
  readonly szerokosc: number;
  readonly wysokosc: number;
}
export interface GeometriaDzianiny {
  readonly dzianina: { readonly y: number; readonly h: number };
  readonly pasDzis: { readonly y: number; readonly h: number } | null;
  readonly liniaCelu: { readonly y: number } | null;
  readonly igla: { readonly y: number };
  /** Przy 0 rzędach pas nabranych oczek nad dolnym marginesem (spec: „0 rzędów → sama igła z nabranymi oczkami”), inaczej `null`. */
  readonly nabranie: { readonly y: number; readonly h: number } | null;
  readonly zabek: { readonly y: number } | null;
}

const nieujemna = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export function geometriaDzianiny(w: WejscieDzianiny): GeometriaDzianiny {
  const gotowe = nieujemna(w.gotowe);
  const cel = w.cel !== null && Number.isFinite(w.cel) && w.cel > 0 ? w.cel : null;
  const okno = cel ?? OKNO_BEZ_CELU;
  const margines = w.wysokosc * MARGINES_UL;
  const gora = margines; // y linii celu
  const dol = w.wysokosc - margines; // y nabrania
  const dostepna = dol - gora;
  const wRzedach = (rzedy: number): number => (Math.min(rzedy, okno) / okno) * dostepna;
  const h = wRzedach(gotowe); // cel osiągnięty albo przekroczony: dzianina kończy się na linii celu (pod nią)
  const y = dol - h;
  const dzis = Math.min(nieujemna(w.dzis), gotowe);
  const hDzis = wRzedach(dzis);
  const nabranie = gotowe === 0 ? { y: dol - NABRANIE_WYSOKOSC, h: NABRANIE_WYSOKOSC } : null;
  const p = w.przypomnienie !== null && Number.isFinite(w.przypomnienie) ? w.przypomnienie : null;
  return {
    dzianina: { y, h },
    pasDzis: hDzis > 0 ? { y, h: Math.min(hDzis, h) } : null,
    liniaCelu: cel === null ? null : { y: gora },
    igla: { y: nabranie ? nabranie.y : y },
    nabranie,
    zabek: p !== null && p > gotowe && p <= okno ? { y: dol - wRzedach(p) } : null,
  };
}

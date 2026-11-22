// Scalanie zdarzeń licznika z wielu źródeł (ADR-0005, ADR-0008, ADR-0009). Prototyp: docs/architektura/eksperymenty/e1/scal.mjs (iteracyjny,
// fix 05 2026-10-25, Z07-13); wyrocznia: scal-wektory.json (M-01–M-17), mutanty: eksperymenty/e1/mutanty-scal.mjs.
import { STANY, type RodzajZdarzenia } from './stany';

export type ZdarzenieLicznika = { id: string; licznik: string; rodzaj: RodzajZdarzenia; wartosc?: number; rodzice: string[]; cofa?: string[] };
export type WynikScalenia =
  | { stan: 'zgodny'; wartosc: number; glowy: string[] }
  | { stan: 'konflikt'; glowy: string[]; kandydaci: { glowa: string; wartosc: number }[] }
  | { stan: 'czeka'; brakujacy: string[] }
  | { stan: 'blad'; powod: PowodBleduScalenia; id: string }; // Z07-13, moduly.md „Scalanie”; wariant dopisany przez 08 (P-111 (4))
export type PowodBleduScalenia = 'kolizja_id' | 'nieznany_rodzaj' | 'wiele_rodzicow' | 'cykl' | 'zla_wartosc'; // zla_wartosc: fix-2 05 (P-118 W1, M-18–M-20)

const RODZAJE: ReadonlySet<string> = new Set(STANY['zdarzenie.rodzaj']);
const USTAWIA: ReadonlySet<string> = new Set(['wpisanie', 'cofniecie', 'rozstrzygniecie']); // zdarzenie niesie wartość po zmianie
const tresc = (z: ZdarzenieLicznika): string => JSON.stringify([z.licznik, z.rodzaj, z.wartosc ?? null, z.rodzice, z.cofa ?? []]);
const najmniejszy = (ids: readonly string[]): string => [...ids].sort()[0];

/**
 * rodzice = ostatnie zdarzenia, które źródło znało (jak commit w git); rozwidlenie łączy tylko `rozstrzygniecie`.
 * Kolejność kontroli stała, a `id` błędu najmniejsze, więc wynik nie zależy od kolejności wejścia (R-038).
 * Iteracyjnie (kolejność topologiczna Kahna), bez rekurencji: 150 000 zdarzeń bez przepełnienia stosu (R-036).
 */
export function scal(zdarzenia: ZdarzenieLicznika[]): WynikScalenia {
  const mapa = new Map<string, ZdarzenieLicznika>();
  const kolizje: string[] = [];
  for (const z of zdarzenia) {
    const byl = mapa.get(z.id);
    if (!byl) mapa.set(z.id, z); // idempotencja: duplikat dostarczenia (M-02)
    else if (tresc(byl) !== tresc(z)) kolizje.push(z.id); // to samo id, inna treść (M-14)
  }
  if (kolizje.length) return { stan: 'blad', powod: 'kolizja_id', id: najmniejszy(kolizje) };
  const wszystkie = [...mapa.values()];
  const nieznane = wszystkie.filter((z) => !RODZAJE.has(z.rodzaj)).map((z) => z.id);
  if (nieznane.length) return { stan: 'blad', powod: 'nieznany_rodzaj', id: najmniejszy(nieznane) }; // M-15
  // Niezmiennik schemat.sql (CHECK zdarzenia): ustawienie niesie nieujemną liczbę całkowitą, ±1 i zerowanie — bez wartości. Rekord z synchronizacji
  // albo importu może go łamać, więc wynik, nie wyjątek (P-118 W1, Q1a; M-18–M-20).
  const zle = wszystkie.filter((z) => (USTAWIA.has(z.rodzaj) ? !(typeof z.wartosc === 'number' && Number.isInteger(z.wartosc) && z.wartosc >= 0) : z.wartosc !== undefined && z.wartosc !== null)).map((z) => z.id);
  if (zle.length) return { stan: 'blad', powod: 'zla_wartosc', id: najmniejszy(zle) };
  const wiele = wszystkie.filter((z) => z.rodzaj !== 'rozstrzygniecie' && z.rodzice.length > 1).map((z) => z.id);
  if (wiele.length) return { stan: 'blad', powod: 'wiele_rodzicow', id: najmniejszy(wiele) }; // M-09
  const brakujacy = new Set(wszystkie.flatMap((z) => z.rodzice.filter((r) => !mapa.has(r))));
  if (brakujacy.size) return { stan: 'czeka', brakujacy: [...brakujacy].sort() }; // M-03; poczekalnia: ADR-0005

  const dzieci = new Map<string, string[]>(wszystkie.map((z) => [z.id, []]));
  const wejscia = new Map<string, number>(wszystkie.map((z) => [z.id, new Set(z.rodzice).size]));
  for (const z of wszystkie) for (const r of new Set(z.rodzice)) dzieci.get(r)?.push(z.id);
  const wartosc = new Map<string, number>();
  const kolejka = wszystkie.filter((z) => wejscia.get(z.id) === 0).map((z) => z.id);
  for (let i = 0; i < kolejka.length; i += 1) {
    const z = mapa.get(kolejka[i]);
    if (!z) throw new Error(`scal: brak zdarzenia ${kolejka[i]} w mapie`); // stan niemożliwy
    wartosc.set(z.id, wartoscPo(z, wartosc));
    for (const d of dzieci.get(z.id) ?? []) {
      const n = (wejscia.get(d) ?? 0) - 1;
      wejscia.set(d, n);
      if (n === 0) kolejka.push(d);
    }
  }
  if (kolejka.length < wszystkie.length) {
    return { stan: 'blad', powod: 'cykl', id: najmniejszy(wszystkie.filter((z) => !wartosc.has(z.id)).map((z) => z.id)) }; // M-12, M-13
  }
  const glowy = wszystkie.filter((z) => (dzieci.get(z.id) ?? []).length === 0).map((z) => z.id).sort();
  const wartoscGlowy = (g: string): number => wartosc.get(g) ?? 0; // każda głowa ma wartość po pełnym przejściu (brak cyklu)
  if (glowy.length <= 1) return { stan: 'zgodny', wartosc: glowy.length ? wartoscGlowy(glowy[0]) : 0, glowy };
  return { stan: 'konflikt', glowy, kandydaci: glowy.map((g) => ({ glowa: g, wartosc: wartoscGlowy(g) })) }; // NFR-DAN-003: pokaż, nie zgaduj
}

/** Wartość licznika po zdarzeniu: ustawienie niesie wartość, zerowanie daje 0, ±1 od rodzica bez zejścia poniżej 0 (M-06). */
function wartoscPo(z: ZdarzenieLicznika, wartosc: ReadonlyMap<string, number>): number {
  if (USTAWIA.has(z.rodzaj)) {
    if (typeof z.wartosc !== 'number') throw new Error(`scal: zdarzenie ${z.id} (${z.rodzaj}) bez wartości`); // stan niemożliwy: zla_wartosc sprawdzone wyżej
    return z.wartosc;
  }
  if (z.rodzaj === 'zerowanie') return 0;
  const przed = z.rodzice.length ? (wartosc.get(z.rodzice[0]) ?? 0) : 0;
  return Math.max(0, przed + (z.rodzaj === 'plus' ? 1 : -1));
}

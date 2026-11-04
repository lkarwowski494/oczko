// Posiedzenie dla kresek na liczniku (design-spec „Kreski sesji przez północ”, :242–:244; P-126 (6a), N2; P-097 (4a)).
// Zaczyna je pierwsze +1 po przerwie ≥ PRZERWA_NOWEGO_DNIA_MS albo start stopera (posiedzenie = sesja stopera); kończy taka przerwa
// (kreski poprzedniego widać do następnego +1, więc funkcja nie patrzy na „teraz”) albo zatrzymanie stopera. Północ go nie przerywa.
import { PRZERWA_NOWEGO_DNIA_MS } from '../konfiguracja';

/** Zdarzenie +1/−1 nieobjęte cofnięciem; `dodaniaMs` dla `posiedzenie` liczy `dodaniaPosiedzenia`. */
export type PlusMinus = { rodzaj: 'plus' | 'minus'; czasMs: number };

/**
 * −1 zdejmuje ostatnią kreskę (design-spec:250–256, [04-studio-projektowe-571]): zdarzenia od najnowszego → czasy +1, które zostają, od najnowszego.
 * −1 bez kreski do zdjęcia (0 kresek w oknie) nic nie zmienia — wartość nie spada poniżej zera, a kolejny +1 nie jest zjadany.
 * Zdjęcie nie patrzy na przerwę ≥ PRZERWA_NOWEGO_DNIA_MS: zdejmuje kreskę, którą widać (także poprzedniego posiedzenia); granicę wyznacza `posiedzenie`.
 */
export function dodaniaPosiedzenia(zdarzenia: readonly PlusMinus[]): number[] {
  const kreski: number[] = []; // od najstarszego
  for (let i = zdarzenia.length - 1; i >= 0; i -= 1) {
    const z = zdarzenia[i];
    if (z?.rodzaj === 'plus') kreski.push(z.czasMs);
    else if (z) kreski.pop();
  }
  return kreski.reverse();
}

export type Posiedzenie = { rzedy: number; odMs: number } | null;

/** `dodaniaMs`: czasy +1 nieobjętych cofnięciem, od najnowszego; `stoper`: ostatnia sesja stopera projektu (koniecMs null = trwa albo wstrzymana). */
export function posiedzenie(w: { dodaniaMs: readonly number[]; stoper: { startMs: number; koniecMs: number | null } | null }): Posiedzenie {
  const s = w.stoper;
  if (s && s.koniecMs === null) return { rzedy: w.dodaniaMs.filter((t) => t >= s.startMs).length, odMs: s.startMs };
  const po = s ? w.dodaniaMs.filter((t) => t > (s.koniecMs ?? s.startMs)) : w.dodaniaMs;
  const [pierwsze] = po;
  if (pierwsze === undefined) return null;
  let i = 0;
  while (i + 1 < po.length && (po[i] ?? 0) - (po[i + 1] ?? 0) < PRZERWA_NOWEGO_DNIA_MS) i += 1;
  return { rzedy: i + 1, odMs: po[i] ?? pierwsze };
}

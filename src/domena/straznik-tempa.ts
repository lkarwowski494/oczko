// Strażnik stuknięć RD-17; osobno dla każdego źródła, po czasie zdarzenia (P-091 4b).
import type { Wynik } from './bledy';
import type { ZrodloZdarzenia } from './stany';

export type Dodanie = { id: string; czasMs: number; zrodlo: ZrodloZdarzenia };
export type Seria = { zrodlo: ZrodloZdarzenia; ids: string[]; odMs: number; doMs: number };

/** Serie do pytania „Added n rows in t s. Undo?”; parametry z konfiguracji (STRAZNIK_SERIA_ZDARZEN, STRAZNIK_OKNO_S). */
// Seria = dodania z odstępem ≤ okno od poprzedniego; pytanie, gdy w niej `seria` kolejnych dodań mieści się w oknie (t[i+seria−1] − t[i] ≤ okno, włącznie).
export function serieDoSprawdzenia(dodania: Dodanie[], konf: { seria: number; oknoS: number }): Wynik<Seria[]> {
  if (dodania.some((d) => !Number.isFinite(d.czasMs))) return { ok: false, powod: 'bledne_dane' }; // RD-17-W7: dodanie bez czasu zdarzenia
  const oknoMs = konf.oknoS * 1000;
  const wgZrodla = new Map<ZrodloZdarzenia, Dodanie[]>();
  for (const d of dodania) wgZrodla.set(d.zrodlo, [...(wgZrodla.get(d.zrodlo) ?? []), d]);
  const wynik: Seria[] = [];
  for (const [zrodlo, lista] of wgZrodla) {
    // Po czasie zdarzenia, przy równym czasie po id (P-091 (4b)); czas dostarczenia nie wchodzi.
    const posortowane = [...lista].sort((a, b) => a.czasMs - b.czasMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    let poczatek = 0;
    for (let i = 1; i <= posortowane.length; i += 1) {
      if (i < posortowane.length && posortowane[i].czasMs - posortowane[i - 1].czasMs <= oknoMs) continue;
      const ciag = posortowane.slice(poczatek, i);
      if (maSerie(ciag, konf.seria, oknoMs)) {
        wynik.push({ zrodlo, ids: ciag.map((d) => d.id), odMs: ciag[0].czasMs, doMs: ciag[ciag.length - 1].czasMs });
      }
      poczatek = i;
    }
  }
  return { ok: true, wartosc: wynik };
}

function maSerie(ciag: readonly Dodanie[], seria: number, oknoMs: number): boolean {
  for (let i = 0; i + seria - 1 < ciag.length; i += 1) if (ciag[i + seria - 1].czasMs - ciag[i].czasMs <= oknoMs) return true;
  return false;
}

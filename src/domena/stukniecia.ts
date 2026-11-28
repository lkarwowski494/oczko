// U6 (ZM-24, ADR-0036, P-1097): krok „+2” = dwa zdarzenia `plus` grupowane w „stuknięcie”; strażnik tempa RD-17 na stuknięciach,
// „Cofnij” cofa całe stuknięcie, sygnały przy skoku (cel części, koniec powtórzenia). Czyste funkcje; wyrocznia: wektory ST, SE, CO, SK.

/** Największy krok licznika; jedna definicja z CHECK (krok IN (1, 2)) migracji 0002 (ADR-0036, ARCH-02). */
export const KROK_MAKS = 2;

export type ZdarzenieStukniecia = {
  id: string;
  rodzaj: string;
  czasMs: number;
  rodzice: readonly string[];
  zrodlo: string;
  urzadzenie: string;
  cofa?: readonly string[];
};
export type Stukniecie = { ids: string[]; krok: number; czasMs: number; zrodlo: string; rodzaj: string };

function glebokosc(z: ZdarzenieStukniecia, mapa: ReadonlyMap<string, ZdarzenieStukniecia>): number {
  let d = 0;
  for (let x: ZdarzenieStukniecia | undefined = z; x && x.rodzice.length > 0; x = mapa.get(x.rodzice[0] ?? '')) d += 1;
  return d;
}

/**
 * `plus` dołącza do stuknięcia rodzica, gdy rodzic jest `plus` z tym samym czasMs, źródłem i urządzeniem, stuknięcie rodzica ma
 * < KROK_MAKS zdarzeń, a rodzic nie ma innego dziecka w stuknięciu. Wejście w dowolnej kolejności.
 * Wynik: stuknięcia w kolejności (czasMs, głębokość pierwszego zdarzenia).
 */
export function stukniecia(zdarzenia: readonly ZdarzenieStukniecia[]): Stukniecie[] {
  const mapa = new Map(zdarzenia.map((z) => [z.id, z] as const));
  const grupa = new Map<string, string[]>(); // id zdarzenia → ids stuknięcia (wspólna tablica)
  const zajety = new Set<string>(); // rodzic, którego dziecko już dołączyło
  const kolejnosc = [...zdarzenia].sort((a, b) => a.czasMs - b.czasMs || glebokosc(a, mapa) - glebokosc(b, mapa) || (a.id < b.id ? -1 : 1));
  for (const z of kolejnosc) {
    const p = z.rodzice.length === 1 ? mapa.get(z.rodzice[0] ?? '') : undefined;
    const g = p ? grupa.get(p.id) : undefined;
    if (z.rodzaj === 'plus' && p && g && p.rodzaj === 'plus' && p.czasMs === z.czasMs && p.zrodlo === z.zrodlo && p.urzadzenie === z.urzadzenie
      && g.length < KROK_MAKS && g[g.length - 1] === p.id && !zajety.has(p.id)) {
      g.push(z.id);
      zajety.add(p.id);
      grupa.set(z.id, g);
    } else {
      grupa.set(z.id, [z.id]);
    }
  }
  const wynik: { st: Stukniecie; pierwsza: number }[] = [];
  for (const ids of new Set(grupa.values())) {
    const pierwsze = mapa.get(ids[0] ?? '');
    const ostatnie = mapa.get(ids[ids.length - 1] ?? '');
    if (!pierwsze || !ostatnie) continue;
    wynik.push({ st: { ids, krok: ids.length, czasMs: ostatnie.czasMs, zrodlo: ostatnie.zrodlo, rodzaj: ostatnie.rodzaj }, pierwsza: glebokosc(pierwsze, mapa) });
  }
  return wynik.sort((a, b) => a.st.czasMs - b.st.czasMs || a.pierwsza - b.pierwsza).map((w) => w.st);
}

export type SeriaStukniec = { zrodlo: string; stukniecia: number; rzedy: number; ids: string[] };

/** RD-17 na stuknięciach: seria = `seria` stuknięć w oknie; liczba rzędów w banerze = suma kroków; cofnięcie obejmuje wszystkie ids. */
export function serieStukniec(st: readonly Stukniecie[], konf: { seria: number; oknoS: number }): SeriaStukniec[] {
  const okno = konf.oknoS * 1000;
  const wynik: SeriaStukniec[] = [];
  for (const zrodlo of new Set(st.map((s) => s.zrodlo))) {
    const lista = st.filter((s) => s.zrodlo === zrodlo && s.rodzaj === 'plus').sort((a, b) => a.czasMs - b.czasMs);
    let poczatek = 0;
    for (let i = 1; i <= lista.length; i += 1) {
      const poprzednie = lista[i - 1];
      const biezace = lista[i];
      if (i < lista.length && biezace && poprzednie && biezace.czasMs - poprzednie.czasMs <= okno) continue;
      const ciag = lista.slice(poczatek, i);
      const zSeria = ciag.some((s, k) => {
        const koniec = ciag[k + konf.seria - 1];
        return koniec !== undefined && koniec.czasMs - s.czasMs <= okno;
      });
      if (zSeria) wynik.push({ zrodlo, stukniecia: ciag.length, rzedy: ciag.reduce((suma, x) => suma + x.krok, 0), ids: ciag.flatMap((x) => x.ids) });
      poczatek = i;
    }
  }
  return wynik;
}

export type ZdarzenieOdNajnowszego = { id: string; rodzaj: string; cofa?: readonly string[] };

/**
 * „Cofnij” z historii: cel = ostatnie stuknięcie z niecofniętym zdarzeniem; cofa jego niecofnięte zdarzenia.
 * `przedId` = pierwsze cofane zdarzenie (wartość po cofnięciu = wartość po jego rodzicu). Brak celu = null.
 */
export function celCofnieciaStukniecia(
  odNajnowszego: readonly ZdarzenieOdNajnowszego[],
  st: readonly { ids: readonly string[] }[],
): { cofa: string[]; przedId: string } | null {
  const cofniete = new Set(odNajnowszego.filter((z) => z.rodzaj === 'cofniecie').flatMap((z) => z.cofa ?? []));
  const grupaZ = new Map(st.flatMap((s) => s.ids.map((id) => [id, s] as const)));
  for (const z of odNajnowszego) {
    if (z.rodzaj === 'cofniecie' || cofniete.has(z.id)) continue;
    const s = grupaZ.get(z.id);
    const ids = (s ? [...s.ids] : [z.id]).filter((id) => !cofniete.has(id));
    const pierwszy = ids[0];
    return pierwszy === undefined ? null : { cofa: ids, przedId: pierwszy };
  }
  return null;
}

/** Sygnały przy skoku (F-08/BR-LIC-011, RD-12): cel części przekroczony w (przed, po]; koniec powtórzenia, gdy w (przed, po] jest wielokrotność długości. */
export function sygnalySkoku(
  przed: number,
  po: number,
  konf: { cel: number | null; dlugosc: number | null },
): { celCzesci: boolean; koniecPowtorzenia: boolean } {
  return {
    celCzesci: konf.cel !== null && przed < konf.cel && konf.cel <= po,
    koniecPowtorzenia: konf.dlugosc !== null && po > przed && Math.floor(po / konf.dlugosc) > Math.floor(przed / konf.dlugosc),
  };
}

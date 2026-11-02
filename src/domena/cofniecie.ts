// Cofanie z historii licznika (BR-LIC-003, P-091 (3a), 07-jakosc-021): „Undo” cofa ostatnią zmianę, która nie jest już cofnięta.
// Czysta funkcja: zdarzenia od najnowszego (głowa pierwsza), bez bazy i zegara.

export type ZdarzenieCofniecia = { id: string; rodzaj: string; cofa: readonly string[] };

/**
 * Indeks zdarzenia, które cofnie następne „Undo”: pierwsze od głowy, które nie jest cofnięciem i nie zostało cofnięte przez żadne
 * nowsze cofnięcie. `null` = nic do cofnięcia. Wcześniej cofano zawsze głowę, więc drugie „Undo” po cofnięciu ponawiało zmianę.
 */
export function celCofnieciaIndeks(odNajnowszego: readonly ZdarzenieCofniecia[]): number | null {
  const cofniete = new Set<string>();
  for (const [i, z] of odNajnowszego.entries()) {
    if (z.rodzaj === 'cofniecie') { for (const id of z.cofa) cofniete.add(id); continue; }
    if (!cofniete.has(z.id)) return i;
  }
  return null;
}

/** Id wszystkich zdarzeń cofniętych przez cofnięcia z listy (do oznaczenia wpisów w historii). */
export function cofnieteId(zdarzenia: readonly ZdarzenieCofniecia[]): Set<string> {
  return new Set(zdarzenia.filter((z) => z.rodzaj === 'cofniecie').flatMap((z) => z.cofa));
}

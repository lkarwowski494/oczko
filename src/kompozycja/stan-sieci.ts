// Stan sieci z portu `Siec` jako stan komponentu (ADR-0031 pkt 1–2, 07-jakosc-017): odczyt przy montowaniu i każde zdarzenie portu; odpięcie przy odmontowaniu.
// „Nieznany” (monitor jeszcze nie odpowiedział) traktujemy jak „jest”: próbujemy otworzyć film, a przeglądarka powie, jeśli się nie da.
import { useEffect, useState } from 'react';
import type { Siec, StanSieci } from '../domena/porty';

/** `'brak'` tylko, gdy system mówi, że ścieżki sieciowej nie ma; inne stany → `'jest'`. */
export const dostepnaSiec = (s: StanSieci): 'jest' | 'brak' => (s === 'brak' ? 'brak' : 'jest');

export function useStanSieci(siec: Siec): 'jest' | 'brak' {
  const [stan, ustaw] = useState<StanSieci>(() => siec.stan());
  useEffect(() => {
    ustaw(siec.stan()); // monitor mógł odpowiedzieć między renderem a efektem
    return siec.obserwuj(ustaw);
  }, [siec]);
  return dostepnaSiec(stan);
}

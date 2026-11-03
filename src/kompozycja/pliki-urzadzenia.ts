// Pliki stanu urządzenia obok bazy, poza bazą i archiwum (08 partia 4, 3A; KP-06): identyfikator urządzenia i pamięć uprawnień Pro.
// Zapis przez zapiszAtomowo (M1-026, ARCH-22).
import { czytajTekst, istniejePlik, polacz, zapiszAtomowo } from '../dane/pliki/system';
import type { MagazynPamieci } from './dostep';

/**
 * Identyfikator urządzenia w zdarzeniach (`zdarzenie.urzadzenie`, ADR-0005): UUID w pliku obok bazy, poza bazą, więc nie wchodzi do kopii ani archiwum.
 * Miejsce pliku: odstępstwo nazwane 08 (partia 4, 3A) do potwierdzenia przez 05 — dane.md nie ustala źródła tego pola.
 */
export async function identyfikatorUrzadzenia(katalog: string, nowyId: () => string): Promise<string> {
  const plik = polacz(katalog, 'urzadzenie.txt');
  if (istniejePlik(plik)) {
    const t = (await czytajTekst(plik)).trim();
    if (/^[0-9a-f-]{36}$/i.test(t)) return t;
  }
  const nowy = nowyId();
  zapiszAtomowo(plik, nowy); // M1-026: przerwany zapis nie zostawia uciętego identyfikatora
  return nowy;
}

/** Pamięć uprawnień Pro (KP-06): plik `pamiec-pro.json` obok bazy, poza bazą i archiwum. */
export function pamiecProWPliku(katalog: string): MagazynPamieci {
  const plikPro = polacz(katalog, 'pamiec-pro.json');
  return { czytaj: async () => (istniejePlik(plikPro) ? czytajTekst(plikPro) : null), zapisz: async (t) => zapiszAtomowo(plikPro, t) };
}

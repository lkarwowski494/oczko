// Adapter portu DziennikPlus na urządzeniu (ADR-0008): źródło tekstu = moduł Swift OczkoDziennikPlus (jedyny pisarz, kolejka szeregowa);
// odczyt i diagnostyka w TS (src/dane/dziennik.ts). `natywny` wstrzykiwany (test na atrapie), domyślnie moduł aplikacji.
import type { DziennikPlus, PortBazy } from '../domena/porty';
import { utworzDziennik } from '../dane/dziennik';
import { natywny as modul, type OczkoDziennikPlusNatywny } from '../../modules/oczko-dziennik-plus';

export function dziennikUrzadzenia(baza: PortBazy, natywny: Pick<OczkoDziennikPlusNatywny, 'odczytajTekst' | 'skroc'> = modul()): DziennikPlus {
  return utworzDziennik({ tekst: () => natywny.odczytajTekst(), skroc: (doId) => natywny.skroc(doId) }, baza);
}

/** SHA-256 pliku natywnie (P-130, M1-017): strumieniowo w Swift (CryptoKit), poza wątkiem JS; ścieżka bezwzględna bez `file://`. */
export const skrotPliku = (sciezka: string): Promise<string> => modul().sha256Pliku(sciezka);

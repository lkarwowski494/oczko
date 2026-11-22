// Migawka projektów w toku w kontenerze App Group dla arkusza „Udostępnij do Oczka” (P-220 R1a/N2, P-243; moduly.md „Kontrakt partii 6”).
// Zapis atomowy (ARCH-22): plik tymczasowy → odczyt kontrolny → rename; rozszerzenie czyta tylko plik docelowy, więc nigdy połowy zapisu.
import type { MigawkaProjektow } from '../domena/porty';
import { MIGAWKA_WERSJA } from '../konfiguracja';
import { czytajTekst, istniejePlik, polacz, przenies, usunPlik, zapiszTekst } from '../dane/pliki/system';

export const PLIK_MIGAWKI = 'projekty-migawka.json';

export function migawkaWKatalogu(grupa: string | null, teraz: () => number): MigawkaProjektow {
  return {
    async zapisz(projekty, jezyk) {
      if (!grupa) return;
      const cel = polacz(grupa, PLIK_MIGAWKI), tmp = `${cel}.tmp`;
      const tekst = JSON.stringify({ format: 'oczko-migawka', wersja: MIGAWKA_WERSJA, utworzono: teraz(), jezyk, projekty }); // jezyk: arkusz mówi językiem aplikacji (P-248 D2a)
      usunPlik(tmp);
      zapiszTekst(tmp, tekst);
      if (await czytajTekst(tmp) !== tekst) { usunPlik(tmp); throw new Error('migawka: odczyt kontrolny niezgodny'); }
      if (istniejePlik(cel)) usunPlik(cel); // moveSync nie nadpisuje; okno bez pliku = stan zastępczy rozszerzenia („Choose in Oczko”)
      przenies(tmp, cel);
    },
  };
}

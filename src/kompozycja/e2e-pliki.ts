// Pliki buildu E2E (e2e/README.md: `e2e-pliki-zachowaj-eksport`, `e2e-pliki-stan`, `e2e-pliki-importuj-ostatni`): ostatni eksport kopiowany
// do katalogu testowego obok bazy, bo arkusza udostępniania i wyboru pliku Maestro nie obsłuży. Wołane tylko z paneli `E2E` (tryb-e2e.ts).
import { kopiuj, lista, nazwaPliku, polacz, usunPlik, utworzKatalog } from '../dane/pliki/system';

export function plikiE2e(katalogDanych: string) {
  const katalog = polacz(katalogDanych, 'e2e-pliki');
  return {
    zachowaj(sciezka: string): number {
      utworzKatalog(katalog);
      const cel = polacz(katalog, nazwaPliku(sciezka));
      usunPlik(cel);
      kopiuj(sciezka, cel);
      return lista(katalog).length;
    },
    ile: () => lista(katalog).length,
    ostatni(): string | null {
      const p = lista(katalog).sort();
      return p.length ? polacz(katalog, p[p.length - 1]) : null;
    },
  };
}

// Zależności `zdjecieBezMetadanych` w aplikacji (P-219 2A): przekodowanie natywne (expo-image-manipulator) i pliki przez expo-file-system.
// Osobny moduł: testy kompozycji nie ładują modułów natywnych.
import { otworzDoCzytania, otworzDoZapisu, usunPlik } from '../dane/pliki/system';
import { przekodujDoJpeg } from '../platforma/obrazy';
import type { ZaleznosciObrazu } from './zdjecie-bez-metadanych';

export function zaleznosciObrazu(tymczasowy: string, nowyId: () => string): ZaleznosciObrazu {
  return {
    przekoduj: przekodujDoJpeg,
    czytaj: (sciezka) => { const c = otworzDoCzytania(sciezka); try { return c.czytaj(0, c.rozmiar); } finally { c.zamknij(); } },
    zapisz: (sciezka, bajty) => { const p = otworzDoZapisu(sciezka); try { p.zapisz(bajty); } finally { p.zamknij(); } },
    usun: usunPlik,
    tymczasowy,
    nazwa: () => `zdjecie-${nowyId()}`,
  };
}

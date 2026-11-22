// Zrzut widoku do PNG (P-219 2A, F-53): react-native-view-shot 5.1.0 `captureRef` → plik tymczasowy. Rozmiar w punktach z `rozmiarZrzutu`
// (plik 1080 × 1350 px przy każdej skali ekranu).
import type { RefObject } from 'react';
import { PixelRatio, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { rozmiarZrzutu } from '../ekrany/ObrazKarty';
import { nazwaPliku, przenies, utworzKatalog } from '../dane/pliki/system';

const MAKS_NAZWY = 100; // znaków nazwy pliku bez rozszerzenia; arkusz i tak skraca dłuższe

/** Nazwa pliku z nazwy projektu (M1-135, SP-11): znaki niedozwolone w nazwach plików i sterujące → „-”, bez kropek na początku
 *  (plik ukryty), najwyżej `MAKS_NAZWY` znaków. Nic nie zostaje → `null` (plik zachowuje nazwę nadaną przez system). */
export function nazwaPlikuUdostepnienia(nazwa: string): string | null {
  // eslint-disable-next-line no-control-regex
  const czysta = nazwa.replace(/[/\\:*?"<>|\u0000-\u001f\u007f]/g, '-').trim().replace(/^\.+/, '');
  const n = Array.from(czysta).slice(0, MAKS_NAZWY).join('').trim();
  return n.length > 0 ? n : null;
}

/** Zrzut karty do PNG we własnym katalogu tymczasowym (`<plik GUID bez .png>/<nazwa projektu>.png`): `captureRef` na iOS nadaje nazwę losową
 *  (opcja `fileName` tylko na Androidzie), a arkusz udostępniania pokazuje nazwę pliku (M1-135). Po arkuszu usuń cały katalog pliku. */
export async function zrzutKarty(ref: RefObject<View | null>, nazwa: string): Promise<string> {
  const uri = await captureRef(ref, { format: 'png', result: 'tmpfile', ...rozmiarZrzutu(PixelRatio.get()) });
  const plik = decodeURIComponent(uri.replace(/^file:\/\//, ''));
  const katalog = plik.replace(/\.png$/i, '');
  utworzKatalog(katalog);
  const czysta = nazwaPlikuUdostepnienia(nazwa);
  const cel = `${katalog}/${czysta ? `${czysta}.png` : nazwaPliku(plik)}`;
  przenies(plik, cel);
  return cel;
}

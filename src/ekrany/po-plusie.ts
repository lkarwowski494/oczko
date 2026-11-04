// Skutek wyniku +1 na ekranie (SYS-01): jedna funkcja dla ekranu licznika i paska licznika pod wzorem — komunikat pod liczbą, wzorzec
// haptyki (gra wołający przy włączonych wibracjach) i jedno ogłoszenie VoiceOver. Wydzielone z `Licznik.tsx` bez zmiany zachowania.
import type { WzorzecHaptyki } from '../domena/porty';
import type { WynikPlus, ZdarzeniePlus } from './LicznikTypy';
import type { Tlumacz } from './wspolne';
import { tekstBleduZapisu } from './WzorLicznik';

export type KomunikatPlus = 'limit' | 'zablokowany' | 'blad_zapisu' | null;
export type SkutekPlus = { komunikat: KomunikatPlus; haptyka: WzorzecHaptyki | null; ogloszenie: string | null };

/** F-48: rozpoznawalne są tylko dwa wzorce — rząd i rząd „ze znaczeniem” (instrukcja, koniec powtórzenia, cel dnia lub części). */
export function wzorzecPoPlus(z: readonly ZdarzeniePlus[]): WzorzecHaptyki {
  return z.some((x) => x !== 'rzad') ? 'rzadZInstrukcja' : 'plus';
}

/** `nrRobocza`: rząd, który +1 miał dodać; `miesiac`: nazwa bieżącego miesiąca (limit dni); `oczka`: licznik oczek (BR-LIC-006). */
export function skutekPlus(t: Tlumacz, w: WynikPlus, k: { nrRobocza: number; miesiac: string; oczka: boolean }): SkutekPlus {
  if (!w.ok) {
    if (w.powod === 'limit') return { komunikat: 'limit', haptyka: null, ogloszenie: t('limit.ogloszenie', { n: k.nrRobocza, miesiac: k.miesiac }) };
    if (w.powod === 'zablokowany') return { komunikat: 'zablokowany', haptyka: null, ogloszenie: null };
    return { komunikat: 'blad_zapisu', haptyka: 'bladZapisu', ogloszenie: tekstBleduZapisu(t) }; // M1-004
  }
  const wej = w.wartosc.wejscieWPrzypomnienie;
  const ogloszenie = wej ? t('licznik.wejscie_w_przypomnienie', { n: wej.rzad, tekst: wej.tekst, ktory: wej.ktory, razy: wej.razy })
    : k.oczka ? t('licznik.po_dodaniu_oczka', { count: w.wartosc.skonczone })
      : t('licznik.po_dodaniu', { zrobione: w.wartosc.skonczone, nastepny: w.wartosc.dziergany });
  return { komunikat: null, haptyka: wzorzecPoPlus(w.wartosc.zdarzenia), ogloszenie };
}

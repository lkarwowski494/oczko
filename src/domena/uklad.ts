// Układ według rozmiaru okna, nie orientacji urządzenia (ADR-0026; P-220 W1a, W3, W4b, G1; P-218 Q3a: wąskie okno iPada = układ telefonu).
// Wymiary z design-spec „Wzór, rysik i iPad” (04 fix-7): kolumna treści iPada maks. 640 pt; licznik obok wzoru: telefon 34 % szerokości
// w granicach 220–360 pt, iPad 340 pt. Klasa regular = obie krawędzie okna ≥ 600 pt (iPad pełny ekran i Split View ≥ 2/3; telefon poziomo
// ma wysokość compact) [OCENA 08: próg zamiast klasy rozmiaru systemu, której RN nie podaje; okna iPadOS sprawdza urządzenie, P-226].
import type { Orientacja } from './porty';

export const KOLUMNA_TRESCI_MAKS = 640; // pt
const REGULAR_MIN = 600; // pt
/** 015 (P-614 (3) A): kolumna licznika iPada 280 pt i próg 1000 pt szerokości okna — tokeny `cele.paskaWzoru.kolumna.szerokosc`, `kolumnaOdSzerokosci` (domena bez importu tokenów; zgodność sprawdza test 015). */
export const KOLUMNA_IPAD = 280; // pt
export const KOLUMNA_IPAD_OD_SZEROKOSCI = 1000; // pt
const KOLUMNA_TELEFON = { udzial: 0.34, min: 220, maks: 360 } as const;

export type Uklad = {
  klasa: 'compact' | 'regular';
  /** Wzór: `pasek` = wzór na szerokość i pasek licznika na dole (W1a, W4b pion); `obok` = wzór i kolumna licznika obok (W3, W4b poziom). */
  wzor: 'pasek' | 'obok';
  kolumnaLicznika: number | null; // pt, tylko przy `obok`
  tresc: number; // pt: szerokość kolumny treści pozostałych ekranów (G1)
};

export function ukladOkna(o: { szerokosc: number; wysokosc: number }): Uklad {
  const s = Number.isFinite(o.szerokosc) && o.szerokosc > 0 ? o.szerokosc : 0;
  const w = Number.isFinite(o.wysokosc) && o.wysokosc > 0 ? o.wysokosc : 0;
  const klasa = s >= REGULAR_MIN && w >= REGULAR_MIN ? 'regular' : 'compact';
  // 015: iPad (regular) — kolumna tylko w oknie ≥ 1000 pt i szerszym niż wyższe, węższe okna → pasek; telefon poziomo (compact) bez zmian (W3).
  const obok = s > w && (klasa === 'compact' || s >= KOLUMNA_IPAD_OD_SZEROKOSCI);
  const kolumnaLicznika = !obok ? null
    : klasa === 'regular' ? KOLUMNA_IPAD
    : Math.round(Math.min(KOLUMNA_TELEFON.maks, Math.max(KOLUMNA_TELEFON.min, s * KOLUMNA_TELEFON.udzial)));
  return { klasa, wzor: obok ? 'obok' : 'pasek', kolumnaLicznika, tresc: klasa === 'regular' ? Math.min(s, KOLUMNA_TRESCI_MAKS) : s };
}

export type EkranOrientacji = 'wzor' | 'inny';
/** Orientacja ekranu dla opcji `orientation` react-native-screens (P-221 Q3a, ADR-0026; P-259 A): obrót tylko, gdy bieżąca orientacja jest poza maską — start w pionie bez żądania (P-258). */
export function orientacjaEkranu(ekran: EkranOrientacji, ipad: boolean): Orientacja {
  return ipad || ekran === 'wzor' ? 'all' : 'portrait_up';
}

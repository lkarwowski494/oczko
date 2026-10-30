// Moduł motywu (zasada 15, design-spec „Pliki”): wartości wyłącznie z docs/design/tokeny.json roli 04 — bez liczb wpisanych w ekranach.
// Kolory motywu jasnego i ciemnego z `useColorScheme`; krój tytułowy Libre Franklin (P-064), treść krojem systemowym (Dynamic Type).
import { useColorScheme, type TextStyle } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';

export type Kolory = typeof tokeny.kolor.jasny;
export const odstep = tokeny.odstep;
export const promien = tokeny.promien;
export const cel = tokeny.cel;
/** Kolory na stałym czarnym tle (zegarek, Dynamic Island, podgląd zdjęcia; design-spec „systemCzarny”). */
export const systemCzarny = tokeny.kolor.systemCzarny;
/** Kolory motywu jasnego niezależnie od ustawienia telefonu (obraz karty ukończenia trafia poza aplikację, design-spec P10a). */
export const kolorJasny = tokeny.kolor.jasny;
/**
 * Krój tytułowy (P-064, design-spec.md:13): Libre Franklin Bold, plik STATYCZNY `assets/fonts/LibreFranklin-Bold.ttf` (instancja wght 700 pliku zmiennego z docs/design/fonty,
 * generator scripts/design/instancja-kroju.py; licencja OFL obok) ładowany natywnie pluginem expo-font (app.json; na iOS nazwa rodziny z pliku). Plik zmienny odpadł:
 * iOS potrafi z niego wziąć domyślną instancję Thin mimo fontWeight (P-306). Plik ma łacinę, cyrylicę i wietnamski; brakujące znaki (greka, CJK) iOS dopełnia krojem
 * systemowym znak po znaku [DO SPRAWDZENIA na urządzeniu: zrzut licznika i ekranu z grecką nazwą, 04-studio-projektowe-001].
 */
export const KROJ_TYTULOWY = 'Libre Franklin';
const ty = tokeny.typografia;
const tytulowy = (t: { rozmiar: number; interlinia: number }): TextStyle => ({ fontFamily: KROJ_TYTULOWY, fontWeight: '700', fontSize: t.rozmiar, lineHeight: Math.round(t.rozmiar * t.interlinia) });
const systemowy = (t: { rozmiar: number; interlinia: number }): TextStyle => ({ fontSize: t.rozmiar, lineHeight: Math.round(t.rozmiar * t.interlinia) });
export const typografia = {
  liczba: { ...tytulowy(ty.liczba), fontVariant: ['tabular-nums'] } satisfies TextStyle,
  tytul: tytulowy(ty.tytul),
  instrukcja: tytulowy(ty.instrukcja),
  przycisk: tytulowy(ty.przycisk),
  tresc: systemowy(ty.tresc),
  podpis: systemowy(ty.podpis),
  drobny: systemowy(ty.drobny),
};
/** Największa skala kluczowej liczby licznika (bez ucięcia przy dużym tekście, tokeny „liczba.maxSkala”). */
export const MAX_SKALA_LICZBY = ty.liczba.maxSkala;
/**
 * Wyjątek nazwany P-277 (do zastąpienia tokenami po audycie 04): RN mnoży każdy tekst przez jeden mnożnik Dynamic Type (AX5 = 3,571,
 * react-native RCTAccessibilityManager.mm `multipliers`), a system 04 skaluje krój tytułowy najwyżej ×1,8 (tokeny.json typografia._zasada)
 * i „−1” najwyżej ×1,4 (fix8-2026-10-27/fix8.html `.minus`). Jak Trening `TEXT_SCALE_MAX` / `NUM_SCALE_MAX`.
 */
export const MAX_SKALA_TYTULOWA = 1.8;
export const MAX_SKALA_MINUSA = 1.4;
/** Pierwsza kategoria dostępności Dynamic Type (AX1) w mnożniku RN; od niej układ licznika „liczba nad nazwami” (04 fix-8 wariant (d), P-275). */
export const PROG_KATEGORII_DOSTEPNOSCI = 1.786;

export function useKolory(): Kolory {
  return useColorScheme() === 'dark' ? tokeny.kolor.ciemny : tokeny.kolor.jasny;
}

/* Wspólne dopasowanie wyniku `identify -format '%wx%h %[channels]'` w testach zrzutów sklepu (ZR1, 2026-11-19).
 * Dlaczego: ImageMagick 6 zwraca `srgb`, a 7 (runner ubuntu-latest od listopada 2026: 7.1.2-18) `srgb  3.0` (nazwa kanałów + liczba kanałów); obraz z alfą to `srgba` (IM6) albo `srgba  4.0` (IM7).
 * Sprawdzenie „bez alfy” zostaje pełne: przyjmujemy wyłącznie `srgb` (opcjonalnie z „3.0” po spacjach), nigdy `srgba` ani 4 kanałów. */
export const wymiarBezAlfy = (wymiar: string): RegExp => new RegExp(`^${wymiar} srgb(?:\\s+3(?:\\.0)?)?$`, 'i');

// Licznik: powtórzenia (RD-12) i wartość wyświetlana (BR-LIC-012, BR-LIC-018).
import type { Wynik } from './bledy';
import type { ZnaczenieLicznika } from './stany';

/** RD-12: numer powtórzenia i rząd w powtórzeniu dla rzędu r przy powtórzeniu co n rzędów. */
export function powtorzenie(r: number, n: number): Wynik<{ powtorzenie: number; rzadW: number }> {
  if (!Number.isInteger(r) || !Number.isInteger(n) || r < 0 || n < 1) return { ok: false, powod: 'bledne_dane' }; // RD-12-W5, W6
  if (r === 0) return { ok: true, wartosc: { powtorzenie: 1, rzadW: 0 } }; // „0 z n” przed pierwszym rzędem (P-097 (3.1a))
  return { ok: true, wartosc: { powtorzenie: Math.floor((r - 1) / n) + 1, rzadW: ((r - 1) % n) + 1 } };
}
/**
 * RD-12 z wyborem r w domenie (P-121 (1), fix-3 05): r = liczba pokazana na liczniku — `skonczone` w trybie „skończone rzędy”,
 * `skonczone + 1` w trybie „rząd w trakcie” (BR-LIC-012, ER-40). Ekrany wołają tylko tę funkcję.
 */
export function powtorzenieLicznika(skonczone: number, znaczenie: ZnaczenieLicznika, n: number): Wynik<{ powtorzenie: number; rzadW: number }> {
  if (!Number.isInteger(skonczone) || skonczone < 0) return { ok: false, powod: 'bledne_dane' };
  return powtorzenie(znaczenie === 'w_trakcie' ? wartoscWyswietlana(skonczone, znaczenie).dziergany : skonczone, n);
}
/** BR-LIC-012: liczba skończonych rzędów i rząd, który się dzierga („Now working row N”). */
// Licznik zapisuje liczbę skończonych rzędów w obu trybach; tryb zmienia tylko to, co pokazuje duża liczba (BR-LIC-012, design-spec).
export function wartoscWyswietlana(wartosc: number, _znaczenie: ZnaczenieLicznika): { skonczone: number; dziergany: number } {
  return { skonczone: wartosc, dziergany: wartosc + 1 };
}

// Liczba oczek na szerokość z próbki (RD-01: N = W × P / 10, bez zaokrąglania, OP-02) i próbka 4 in → 10 cm (RD-04: P10 = P4 × 10 / 10,16, JED-006).
import type { Wynik } from '../bledy';
import { CZTERY_CALE_W_CM } from './parametry';

const dodatnia = (x: number): boolean => Number.isFinite(x) && x > 0;

export function oczkaNaSzerokosc(w: { szerokoscCm: number; oczkaNa10cm: number }): Wynik<number> {
  if (!dodatnia(w.szerokoscCm) || !dodatnia(w.oczkaNa10cm)) return { ok: false, powod: 'bledne_dane' }; // RD-01-W2, W3, W5
  return { ok: true, wartosc: (w.szerokoscCm * w.oczkaNa10cm) / 10 };
}
export function proba4inNa10cm(oczkaNa4in: number): Wynik<number> {
  if (!dodatnia(oczkaNa4in)) return { ok: false, powod: 'bledne_dane' }; // RD-04-W3, W4, W6
  return { ok: true, wartosc: (oczkaNa4in * 10) / CZTERY_CALE_W_CM };
}

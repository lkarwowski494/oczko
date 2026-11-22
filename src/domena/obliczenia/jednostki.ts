// Przeliczenia jednostek (RD-03; wyrocznia: docs/tresci/wektory.json jednostki, tolerancja 1e-9). Stałe z parametry.json (JED-001, -002, -005).
// Wartość ujemna albo nieliczba → BladDanych (sygnatura bez Wynik; RD-03-W5, W7).
import { BladDanych } from '../bledy';
import { CAL_W_CM, JARD_W_M, UNCJA_W_G } from './parametry';

export type Przelicznik = 'in→cm' | 'yd→m' | 'oz→g' | 'cm→in' | 'm→yd' | 'g→oz';
// [stała, kierunek]: „×” z jednostki imperialnej na metryczną, „÷” z powrotem (dzielenie przez stałą, bez odwrotności: powrót = x w 1e-9).
const PRZELICZNIKI: Record<Przelicznik, [number, '×' | '÷']> = {
  'in→cm': [CAL_W_CM, '×'],
  'cm→in': [CAL_W_CM, '÷'],
  'yd→m': [JARD_W_M, '×'],
  'm→yd': [JARD_W_M, '÷'],
  'oz→g': [UNCJA_W_G, '×'],
  'g→oz': [UNCJA_W_G, '÷'],
};
export function przelicz(wartosc: number, przelicznik: Przelicznik): number {
  if (!Number.isFinite(wartosc) || wartosc < 0) throw new BladDanych(`przelicz: zła wartość ${wartosc}`);
  if (!Object.hasOwn(PRZELICZNIKI, przelicznik)) throw new BladDanych(`przelicz: nieznany przelicznik ${String(przelicznik)}`);
  const [stala, kierunek] = PRZELICZNIKI[przelicznik];
  return kierunek === '×' ? wartosc * stala : wartosc / stala;
}

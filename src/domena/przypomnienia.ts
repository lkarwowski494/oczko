// Przypomnienie „co N rzędów, M razy, od rzędu s” (RD-13, F-06): rząd r wyzwala, gdy r ≥ s, (r − s) mod N = 0 i (r − s) / N < M.
import type { Wynik } from './bledy';

export type PlanPrzypomnienia = { od: number; co: number; razy: number };

const zlyPlan = (p: PlanPrzypomnienia): boolean => !Number.isInteger(p.od) || !Number.isInteger(p.co) || !Number.isInteger(p.razy) || p.co < 1; // RD-13-W5: N < 1
const wyzwala = (r: number, p: PlanPrzypomnienia): boolean => r >= p.od && (r - p.od) % p.co === 0 && (r - p.od) / p.co < p.razy;

export function czyPrzypomnienie(rzad: number, plan: PlanPrzypomnienia): Wynik<boolean> {
  if (zlyPlan(plan) || !Number.isInteger(rzad)) return { ok: false, powod: 'bledne_dane' };
  return { ok: true, wartosc: wyzwala(rzad, plan) };
}
/** RD-13, zmiana wartości z a na b (P-097 (3.2a)): rząd jednego przypomnienia (największy wyzwalający w (a, b]) albo null przy spadku. Sygnatura 08 (P-114 Q2a). */
export function przypomnienieWpisania(a: number, b: number, plan: PlanPrzypomnienia): Wynik<number | null> {
  if (zlyPlan(plan) || !Number.isInteger(a) || !Number.isInteger(b)) return { ok: false, powod: 'bledne_dane' };
  if (b <= a) return { ok: true, wartosc: null }; // spadek albo bez zmiany: bez przypomnienia
  const ostatni = plan.od + (plan.razy - 1) * plan.co; // RD-13 „Granica”
  const gorny = Math.min(b, ostatni);
  if (plan.razy < 1 || gorny < plan.od) return { ok: true, wartosc: null };
  const rzad = gorny - ((gorny - plan.od) % plan.co); // największy rząd planu ≤ gorny
  return { ok: true, wartosc: rzad > a ? rzad : null };
}
/** F-06 (U-3): lista rzędów z przypomnieniem przed zapisem (rachunek z 0.1.0, bez ucięcia do celu: RD-13 go nie ma). Sygnatura 08 (P-114 Q5). */
export function planPrzypomnien(plan: PlanPrzypomnienia): Wynik<number[]> {
  if (zlyPlan(plan)) return { ok: false, powod: 'bledne_dane' };
  return { ok: true, wartosc: Array.from({ length: Math.max(0, plan.razy) }, (_, k) => plan.od + k * plan.co) };
}

export type TrybLicznika = 'skonczone' | 'w_trakcie'; // licznik.znaczenie (F-09)
export type ChwilaPrzypomnienia = { licznik: number; rzadPasa: number | null; k: number | null };
/**
 * RD-13 (P-161, W11–W19): pas dotyczy rzędu w robocie w = skończone + 1 w obu trybach; liczba na liczniku = skończone (tryb „skończone”)
 * albo skończone + 1 (tryb „rząd w trakcie”); k = które powtórzenie planu (1…M). Stan, bez sygnału. Sygnatura 08 (P-163, przegląd 05).
 */
export function przypomnienieChwili(skonczone: number, tryb: TrybLicznika, plan: PlanPrzypomnienia): Wynik<ChwilaPrzypomnienia> {
  if (zlyPlan(plan) || !Number.isInteger(skonczone) || skonczone < 0 || (tryb !== 'skonczone' && tryb !== 'w_trakcie')) return { ok: false, powod: 'bledne_dane' }; // RD-13-W19
  const w = skonczone + 1;
  const pas = wyzwala(w, plan);
  return { ok: true, wartosc: { licznik: tryb === 'w_trakcie' ? w : skonczone, rzadPasa: pas ? w : null, k: pas ? (w - plan.od) / plan.co + 1 : null } };
}
/**
 * RD-13 (P-161, W20–W25): sygnał (wibracja, VoiceOver) tylko przy wzroście skończonych — raz, dla największego wyzwalającego rzędu
 * w (przed + 1, po + 1]; spadek → bez sygnału, pas ze stanu po zmianie (Q2a). Sygnatura 08 (P-163, przegląd 05).
 */
export function sygnalZmiany(przed: number, po: number, plan: PlanPrzypomnienia): Wynik<{ rzadSygnalu: number | null; rzadPasa: number | null }> {
  if (!Number.isInteger(przed) || przed < 0) return { ok: false, powod: 'bledne_dane' };
  const stan = przypomnienieChwili(po, 'skonczone', plan);
  if (!stan.ok) return stan;
  const s = przypomnienieWpisania(przed + 1, po + 1, plan); // spadek albo bez zmiany → null
  if (!s.ok) return s;
  return { ok: true, wartosc: { rzadSygnalu: s.wartosc, rzadPasa: stan.wartosc.rzadPasa } };
}

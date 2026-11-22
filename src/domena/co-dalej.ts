// Wiersz „co dalej” na karcie „Dziś” (M3 p2, ZM-01; makieta dzis-390: „Za 4 rzędy: ujmowanie (5 z 8)”): najbliższe przypomnienie
// od rzędu w robocie (skończone + 1, RD-13 P-161) w planach licznika; rzędy planu liczy `planPrzypomnien` (RD-13), błędny plan pomijany.
import { planPrzypomnien, type PlanPrzypomnienia } from './przypomnienia';

export type CoDalej = { za: number; rzad: number; tekst: string; ktory: number; razy: number };

export function coDalej(wRobocie: number, plany: readonly (PlanPrzypomnienia & { tekst: string })[]): CoDalej | null {
  let najblizszy: CoDalej | null = null;
  for (const p of plany) {
    const rzedy = planPrzypomnien(p);
    if (!rzedy.ok) continue;
    const i = rzedy.wartosc.findIndex((r) => r >= wRobocie);
    const rzad = rzedy.wartosc[i];
    if (rzad === undefined) continue;
    if (!najblizszy || rzad < najblizszy.rzad) najblizszy = { za: rzad - wRobocie, rzad, tekst: p.tekst, ktory: i + 1, razy: p.razy };
  }
  return najblizszy;
}

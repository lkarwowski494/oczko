// Strażnik startu z kamieniem milowym (ADR-0019, P-080 (2a)): czysta logika bez I/O. Stan w małym pliku JSON poza bazą (sciezki.stanStartu),
// zapisywany przed otwarciem bazy. Start = pierwsze przejście interfejsu na pierwszy plan w procesie; start w tle się nie liczy (wołający).
// Wzorzec roli 12 nie powstał (ADR-0019 „Logika czysta”) — sygnatury 08 do przeglądu 12/05 (precedens P-114 Q2a).
import { PROG_NIEUDANYCH_STARTOW } from '../konfiguracja';

/** `nieudane`: kolejne starty bez kamienia; `wToku`: bieżący start normalny jeszcze nie doszedł do kamienia. */
export type StanStartu = { nieudane: number; wToku: boolean };
export const STAN_POCZATKOWY: StanStartu = Object.freeze({ nieudane: 0, wToku: false });

/** Uszkodzony albo obcy zapis (np. `'{"x":1}'`, `'nie-json'`, `null`) → stan początkowy (ADR-0019: bez fałszywego alarmu). */
export function odczytajStan(tekst: unknown): StanStartu {
  if (typeof tekst !== 'string') return STAN_POCZATKOWY;
  try {
    const x: unknown = JSON.parse(tekst);
    if (typeof x !== 'object' || x === null || !('nieudane' in x) || !('wToku' in x)) return STAN_POCZATKOWY;
    const { nieudane, wToku } = x;
    if (typeof nieudane !== 'number' || !Number.isInteger(nieudane) || nieudane < 0 || typeof wToku !== 'boolean') return STAN_POCZATKOWY;
    return { nieudane, wToku };
  } catch {
    return STAN_POCZATKOWY;
  }
}
/**
 * Początek startu na pierwszym planie: poprzedni start bez kamienia (`wToku`) liczy się jako nieudany. Od progu → tryb awaryjny;
 * start awaryjny nie jest startem normalnym (`wToku` = false: zamknięcie ekranu awaryjnego nie podbija licznika, kamienia nie zapisuje).
 */
export function poczatekStartu(s: StanStartu, prog = PROG_NIEUDANYCH_STARTOW): { stan: StanStartu; awaryjny: boolean } {
  const nieudane = s.wToku ? s.nieudane + 1 : s.nieudane;
  if (nieudane >= prog) return { stan: { nieudane, wToku: false }, awaryjny: true };
  return { stan: { nieudane, wToku: true }, awaryjny: false };
}
/** Kamień milowy (baza otwarta, migracje zakończone, pierwszy ekran wyrenderowany): licznik zerowany. */
export function kamienMilowy(_s: StanStartu): StanStartu {
  return { nieudane: 0, wToku: false };
}
/**
 * „Spróbuj normalnie” z ekranu awaryjnego: start normalny w tym procesie; jedna kolejna awaria przed kamieniem wraca do ekranu awaryjnego
 * (licznik na progu − 1), kamień zeruje licznik.
 */
export function sprobujNormalnie(_s: StanStartu, prog = PROG_NIEUDANYCH_STARTOW): StanStartu {
  return { nieudane: Math.max(0, prog - 1), wToku: true };
}
/**
 * Wyjście do tła przed kamieniem (P-271, jak Trening L-029): start nie skończył się awarią — użytkownik wyszedł, a iOS mógł potem ubić proces.
 * Licznik zerowany. Start nie „w toku” (ekran awaryjny, po kamieniu) bez zmian: tło na ekranie awaryjnym nie przerywa wykrytej pętli.
 */
export function wyjscieDoTla(s: StanStartu): StanStartu {
  return s.wToku ? { nieudane: 0, wToku: false } : s;
}

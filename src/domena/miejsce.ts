// Zapisane miejsce pracy (`ustawienie.ostatnie_miejsce`, F-49, BR-PRJ-011): licznik, ostatni wzór i jego pozycja. Czyste funkcje, bez bazy.
// `ekran: 'wzor'` = praca skończyła się na ekranie wzoru (start otwiera wzór); `'licznik'` = na liczniku. Strona od 0 (jak `znacznik.strona`);
// powiększenie jako krotność dopasowania do szerokości (1 = dopasowany), więc obrót i inny rozmiar okna nie psują zapisu (07-jakosc-006).
import { POWIEKSZENIE_WZORU_MAKS } from '../konfiguracja';

export type MiejsceZapisane = { ekran: 'licznik' | 'wzor'; id: string; wzor?: string; strona?: number; powiekszenie?: number };

export const poprawnaStrona = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;
export const poprawnePowiekszenie = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= POWIEKSZENIE_WZORU_MAKS;

/** Zapis z bazy (`unknown`) → miejsce; pole pozycji, które nie przechodzi kontroli, jest pomijane (brak zostaje brakiem), a nie zgadywane. Brak `ekran`/`id` → null. */
export function czytajMiejsce(m: unknown): MiejsceZapisane | null {
  if (typeof m !== 'object' || m === null || !('ekran' in m) || !('id' in m)) return null;
  if ((m.ekran !== 'licznik' && m.ekran !== 'wzor') || typeof m.id !== 'string') return null;
  const wzor = 'wzor' in m && typeof m.wzor === 'string' ? m.wzor : undefined;
  const strona = wzor && 'strona' in m && poprawnaStrona(m.strona) ? m.strona : undefined;
  const powiekszenie = wzor && 'powiekszenie' in m && poprawnePowiekszenie(m.powiekszenie) ? m.powiekszenie : undefined;
  return { ekran: m.ekran, id: m.id, ...(wzor ? { wzor } : {}), ...(strona !== undefined ? { strona } : {}), ...(powiekszenie !== undefined ? { powiekszenie } : {}) };
}

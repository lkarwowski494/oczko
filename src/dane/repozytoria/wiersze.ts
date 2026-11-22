// Odczyt pól wiersza bazy z `unknown` (wzorce roli, „Parsowanie”): baza pod CHECK, więc zły kształt to BladDanych (P-118 Q1a), nie zgadywanie.
import { BladDanych } from '../../domena/bledy';

export type Wiersz = Record<string, unknown>;
export function wiersz(w: unknown, gdzie: string): Wiersz {
  if (typeof w !== 'object' || w === null || Array.isArray(w)) throw new BladDanych(`${gdzie}: wiersz nie jest obiektem`);
  return Object.fromEntries(Object.entries(w));
}
export function tekst(w: Wiersz, pole: string): string {
  const v = w[pole];
  if (typeof v !== 'string') throw new BladDanych(`pole ${pole}: oczekiwano tekstu`);
  return v;
}
export function tekstLubNull(w: Wiersz, pole: string): string | null {
  const v = w[pole];
  if (v === null) return null;
  return tekst(w, pole);
}
export function liczba(w: Wiersz, pole: string): number {
  const v = w[pole];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BladDanych(`pole ${pole}: oczekiwano liczby`);
  return v;
}
export function liczbaLubNull(w: Wiersz, pole: string): number | null {
  const v = w[pole];
  if (v === null) return null;
  return liczba(w, pole);
}
/** Lista tekstów zapisana jako JSON (`rodzice`, `cofa`; CHECK json_type = 'array'). */
export function listaTekstow(w: Wiersz, pole: string): string[] {
  const v: unknown = JSON.parse(tekst(w, pole));
  if (!Array.isArray(v) || !v.every((x): x is string => typeof x === 'string')) throw new BladDanych(`pole ${pole}: oczekiwano listy tekstów`);
  return v;
}
export async function wiersze(p: Promise<unknown[]>, gdzie: string): Promise<Wiersz[]> {
  return (await p).map((w) => wiersz(w, gdzie));
}

// Czysta logika komórek cyfr (M3-S3-03, P-563 (2a)): Bree Serif nie ma cyfr tabelarycznych (brak cechy `tnum`; szerokości cyfr 0–9: 454–536 jednostek na 1000),
// więc każda cyfra stoi w komórce o szerokości najszerszej cyfry (`typografia.cyfry.komorkaEm` × rozmiar), wyśrodkowana. Znaki inne niż cyfry (spacja, przecinek, „h”) bez komórki.
import tokeny from '../../docs/design/tokeny.json';

/** Szerokość komórki cyfry w pt dla rozmiaru kroju `pt` (tokeny `typografia.cyfry.komorkaEm`). */
export function szerokoscKomorki(pt: number): number {
  return tokeny.typografia.cyfry.komorkaEm * pt;
}

const CYFRA = /^\p{Nd}$/u;
export interface ZnakLiczby { readonly znak: string; readonly komorka: boolean }
/** Rozbija tekst liczby na znaki; `komorka` = true dla cyfr (Unicode `Nd`, więc także cyfry innych pism), false dla separatorów i liter. */
export function komorkiLiczby(tekst: string): ZnakLiczby[] {
  return Array.from(tekst, (znak) => ({ znak, komorka: CYFRA.test(znak) }));
}

// WYGENEROWANE z docs/tresci/parametry.json (rola 06): node scripts/domena/generuj-parametry.mjs — nie edytować ręcznie.
// Kopia, bo domena nie importuje z docs/ (ADR-0003, granice.mjs); zgodność: tests/domena/obliczenia/parametry-kopia.test.ts.
export const CAL_W_CM = 2.54; // JED-001
export const JARD_W_M = 0.9144; // JED-002
export const UNCJA_W_G = 28.349523125; // JED-005
export const CZTERY_CALE_W_CM = 10.16; // JED-006

export type Rozmiar = { mm: number; us: string | null };
export const DRUTY: readonly Rozmiar[] = [
  { mm: 1.5, us: "000" }, // DRT-M01500
  { mm: 1.75, us: "00" }, // DRT-M01750
  { mm: 2, us: "0" }, // DRT-M02000
  { mm: 2.25, us: "1" }, // DRT-M02250
  { mm: 2.75, us: "2" }, // DRT-M02750
  { mm: 3, us: null }, // DRT-M03000
  { mm: 3.125, us: "3" }, // DRT-M03125
  { mm: 3.25, us: "3" }, // DRT-M03250
  { mm: 3.5, us: "4" }, // DRT-M03500
  { mm: 3.75, us: "5" }, // DRT-M03750
  { mm: 4, us: "6" }, // DRT-M04000
  { mm: 4.25, us: "6" }, // DRT-M04250
  { mm: 4.5, us: "7" }, // DRT-M04500
  { mm: 5, us: "8" }, // DRT-M05000
  { mm: 5.25, us: "9" }, // DRT-M05250
  { mm: 5.5, us: "9" }, // DRT-M05500
  { mm: 5.75, us: "10" }, // DRT-M05750
  { mm: 6, us: "10" }, // DRT-M06000
  { mm: 6.5, us: "10 ½" }, // DRT-M06500
  { mm: 7, us: null }, // DRT-M07000
  { mm: 8, us: "11" }, // DRT-M08000
  { mm: 9, us: "13" }, // DRT-M09000
  { mm: 10, us: "15" }, // DRT-M10000
  { mm: 12.5, us: "17" }, // DRT-M12500
  { mm: 12.75, us: "17" }, // DRT-M12750
  { mm: 15, us: "19" }, // DRT-M15000
  { mm: 19, us: "35" }, // DRT-M19000
  { mm: 25, us: "50" }, // DRT-M25000
  { mm: 35, us: "70" }, // DRT-M35000
];
export const SZYDELKA: readonly Rozmiar[] = [
  { mm: 2.25, us: "B-1" }, // SZD-M02250
  { mm: 2.5, us: null }, // SZD-M02500
  { mm: 2.75, us: "C-2" }, // SZD-M02750
  { mm: 3.125, us: "D" }, // SZD-M03125
  { mm: 3.25, us: "D-3" }, // SZD-M03250
  { mm: 3.5, us: "E-4" }, // SZD-M03500
  { mm: 3.75, us: "F-5" }, // SZD-M03750
  { mm: 4, us: "G-6" }, // SZD-M04000
  { mm: 4.25, us: "G" }, // SZD-M04250
  { mm: 4.5, us: "7" }, // SZD-M04500
  { mm: 5, us: "H-8" }, // SZD-M05000
  { mm: 5.25, us: "I" }, // SZD-M05250
  { mm: 5.5, us: "I-9" }, // SZD-M05500
  { mm: 5.75, us: "J" }, // SZD-M05750
  { mm: 6, us: "J-10" }, // SZD-M06000
  { mm: 6.5, us: "K-10 ½" }, // SZD-M06500
  { mm: 7, us: null }, // SZD-M07000
  { mm: 8, us: "L-11" }, // SZD-M08000
  { mm: 9, us: "M/N-13" }, // SZD-M09000
  { mm: 10, us: "N/P-15" }, // SZD-M10000
  { mm: 11.5, us: "P-16" }, // SZD-M11500
  { mm: 12, us: null }, // SZD-M12000
  { mm: 15, us: "P/Q" }, // SZD-M15000
  { mm: 15.75, us: "Q" }, // SZD-M15750
  { mm: 16, us: "Q" }, // SZD-M16000
  { mm: 19, us: "S" }, // SZD-M19000
  { mm: 25, us: "T/U/X" }, // SZD-M25000
  { mm: 30, us: "T/X" }, // SZD-M30000
];
export type KategoriaGrubosci = { kategoria: number; min: number | null; max: number | null }; // próbka na 4 in
export const GRUBOSC: readonly KategoriaGrubosci[] = [
  { kategoria: 0, min: 33, max: 40 }, // GRB-Z0
  { kategoria: 1, min: 27, max: 32 }, // GRB-Z1
  { kategoria: 2, min: 23, max: 26 }, // GRB-Z2
  { kategoria: 3, min: 21, max: 24 }, // GRB-Z3
  { kategoria: 4, min: 16, max: 20 }, // GRB-Z4
  { kategoria: 5, min: 12, max: 15 }, // GRB-Z5
  { kategoria: 6, min: 7, max: 11 }, // GRB-Z6
  { kategoria: 7, min: null, max: 6 }, // GRB-Z7
];

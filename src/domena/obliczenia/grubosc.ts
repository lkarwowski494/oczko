// Klasyfikacja grubości włóczki z próbki (RD-10 według P-084; wyrocznia: docs/tresci/wektory.json klasyfikacja_4in, klasyfikacja_10cm).
// P-084 (PRB-004): najbliższa całość przed klasyfikacją; dokładna połówka → część wspólna wyników obu całości, inaczej „między kategoriami”
// albo „powyżej tabeli”. Próbka 10 cm → 4 in dokładnie × 10,16 / 10 (P-081 P3a). Zakresy kategorii CYC z parametry.json (GRB-Z0–Z7).
import { CZTERY_CALE_W_CM, GRUBOSC } from './parametry';

export type Klasyfikacja =
  | { wynik: 'kategorie'; kategorie: number[]; p4Zaokraglone: number | null; polowka: boolean }
  | { wynik: 'miedzy'; kategorie: [number, number]; polowka: boolean }
  | { wynik: 'powyzej_tabeli'; p4Zaokraglone: number | null; polowka: boolean }
  | { wynik: 'blad_danych' };

const GORA_TABELI = Math.max(...GRUBOSC.map((g) => g.max ?? 0)); // 40 o./4 in (kategoria 0)
/** Kategorie dla całkowitej liczby oczek na 4 in; null = powyżej tabeli. */
function kategorieCalosci(n: number): number[] | null {
  if (n > GORA_TABELI) return null;
  return GRUBOSC.filter((g) => (g.min === null || n >= g.min) && (g.max === null || n <= g.max)).map((g) => g.kategoria);
}

/** Próbka: oczka na 4 in albo na 10 cm (przeliczenie dokładne × 10,16 / 10, P-081 P3a). */
export function klasyfikujGrubosc(proba: { oczka: number; na: '4in' | '10cm' }): Klasyfikacja {
  if (!Number.isFinite(proba.oczka) || proba.oczka <= 0) return { wynik: 'blad_danych' }; // RD-10-W6
  const p4 = proba.na === '4in' ? proba.oczka : (proba.oczka * CZTERY_CALE_W_CM) / 10;
  const dol = Math.floor(p4);
  const polowka = Math.abs(p4 - dol - 0.5) < 1e-9;
  if (!polowka) {
    const n = Math.round(p4);
    const k = kategorieCalosci(n);
    return k === null ? { wynik: 'powyzej_tabeli', p4Zaokraglone: n, polowka: false } : { wynik: 'kategorie', kategorie: k, p4Zaokraglone: n, polowka: false };
  }
  const a = kategorieCalosci(dol);
  const b = kategorieCalosci(dol + 1);
  if (a === null || b === null) return { wynik: 'powyzej_tabeli', p4Zaokraglone: null, polowka: true }; // KL4-40_5
  const wspolne = a.filter((x) => b.includes(x));
  if (wspolne.length) return { wynik: 'kategorie', kategorie: wspolne, p4Zaokraglone: null, polowka: true };
  const wszystkie = [...a, ...b];
  return { wynik: 'miedzy', kategorie: [Math.min(...wszystkie), Math.max(...wszystkie)], polowka: true };
}

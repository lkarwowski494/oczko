// Panel `e2e-pomiar-operacji` (build E2E, E2-137-A3/A4; bez t(), e2e/README.md): ms ostatnich operacji — import do „import-gotowy”, dodanie zdjęcia (całe i samo przekodowanie bez metadanych)
// i wczytanie projektu po nim — albo „running”, gdy operacja trwa. Zielone przebiegi też go pokazują, więc „maszyna wolna” i „aplikacja wisi”
// różni liczba w `maestro.log` i na zrzucie, nie hipoteza. Moduł ładowany tylko z `panele.tsx` (P-238: poza buildem E2E nie trafia do bundla).
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

export type NazwaOperacji = 'import' | 'przekodowanie' | 'zdjecie' | 'projekt';
type Wpis = { poczatekMs: number } | { ms: number; ok: boolean };
const KOLEJNOSC: readonly NazwaOperacji[] = ['import', 'przekodowanie', 'zdjecie', 'projekt'];
const OPIS: Record<NazwaOperacji, string> = { import: 'import', przekodowanie: 'recode', zdjecie: 'photo', projekt: 'project' };

const wpisy = new Map<NazwaOperacji, Wpis>();
const sluchacze = new Set<() => void>();
const zmiana = () => sluchacze.forEach((f) => f());
const teraz = () => performance.now();

export function poczatekOperacji(n: NazwaOperacji): void {
  wpisy.set(n, { poczatekMs: teraz() });
  zmiana();
}
/** Pierwszy koniec wygrywa (import: „gotowy” przed wyborem, powrót po nim nie nadpisuje); koniec bez początku jest ignorowany. */
export function koniecOperacji(n: NazwaOperacji, ok: boolean): void {
  const w = wpisy.get(n);
  if (!w || !('poczatekMs' in w)) return;
  wpisy.set(n, { ms: teraz() - w.poczatekMs, ok });
  zmiana();
}
export async function zmierzOperacje<T>(n: NazwaOperacji, f: () => Promise<T>): Promise<T> {
  poczatekOperacji(n);
  try {
    const wynik = await f();
    koniecOperacji(n, true);
    return wynik;
  } catch (e) {
    koniecOperacji(n, false);
    throw e;
  }
}
export function zerujPomiarOperacji(): void {
  wpisy.clear();
  zmiana();
}

function opis(n: NazwaOperacji, w: Wpis): string {
  if ('poczatekMs' in w) return `${OPIS[n]} running`;
  return `${OPIS[n]} ${Math.round(w.ms)} ms${w.ok ? '' : ' (error)'}`;
}
export function PanelPomiaruOperacji(): React.ReactElement | null {
  const [, odswiez] = useState(0);
  useEffect(() => {
    const f = () => odswiez((x) => x + 1);
    sluchacze.add(f);
    f(); // wpis zapisany między renderem a efektem
    return () => { sluchacze.delete(f); };
  }, []);
  const linie = KOLEJNOSC.flatMap((n) => { const w = wpisy.get(n); return w ? [opis(n, w)] : []; });
  return linie.length ? <Text testID="e2e-pomiar-operacji">{linie.join(' · ')}</Text> : null;
}

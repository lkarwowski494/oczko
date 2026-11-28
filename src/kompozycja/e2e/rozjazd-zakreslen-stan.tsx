// ZA1 (PU-008, KO-244): panel `e2e-wzor-rozjazdy` na ekranie wzoru pokazuje, ile razy widok natywny wykrył rozjazd płótna z danymi (płótno PencilKit miało inną liczbę kresek niż
// `rysunki[s]`), i opis ostatniego zdarzenia: „stroke mismatches: 0” albo „stroke mismatches: 1; last: cofniecie strona=0 platno=2 dane=1”. Liczba kresek płótna jest niewidoczna dla XCUI
// (nakładka PDFKit), więc scenariusz 100 odczyta ją stąd po porażce. Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E nie trafia do bundla.
import React from 'react';
import { Text } from 'react-native';

export type RozjazdZakreslen = { readonly rozjazdy: number; readonly ostatni: string };

/** Wartość panelu `e2e-wzor-rozjazdy` (osobno, żeby test nie zależał od renderowania). */
export const opisRozjazduZakreslen = (r: RozjazdZakreslen): string =>
  r.rozjazdy > 0 ? `stroke mismatches: ${r.rozjazdy}; last: ${r.ostatni}` : 'stroke mismatches: 0';

/** Mały napis pod `e2e-wzor-notatki`; `pointerEvents="none"`, więc nie przechwytuje stuknięć. */
export function PanelRozjazduZakreslen({ rozjazd }: { rozjazd: RozjazdZakreslen }): React.ReactElement {
  return (
    <Text testID="e2e-wzor-rozjazdy" pointerEvents="none" style={{ position: 'absolute', top: 52, left: 0, zIndex: 1000, fontSize: 9 }}>{opisRozjazduZakreslen(rozjazd)}</Text>
  );
}

// CH-01 (BX11 zad. 2; recenzja `docs/jakosc/ch-recenzja-bx9.md`): panel `e2e-okno` w korzeniu nawigacji (app/_layout.tsx) pokazuje proporcję okna aplikacji z `useWindowDimensions`:
// „window: portrait (szer. x wys.)” albo „window: landscape (…)”. Scenariusz 105 (PU-071: poza wzorem obrót poziomo zostaje w pionie) asertuje tę wartość po obrocie — Maestro nie czyta
// wymiarów okna, a asercje `below` są prawdziwe w obu orientacjach. Tylko pokazuje: zachowanie aplikacji bez zmian. Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238),
// więc poza buildem E2E nie trafia do bundla. Pionowe = wysokość >= szerokość (kwadrat liczy się jak pion).
import React from 'react';
import { Text, useWindowDimensions } from 'react-native';

/** Opis okna: wartość panelu `e2e-okno` (osobno, żeby test nie zależał od renderowania). */
export const opisOkna = (szerokosc: number, wysokosc: number): string =>
  `window: ${wysokosc >= szerokosc ? 'portrait' : 'landscape'} (${Math.round(szerokosc)} x ${Math.round(wysokosc)})`;

/** Mały napis u góry okna nad całym stosem ekranów; `pointerEvents="none"`, więc nie przechwytuje stuknięć. */
export function PanelOkna(): React.ReactElement {
  const { width, height } = useWindowDimensions();
  return (
    <Text testID="e2e-okno" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, fontSize: 9 }}>{opisOkna(width, height)}</Text>
  );
}

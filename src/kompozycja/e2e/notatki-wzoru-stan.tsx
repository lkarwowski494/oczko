// BX15 (KO-121 b; BX-051): panel `e2e-wzor-notatki` na ekranie wzoru pokazuje ZAPISANE notatki rzędów bieżącej strony jako tekst („notes: row 1: k2tog here” albo „notes: none”).
// Chip notatki rysuje nakładka PDFKit (`PDFPageOverlayViewProvider`), której nie ma w hierarchii XCUI, więc Maestro nie widzi ani chipa, ani jego etykiety dostępności (scenariusze 102, 104).
// Panel czyta te same dane, z których powstają chipy (`widok.notatki`), i niczego nie zmienia (`pointerEvents="none"`). Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238),
// więc poza buildem E2E nie trafia do bundla.
import React from 'react';
import { Text } from 'react-native';
import type { ChipNotatki } from '../../domena/znacznik-wzoru';

/** Opis zapisanych notatek: wartość panelu `e2e-wzor-notatki` (osobno, żeby test nie zależał od renderowania). */
export const opisNotatekWzoru = (chipy: readonly Pick<ChipNotatki, 'rzadWzoru' | 'notatki'>[]): string => {
  const wiersze = chipy.flatMap((c) => c.notatki.map((n) => `row ${c.rzadWzoru}: ${n.tekst}`));
  return wiersze.length ? `notes: ${wiersze.join(' | ')}` : 'notes: none';
};

/** Mały napis pod `e2e-okno`; `pointerEvents="none"`, więc nie przechwytuje stuknięć. */
export function PanelNotatekWzoru({ chipy }: { chipy: readonly ChipNotatki[] }): React.ReactElement {
  return (
    <Text testID="e2e-wzor-notatki" pointerEvents="none" style={{ position: 'absolute', top: 40, left: 0, zIndex: 1000, fontSize: 9 }}>{opisNotatekWzoru(chipy)}</Text>
  );
}

// Kafelek ikony wiersza listy (Ustawienia ZM-07, zakładka Narzędzia; token `znaczniki.kafelekIkonyWiersza`, M3-MAK-03/04): 32 pt (od AX1 44), promień 8, tło `ikonaTlo`, symbol `ikona`
// 20 pt (od AX1 30). Symbol SF albo rysunek własny (`IkonaDnia`, `IkonaDruty`). Dekoracyjny: ukryty przed VoiceOver, nazwę wiersza niesie wiersz.
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { PROG_KATEGORII_DOSTEPNOSCI, useKolory } from './motyw';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';

const z = tokeny.znaczniki;
/** Rozmiar symbolu w kafelku: 20 pt, od AX1 30 pt — z opisu tokenu `znaczniki._kafelek` (pola liczbowego brak, zgłoszenie do 04). */
const SYMBOL = 20, SYMBOL_AX = 30;

export type RysunekIkony = (p: { rozmiar: number; kolor: string; testID?: string }) => React.ReactElement;
export type PropsKafelkaIkony = { symbol: NazwaSymbolu } | { rysunek: RysunekIkony; testID: string };

export function KafelekIkony(p: PropsKafelkaIkony): React.ReactElement {
  const k = useKolory();
  const ax = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const bok = ax ? z.kafelekIkonyWierszaAx5 : z.kafelekIkonyWiersza;
  const rozmiar = ax ? SYMBOL_AX : SYMBOL;
  return (
    <View style={{ width: bok, height: bok, borderRadius: z.promienKafelkaWiersza, backgroundColor: k.ikonaTlo, alignItems: 'center', justifyContent: 'center' }}
      testID="kafelek-ikony" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {'symbol' in p ? <SymbolSf nazwa={p.symbol} rozmiar={rozmiar} kolor={k.ikona} maxSkala={1} /> : p.rysunek({ rozmiar, kolor: k.ikona, testID: p.testID })}
    </View>
  );
}

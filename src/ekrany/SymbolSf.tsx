// Symbol SF (design-spec „Symbole SF”, Aneks P2 poz. 2; P-374): kontur, waga z tekstu, dekoracyjny — etykieta VoiceOver zostaje na przycisku.
// Rozmiar rośnie z ustawieniem tekstu najwyżej do `maxSkala` (jak `maxFontSizeMultiplier` glifu, który symbol zastępuje).
import React from 'react';
import { useWindowDimensions, type ColorValue } from 'react-native';
import { SymbolView } from 'expo-symbols';

/** Nazwy ze spec (sf-symbols-typescript 2.2.0; iOS: stopwatch 13, pause.fill 13, highlighter 14, pencil.tip 13, note.text(.badge.plus) 14, eraser 16, arrow.uturn.backward 14; cel aplikacji iOS 18.0, app.json:26). */
export type NazwaSymbolu = 'stopwatch' | 'pause.fill' | 'highlighter' | 'pencil.tip' | 'note.text.badge.plus' | 'note.text' | 'eraser' | 'arrow.uturn.backward';

export function SymbolSf(p: { nazwa: NazwaSymbolu; rozmiar: number; kolor: ColorValue; maxSkala: number; waga?: 'regular' | 'bold' }): React.ReactElement {
  const { fontScale } = useWindowDimensions();
  const px = Math.round(p.rozmiar * Math.min(Math.max(fontScale, 1), p.maxSkala));
  return (
    <SymbolView name={p.nazwa} size={px} tintColor={p.kolor} weight={p.waga ?? 'regular'} type="monochrome" resizeMode="scaleAspectFit"
      style={{ width: px, height: px }} testID={`symbol-${p.nazwa}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  );
}

// Ikona „druty” (wiersz Druty zakładki Narzędzia; makieta `narzedzia`, design-spec Dzianiny: symbol własny, bo SF Symbols nie ma drutów — `docs/design/dzianina/ikony.js` → `druty`).
// Rysunek w react-native-svg wzorem `IkonaDnia.tsx` (bez zmiany natywnej, kolor z motywu). Dekoracyjny (ukryty przed VoiceOver).
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function IkonaDruty(p: { rozmiar: number; kolor: string; testID?: string }): React.ReactElement {
  return (
    <Svg width={p.rozmiar} height={p.rozmiar} viewBox="0 0 24 24" fill="none" stroke={p.kolor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      testID={p.testID} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M5 20L17.5 4.5M9 20.5L19.5 7" />
      <Circle cx={18.2} cy={3.7} r={1.4} />
      <Circle cx={20.2} cy={6.2} r={1.4} />
      <Path d="M4 15.5c3 1 6.5 1 9.5-1.5" />
    </Svg>
  );
}

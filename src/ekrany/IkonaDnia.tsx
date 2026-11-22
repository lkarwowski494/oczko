// Ikona „dzień dziergany” (kafel 1 ekranu Oczko Pro; design-spec Dzianiny: symbol własny — kwadrat dzianiny z oczkami „V”, `ikony.js` → `dzien`).
// Decyzja 08 (M3 p7, do zgłoszenia 04): rysunek w react-native-svg (ADR roli 05) zamiast własnego SF Symbolu w katalogu zasobów — bez zmiany natywnej, kolor z motywu.
// Kształt celowo inny niż kalendarz zakładki Historia (02-monetyzacja-004): bez nagłówka i uchwytów kalendarza. Dekoracyjny (ukryty przed VoiceOver).
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function IkonaDnia(p: { rozmiar: number; kolor: string; testID?: string }): React.ReactElement {
  return (
    <Svg width={p.rozmiar} height={p.rozmiar} viewBox="0 0 24 24" fill="none" stroke={p.kolor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      testID={p.testID} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={3.5} y={3.5} width={17} height={17} rx={3} />
      <Path d="M6.5 8l2 3 2-3M10.5 8l2 3 2-3M14.5 8l2 3 2-3M6.5 13l2 3 2-3M10.5 13l2 3 2-3M14.5 13l2 3 2-3" />
    </Svg>
  );
}

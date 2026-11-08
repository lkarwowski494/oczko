// Symbol SF (design-spec „Symbole SF”, Aneks P2 poz. 2; P-374): kontur, waga z tekstu, dekoracyjny — etykieta VoiceOver zostaje na przycisku.
// Rozmiar rośnie z ustawieniem tekstu najwyżej do `maxSkala` (jak `maxFontSizeMultiplier` glifu, który symbol zastępuje).
import React from 'react';
import { useWindowDimensions, type ColorValue } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, useKolory } from './motyw';

/** Nazwy ze spec (sf-symbols-typescript 2.2.0; iOS: stopwatch 13, pause.fill 13, highlighter 14, pencil.tip 13, note.text(.badge.plus) 14, eraser 16, arrow.uturn.backward 14; cel aplikacji iOS 18.0, app.json:26).
 *  Paski (design-spec „Aneks M2 partia 3a”, M1-033/036): chevron.backward/forward, gearshape, clock.arrow.circlepath, ruler (iOS 14); calendar, plus, doc.text, ellipsis, square.and.arrow.up, xmark, arrow.up.right, bookmark (iOS 13).
 *  M1-146 (04-studio-projektowe-531 opcja a): minus.circle.fill, chevron.down, chevron.right (iOS 13); chevron.forward przy wierszach list. */
export type NazwaSymbolu = 'stopwatch' | 'pause.fill' | 'highlighter' | 'pencil.tip' | 'note.text.badge.plus' | 'note.text' | 'eraser' | 'arrow.uturn.backward'
  | 'chevron.backward' | 'chevron.forward' | 'gearshape' | 'calendar' | 'ruler' | 'plus' | 'doc.text' | 'clock.arrow.circlepath' | 'ellipsis' | 'square.and.arrow.up' | 'xmark' | 'arrow.up.right' | 'bookmark'
  | 'minus.circle.fill' | 'chevron.down' | 'chevron.right'
  // M3 p2, P-577 (nazwany wyjątek od zamrożenia p1, tylko typ): zakładki i kafle „Dziś” z design-spec.md:48 — Dziś sun.max (wybór koordynatora z pary
  // calendar.day.timeline.left / sun.max [DO USTALENIA 08: okiem na urządzeniu]), Projekty square.stack, kafle plus.square, scribble.variable, square.grid.3x3.
  // M3 p3a (nazwany wyjątek od zamrożenia p1, tylko typ, jak P-577): akcja „Cel” na liczniku (testid.md: `licznik-cel` = `flag`).
  | 'flag'
  | 'sun.max' | 'square.stack' | 'plus.square' | 'scribble.variable' | 'square.grid.3x3';

export function SymbolSf(p: { nazwa: NazwaSymbolu; rozmiar: number; kolor: ColorValue; maxSkala: number; waga?: 'regular' | 'bold' }): React.ReactElement {
  const { fontScale } = useWindowDimensions();
  const px = Math.round(p.rozmiar * Math.min(Math.max(fontScale, 1), p.maxSkala));
  return (
    <SymbolView name={p.nazwa} size={px} tintColor={p.kolor} weight={p.waga ?? 'regular'} type="monochrome" resizeMode="scaleAspectFit"
      style={{ width: px, height: px }} testID={`symbol-${p.nazwa}`} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  );
}

/** Wskaźnik przejścia przy wierszu listy (M1-146, decyzja 04): `chevron.forward` w kolorze `olowek`, rozmiar treści 17 pt, skala najwyżej ×1,8; dekoracyjny (ukryty przed VoiceOver). */
export function StrzalkaWiersza(): React.ReactElement {
  return <SymbolSf nazwa="chevron.forward" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={useKolory().tekst2} maxSkala={MAX_SKALA_TYTULOWA} />;
}

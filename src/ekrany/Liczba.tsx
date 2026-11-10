// Liczba w komórkach stałej szerokości (M3-S3-03): licznik, liczba karty, pasek wzoru, podsumowanie — liczba nie przesuwa się przy +1. Jeden element dla VoiceOver (etykieta = liczba).
// Języki z krojem systemowym (kroje.tytul.jezykiSystemowe): bez komórek, krój systemowy z `tabular-nums` (design-spec „Typografia”).
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle } from 'react-native';
import { komorkiLiczby, szerokoscKomorki } from './liczbaKomorki';
import { krojTytulowy } from './motyw';

export type PropsLiczby = {
  wartosc: string;
  /** Styl kroju liczby z `typografiaDzianiny` (Bree, rozmiar i interlinia z tokenów); kolor dodaje wywołujący. */
  styl: StyleProp<TextStyle>;
  /** Rozmiar kroju w pt (ten sam co w `styl`; z tokenów `typografia.liczba*.pt`). */
  pt: number;
  /** Kod języka aplikacji; dla języków z krojem systemowym liczba bez komórek. */
  jezyk?: string;
  maxFontSizeMultiplier?: number;
  testID?: string;
};

export function Liczba({ wartosc, styl, pt, jezyk, maxFontSizeMultiplier, testID }: PropsLiczby): React.ReactElement {
  const skalaSystemu = useWindowDimensions().fontScale; // 003: komórka rośnie z krojem (przed warunkiem — kolejność hooków stała)
  const systemowy = jezyk !== undefined && krojTytulowy(jezyk) === undefined;
  if (systemowy) {
    return (
      <View accessible accessibilityRole="text" accessibilityLabel={wartosc} testID={testID}>
        <Text style={[styl, st.systemowy]} maxFontSizeMultiplier={maxFontSizeMultiplier} importantForAccessibility="no" testID={testID ? `${testID}-tekst` : undefined}>{wartosc}</Text>
      </View>
    );
  }
  const szer = szerokoscKomorki(pt, skalaSystemu, maxFontSizeMultiplier);
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={wartosc} style={st.rzad} testID={testID}>
      {komorkiLiczby(wartosc).map((c, i) => (
        <Text key={i} style={[styl, c.komorka ? { width: szer, textAlign: 'center' } : null]} maxFontSizeMultiplier={maxFontSizeMultiplier} importantForAccessibility="no"
          testID={testID && c.komorka ? `${testID}-cyfra-${i}` : undefined}>{c.znak}</Text>
      ))}
    </View>
  );
}
const st = StyleSheet.create({
  rzad: { flexDirection: 'row', alignItems: 'baseline' },
  // Krój systemowy: bez nazwy rodziny Bree, cyfry tabelaryczne systemu (tokeny `typografia.cyfry`).
  systemowy: { fontFamily: undefined, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

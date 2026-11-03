// Wspólne elementy paska (M1-audytor-generalny-033 i 036; design-spec „Aneks M2 partia 3a”): jeden wygląd „wstecz” na każdym ekranie
// i przyciski z symbolem SF zamiast glifów Unicode. Symbol jest dekoracyjny (etykieta VoiceOver na przycisku), waga symbolu jak tekst obok
// (HIG Typography: „precise weight matching between symbols and adjacent text”), skala z tekstem najwyżej ×1,8 jak dotychczasowe ikony paska.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SymbolSf, type NazwaSymbolu } from './SymbolSf';
import { cel, MAX_SKALA_TYTULOWA, odstep, ROZMIAR_SYMBOLU, ROZMIAR_SYMBOLU_KAPSULY, typografia, useKolory } from './motyw';

/**
 * „Wstecz” (słownik studia; HIG: przycisk obok gestu od krawędzi): `chevron.backward` + nazwa celu albo „Back”, treść 17 pt zwykłą
 * odmianą w kolorze `grafit`, bez podkreślenia i bez pogrubienia — jak systemowy przycisk wstecz. `tylkoSymbol`: pasek wzoru (sama strzałka,
 * etykieta „Back to {część}”). testID domyślnie `nav-wstecz`.
 */
export function Wstecz(p: { tekst: string; etykieta?: string; onPress(): void; testID?: string; tylkoSymbol?: boolean; kolor?: string }): React.ReactElement {
  const k = useKolory();
  const kolor = p.kolor ?? k.grafit;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta ?? p.tekst} onPress={p.onPress} style={st.wstecz} testID={p.testID ?? 'nav-wstecz'}>
      <SymbolSf nazwa="chevron.backward" rozmiar={ROZMIAR_SYMBOLU_KAPSULY} kolor={kolor} maxSkala={MAX_SKALA_TYTULOWA} />
      {!p.tylkoSymbol && <Text style={[st.tekst, { color: kolor }]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{p.tekst}</Text>}
    </Pressable>
  );
}

/** Przycisk paska z symbolem SF; `podpis` = widoczny tekst obok symbolu (DEC-05 a: „Tools”), etykieta VoiceOver bez zmian. */
export function PrzyciskSymbolu(p: { symbol: NazwaSymbolu; etykieta: string; onPress(): void; testID?: string; podpis?: string; kolor?: string; rozmiar?: number }): React.ReactElement {
  const k = useKolory();
  const kolor = p.kolor ?? k.grafit;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta} onPress={p.onPress} style={[st.symbol, p.podpis ? st.zPodpisem : null]} testID={p.testID}>
      <SymbolSf nazwa={p.symbol} rozmiar={p.rozmiar ?? ROZMIAR_SYMBOLU} kolor={kolor} maxSkala={MAX_SKALA_TYTULOWA} />
      {p.podpis && <Text style={[st.tekst, { color: kolor }]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{p.podpis}</Text>}
    </Pressable>
  );
}

const st = StyleSheet.create({
  wstecz: { flexDirection: 'row', alignItems: 'center', gap: odstep.xs, minHeight: cel.minimum, flexShrink: 1, alignSelf: 'flex-start' },
  symbol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: cel.minimum, minHeight: cel.minimum },
  zPodpisem: { gap: odstep.xs, paddingHorizontal: odstep.xs },
  tekst: { ...typografia.tresc, flexShrink: 1 },
});

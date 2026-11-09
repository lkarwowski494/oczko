// Tytuł paska nawigacji przeglądarki wzoru: nazwa wzoru (przy ≥ 2 wzorach albo stronach czekających na sieć — przełącznik ▾, W9b, poz. 12 C)
// i podpis źródła `wzor-zrodlo` („PDF · 6 pages”). Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku, P-364).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI, cel as rozmiary, odstep, typografia, useKolory, type Kolory } from './motyw';
import { SymbolSf } from './SymbolSf';
import type { Tlumacz } from './wspolne';

export type PropsTytuluWzoru = { t: Tlumacz; nazwa: string; opis: string; przelacza: boolean; naPrzelacz(): void };

export function TytulWzoru(p: PropsTytuluWzoru): React.ReactElement {
  const { t } = p;
  const k = useKolory();
  const st = style(k);
  return (
    <View style={st.tytulPaska}>
      {p.przelacza ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('wzor.przelacz_a11y', { nazwa: p.nazwa })} onPress={p.naPrzelacz} style={st.przelacz} testID="wzor-przelacz">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: odstep.xs }}>{/* M1-146: chevron.down zamiast glifu ▾ */}
            <Text style={[st.tytul, { flexShrink: 1 }]} numberOfLines={2}>{p.nazwa}</Text>
            <SymbolSf nazwa="chevron.down" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.grafit} maxSkala={MAX_SKALA_TYTULOWA} />
          </View>
        </Pressable>
      ) : <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} numberOfLines={2}>{p.nazwa}</Text>}
      {/* AX5-wzór (P-630, opcja A właściciela): podpis źródła z limitem skali tytułów paska, jedna linia pod tytułem — przy AX5 bez limitu łamał się na 4 linie i zabierał wzorowi wysokość */}
      <Text style={st.podpis} testID="wzor-zrodlo" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} numberOfLines={1}>{p.opis}</Text>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tytulPaska: { flex: 1, minWidth: 120 },
    przelacz: { minHeight: rozmiary.minimum, justifyContent: 'center' }, // cel dotyku przełącznika wzorów w tytule (M1-175, SP-06; TT-16)
    tytul: { ...typografia.instrukcja, color: k.grafit },
    podpis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.l },
  });
}
